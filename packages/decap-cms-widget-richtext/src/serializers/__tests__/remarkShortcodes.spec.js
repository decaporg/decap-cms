import { Map, OrderedMap } from 'immutable';
import unified from 'unified';
import markdownToRemarkPlugin from 'remark-parse';

import { remarkParseShortcodes, getLinesWithOffsets } from '../remarkShortcodes';

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
    it('should match shortcodes based on order of occurrence in value', () => {
      const fooEditorComponent = EditorComponent({ id: 'foo', pattern: /foo/ });
      const barEditorComponent = EditorComponent({ id: 'bar', pattern: /bar/ });
      process(
        'foo\n\nbar',
        OrderedMap([
          [barEditorComponent.id, barEditorComponent],
          [fooEditorComponent.id, fooEditorComponent],
        ]),
      );
      expect(fooEditorComponent.fromBlock).toHaveBeenCalledWith(expect.arrayContaining(['foo']));
    });
    it('should match shortcodes based on order of occurrence in value even when some use line anchors', () => {
      const barEditorComponent = EditorComponent({ id: 'bar', pattern: /bar/ });
      const bazEditorComponent = EditorComponent({ id: 'baz', pattern: /^baz$/ });
      process(
        'foo\n\nbar\n\nbaz',
        OrderedMap([
          [bazEditorComponent.id, bazEditorComponent],
          [barEditorComponent.id, barEditorComponent],
        ]),
      );
      expect(barEditorComponent.fromBlock).toHaveBeenCalledWith(expect.arrayContaining(['bar']));
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

describe('getLinesWithOffsets', () => {
  test('should split into lines', () => {
    const value = ' line1\n\nline2 \n\n    line3   \n\n';

    const lines = getLinesWithOffsets(value);
    expect(lines).toEqual([
      { line: ' line1', start: 0 },
      { line: 'line2', start: 8 },
      { line: '    line3', start: 16 },
      { line: '', start: 30 },
    ]);
  });

  test('should return single item on no match', () => {
    const value = ' line1    ';

    const lines = getLinesWithOffsets(value);
    expect(lines).toEqual([{ line: ' line1', start: 0 }]);
  });
});
