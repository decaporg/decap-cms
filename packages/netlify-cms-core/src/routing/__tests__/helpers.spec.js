import { getFilterPath } from '../helpers';

describe('routing helpers', () => {
  describe('getFilterPath', () => {
    it('should return empty string on undefined filter term', () => {
      expect(getFilterPath()).toBe('');
    });

    it('should return empty string on null filter term', () => {
      expect(getFilterPath(null)).toBe('');
    });

    it('should filter path on simple filter term', () => {
      expect(getFilterPath('dir1/dir2')).toBe('dir1/dir2');
    });

    it('should filter path on simple filter term with additional filters', () => {
      expect(getFilterPath('dir1/dir2&title=hello')).toBe('dir1/dir2');
    });
  });
});
