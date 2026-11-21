import { describe, expect, it } from 'vitest';

import { formatJson, highlightMarkdownSource, parseJson, renderMarkdown } from './markup';

describe('markup', () => {
  it('renders markdown headings and highlights source cues', () => {
    expect(renderMarkdown('# Hello')).toContain('Hello');
    expect(highlightMarkdownSource('# Hello\n{{ name }}', true)).toContain('ag-token');
    expect(highlightMarkdownSource('# Hello\n{{ name }}', true)).toContain('ag-md-heading');
  });

  it('parses objects and string maps and pretty-prints values', () => {
    expect(parseJson('', 'object')).toEqual({ ok: true, value: {} });
    expect(parseJson('[]', 'object')).toEqual({ ok: false, error: 'object' });
    expect(parseJson('{"a":1}', 'string-map')).toEqual({ ok: false, error: 'string-map' });
    expect(parseJson('{"a":"b"}', 'string-map')).toEqual({ ok: true, value: { a: 'b' } });
    expect(formatJson('{"a":1}')).toBe('{\n  "a": 1\n}');
    expect(formatJson('{')).toBeNull();
  });
});
