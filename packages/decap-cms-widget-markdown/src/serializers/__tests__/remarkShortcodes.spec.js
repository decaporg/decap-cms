import { Map, OrderedMap } from 'immutable';
import unified from 'unified';
import markdownToRemarkPlugin from 'remark-parse';
import remarkToMarkdownPlugin from 'remark-stringify';

import { remarkParseShortcodes, createRemarkShortcodeStringifier } from '../remarkShortcodes';

function process(value, plugins) {
  return unified()
    .use(markdownToRemarkPlugin, { fences: true, commonmark: true })
    .use(remarkParseShortcodes, { plugins })
    .parse(value);
}

function stringify(mdast, plugins) {
  return unified()
    .use(remarkToMarkdownPlugin, { commonmark: true })
    .use(createRemarkShortcodeStringifier({ plugins }))
    .stringify(mdast)
    .trim();
}

function EditorComponent({ id = 'foo', fromBlock = jest.fn(), pattern }) {
  return {
    id,
    fromBlock,
    pattern,
  };
}

describe('remarkParseShortcodes', () => {
  describe('pattern matching', () => {
    it('should match multiline shortcodes', () => {
      const editorComponent = EditorComponent({ pattern: /^foo\nbar$/ });
      process('foo\nbar', Map({ [editorComponent.id]: editorComponent }));
      expect(editorComponent.fromBlock).toHaveBeenCalledWith(expect.arrayContaining(['foo\nbar']));
    });
    it('should match multiline shortcodes with empty lines', () => {
      const editorComponent = EditorComponent({ pattern: /^foo\n\nbar$/ });
      process('foo\n\nbar', Map({ [editorComponent.id]: editorComponent }));
      expect(editorComponent.fromBlock).toHaveBeenCalledWith(
        expect.arrayContaining(['foo\n\nbar']),
      );
    });
    it('should match shortcodes by first matching plugin', () => {
      const fooEditorComponent = EditorComponent({ id: 'foo', pattern: /^foo/ });
      const barEditorComponent = EditorComponent({ id: 'bar', pattern: /^bar/ });
      process(
        'bar\n\nfoo',
        OrderedMap([
          [fooEditorComponent.id, fooEditorComponent],
          [barEditorComponent.id, barEditorComponent],
        ]),
      );
      // 'bar' is the first block, but 'foo' plugin is first in registry,
      // so 'foo' doesn't match 'bar'. 'bar' plugin matches 'bar'.
      expect(barEditorComponent.fromBlock).toHaveBeenCalledWith(expect.arrayContaining(['bar']));
    });
    it('should warn when pattern uses multiline flag', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const editorComponent = EditorComponent({ pattern: /^foo$/m });
      process('foo', Map({ [editorComponent.id]: editorComponent }));
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('must not use the multiline flag'),
      );
      warnSpy.mockRestore();
    });
  });
  describe('parse', () => {
    describe('pattern with leading caret', () => {
      it('should be a remark shortcode node', () => {
        const editorComponent = EditorComponent({
          pattern: /^foo (?<bar>.+)$/,
          fromBlock: ({ groups }) => ({ bar: groups.bar }),
        });
        const mdast = process('foo baz', Map({ [editorComponent.id]: editorComponent }));
        expect(removePositions(mdast)).toMatchSnapshot();
      });
      it('should parse multiple shortcodes', () => {
        const editorComponent = EditorComponent({
          pattern: /foo (?<bar>.+)/,
          fromBlock: ({ groups }) => ({ bar: groups.bar }),
        });
        const mdast = process(
          'paragraph\n\nfoo bar\n\nfoo baz\n\nnext para',
          Map({ [editorComponent.id]: editorComponent }),
        );
        expect(removePositions(mdast)).toMatchSnapshot();
      });
    });
    describe('pattern without leading caret', () => {
      it('should handle pattern without leading caret', () => {
        const editorComponent = EditorComponent({
          pattern: /foo (?<bar>.+)/,
          fromBlock: ({ groups }) => ({ bar: groups.bar }),
        });
        const mdast = process(
          'paragraph\n\nfoo baz',
          Map({ [editorComponent.id]: editorComponent }),
        );
        expect(removePositions(mdast)).toMatchSnapshot();
      });
      it('should parse multiple shortcodes', () => {
        const editorComponent = EditorComponent({
          pattern: /foo (?<bar>.+)/,
          fromBlock: ({ groups }) => ({ bar: groups.bar }),
        });
        const mdast = process(
          'paragraph\n\nfoo bar\n\nfoo baz\n\nnext para',
          Map({ [editorComponent.id]: editorComponent }),
        );
        expect(removePositions(mdast)).toMatchSnapshot();
      });
    });
    describe('inline shortcodes', () => {
      it('should parse inline shortcode inside paragraph without breaking paragraph into blocks', () => {
        const inlineComponent = {
          id: 'ref',
          type: 'inline',
          pattern: /\{\{<\s*ref\s+"(?<target>[^"]+)"\s*>\}\}/,
          fromInline: match => ({ target: match.groups.target }),
          toInline: data => `{{< ref "${data.target}" >}}`,
        };

        const mdast = process(
          'Hello {{< ref "about" >}} world',
          Map({ [inlineComponent.id]: inlineComponent }),
        );

        const stripped = removePositions(mdast);
        expect(stripped).toEqual({
          type: 'root',
          children: [
            {
              type: 'paragraph',
              children: [
                { type: 'text', value: 'Hello ' },
                {
                  type: 'inline-shortcode',
                  data: {
                    shortcode: 'ref',
                    shortcodeData: { target: 'about' },
                    isVoid: true,
                  },
                },
                { type: 'text', value: ' world' },
              ],
            },
          ],
        });
      });

      it('should parse adjacent CJK characters and punctuation correctly', () => {
        const wikilinkComponent = {
          id: 'wikilink',
          type: 'inline',
          trigger: '[',
          pattern: /\[\[(?<target>[^\]]+)\]\]/,
          fromInline: match => ({ target: match.groups.target }),
          toInline: data => `[[${data.target}]]`,
        };

        const mdast = process(
          '這是一個[[測試頁面]]，請點擊！',
          Map({ [wikilinkComponent.id]: wikilinkComponent }),
        );

        const stripped = removePositions(mdast);
        expect(stripped).toEqual({
          type: 'root',
          children: [
            {
              type: 'paragraph',
              children: [
                { type: 'text', value: '這是一個' },
                {
                  type: 'inline-shortcode',
                  data: {
                    shortcode: 'wikilink',
                    shortcodeData: { target: '測試頁面' },
                    isVoid: true,
                  },
                },
                { type: 'text', value: '，請點擊！' },
              ],
            },
          ],
        });
      });

      it('should parse multiple inline shortcodes within single paragraph', () => {
        const tagComponent = {
          id: 'tag',
          type: 'inline',
          trigger: '#',
          pattern: /#(?<name>[a-zA-Z0-9_-]+)/,
          fromInline: match => ({ name: match.groups.name }),
          toInline: data => `#${data.name}`,
        };

        const mdast = process(
          'Tags: #react and #decap are cool',
          Map({ [tagComponent.id]: tagComponent }),
        );

        const stripped = removePositions(mdast);
        expect(stripped.children[0].children).toHaveLength(5);
        expect(stripped.children[0].children[1]).toEqual({
          type: 'inline-shortcode',
          data: {
            shortcode: 'tag',
            shortcodeData: { name: 'react' },
            isVoid: true,
          },
        });
        expect(stripped.children[0].children[3]).toEqual({
          type: 'inline-shortcode',
          data: {
            shortcode: 'tag',
            shortcodeData: { name: 'decap' },
            isVoid: true,
          },
        });
      });

      it('should stringify inline shortcodes correctly in round-trip', () => {
        const inlineComponent = {
          id: 'ref',
          type: 'inline',
          pattern: /\{\{<\s*ref\s+"(?<target>[^"]+)"\s*>\}\}/,
          fromInline: match => ({ target: match.groups.target }),
          toInline: data => `{{< ref "${data.target}" >}}`,
        };

        const input = 'Hello {{< ref "about" >}} world';
        const plugins = Map({ [inlineComponent.id]: inlineComponent });
        const mdast = process(input, plugins);
        const output = stringify(mdast, plugins);

        expect(output).toEqual(input);
      });

      it('should warn when inline component pattern has greedy quantifier', () => {
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        const inlineComponent = {
          id: 'greedy-ref',
          type: 'inline',
          pattern: /\{\{< ref (.+) >\}\}/,
          fromInline: match => ({ target: match[1] }),
          toInline: data => `{{< ref ${data.target} >}}`,
        };

        process('text', Map({ [inlineComponent.id]: inlineComponent }));
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining('Potentially greedy RegExp in inline component'),
        );
        warnSpy.mockRestore();
      });

      it('should handle inline shortcodes nested inside bold text', () => {
        const badgeComponent = {
          id: 'badge',
          type: 'inline',
          pattern: /\[badge:(?<text>[^\]]+)\]/,
          fromInline: match => ({ text: match.groups.text }),
          toInline: data => `[badge:${data.text}]`,
        };

        const input = '**Important [badge:NEW] Note**';
        const plugins = Map({ [badgeComponent.id]: badgeComponent });
        const mdast = process(input, plugins);
        const stripped = removePositions(mdast);

        expect(stripped.children[0].children[0].type).toBe('strong');
        const strongChildren = stripped.children[0].children[0].children;
        expect(strongChildren[0]).toEqual({ type: 'text', value: 'Important ' });
        expect(strongChildren[1]).toEqual({
          type: 'inline-shortcode',
          data: {
            shortcode: 'badge',
            shortcodeData: { text: 'NEW' },
            isVoid: true,
          },
        });
        expect(strongChildren[2]).toEqual({ type: 'text', value: ' Note' });
      });
    });
  });

  function removePositions(obj) {
    if (Array.isArray(obj)) {
      return obj.map(removePositions);
    }
    if (obj && typeof obj === 'object') {
      // eslint-disable-next-line no-unused-vars
      const { position, ...rest } = obj;
      const result = {};
      for (const key in rest) {
        result[key] = removePositions(rest[key]);
      }
      return result;
    }
    return obj;
  }
});
