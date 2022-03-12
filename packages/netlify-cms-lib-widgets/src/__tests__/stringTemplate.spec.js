import { fromJS } from 'immutable';

import {
  compileStringTemplate,
  expandPath,
  extractTemplateVars,
  keyToPathArray,
  parseDateFromEntry,
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

    it('return apply filter to values', () => {
      expect(
        compileStringTemplate(
          '{{slug | upper}}-{{title | lower}}-{{year}}',
          date,
          'backendSlug',
          fromJS({ slug: 'entrySlug', title: 'Title', date }),
        ),
      ).toBe('BACKENDSLUG-title-2020');
    });

    it('return apply filter to date field', () => {
      expect(
        compileStringTemplate(
          "{{slug | upper}}-{{title | lower}}-{{published | date('MM-DD')}}-{{year}}",
          date,
          'backendSlug',
          fromJS({ slug: 'entrySlug', title: 'Title', published: date, date }),
        ),
      ).toBe('BACKENDSLUG-title-01-02-2020');
    });

    it('return apply filter for default value', () => {
      expect(
        compileStringTemplate(
          "{{slug | upper}}-{{title | default('none')}}-{{subtitle | default('none')}}",
          date,
          'backendSlug',
          fromJS({ slug: 'entrySlug', title: 'title', subtitle: null, published: date, date }),
        ),
      ).toBe('BACKENDSLUG-title-none');
    });

    it('return apply filter for ternary', () => {
      expect(
        compileStringTemplate(
          "{{slug | upper}}-{{starred | ternary('star️','nostar')}}-{{done | ternary('done', 'open️')}}",
          date,
          'backendSlug',
          fromJS({ slug: 'entrySlug', starred: true, done: false }),
        ),
      ).toBe('BACKENDSLUG-star️-open️');
    });

    it('return apply filter for truncate', () => {
      expect(
        compileStringTemplate(
          '{{slug | truncate(6)}}',
          date,
          'backendSlug',
          fromJS({ slug: 'entrySlug', starred: true, done: false }),
        ),
      ).toBe('backen...');
    });

    it('return apply filter for truncate', () => {
      expect(
        compileStringTemplate(
          "{{slug | truncate(3,'***')}}",
          date,
          'backendSlug',
          fromJS({ slug: 'entrySlug', starred: true, done: false }),
        ),
      ).toBe('bac***');
    });
  });

  describe('expandPath', () => {
    it('should expand wildcard paths', () => {
      const data = {
        categories: [
          {
            name: 'category 1',
          },
          {
            name: 'category 2',
          },
        ],
      };

      expect(expandPath({ data, path: 'categories.*.name' })).toEqual([
        'categories.0.name',
        'categories.1.name',
      ]);
    });

    it('should handle wildcard at the end of the path', () => {
      const data = {
        nested: {
          otherNested: {
            list: [
              {
                title: 'title 1',
                nestedList: [{ description: 'description 1' }, { description: 'description 2' }],
              },
              {
                title: 'title 2',
                nestedList: [{ description: 'description 2' }, { description: 'description 2' }],
              },
            ],
          },
        },
      };

      expect(expandPath({ data, path: 'nested.otherNested.list.*.nestedList.*' })).toEqual([
        'nested.otherNested.list.0.nestedList.0',
        'nested.otherNested.list.0.nestedList.1',
        'nested.otherNested.list.1.nestedList.0',
        'nested.otherNested.list.1.nestedList.1',
      ]);
    });

    it('should handle non wildcard index', () => {
      const data = {
        categories: [
          {
            name: 'category 1',
          },
          {
            name: 'category 2',
          },
        ],
      };
      const path = 'categories.0.name';

      expect(expandPath({ data, path })).toEqual(['categories.0.name']);
    });
  });
});
