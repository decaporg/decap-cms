import { stripIndent } from 'common-tags';
import { remarkParseShortcodes } from '../remarkShortcodes';

// Stub of Remark Parser
function process(value, plugins, processEat = () => {}) {
  const eat = () => processEat;
  function Parser() {}
  Parser.prototype.blockTokenizers = {};
  Parser.prototype.blockMethods = [];
  remarkParseShortcodes.call({ Parser }, { plugins });
  Parser.prototype.blockTokenizers.shortcode(eat, value);
}

describe('remarkParseShortcodes', () => {
  let editorComponent;

  beforeEach(() => {
    editorComponent = {
      id: 'foo',
      pattern: /bar/,
      fromBlock: jest.fn(),
    };
  });
  it('should parse shortcodes', () => {
    process('foo bar', [editorComponent]);
    expect(editorComponent.fromBlock).toHaveBeenCalledWith(expect.arrayContaining(['bar']));
  });
  it('should parse multiline shortcodes', () => {
    const value = stripIndent`
      foo
      bar
    `;
    process(value, [{ ...editorComponent, pattern: /^foo\nbar$/ }]);
    expect(editorComponent.fromBlock).toHaveBeenCalledWith(expect.arrayContaining(['foo\nbar']));
  });
  it('should parse multiline shortcodes with empty lines', () => {
    const value = stripIndent`
      foo

      bar
    `;
    process(value, [{ ...editorComponent, pattern: /^foo\n\nbar$/ }]);
    expect(editorComponent.fromBlock).toHaveBeenCalledWith(expect.arrayContaining(['foo\n\nbar']));
  });
  it('should produce shortcode node', () => {
    const processEat = jest.fn();
    const shortcodeData = { bar: 'baz' };
    const expectedNode = { type: 'shortcode', data: { shortcode: 'foo', shortcodeData } };
    editorComponent.fromBlock = () => shortcodeData;
    process('foo bar', [editorComponent], processEat);
    expect(processEat).toHaveBeenCalledWith(expectedNode);
  });
});
