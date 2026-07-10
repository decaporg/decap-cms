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
      expect(apiUtils.isCMSLabel('decap-cms/draft', 'decap-cms/')).toBe(true);
    });

    it('should return false for non CMS label', () => {
      expect(apiUtils.isCMSLabel('other/label', 'decap-cms/')).toBe(false);
    });

    it('should return true if the prefix not provided for CMS label', () => {
      expect(apiUtils.isCMSLabel('decap-cms/draft', '')).toBe(true);
    });

    it('should return false if a different prefix provided for CMS label', () => {
      expect(apiUtils.isCMSLabel('decap-cms/draft', 'other/')).toBe(false);
    });

    it('should return true for CMS label when undefined prefix is passed', () => {
      expect(apiUtils.isCMSLabel('decap-cms/draft', undefined)).toBe(true);
    });
  });

  describe('labelToStatus', () => {
    it('should get status from label when default prefix is passed', () => {
      expect(apiUtils.labelToStatus('decap-cms/draft', 'decap-cms/')).toBe('draft');
    });

    it('should get status from label when custom prefix is passed', () => {
      expect(apiUtils.labelToStatus('other/draft', 'other/')).toBe('draft');
    });

    it('should get status from label when empty prefix is passed', () => {
      expect(apiUtils.labelToStatus('decap-cms/draft', '')).toBe('draft');
    });

    it('should get status from label when undefined prefix is passed', () => {
      expect(apiUtils.labelToStatus('decap-cms/draft', undefined)).toBe('draft');
    });
  });

  describe('statusToLabel', () => {
    it('should generate label from status when default prefix is passed', () => {
      expect(apiUtils.statusToLabel('draft', 'decap-cms/')).toBe('decap-cms/draft');
    });
    it('should generate label from status when custom prefix is passed', () => {
      expect(apiUtils.statusToLabel('draft', 'other/')).toBe('other/draft');
    });
    it('should generate label from status when empty prefix is passed', () => {
      expect(apiUtils.statusToLabel('draft', '')).toBe('decap-cms/draft');
    });
    it('should generate label from status when undefined prefix is passed', () => {
      expect(apiUtils.statusToLabel('draft', undefined)).toBe('decap-cms/draft');
    });
  });
});
