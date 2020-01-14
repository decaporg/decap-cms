import { wrapInlinesWithTexts } from '../remarkSlate';
describe('remarkSlate', () => {
  describe('wrapInlinesWithTexts', () => {
    it('should handle empty array', () => {
      const children = [];
      expect(wrapInlinesWithTexts(children)).toBe(children);
    });

    it('should wrap single inline node with texts', () => {
      expect(wrapInlinesWithTexts([{ object: 'inline' }])).toEqual([
        { object: 'text', text: '' },
        { object: 'inline' },
        { object: 'text', text: '' },
      ]);
    });

    it('should insert text before inline', () => {
      expect(wrapInlinesWithTexts([{ object: 'inline' }, { object: 'text', text: '' }])).toEqual([
        { object: 'text', text: '' },
        { object: 'inline' },
        { object: 'text', text: '' },
      ]);
    });

    it('should insert text after inline', () => {
      expect(wrapInlinesWithTexts([{ object: 'text', text: '' }, { object: 'inline' }])).toEqual([
        { object: 'text', text: '' },
        { object: 'inline' },
        { object: 'text', text: '' },
      ]);
    });

    it('should not modify valid children array', () => {
      const children = [
        { object: 'text', text: '' },
        { object: 'inline' },
        { object: 'text', text: '' },
      ];
      expect(wrapInlinesWithTexts(children)).toBe(children);
    });

    it('should wrap inlines with text nodes', () => {
      expect(
        wrapInlinesWithTexts([
          { object: 'inline' },
          { object: 'other' },
          { object: 'inline' },
          { object: 'inline' },
          { object: 'other' },
          { object: 'text', text: 'hello' },
          { object: 'inline' },
          { object: 'inline' },
          { object: 'text', text: 'world' },
          { object: 'inline' },
        ]),
      ).toEqual([
        { object: 'text', text: '' },
        { object: 'inline' },
        { object: 'text', text: '' },
        { object: 'other' },
        { object: 'text', text: '' },
        { object: 'inline' },
        { object: 'text', text: '' },
        { object: 'inline' },
        { object: 'text', text: '' },
        { object: 'other' },
        { object: 'text', text: 'hello' },
        { object: 'inline' },
        { object: 'text', text: '' },
        { object: 'inline' },
        { object: 'text', text: 'world' },
        { object: 'inline' },
        { object: 'text', text: '' },
      ]);
    });
  });
});
