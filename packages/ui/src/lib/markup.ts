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
      return `<pre class="ag-md-pre"><code class="${className}">${highlighted}</code></pre>`;
    },
  },
});

/** Shape accepted by {@link parseJson}. */
export type JsonExpect = 'value' | 'object' | 'string-map';

/** Why a JSON document was rejected. */
export type JsonParseError = 'invalid' | 'object' | 'string-map';

export type JsonParseResult = { ok: true; value: unknown } | { ok: false; error: JsonParseError };

/** Escapes HTML special characters before inserting text into highlighted markup. */
export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/**
 * Highlights Markdown cues for the write-pane overlay.
 *
 * @param source raw editor text
 * @param placeholders when true, also marks `{{ identifier }}` tokens
 */
export function highlightMarkdownSource(source: string, placeholders = false): string {
  let html = escapeHtml(source);
  if (placeholders) {
    html = html.replace(
      /(\{\{\s*[A-Za-z_][A-Za-z0-9_]*\s*\}\})/g,
      '<mark class="ag-token">$1</mark>',
    );
  }
  html = html.replace(/^(#{1,6}\s.+)$/gm, '<span class="ag-md-heading">$1</span>');
  html = html.replace(/(`[^`\n]+`)/g, '<span class="ag-md-inline-code">$1</span>');
  html = html.replace(/(\*\*[^*\n]+\*\*)/g, '<span class="ag-md-strong">$1</span>');
  return html || ' ';
}

/** Renders Markdown to HTML with fenced-code highlighting. */
export function renderMarkdown(source: string): string {
  if (!source.trim()) return '';
  return marked.parse(source, { async: false }) as string;
}

/** Highlights a JSON document for a read-only view or editor overlay. */
export function highlightJson(source: string): string {
  const text = source.length > 0 ? source : ' ';
  return hljs.highlight(text, { language: 'json' }).value;
}

/**
 * Parses JSON and optionally requires an object or a string map.
 *
 * A blank document is an empty object for `object` and `string-map`, and `null` for `value`.
 */
export function parseJson(source: string, expect: JsonExpect = 'value'): JsonParseResult {
  const raw = source.trim() || (expect === 'value' ? 'null' : '{}');
  let value: unknown;
  try {
    value = JSON.parse(raw) as unknown;
  } catch {
    return { ok: false, error: 'invalid' };
  }
  if (expect === 'object' || expect === 'string-map') {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return { ok: false, error: 'object' };
    }
  }
  if (expect === 'string-map') {
    const entries = Object.values(value as Record<string, unknown>);
    if (entries.some((entry) => typeof entry !== 'string')) {
      return { ok: false, error: 'string-map' };
    }
  }
  return { ok: true, value };
}

/** Returns pretty-printed JSON, or null when the text is not JSON. */
export function formatJson(source: string): string | null {
  const parsed = parseJson(source, 'value');
  if (!parsed.ok) return null;
  return JSON.stringify(parsed.value, null, 2);
}

/** Pretty-prints a value that is already parsed. */
export function stringifyJson(value: unknown): string {
  return JSON.stringify(value, null, 2) ?? '';
}
