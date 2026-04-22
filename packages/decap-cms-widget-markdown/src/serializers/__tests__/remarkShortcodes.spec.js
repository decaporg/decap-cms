import { Map, OrderedMap } from 'immutable';
import unified from 'unified';
import markdownToRemarkPlugin from 'remark-parse';

import { remarkParseShortcodes } from '../remarkShortcodes';

function process(value, plugins) {
  return unified()
    .use(markdownToRemarkPlugin, { fences: true, commonmark: true })
    .use(remarkParseShortcodes, { plugins })
    .parse(value);
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
