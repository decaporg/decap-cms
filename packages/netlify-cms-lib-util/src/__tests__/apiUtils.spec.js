import * as apiUtils from '../APIUtils';
describe('APIUtils', () => {
  describe('generateContentKey', () => {
    it('should generate content key', () => {
      expect(apiUtils.generateContentKey('posts', 'dir1/dir2/post-title')).toBe(
        'posts/dir1/dir2/post-title',
      );
    });
  });

  describe('parseContentKey', () => {
    it('should parse content key', () => {
      expect(apiUtils.parseContentKey('posts/dir1/dir2/post-title')).toEqual({
        collection: 'posts',
        slug: 'dir1/dir2/post-title',
      });
    });
  });

  describe('isCMSLabel', () => {
    it('should return true for CMS label', () => {
      expect(apiUtils.isCMSLabel('netlify-cms/draft')).toBe(true);
    });

    it('should return false for non CMS label', () => {
      expect(apiUtils.isCMSLabel('other/label')).toBe(false);
    });
  });

  describe('labelToStatus', () => {
    it('should get status from label', () => {
      expect(apiUtils.labelToStatus('netlify-cms/draft')).toBe('draft');
    });
  });

  describe('statusToLabel', () => {
    it('should generate label from status', () => {
      expect(apiUtils.statusToLabel('draft')).toBe('netlify-cms/draft');
    });
  });
});
