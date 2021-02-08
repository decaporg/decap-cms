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
  // initialize pattern as RegExp as done in the EditorComponent value object
  return { id, fromBlock, pattern: new RegExp(pattern, 'm') };
}

describe('remarkParseShortcodes', () => {
  describe('pattern matching', () => {
    it('should work', () => {
      const editorComponent = EditorComponent({ pattern: /bar/ });
      process('foo bar', [editorComponent]);
      expect(editorComponent.fromBlock).toHaveBeenCalledWith(expect.arrayContaining(['bar']));
    });
    it('should match value surrounded in newlines', () => {
      const editorComponent = EditorComponent({ pattern: /^bar$/ });
      process('foo\n\nbar\n', [editorComponent]);
      expect(editorComponent.fromBlock).toHaveBeenCalledWith(expect.arrayContaining(['bar']));
    });
    it('should match multiline shortcodes', () => {
      const editorComponent = EditorComponent({ pattern: /^foo\nbar$/ });
      process('foo\nbar', [editorComponent]);
      expect(editorComponent.fromBlock).toHaveBeenCalledWith(expect.arrayContaining(['foo\nbar']));
    });
    it('should match multiline shortcodes with empty lines', () => {
      const editorComponent = EditorComponent({ pattern: /^foo\n\nbar$/ });
      process('foo\n\nbar', [editorComponent]);
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
      const editorComponent = EditorComponent({ pattern: /bar/, fromBlock: () => shortcodeData });
      process('foo bar', [editorComponent], processEat);
      expect(processEat).toHaveBeenCalledWith(expectedNode);
    });
  });
});
