/**
 * Guards the seed data in dev-test/index.html against the constraints declared in
 * dev-test/config.yml — the `books` relation, `genre` select and `isbn` pattern in
 * particular, since a mismatch there only shows up as a broken widget in the browser
 * (this caught a real bug: a catalog-number pattern that rejected the demo's own data).
 */
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

function loadFixtures() {
  const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const sandbox = { repoFiles: {}, repoNotes: {} };
  // eslint-disable-next-line no-new-func
  new Function('window', script)(sandbox);
  return sandbox;
}

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) {
    throw new Error(`no frontmatter delimiters found in: ${content.slice(0, 60)}...`);
  }
  return { data: yaml.load(match[1]), body: match[2] };
}

describe('dev-test/index.html seed data (Authors & Books)', () => {
  const { repoFiles } = loadFixtures();
  const authorSlugs = new Set(Object.keys(repoFiles._authors).map(f => f.replace(/\.md$/, '')));

  const GENRE_OPTIONS = [
    'Literary Fiction',
    'Magical Realism',
    'Historical Fiction',
    'Science Fiction',
    'Fantasy',
    'Mystery',
    'Crime',
    'Romance',
    'Horror',
    'Dystopian',
    'Satire',
    'Poetry',
    'Drama',
    'Short Stories',
    'Philosophy',
    'Memoir',
    'Biography',
    'Epic',
    'Young Adult',
    'Essay',
  ];
  const ISBN_PATTERN = /^97[89]-\d{1,5}-\d{1,7}-\d{1,6}-\d$/;

  it('every book resolves the author it relates to', () => {
    const broken = [];
    for (const [file, { content }] of Object.entries(repoFiles._books)) {
      const { data } = parseFrontmatter(content);
      if (!authorSlugs.has(data.author)) {
        broken.push(`${file}: relates to unknown author "${data.author}"`);
      }
    }
    expect(broken).toEqual([]);
  });

  it('every book genre is one of the collection’s select options', () => {
    const invalid = [];
    for (const [file, { content }] of Object.entries(repoFiles._books)) {
      const { data } = parseFrontmatter(content);
      if (!GENRE_OPTIONS.includes(data.genre)) {
        invalid.push(`${file}: genre "${data.genre}" is not a configured option`);
      }
    }
    expect(invalid).toEqual([]);
  });

  it('every configured genre option is used by at least one book', () => {
    const used = new Set(
      Object.values(repoFiles._books).map(({ content }) => parseFrontmatter(content).data.genre),
    );
    const unused = GENRE_OPTIONS.filter(g => !used.has(g));
    expect(unused).toEqual([]);
  });

  it('every ISBN matches the collection’s validation pattern', () => {
    const invalid = [];
    for (const [file, { content }] of Object.entries(repoFiles._books)) {
      const { data } = parseFrontmatter(content);
      if (!ISBN_PATTERN.test(String(data.isbn))) {
        invalid.push(`${file}: isbn "${data.isbn}" fails the configured pattern`);
      }
    }
    expect(invalid).toEqual([]);
  });

  it('every author is referenced by at least one book', () => {
    const referenced = new Set(
      Object.values(repoFiles._books).map(({ content }) => parseFrontmatter(content).data.author),
    );
    const orphans = [...authorSlugs].filter(slug => !referenced.has(slug));
    expect(orphans).toEqual([]);
  });

  it('authors span a genuinely international set of countries', () => {
    const countries = new Set(
      Object.values(repoFiles._authors).map(
        ({ content }) => parseFrontmatter(content).data.country,
      ),
    );
    expect(countries.size).toBeGreaterThanOrEqual(20);
  });
});
