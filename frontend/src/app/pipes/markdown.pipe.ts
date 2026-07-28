import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Configure marked once: GitHub-flavoured markdown + ChatGPT-style code blocks.
const renderer = new marked.Renderer();
renderer.code = ({ text, lang }: { text: string; lang?: string }) => {
  const language = (lang || '').trim().split(/\s+/)[0] || 'text';
  return `<div class="code-block">` +
    `<div class="code-block-header">` +
      `<span class="code-lang">${escapeHtml(language)}</span>` +
      `<button class="copy-code-btn" type="button" aria-label="Copy code">Copy</button>` +
    `</div>` +
    `<pre><code>${escapeHtml(text)}</code></pre>` +
  `</div>`;
};

marked.use({ gfm: true, breaks: true, renderer });

// Open links in a new tab safely.
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A') {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

@Pipe({ name: 'markdown', standalone: true })
export class MarkdownPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string | null | undefined): SafeHtml {
    if (!value) return this.sanitizer.bypassSecurityTrustHtml('');
    const rawHtml = marked.parse(value, { async: false }) as string;
    const clean = DOMPurify.sanitize(rawHtml, {
      ADD_ATTR: ['target', 'rel'],
      ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
    });
    return this.sanitizer.bypassSecurityTrustHtml(clean);
  }
}
