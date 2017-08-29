import unified from 'unified';
import u from 'unist-builder';
import remarkEscapeMarkdownEntities from '../remarkEscapeMarkdownEntities';

const process = text => {
  const tree = u('root', [ u('text', text) ]);
  const escapedMdast = unified()
    .use(remarkEscapeMarkdownEntities)
    .runSync(tree);

  return escapedMdast.children[0].value;
};

describe('remarkEscapeMarkdownEntities', () => {
  it('should escape common markdown entities', () => {
    expect(process('*~`[_')).toEqual('\\*\\~\\`\\[\\_');
  });

  it('should escape leading markdown entities', () => {
    expect(process('#')).toEqual('\\#');
    expect(process('-')).toEqual('\\-');
  });

  it('should escape leading markdown entities preceded by whitespace', () => {
    expect(process('\n #')).toEqual('\\#');
    expect(process(' \n-')).toEqual('\\-');
  });

  it('should not escape leading markdown entities preceded by non-whitespace characters', () => {
    expect(process('a# # b #')).toEqual('a# # b #');
    expect(process('a- - b -')).toEqual('a- - b -');
  });
});
