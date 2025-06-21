import { Map } from 'immutable';

import { remarkParseShortcodes } from '../remarkShortcodes';

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
      const editorComponent = EditorComponent({ pattern: /^foo/ });
      process('foo bar', Map({ [editorComponent.id]: editorComponent }));
      expect(editorComponent.fromBlock).toHaveBeenCalledWith(expect.arrayContaining(['foo']));
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
  });
  describe('output', () => {
    it('should be a remark shortcode node', () => {
      const processEat = jest.fn();
      const shortcodeData = { bar: 'baz' };
      const expectedNode = { type: 'shortcode', data: { shortcode: 'foo', shortcodeData } };
      const editorComponent = EditorComponent({ pattern: /^foo/, fromBlock: () => shortcodeData });
      process('foo bar', Map({ [editorComponent.id]: editorComponent }), processEat);
      expect(processEat).toHaveBeenCalledWith(expectedNode);
    });
  });
});
