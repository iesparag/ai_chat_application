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
    this.socket = io('http://localhost:3000');
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

      // Only update if it's the current chat and message doesn't exist
      if (currentChat._id === chatId && 
          !currentChat.messages?.some(m => 
            m.content === message.content && 
            m.role === message.role && 
            Math.abs(new Date(m.timestamp).getTime() - new Date().getTime()) < 1000
          )
      ) {
        this.updateChatWithMessage(chatId, message.content, message.role);
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
    this.authService.getToken().subscribe(token => {
      if (token) {
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
}
