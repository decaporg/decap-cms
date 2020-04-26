import { fromJS } from 'immutable';
import {
  keyToPathArray,
  compileStringTemplate,
  parseDateFromEntry,
  extractTemplateVars,
} from '../stringTemplate';
describe('stringTemplate', () => {
  describe('keyToPathArray', () => {
    it('should return array of length 1 with simple path', () => {
      expect(keyToPathArray('category')).toEqual(['category']);
    });

    it('should return path array for complex path', () => {
      expect(keyToPathArray('categories[0].title.subtitles[0].welcome[2]')).toEqual([
        'categories',
        '0',
        'title',
        'subtitles',
        '0',
        'welcome',
        '2',
      ]);
    });
  });

  describe('parseDateFromEntry', () => {
    it('should return date based on dateFieldName', () => {
      const date = new Date().toISOString();
      const dateFieldName = 'dateFieldName';
      const entry = fromJS({ data: { dateFieldName: date } });
      expect(parseDateFromEntry(entry, dateFieldName).toISOString()).toBe(date);
    });

    it('should return undefined on empty dateFieldName', () => {
      const entry = fromJS({ data: {} });
      expect(parseDateFromEntry(entry, '')).toBeUndefined();
      expect(parseDateFromEntry(entry, null)).toBeUndefined();
      expect(parseDateFromEntry(entry, undefined)).toBeUndefined();
    });

    it('should return undefined on invalid date', () => {
      const entry = fromJS({ data: { date: '' } });
      const dateFieldName = 'date';
      expect(parseDateFromEntry(entry, dateFieldName)).toBeUndefined();
    });
  });

  describe('extractTemplateVars', () => {
    it('should extract template variables', () => {
      expect(extractTemplateVars('{{slug}}-hello-{{date}}-world-{{fields.id}}')).toEqual([
        'slug',
        'date',
        'fields.id',
      ]);
    });

    it('should return empty array on no matches', () => {
      expect(extractTemplateVars('hello-world')).toEqual([]);
    });
  });

  describe('compileStringTemplate', () => {
    const date = new Date('2020-01-02T13:28:27.679Z');
    it('should compile year variable', () => {
      expect(compileStringTemplate('{{year}}', date)).toBe('2020');
    });

    it('should compile month variable', () => {
      expect(compileStringTemplate('{{month}}', date)).toBe('01');
    });

    it('should compile day variable', () => {
      expect(compileStringTemplate('{{day}}', date)).toBe('02');
    });

    it('should compile hour variable', () => {
      expect(compileStringTemplate('{{hour}}', date)).toBe('13');
    });

    it('should compile minute variable', () => {
      expect(compileStringTemplate('{{minute}}', date)).toBe('28');
    });

    it('should compile second variable', () => {
      expect(compileStringTemplate('{{second}}', date)).toBe('27');
    });

    it('should error on missing date', () => {
      expect(() => compileStringTemplate('{{year}}')).toThrowError();
    });

    it('return compiled template', () => {
      expect(
        compileStringTemplate(
          '{{slug}}-{{year}}-{{fields.slug}}-{{title}}-{{date}}',
          date,
          'backendSlug',
          fromJS({ slug: 'entrySlug', title: 'title', date }),
        ),
      ).toBe('backendSlug-2020-entrySlug-title-' + date.toString());
    });

    it('return apply processor to values', () => {
      expect(
        compileStringTemplate('{{slug}}', date, 'slug', fromJS({}), value => value.toUpperCase()),
      ).toBe('SLUG');
    });
  });
});
