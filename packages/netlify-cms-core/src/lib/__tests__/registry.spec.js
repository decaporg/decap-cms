import { registerLocale, getLocale } from '../registry';

jest.spyOn(console, 'error').mockImplementation(() => {});

describe('registry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  describe('registerLocale', () => {
    it('should log error when name is empty', () => {
      registerLocale();
      expect(console.error).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledWith(
        "Locale parameters invalid. example: CMS.registerLocale('locale', phrases)",
      );
    });

    it('should log error when phrases are undefined', () => {
      registerLocale('fr');
      expect(console.error).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledWith(
        "Locale parameters invalid. example: CMS.registerLocale('locale', phrases)",
      );
    });

    it('should register locale', () => {
      const phrases = {
        app: {
          header: {
            content: 'Inhalt',
          },
        },
      };

      registerLocale('de', phrases);

      expect(getLocale('de')).toBe(phrases);
    });
  });
});
