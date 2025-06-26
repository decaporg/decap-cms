import { Map, OrderedMap } from 'immutable';

import { remarkParseShortcodes, getLinesWithOffsets } from '../remarkShortcodes';

// Stub of Remark Parser
function process(value, plugins, processEat = () => {}) {
  function eat() {
    return processEat;
  }

  function Parser() {}
  Parser.prototype.blockTokenizers = {};
  Parser.prototype.blockMethods = [];
  remarkParseShortcodes.call({ Parser }, { plugins });
  Parser.prototype.blockTokenizers.shortcode(eat, value);
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
    it('should work', () => {
      const editorComponent = EditorComponent({ pattern: /bar/ });
      process('foo bar', Map({ [editorComponent.id]: editorComponent }));
      expect(editorComponent.fromBlock).toHaveBeenCalledWith(expect.arrayContaining(['bar']));
    });
    it('should match value surrounded in newlines', () => {
      const editorComponent = EditorComponent({ pattern: /^bar$/ });
      process('foo\n\nbar\n', Map({ [editorComponent.id]: editorComponent }));
      expect(editorComponent.fromBlock).toHaveBeenCalledWith(expect.arrayContaining(['bar']));
    });
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
  describe('output', () => {
    it('should be a remark shortcode node', () => {
      const processEat = jest.fn();
      const shortcodeData = { bar: 'baz' };
      const expectedNode = { type: 'shortcode', data: { shortcode: 'foo', shortcodeData } };
      const editorComponent = EditorComponent({ pattern: /bar/, fromBlock: () => shortcodeData });
      process('foo bar', Map({ [editorComponent.id]: editorComponent }), processEat);
      expect(processEat).toHaveBeenCalledWith(expectedNode);
    });
  });
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
