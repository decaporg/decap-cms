import { stripIndent } from 'common-tags';
import component from '../index';

const block = stripIndent`
  foo
  : bar
`;
const match = block.match(component.pattern);
const data = [{ term: 'foo', definition: 'bar' }];

describe('definition list component', () => {
  it('should read', () => {
    expect(component.fromBlock(match)).toEqual(data);
  });
  it('should generate empty string list from empty value', () => {
    expect(component.toBlock()).toEqual('');
    expect(component.toBlock([])).toEqual('');
  });
  it('should write', () => {
    expect(component.toBlock(data)).toEqual(block);
  });
  it('should preview', () => {
    expect(component.toPreview(data)).toMatchInlineSnapshot(`
      <dl>
        <React.Fragment>
          <dt
            dangerouslySetInnerHTML={
              Object {
                "__html": "<p>foo</p>
      ",
              }
            }
          />
          <dd
            dangerouslySetInnerHTML={
              Object {
                "__html": "<p>bar</p>
      ",
              }
            }
          />
        </React.Fragment>
      </dl>
    `);
  });
});
