import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { Chat, ChatMessage } from '../../services/chat.service';
import { ChatService } from '../../services/chat.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule
  ],
  template: `
    <div class="chat-container">
      <!-- Error message -->
      <div class="error-message" *ngIf="errorMessage">
        {{ errorMessage }}
      </div>
      <!-- Empty state when no messages -->
      <div class="empty-state" *ngIf="!currentChat?.messages?.length">
        <h2>How can I help you today?</h2>
        <div class="examples">
          <div class="example-group">
            <h3>Examples</h3>
            <button mat-button (click)="sendExample('Explain quantum computing in simple terms')">
              "Explain quantum computing in simple terms" →
            </button>
            <button mat-button (click)="sendExample('Got any creative ideas for a 10 year old birthday party?')">
              "Got any creative ideas for a 10 year old birthday party?" →
            </button>
          </div>
        </div>
      </div>

      <!-- Messages -->
      <div class="messages" #messagesContainer>
        <div *ngFor="let message of currentChat?.messages" 
             [ngClass]="{'message': true, 'user-message': message.role === 'user'}">
          <div class="avatar">
            <mat-icon>{{ message.role === 'user' ? 'person' : 'smart_toy' }}</mat-icon>
          </div>
          <div class="content">
            {{ message.content }}
          </div>
        </div>
      </div>

      <!-- Input area -->
      <div class="input-area" (click)="$event.stopPropagation()">
        <div class="input-wrapper">
          <mat-form-field appearance="outline">
            <input matInput 
                   [(ngModel)]="newMessage" 
                   (keyup.enter)="sendMessage()"
                   placeholder="Type a message..."
                   [style.caretColor]="'white'">
          </mat-form-field>
          <button mat-icon-button 
                  [class.active]="newMessage.trim()"
                  [disabled]="!newMessage.trim()"
                  (click)="sendMessage()">
            <mat-icon>send</mat-icon>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
      overflow: hidden;
      background-color: #343541;
    }

    .chat-container {
      height: 100%;
      display: flex;
      flex-direction: column;
      color: #ECECF1;
      position: relative;
      max-width: 900px;
      margin: 0 auto;
      padding: 0 1rem;
    }

    .empty-state {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
      width: 100%;
    }

    .empty-state h2 {
      font-size: 2rem;
      font-weight: 600;
      margin-bottom: 2rem;
      background: linear-gradient(90deg, #00DC82 0%, #36E4DA 50%, #0047E1 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      animation: gradient 8s ease infinite;
    }

    .examples {
      max-width: 600px;
      width: 100%;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1rem;
      padding: 1rem;
    }

    .example-group {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      padding: 1.5rem;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .example-group h3 {
      margin-bottom: 1rem;
      color: var(--text-light);
      font-size: 1.2rem;
      font-weight: 500;
      letter-spacing: 0.5px;
    }

    .example-group button {
      width: 100%;
      margin-bottom: 0.75rem;
      text-align: left;
      white-space: normal;
      height: auto;
      line-height: 1.5;
      padding: 1rem;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.05);
      color: var(--text-light);
      transition: all 0.2s ease;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .example-group button:hover {
      background: rgba(255, 255, 255, 0.1);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .messages {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
      margin: 0 -1rem;
      scroll-behavior: smooth;
    }

    .messages::-webkit-scrollbar {
      width: 6px;
    }

    .messages::-webkit-scrollbar-track {
      background: transparent;
    }

    .messages::-webkit-scrollbar-thumb {
      background-color: rgba(255,255,255,0.2);
      border-radius: 3px;
    }

    .message {
      display: flex;
      padding: 1.5rem;
      gap: 1.5rem;
      border-bottom: 1px solid var(--border-dark);
      animation: messageAppear 0.3s ease-out;
      max-width: 1000px;
      margin: 0 auto;
    }

    @keyframes messageAppear {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .message:last-child {
      border-bottom: none;
    }

    .user-message {
      background-color: var(--hover-dark);
    }

    .avatar {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      background-color: var(--primary-color);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .user-message .avatar {
      background-color: #9859B6;
      background: linear-gradient(135deg, #9859B6 0%, #7B36D7 100%);
    }

    .content {
      flex: 1;
      line-height: 1.7;
      font-size: 1rem;
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    .input-area {
      padding: 1rem;
      position: sticky;
      bottom: 0;
      background-color: #343541;
      border-top: 1px solid rgba(255,255,255,0.1);
      z-index: 1001;
    }

    .input-wrapper {
      max-width: 800px;
      margin: 0 auto;
      position: relative;
      display: flex;
      gap: 0.75rem;
      align-items: flex-start;
      background: #40414F;
      border-radius: 1rem;
      border: 1px solid rgba(255,255,255,0.1);
      padding: 0.75rem;
      box-shadow: 0 0 15px rgba(0,0,0,0.1);
    }

    mat-form-field {
      flex: 1;
    }

    ::ng-deep .mat-mdc-form-field-flex {
      background-color: transparent !important;
      padding: 0 !important;
    }

    ::ng-deep .mat-mdc-form-field-infix {
      padding: 0.5rem 0 !important;
      min-height: unset !important;
    }

    ::ng-deep .mat-mdc-text-field-wrapper {
      background-color: transparent !important;
      padding: 0 !important;
    }

    ::ng-deep .mdc-text-field--outlined {
      --mdc-outlined-text-field-outline-color: transparent;
    }

    input.mat-mdc-input-element {
      color: white !important;
      font-size: 1rem !important;
      line-height: 1.5 !important;
    }

    button[mat-icon-button] {
      color: rgba(255,255,255,0.4);
      transition: all 0.2s ease;
    }

    button[mat-icon-button].active {
      color: #19C37D;
      cursor: pointer;
    }

    button[mat-icon-button].active:hover {
      background-color: rgba(25,195,125,0.1);
    }

    ::ng-deep .input-area .mat-mdc-form-field-subscript-wrapper {
      display: none;
    }

    .error-message {
      position: fixed;
      top: 1.5rem;
      left: 50%;
      transform: translateX(-50%);
      background-color: #f44336;
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      z-index: 1000;
      animation: fadeIn 0.3s ease-in;
      box-shadow: 0 4px 12px rgba(244, 67, 54, 0.3);
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    @media (max-width: 768px) {
      .chat-container {
        padding: 0;
      }

      .empty-state {
        padding: 1rem;
      }

      .empty-state h2 {
        font-size: 1.5rem;
      }

      .examples {
        grid-template-columns: 1fr;
        padding: 0.5rem;
      }

      .message {
        padding: 1rem;
        gap: 0.75rem;
      }

      .input-area {
        padding: 0.75rem 0.75rem 1rem;
      }

      .input-wrapper {
        padding: 0.625rem;
      }

      .avatar {
        width: 32px;
        height: 32px;
      }

      .content {
        font-size: 0.9375rem;
      }

      mat-form-field {
        margin-bottom: -1.25em;
      }
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translate(-50%, -20px); }
      to { opacity: 1; transform: translate(-50%, 0); }
    }
  `]
})
export class ChatComponent implements OnInit, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  currentChat: Chat | null = null;
  newMessage = '';
  errorMessage: string | null = null;

  constructor(private chatService: ChatService) {
    // Listen for socket errors
    this.chatService.getSocket().on('error', (error: { message: string }) => {
      console.error('Socket error:', error);
      this.errorMessage = error.message;
      setTimeout(() => this.errorMessage = null, 5000); // Clear error after 5 seconds
    });
  }

  ngOnInit() {
    this.chatService.getCurrentChat().subscribe(chat => {
      // Only update if chat is different or messages length changed
      if (!this.currentChat || 
          this.currentChat._id !== chat?._id || 
          this.currentChat?.messages?.length !== chat?.messages?.length) {
        this.currentChat = chat;
        setTimeout(() => this.scrollToBottom(), 0);
      }
    });
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    try {
      const container = this.messagesContainer.nativeElement;
      container.scrollTop = container.scrollHeight;
    } catch (err) {}
  }

  sendMessage() {
    if (!this.newMessage.trim()) return;
    
    this.chatService.sendMessage(this.newMessage);
    this.newMessage = '';
  }

  sendExample(message: string) {
    this.newMessage = message;
    this.sendMessage();
  }
}
