import { truncateMiddle } from '../textHelper';

describe('textHelper', () => {
  describe('truncateMiddle', () => {
    it('should return an original string if it is shorter than second argument', () => {
      expect(truncateMiddle('test', 5)).toBe('test');
    });

    it('should truncate in the middle', () => {
      expect(truncateMiddle('test of very long string', 10)).toBe('test \u2026ring');
    });
  });
});
