import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { io, Socket } from 'socket.io-client';

export interface Chat {
  _id: string;
  title: string;
  messages: ChatMessage[];
  userId: string;
  createdAt: Date;
  lastUpdated: Date;
}

export interface ChatMessage {
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private socket: Socket;
  private apiUrl = environment.apiUrl;
  private currentChatSubject = new BehaviorSubject<Chat | null>(null);
  private chatsSubject = new BehaviorSubject<Chat[]>([]);

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    // Socket connects to same host as API (apiUrl without /api)
    const socketUrl = environment.apiUrl.replace(/\/api\/?$/, '');
    this.socket = io(socketUrl);
    this.setupSocketAuthentication();
    this.loadChats();

    // Handle incoming messages from socket
    this.socket.on('message', ({ chatId, message }) => {
      console.log('Received message:', { chatId, message });
      const currentChat = this.currentChatSubject.value;
      
      // Skip if no current chat
      if (!currentChat) {
        console.log('No current chat');
        return;
      }

      // Extract content safely - backend sends { content, role }
      const textContent = typeof message?.content === 'string' ? message.content : '';
      const role = message?.role === 'user' || message?.role === 'assistant' ? message.role : 'assistant';

      // Only update if it's the current chat and message doesn't exist
      if (currentChat._id === chatId && textContent &&
          !currentChat.messages?.some(m => 
            this.getDisplayContent(m) === textContent && 
            m.role === role && 
            Math.abs(new Date(m.timestamp || 0).getTime() - new Date().getTime()) < 2000
          )
      ) {
        this.updateChatWithMessage(chatId, textContent, role);
      } else {
        console.log('Skipping duplicate message');
      }
    });

    // Handle socket errors
    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  private setupSocketAuthentication() {
    const authenticate = () => {
      const token = localStorage.getItem('token');
      if (token) {
        this.socket.emit('authenticate', token);
      }
    };

    // Re-authenticate whenever socket connects (including reconnection)
    this.socket.on('connect', authenticate);

    // Authenticate immediately if already connected (e.g. fast initial connection)
    if (this.socket.connected) {
      authenticate();
    }

    // Also authenticate when token changes (e.g. after login)
    this.authService.getToken().subscribe(token => {
      if (token && this.socket.connected) {
        this.socket.emit('authenticate', token);
      }
    });
  }

  private async loadChats() {
    try {
      const chats = await this.http.get<Chat[]>(`${this.apiUrl}/chats`).toPromise();
      if (chats && chats.length > 0) {
        this.chatsSubject.next(chats);
        this.currentChatSubject.next(chats[0]);
      }
    } catch (error) {
      console.error('Error loading chats:', error);
    }
  }

  createChat(title: string): Observable<Chat> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${localStorage.getItem('token')}`);
    return this.http.post<Chat>(`${this.apiUrl}/chats`, { title }, { headers }).pipe(
      tap(chat => {
        this.chatsSubject.next([...this.chatsSubject.getValue(), chat]);
        this.currentChatSubject.next(chat);
      })
    );
  }

  selectChat(chatId: string) {
    const chat = this.chatsSubject.value.find(c => c._id === chatId);
    if (chat) {
      this.currentChatSubject.next(chat);
    }
  }

  deleteChat(chatId: string): Observable<void> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${localStorage.getItem('token')}`);
    return this.http.delete<void>(`${this.apiUrl}/chats/${chatId}`, { headers }).pipe(
      tap(() => {
        const currentChats = this.chatsSubject.getValue();
        const updatedChats = currentChats.filter(chat => chat._id !== chatId);
        this.chatsSubject.next(updatedChats);
        
        // If the deleted chat was the current chat, clear it
        const currentChat = this.currentChatSubject.getValue();
        if (currentChat?._id === chatId) {
          this.currentChatSubject.next(updatedChats[0] || null);
        }
      })
    );
  }

  sendMessage(content: string) {
    if (!content.trim() || !this.currentChatSubject.value) return;

    const currentChat = this.currentChatSubject.value;
    const timestamp = new Date();
    
    // Add user message first
    this.updateChatWithMessage(currentChat._id, content, 'user', timestamp);
    
    // Then emit to socket
    this.socket.emit('message', {
      chatId: currentChat._id,
      message: {
        content,
        timestamp
      }
    });
  }

  private updateChatWithMessage(chatId: string, content: string, role: 'user' | 'assistant', timestamp: Date = new Date()) {
    console.log('Updating chat with message:', { chatId, content, role });
    const currentChat = this.currentChatSubject.value;
    if (!currentChat || currentChat._id !== chatId) {
      console.log('No matching chat found');
      return;
    }

    const message: ChatMessage = {
      content,
      role,
      timestamp: new Date()
    };

    // Initialize messages array if it doesn't exist
    if (!currentChat.messages) {
      currentChat.messages = [];
    }

    currentChat.messages.push(message);
    console.log('Added message to chat:', message);
    
    // Update chat title if it's the first message
    if (currentChat.messages.length === 1 && role === 'user') {
      currentChat.title = content.slice(0, 30) + (content.length > 30 ? '...' : '');
    }

    currentChat.lastUpdated = new Date();
    this.currentChatSubject.next({ ...currentChat });
    
    const chats = this.chatsSubject.value.map(chat =>
      chat._id === chatId ? currentChat : chat
    );
    this.chatsSubject.next(chats);
  }

  getCurrentChat(): Observable<Chat | null> {
    return this.currentChatSubject.asObservable();
  }

  setCurrentChat(chat: Chat): void {
    this.currentChatSubject.next(chat);
  }



  getChats(): Observable<Chat[]> {
    return this.chatsSubject.asObservable();
  }

  getSocket(): Socket {
    return this.socket;
  }

  /** Safely get displayable string from message content (handles old DB records with [object Object]) */
  getDisplayContent(msg: { content?: unknown }): string {
    if (typeof msg?.content === 'string') {
      // Filter out malformed content from old buggy DB records
      if (msg.content === '[object Object]') return 'Unable to display message';
      return msg.content;
    }
    if (msg?.content && typeof msg.content === 'object') return 'Unable to display message';
    return String(msg?.content ?? '');
  }
}
