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
      expect(apiUtils.isCMSLabel('netlify-cms/draft', 'netlify-cms/')).toBe(true);
    });

    it('should return false for non CMS label', () => {
      expect(apiUtils.isCMSLabel('other/label', 'netlify-cms/')).toBe(false);
    });

    it('should return true if the prefix not provided for CMS label', () => {
      expect(apiUtils.isCMSLabel('netlify-cms/draft', '')).toBe(true);
    });

    it('should return false if a different prefix provided for CMS label', () => {
      expect(apiUtils.isCMSLabel('netlify-cms/draft', 'other/')).toBe(false);
    });

    it('should return true for CMS label when undefined prefix is passed', () => {
      expect(apiUtils.isCMSLabel('netlify-cms/draft', undefined)).toBe(true);
    });
  });

  describe('labelToStatus', () => {
    it('should get status from label when default prefix is passed', () => {
      expect(apiUtils.labelToStatus('netlify-cms/draft', 'netlify-cms/')).toBe('draft');
    });

    it('should get status from label when custom prefix is passed', () => {
      expect(apiUtils.labelToStatus('other/draft', 'other/')).toBe('draft');
    });

    it('should get status from label when empty prefix is passed', () => {
      expect(apiUtils.labelToStatus('netlify-cms/draft', '')).toBe('draft');
    });

    it('should get status from label when undefined prefix is passed', () => {
      expect(apiUtils.labelToStatus('netlify-cms/draft', undefined)).toBe('draft');
    });
  });

  describe('statusToLabel', () => {
    it('should generate label from status when default prefix is passed', () => {
      expect(apiUtils.statusToLabel('draft', 'netlify-cms/')).toBe('netlify-cms/draft');
    });
    it('should generate label from status when custom prefix is passed', () => {
      expect(apiUtils.statusToLabel('draft', 'other/')).toBe('other/draft');
    });
    it('should generate label from status when empty prefix is passed', () => {
      expect(apiUtils.statusToLabel('draft', '')).toBe('netlify-cms/draft');
    });
    it('should generate label from status when undefined prefix is passed', () => {
      expect(apiUtils.statusToLabel('draft', undefined)).toBe('netlify-cms/draft');
    });
  });
});
