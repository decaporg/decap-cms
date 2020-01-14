import * as api from '../API';
describe('Api', () => {
  describe('generateContentKey', () => {
    it('should generate content key', () => {
      expect(api.generateContentKey('posts', 'dir1/dir2/post-title')).toBe(
        'posts/dir1/dir2/post-title',
      );
    });
  });

  describe('parseContentKey', () => {
    it('should parse content key', () => {
      expect(api.parseContentKey('posts/dir1/dir2/post-title')).toEqual({
        collection: 'posts',
        slug: 'dir1/dir2/post-title',
      });
    });
  });

  describe('isCMSLabel', () => {
    it('should return true for CMS label', () => {
      expect(api.isCMSLabel('netlify-cms/draft')).toBe(true);
    });

    it('should return false for non CMS label', () => {
      expect(api.isCMSLabel('other/label')).toBe(false);
    });
  });

  describe('labelToStatus', () => {
    it('should get status from label', () => {
      expect(api.labelToStatus('netlify-cms/draft')).toBe('draft');
    });
  });

  describe('statusToLabel', () => {
    it('should generate label from status', () => {
      expect(api.statusToLabel('draft')).toBe('netlify-cms/draft');
    });
  });

  describe('isPreviewContext', () => {
    it('should return true for default preview context', () => {
      expect(api.isPreviewContext('deploy', '')).toBe(true);
    });

    it('should return false for non default preview context', () => {
      expect(api.isPreviewContext('other', '')).toBe(false);
    });

    it('should return true for custom preview context', () => {
      expect(api.isPreviewContext('ci/custom_preview', 'ci/custom_preview')).toBe(true);
    });
  });

  describe('getPreviewStatus', () => {
    it('should return preview status on matching context', () => {
      expect(api.getPreviewStatus([{ context: 'deploy' }])).toEqual({ context: 'deploy' });
    });

    it('should return undefined on matching context', () => {
      expect(api.getPreviewStatus([{ context: 'other' }])).toBeUndefined();
    });
  });
});
