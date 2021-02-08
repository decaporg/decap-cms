/** @jsx h */

import h from '../../../test-helpers/h';
import { Editor } from 'slate';
import plugins from '../plugins/visual';
import schema from '../schema';

function run(input, output, fn) {
  const editor = new Editor({ plugins: plugins(), schema: schema() });
  const opts = { preserveSelection: true };
  editor.setValue(input);
  fn(editor);
  const actual = editor.value.toJSON(opts);
  editor.setValue(output);
  const expected = editor.value.toJSON(opts);
  return [actual, expected];
}

// If we want to use slate-hyperscript for testing our schema direct, we can use
// this setup.
describe.skip('slate', () => {
  test('test', () => {
    const input = (
      <value>
        <document>
          <paragraph>
            a<cursor />
          </paragraph>
        </document>
      </value>
    );
    const output = (
      <value>
        <document>
          <heading-one>
            b<cursor />
          </heading-one>
        </document>
      </value>
    );

    function fn(editor) {
      editor
        .deleteBackward()
        .insertText('b')
        .setBlocks('heading-one');
    }

    const [actual, expected] = run(input, output, fn);
    expect(actual).toEqual(expected);
  });
});
