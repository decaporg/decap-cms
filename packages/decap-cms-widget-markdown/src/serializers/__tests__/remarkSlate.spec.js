import { mergeAdjacentTexts } from '../remarkSlate';
describe('remarkSlate', () => {
  describe('mergeAdjacentTexts', () => {
    it('should handle empty array', () => {
      const children = [];
      expect(mergeAdjacentTexts(children)).toBe(children);
    });

    it('should merge adjacent texts with same marks', () => {
      const children = [
        { text: '<a href="https://www.netlify.com" target="_blank">', marks: [] },
        { text: 'Netlify', marks: [] },
        { text: '</a>', marks: [] },
      ];

      expect(mergeAdjacentTexts(children)).toEqual([
        {
          text: '<a href="https://www.netlify.com" target="_blank">Netlify</a>',
          marks: [],
        },
      ]);
    });

    it('should not merge adjacent texts with different marks', () => {
      const children = [
        { text: '<a href="https://www.netlify.com" target="_blank">', marks: [] },
        { text: 'Netlify', marks: ['b'] },
        { text: '</a>', marks: [] },
      ];

      expect(mergeAdjacentTexts(children)).toEqual(children);
    });

    it('should handle mixed children array', () => {
      const children = [
        { object: 'inline' },
        { text: '<a href="https://www.netlify.com" target="_blank">', marks: [] },
        { text: 'Netlify', marks: [] },
        { text: '</a>', marks: [] },
        { object: 'inline' },
        { text: '<a href="https://www.netlify.com" target="_blank">', marks: [] },
        { text: 'Netlify', marks: ['b'] },
        { text: '</a>', marks: [] },
        { text: '<a href="https://www.netlify.com" target="_blank">', marks: [] },
        { object: 'inline' },
        { text: '</a>', marks: [] },
      ];

      expect(mergeAdjacentTexts(children)).toEqual([
        { object: 'inline' },
        {
          text: '<a href="https://www.netlify.com" target="_blank">Netlify</a>',
          marks: [],
        },
        { object: 'inline' },
        { text: '<a href="https://www.netlify.com" target="_blank">', marks: [] },
        { text: 'Netlify', marks: ['b'] },
        {
          text: '</a><a href="https://www.netlify.com" target="_blank">',
          marks: [],
        },
        { object: 'inline' },
        { text: '</a>', marks: [] },
      ]);
    });
  });
});
