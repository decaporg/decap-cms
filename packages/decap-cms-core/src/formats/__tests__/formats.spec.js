import { Map } from 'immutable';

import { extensionFormatters, resolveFormat } from '../formats';
import { registerCustomFormat } from '../../lib/registry';

describe('custom formats', () => {
  const testEntry = {
    collection: 'testCollection',
    data: { x: 1 },
    isModification: false,
    label: 'testLabel',
    mediaFiles: [],
    meta: {},
    newRecord: true,
    partial: false,
    path: 'testPath1',
    raw: 'testRaw',
    slug: 'testSlug',
    author: 'testAuthor',
    updatedOn: 'testUpdatedOn',
  };
  it('resolves builtint formats', () => {
    const collection = Map({
      name: 'posts',
    });
    expect(resolveFormat(collection, { ...testEntry, path: 'test.yml' })).toEqual(
      extensionFormatters.yml,
    );
    expect(resolveFormat(collection, { ...testEntry, path: 'test.yaml' })).toEqual(
      extensionFormatters.yml,
    );
    expect(resolveFormat(collection, { ...testEntry, path: 'test.toml' })).toEqual(
      extensionFormatters.toml,
    );
    expect(resolveFormat(collection, { ...testEntry, path: 'test.json' })).toEqual(
      extensionFormatters.json,
    );
    expect(resolveFormat(collection, { ...testEntry, path: 'test.md' })).toEqual(
      extensionFormatters.md,
    );
    expect(resolveFormat(collection, { ...testEntry, path: 'test.markdown' })).toEqual(
      extensionFormatters.markdown,
    );
    expect(resolveFormat(collection, { ...testEntry, path: 'test.html' })).toEqual(
      extensionFormatters.html,
    );
  });

  it('resolves custom format', () => {
    registerCustomFormat('txt-querystring', 'txt', {
      fromFile: file => Object.fromEntries(new URLSearchParams(file)),
      toFile: value => new URLSearchParams(value).toString(),
    });

    const collection = Map({
      name: 'posts',
      format: 'txt-querystring',
    });

    const formatter = resolveFormat(collection, { ...testEntry, path: 'test.txt' });

    expect(formatter.toFile({ foo: 'bar' })).toEqual('foo=bar');
    expect(formatter.fromFile('foo=bar')).toEqual({ foo: 'bar' });
  });

  it('can override existing formatters', () => {
    // simplified version of a more realistic use case: using a different yaml library like js-yaml
    // to make netlify-cms play nice with other tools that edit content and spit out yaml
    registerCustomFormat('bad-yaml', 'yml', {
      fromFile: file => Object.fromEntries(file.split('\n').map(line => line.split(': '))),
      toFile: value =>
        Object.entries(value)
          .map(([k, v]) => `${k}: ${v}`)
          .join('\n'),
    });

    const collection = Map({
      name: 'posts',
      format: 'bad-yaml',
    });

    const formatter = resolveFormat(collection, { ...testEntry, path: 'test.txt' });

    expect(formatter.toFile({ a: 'b', c: 'd' })).toEqual('a: b\nc: d');
    expect(formatter.fromFile('a: b\nc: d')).toEqual({ a: 'b', c: 'd' });
  });
});
