import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';
import { Chat } from '../../services/chat.service';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="sidebar-container">
      <div class="sidebar-header">
        <button class="new-chat-btn" (click)="createNewChat()">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          New Chat
        </button>
      </div>

      <div class="chats-list">
        <ng-container *ngFor="let chat of chats$ | async">
          <div class="chat-item" 
               [class.active]="(currentChat$ | async)?._id === chat._id"
               (click)="selectChat(chat._id)">
            <div class="chat-item-content">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              <span class="chat-title">{{ chat.title }}</span>
            </div>
            <button class="delete-btn" (click)="$event.stopPropagation(); deleteChat(chat._id)">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18"></path>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </ng-container>
      </div>

      <div class="sidebar-footer">
        <button class="logout-btn" (click)="logout()">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          Logout
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
      background-color: #202123;
      color: white;
    }

    .sidebar-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      padding: 1rem;
    }

    .sidebar-header {
      margin-bottom: 1rem;
      padding: 0.5rem 0;
    }

    .new-chat-btn {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 0.5rem;
      background: transparent;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: all 0.2s ease;
      font-size: 0.9375rem;
    }

    .new-chat-btn:hover {
      background-color: rgba(255,255,255,0.1);
      border-color: rgba(255,255,255,0.4);
    }

    .new-chat-btn:active {
      transform: scale(0.98);
    }

    .chats-list {
      flex: 1;
      overflow-y: auto;
      margin: 0 -1rem;
      padding: 0 1rem;
    }

    .chats-list::-webkit-scrollbar {
      width: 6px;
    }

    .chats-list::-webkit-scrollbar-track {
      background: transparent;
    }

    .chats-list::-webkit-scrollbar-thumb {
      background-color: #565869;
      border-radius: 3px;
    }

    .chat-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem;
      margin-bottom: 0.5rem;
      border-radius: 0.375rem;
      cursor: pointer;
      transition: all 0.3s ease;
      border: 1px solid transparent;
    }

    .chat-item:hover {
      background-color: #2A2B32;
      border-color: #565869;
    }

    .chat-item.active {
      background-color: #343541;
      border-color: #565869;
    }

    .chat-item-content {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex: 1;
      min-width: 0;
    }

    .chat-title {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 0.9rem;
    }

    .delete-btn {
      background: transparent;
      border: none;
      color: #565869;
      cursor: pointer;
      padding: 0.25rem;
      border-radius: 0.25rem;
      transition: all 0.3s ease;
      opacity: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .chat-item:hover .delete-btn {
      opacity: 1;
    }

    .delete-btn:hover {
      color: #ff4a4a;
      background-color: rgba(255, 74, 74, 0.1);
    }

    .sidebar-footer {
      margin-top: auto;
      padding-top: 1rem;
      border-top: 1px solid #565869;
    }

    .logout-btn {
      width: 100%;
      color: var(--text-light);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding: 0.75rem;
      border-radius: 8px;
      background: rgba(244, 67, 54, 0.1);
      font-weight: 500;
      transition: all 0.2s ease;
    }

    .logout-btn:hover {
      background: rgba(244, 67, 54, 0.2);
    }

    @media (max-width: 768px) {
      .sidebar-container {
        padding: 0.75rem;
      }

      .sidebar-header {
        margin-bottom: 0.75rem;
        padding: 0;
      }

      .new-chat-btn {
        padding: 0.625rem;
        font-size: 0.875rem;
      }

      .chat-item {
        padding: 0.625rem;
        margin-bottom: 0.25rem;
      }

      .chat-title {
        font-size: 0.875rem;
      }

      .delete-btn {
        opacity: 1;
        padding: 0.375rem;
      }

      .logout-btn {
        padding: 0.625rem;
        margin-top: 0.5rem;
      }
    }
  `]
})
export class SidebarComponent implements OnInit {
  chats$!: Observable<Chat[]>;
  currentChat$!: Observable<Chat | null>;

  constructor(
    private chatService: ChatService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.chats$ = this.chatService.getChats();
    this.currentChat$ = this.chatService.getCurrentChat();
  }

  deleteChat(chatId: string) {
    this.chatService.deleteChat(chatId).subscribe({
      error: (error: any) => console.error('Error deleting chat:', error)
    });
  }

  createNewChat() {
    this.chatService.createChat('New Chat').subscribe({
      next: (chat: Chat) => {
        this.chatService.setCurrentChat(chat);
      },
      error: (error: any) => {
        console.error('Error creating chat:', error);
      }
    });
  }

  selectChat(chatId: string) {
    this.chatService.selectChat(chatId);
  }

  logout() {
    this.authService.logout();
  }
}
