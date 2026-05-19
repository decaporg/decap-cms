import { stripIndent } from 'common-tags';

import yaml from '../yaml';

describe('yaml', () => {
  describe('fromFile', () => {
    test('loads valid yaml', () => {
      expect(yaml.fromFile('[]')).toEqual([]);

      const result = yaml.fromFile(stripIndent`
      date: 2020-04-02T16:08:03.327Z
      dateString: 2020-04-02
      boolean: true
      number: 1
      `);
      expect(result).toEqual({
        date: new Date('2020-04-02T16:08:03.327Z'),
        dateString: '2020-04-02',
        boolean: true,
        number: 1,
      });
      expect(yaml.fromFile('# Comment a\na: a\nb:\n  # Comment c\n  c:\n    d: d\n')).toEqual({
        a: 'a',
        b: { c: { d: 'd' } },
      });
      expect(
        yaml.fromFile(stripIndent`
      # template comment
      template: post
      # title comment
      title: title
      # image comment
      image: /media/netlify.png
      # date comment
      date: 2020-04-02T13:27:48.617Z
      # object comment
      object:
        # object_title comment
        object_title: object_title
        # object_list comment
        object_list:
          - object_list_item_1: "1"
            object_list_item_2: "2"
      # list comment
      list:
        - "1"
      `),
      ).toEqual({
        list: ['1'],
        object: {
          object_title: 'object_title',
          object_list: [{ object_list_item_1: '1', object_list_item_2: '2' }],
        },
        date: new Date('2020-04-02T13:27:48.617Z'),
        image: '/media/netlify.png',
        title: 'title',
        template: 'post',
      });
    });
    test('does not fail on closing separator', () => {
      expect(yaml.fromFile('---\n[]\n---')).toEqual([]);
    });

    test('parses single quoted string as string', () => {
      expect(yaml.fromFile('name: y')).toEqual({ name: 'y' });
    });

    test('parses ISO date string as date', () => {
      expect(yaml.fromFile('date: 2020-04-02T16:08:03.327Z')).toEqual({
        date: new Date('2020-04-02T16:08:03.327Z'),
      });
    });

    test('parses partial date string as string', () => {
      expect(yaml.fromFile('date: 2020-06-12')).toEqual({
        date: '2020-06-12',
      });
      expect(yaml.fromFile('date: 12-06-2012')).toEqual({
        date: '12-06-2012',
      });
    });

    test('parses partial time value as string', () => {
      expect(yaml.fromFile('time: 10:05')).toEqual({
        time: '10:05',
      });
    });

    test('throws on duplicate keys', () => {
      expect(() => yaml.fromFile('title: Hello\ntitle: World')).toThrow(
        /Map keys must be unique; "title" is repeated/,
      );
    });

    test('throws on duplicate nested keys', () => {
      expect(() => yaml.fromFile('nested:\n  a: 1\n  a: 2')).toThrow(
        /Map keys must be unique; "a" is repeated/,
      );
    });

    test('does not throw when same key appears in different nested objects', () => {
      expect(yaml.fromFile('obj1:\n  name: foo\nobj2:\n  name: bar')).toEqual({
        obj1: { name: 'foo' },
        obj2: { name: 'bar' },
      });
    });

    test('logs warnings to console.warn', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      // Valid YAML should produce no warnings
      yaml.fromFile('title: Hello');
      expect(warnSpy).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });
  describe('toFile', () => {
    test('outputs valid yaml', () => {
      expect(yaml.toFile([])).toEqual('[]\n');
    });

    test('should sort keys', () => {
      expect(yaml.toFile({ a: 'a', b: 'b', c: 'c', d: 'd' })).toEqual('a: a\nb: b\nc: c\nd: d\n');
      expect(yaml.toFile({ a: 'a', b: 'b', c: 'c', d: 'd' }, ['d', 'b', 'a', 'c'])).toEqual(
        'd: d\nb: b\na: a\nc: c\n',
      );
      expect(yaml.toFile({ a: 'a', b: 'b', c: 'c', d: 'd' }, ['d', 'b', 'c'])).toEqual(
        'a: a\nd: d\nb: b\nc: c\n',
      );
    });

    test('should add comments', () => {
      expect(
        yaml.toFile({ a: 'a', b: { c: { d: 'd' } } }, [], { a: 'Comment a', 'b.c': 'Comment c' }),
      ).toEqual('# Comment a\na: a\nb:\n  # Comment c\n  c:\n    d: d\n');

      const expected = `# template comment
template: post
# title comment
title: title
# image comment
image: /media/netlify.png
# date comment
date: 2020-04-02T13:27:48.617Z
# object comment
object:
  # object_title comment
  object_title: object_title
  # object_list comment
  object_list:
    - object_list_item_1: "1"
      object_list_item_2: "2"
# list comment
list:
  - "1"
`;

      const result = yaml.toFile(
        {
          list: ['1'],
          object: {
            object_title: 'object_title',
            object_list: [{ object_list_item_1: '1', object_list_item_2: '2' }],
          },
          date: new Date('2020-04-02T13:27:48.617Z'),
          image: '/media/netlify.png',
          title: 'title',
          template: 'post',
        },
        ['template', 'title', 'image', 'date', 'object', 'list'],
        {
          list: 'list comment',
          object: 'object comment',
          'object.object_title': 'object_title comment',
          'object.object_list': 'object_list comment',
          date: 'date comment',
          image: 'image comment',
          title: 'title comment',
          template: 'template comment',
        },
      );

      expect(result).toEqual(expected);

      expect(yaml.toFile({ a: 'a' }, [], { a: 'line 1\\nline 2' })).toEqual(
        '# line 1\n# line 2\na: a\n',
      );
    });
  });
});
