import { fromJS } from 'immutable';

import Widget from '../Widget';

function createWidget(pattern) {
  return new Widget({
    field: fromJS({ name: 'teaser', label: 'Teaser', pattern }),
    t: jest.fn(key => key),
    parentIds: [],
  });
}

describe('Widget', () => {
  describe('validatePattern', () => {
    it('should return an error when the value does not match the pattern', () => {
      const widget = createWidget(['^[0-9]+$', 'Must be a number']);
      const { error } = widget.validatePattern(widget.props.field, 'abc');

      expect(error).toEqual(expect.objectContaining({ type: 'PATTERN' }));
    });

    it('should not return an error when the value matches the pattern', () => {
      const widget = createWidget(['^[0-9]+$', 'Must be a number']);

      expect(widget.validatePattern(widget.props.field, '123')).toEqual({ error: false });
    });

    it('should give consistent results for a RegExp pattern with the global flag', () => {
      const widget = createWidget([/^.{0,10}$/gm, 'Max 10 characters']);
      const { field } = widget.props;

      expect(widget.validatePattern(field, 'short')).toEqual({ error: false });
      expect(widget.validatePattern(field, 'short')).toEqual({ error: false });
      expect(widget.validatePattern(field, 'short')).toEqual({ error: false });
    });
  });
});
