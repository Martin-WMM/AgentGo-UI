import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import markdown from 'highlight.js/lib/languages/markdown';
import python from 'highlight.js/lib/languages/python';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import { marked } from 'marked';

import 'highlight.js/styles/github.min.css';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('js', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('ts', typescript);
hljs.registerLanguage('json', json);
hljs.registerLanguage('python', python);
hljs.registerLanguage('py', python);
hljs.registerLanguage('markdown', markdown);
hljs.registerLanguage('md', markdown);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('html', xml);

marked.use({
  gfm: true,
  breaks: true,
  renderer: {
    code({ text, lang }) {
      const language = lang && hljs.getLanguage(lang) ? lang : '';
      const highlighted = language
        ? hljs.highlight(text, { language }).value
        : hljs.highlightAuto(text).value;
      const className = language ? `hljs language-${language}` : 'hljs';
      return `<pre class="prompt-md-pre"><code class="${className}">${highlighted}</code></pre>`;
    },
  },
});

/** Escapes HTML special characters for safe overlay rendering. */
export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/**
 * Highlights common Markdown cues and `{{ placeholder }}` tokens for the
 * write-pane overlay behind the transparent textarea.
 */
export function highlightPromptSource(source: string): string {
  let html = escapeHtml(source);
  html = html.replace(
    /(\{\{\s*[A-Za-z_][A-Za-z0-9_]*\s*\}\})/g,
    '<mark class="prompt-token">$1</mark>',
  );
  html = html.replace(/^(#{1,6}\s.+)$/gm, '<span class="prompt-md-heading">$1</span>');
  html = html.replace(/(`[^`\n]+`)/g, '<span class="prompt-md-inline-code">$1</span>');
  html = html.replace(/(\*\*[^*\n]+\*\*)/g, '<span class="prompt-md-strong">$1</span>');
  return html || ' ';
}

/** Renders Markdown to HTML with fenced-code highlighting. */
export function renderPromptMarkdown(source: string): string {
  if (!source.trim()) return '';
  return marked.parse(source, { async: false }) as string;
}
