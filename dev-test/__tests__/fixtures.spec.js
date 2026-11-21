/**
 * Guards the seed data in dev-test/index.html against the constraints declared in
 * dev-test/config.yml — the `books` relation, `genre` select and `isbn` pattern in
 * particular, since a mismatch there only shows up as a broken widget in the browser
 * (this caught a real bug: a catalog-number pattern that rejected the demo's own data).
 */
import fs from 'fs';
import yaml from 'js-yaml';

function loadFixtures() {
  const html = fs.readFileSync(require.resolve('../index.html'), 'utf8');
  const script = html.match(/<script>([\s\S]*?)<\/script>/i)[1];
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

/**
 * The posts collection deliberately seeds one entry per supported front matter format, so
 * this understands all three rather than assuming YAML.
 */
function parseAnyFrontmatter(content) {
  if (content.startsWith('---\n')) {
    return { format: 'yaml', data: parseFrontmatter(content).data };
  }
  if (content.startsWith('{')) {
    const end = content.indexOf('\n}\n');
    return { format: 'json', data: JSON.parse(content.slice(0, end + 2)) };
  }
  if (content.startsWith('+++\n')) {
    const block = content.slice(4, content.indexOf('\n+++'));
    const data = {};
    for (const line of block.split('\n')) {
      const m = line.match(/^"?([\w-]+)"?\s*=\s*"(.*)"$/);
      if (m) data[m[1]] = m[2];
    }
    return { format: 'toml', data };
  }
  throw new Error(`unrecognised front matter: ${content.slice(0, 40)}...`);
}

describe('dev-test/index.html seed data (Writers & Books)', () => {
  const { repoFiles } = loadFixtures();
  const authorSlugs = new Set(Object.keys(repoFiles._writers).map(f => f.replace(/\.md$/, '')));

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

  it('every writer is referenced by at least one book', () => {
    const referenced = new Set(
      Object.values(repoFiles._books).map(({ content }) => parseFrontmatter(content).data.author),
    );
    const orphans = [...authorSlugs].filter(slug => !referenced.has(slug));
    expect(orphans).toEqual([]);
  });

  it('blog posts carry the fields their view filters and groups read', () => {
    const listed = Object.entries(repoFiles._posts).filter(([f]) => f.endsWith('.md'));
    const parsed = listed.map(([file, { content }]) => ({
      file,
      ...parseAnyFrontmatter(content).data,
    }));

    // all three supported front matter formats are represented
    const formats = new Set(listed.map(([, { content }]) => parseAnyFrontmatter(content).format));
    expect([...formats].sort()).toEqual(['json', 'toml', 'yaml']);

    // The counts the Cypress view_filters/view_groups specs assert against
    expect(parsed).toHaveLength(15);
    const withCategory = parsed.filter(p => p.category);
    expect(withCategory).toHaveLength(12);
    expect(withCategory.filter(p => p.category === 'Tutorial')).toHaveLength(5);
    expect(withCategory.filter(p => p.category === 'Release Notes')).toHaveLength(3);
    expect(parsed.filter(p => p.featured === true)).toHaveLength(4);

    // the three front matter format posts deliberately carry neither, which is what
    // produces the missing_value group
    expect(parsed.filter(p => p.category === undefined)).toHaveLength(3);

    const CATEGORIES = ['Tutorial', 'Release Notes', 'Case Study', 'Opinion'];
    expect(withCategory.every(p => CATEGORIES.includes(p.category))).toBe(true);
  });

  it('the non-md post is not picked up as an entry', () => {
    const other = Object.keys(repoFiles._posts).filter(f => !f.endsWith('.md'));
    expect(other).toEqual(['2015-02-14-this-is-a-post-with-a-different-extension.other']);
  });

  it('every FAQ answer carries all three locales in one file', () => {
    const files = Object.keys(repoFiles._faqs);
    expect(files.length).toBeGreaterThanOrEqual(6);

    // single_file structure: the whole entry is one file, keyed by locale at the top level
    for (const file of files) {
      const { data } = parseFrontmatter(repoFiles._faqs[file].content);
      expect(Object.keys(data).sort()).toEqual(['en', 'es', 'fr']);

      // `published` is an i18n: duplicate field, so it must agree across locales
      const flags = new Set(['en', 'es', 'fr'].map(l => data[l].published));
      expect([...flags]).toHaveLength(1);

      // `title` and `body` are i18n: translate, so each locale must actually differ
      const titles = new Set(['en', 'es', 'fr'].map(l => data[l].title));
      expect(titles.size).toBe(3);
      ['en', 'es', 'fr'].forEach(l => expect(typeof data[l].body).toBe('string'));
    }

    // exactly one draft, which the collection filter hides
    const drafts = files.filter(
      f => parseFrontmatter(repoFiles._faqs[f].content).data.en.published === false,
    );
    expect(drafts).toHaveLength(1);
  });

  it('the FAQ collection stays under the test backend page size', () => {
    // The test backend returns 10 files per page and groups i18n entries per page, so a
    // collection that needs grouping must fit in one page to merge correctly.
    expect(Object.keys(repoFiles._faqs).length).toBeLessThanOrEqual(10);
  });

  it('writers span a genuinely international set of countries', () => {
    const countries = new Set(
      Object.values(repoFiles._writers).map(
        ({ content }) => parseFrontmatter(content).data.country,
      ),
    );
    expect(countries.size).toBeGreaterThanOrEqual(20);
  });
});
