import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TextFieldModule } from '@angular/cdk/text-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { Chat, ChatMessage, ChatService } from '../../services/chat.service';
import { MarkdownPipe } from '../../pipes/markdown.pipe';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, TextFieldModule, MatSnackBarModule, MarkdownPipe],
  template: `
    <div class="chat">
      <!-- Empty state -->
      <div class="empty-state" *ngIf="!currentChat?.messages?.length && !isTyping">
        <div class="logo-badge">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l2.09 6.26L20.5 8.5l-5 3.7L17.4 20 12 16.1 6.6 20l1.9-7.8-5-3.7 6.41-.24z"/>
          </svg>
        </div>
        <h1>How can I help you today?</h1>
        <div class="suggestions">
          <button class="suggestion" (click)="sendExample('Explain quantum computing in simple terms')">
            <span class="s-title">Explain a concept</span>
            <span class="s-sub">Quantum computing in simple terms</span>
          </button>
          <button class="suggestion" (click)="sendExample('Give me creative ideas for a 10 year old birthday party')">
            <span class="s-title">Brainstorm ideas</span>
            <span class="s-sub">A 10 year old's birthday party</span>
          </button>
          <button class="suggestion" (click)="sendExample('Write a Python function to check if a string is a palindrome')">
            <span class="s-title">Write code</span>
            <span class="s-sub">A palindrome checker in Python</span>
          </button>
          <button class="suggestion" (click)="sendExample('Draft a polite email asking for a project deadline extension')">
            <span class="s-title">Help me write</span>
            <span class="s-sub">A deadline extension email</span>
          </button>
        </div>
      </div>

      <!-- Messages -->
      <div class="messages" #messagesContainer (click)="onMessagesClick($event)"
           *ngIf="currentChat?.messages?.length || isTyping">
        <div class="thread">
          <div *ngFor="let message of currentChat?.messages; trackBy: trackByIndex"
               class="row" [class.user]="message.role === 'user'">
            <ng-container *ngIf="message.role === 'user'; else assistantRow">
              <div class="bubble">{{ display(message) }}</div>
            </ng-container>
            <ng-template #assistantRow>
              <div class="avatar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l2.09 6.26L20.5 8.5l-5 3.7L17.4 20 12 16.1 6.6 20l1.9-7.8-5-3.7 6.41-.24z"/>
                </svg>
              </div>
              <div class="assistant-body">
                <div class="md-content" [innerHTML]="display(message) | markdown"></div>
                <button class="msg-copy" type="button" (click)="copyMessage(display(message))" aria-label="Copy">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                  <span>Copy</span>
                </button>
              </div>
            </ng-template>
          </div>

          <!-- Typing indicator -->
          <div class="row" *ngIf="isTyping">
            <div class="avatar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l2.09 6.26L20.5 8.5l-5 3.7L17.4 20 12 16.1 6.6 20l1.9-7.8-5-3.7 6.41-.24z"/>
              </svg>
            </div>
            <div class="assistant-body">
              <div class="typing"><span></span><span></span><span></span></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Composer -->
      <div class="composer">
        <div class="composer-inner">
          <textarea
            #messageInput
            [(ngModel)]="newMessage"
            (keydown)="handleKeyDown($event)"
            placeholder="Message AI Chat…"
            rows="1"
            cdkTextareaAutosize
            cdkAutosizeMinRows="1"
            cdkAutosizeMaxRows="8"></textarea>
          <button class="send" [class.active]="newMessage.trim().length > 0"
                  [disabled]="!newMessage.trim() || isTyping" (click)="sendMessage()" aria-label="Send">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
            </svg>
          </button>
        </div>
        <p class="disclaimer">AI can make mistakes. Consider checking important information.</p>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; background: var(--bg); }

    .chat {
      height: 100%;
      display: flex;
      flex-direction: column;
      color: var(--text);
      position: relative;
    }

    /* ---------- Empty state ---------- */
    .empty-state {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem 1rem;
      text-align: center;
    }
    .logo-badge {
      width: 56px; height: 56px;
      display: flex; align-items: center; justify-content: center;
      border-radius: 50%;
      background: var(--bg-elevated);
      color: var(--accent);
      margin-bottom: 1.25rem;
    }
    .empty-state h1 { font-size: 1.75rem; font-weight: 600; margin-bottom: 2rem; }
    .suggestions {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 260px));
      gap: 0.75rem;
      width: 100%;
      max-width: 540px;
    }
    .suggestion {
      display: flex; flex-direction: column; gap: 0.2rem;
      text-align: left;
      padding: 0.85rem 1rem;
      background: transparent;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: background 0.15s ease, border-color 0.15s ease;
    }
    .suggestion:hover { background: var(--bg-elevated); border-color: var(--border-strong); }
    .s-title { font-size: 0.9rem; font-weight: 600; color: var(--text); }
    .s-sub { font-size: 0.8rem; color: var(--text-muted); }

    /* ---------- Messages ---------- */
    .messages { flex: 1; overflow-y: auto; scroll-behavior: smooth; }
    .thread { max-width: 768px; margin: 0 auto; padding: 1.5rem 1rem 1rem; }

    .row { display: flex; gap: 0.9rem; margin-bottom: 1.75rem; animation: appear 0.25s ease-out; }
    .row.user { justify-content: flex-end; }

    @keyframes appear { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }

    .bubble {
      background: var(--bg-elevated);
      padding: 0.7rem 1rem;
      border-radius: var(--radius-lg);
      border-top-right-radius: 6px;
      max-width: 78%;
      line-height: 1.6;
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    .avatar {
      flex-shrink: 0;
      width: 30px; height: 30px;
      display: flex; align-items: center; justify-content: center;
      border-radius: 50%;
      background: var(--bg-elevated);
      color: var(--accent);
      margin-top: 2px;
    }
    .assistant-body { min-width: 0; flex: 1; }

    .msg-copy {
      display: inline-flex; align-items: center; gap: 0.35rem;
      margin-top: 0.5rem;
      padding: 0.25rem 0.5rem;
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 0.75rem;
      border-radius: 6px;
      opacity: 0;
      transition: opacity 0.15s ease, color 0.15s ease, background 0.15s ease;
    }
    .row:hover .msg-copy { opacity: 1; }
    .msg-copy:hover { color: var(--text); background: var(--bg-elevated); }
    .msg-copy.copied { color: var(--accent); opacity: 1; }

    .typing { display: inline-flex; gap: 5px; padding: 0.5rem 0; }
    .typing span {
      width: 7px; height: 7px; border-radius: 50%;
      background: var(--text-muted);
      animation: blink 1.4s infinite both;
    }
    .typing span:nth-child(2) { animation-delay: 0.2s; }
    .typing span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes blink { 0%, 80%, 100% { opacity: 0.25; } 40% { opacity: 1; } }

    /* ---------- Composer ---------- */
    .composer { padding: 0.5rem 1rem 0.75rem; background: var(--bg); }
    .composer-inner {
      max-width: 768px;
      margin: 0 auto;
      display: flex;
      align-items: flex-end;
      gap: 0.5rem;
      background: var(--bg-elevated);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 0.5rem 0.5rem 0.5rem 1rem;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.25);
    }
    .composer-inner:focus-within { border-color: var(--border-strong); }

    textarea {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      resize: none;
      color: var(--text);
      font-size: 1rem;
      line-height: 1.5;
      padding: 0.4rem 0;
      max-height: 200px;
    }
    textarea::placeholder { color: var(--text-muted); }

    .send {
      flex-shrink: 0;
      width: 36px; height: 36px;
      display: flex; align-items: center; justify-content: center;
      border: none;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.12);
      color: var(--text-muted);
      cursor: not-allowed;
      transition: background 0.15s ease, color 0.15s ease;
    }
    .send.active { background: var(--accent); color: #0b0b0b; cursor: pointer; }
    .send.active:hover { background: var(--accent-hover); }
    .send:disabled { cursor: not-allowed; }

    .disclaimer {
      text-align: center;
      font-size: 0.72rem;
      color: var(--text-muted);
      margin-top: 0.5rem;
    }

    @media (max-width: 768px) {
      .suggestions { grid-template-columns: 1fr; max-width: 340px; }
      .empty-state h1 { font-size: 1.4rem; }
      .thread { padding: 1rem 0.75rem; }
      .bubble { max-width: 85%; }
      .msg-copy { opacity: 1; }
    }
  `]
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer?: ElementRef<HTMLDivElement>;

  currentChat: Chat | null = null;
  newMessage = '';
  isTyping = false;

  private shouldScroll = false;
  private subs: Subscription[] = [];

  constructor(private chatService: ChatService, private snackBar: MatSnackBar) {}

  ngOnInit() {
    this.subs.push(
      this.chatService.getCurrentChat().subscribe(chat => {
        const changed = !this.currentChat
          || this.currentChat._id !== chat?._id
          || this.currentChat?.messages?.length !== chat?.messages?.length;
        this.currentChat = chat;
        if (changed) this.shouldScroll = true;
      }),

      this.chatService.isTyping().subscribe(typing => {
        this.isTyping = typing;
        if (typing) this.shouldScroll = true;
      }),

      this.chatService.getNotifications().subscribe(n => this.showToast(n.message, n.type))
    );
  }

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
  }

  trackByIndex(index: number): number { return index; }

  display(message: ChatMessage): string {
    return this.chatService.getDisplayContent(message);
  }

  sendMessage() {
    const text = this.newMessage.trim();
    if (!text || this.isTyping) return;
    this.chatService.sendMessage(text);
    this.newMessage = '';
    this.shouldScroll = true;
  }

  sendExample(message: string) {
    this.newMessage = message;
    this.sendMessage();
  }

  handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  /** Delegate clicks on the "Copy" buttons inside rendered code blocks. */
  onMessagesClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const btn = target.closest('.copy-code-btn') as HTMLElement | null;
    if (!btn) return;
    const code = btn.closest('.code-block')?.querySelector('code');
    if (!code) return;
    this.copyText(code.textContent || '', btn, 'Copied');
  }

  copyMessage(text: string) {
    this.copyText(text);
    this.showToast('Copied to clipboard', 'success');
  }

  private copyText(text: string, btn?: HTMLElement, label = 'Copy') {
    navigator.clipboard?.writeText(text).then(() => {
      if (btn) {
        const original = btn.textContent;
        btn.textContent = label;
        btn.classList.add('copied');
        setTimeout(() => { btn.textContent = original; btn.classList.remove('copied'); }, 1500);
      }
    }).catch(() => {});
  }

  private showToast(message: string, type: 'success' | 'error' | 'info') {
    this.snackBar.open(message, 'Dismiss', {
      duration: type === 'error' ? 6000 : 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['app-snackbar', `${type}-snackbar`]
    });
  }

  private scrollToBottom() {
    try {
      const el = this.messagesContainer?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    } catch { /* view not ready */ }
  }
}
