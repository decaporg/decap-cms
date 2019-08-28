import { compileStringTemplate } from '../stringTemplate';
import { Map } from 'immutable';

describe('compileStringTemplate', () => {
  it('should compile templates containing nested fields correctly', () => {
    const template = 'Templates are {{some.nested.field}} cool, I {{other.field}} them';

    const data = Map({
      some: Map({
        nested: Map({
          field: 'really',
        }),
      }),
      other: Map({
        field: 'love',
      }),
    });

    expect(compileStringTemplate(template, '', '', data)).toBe(
      'Templates are really cool, I love them',
    );
  });
});
