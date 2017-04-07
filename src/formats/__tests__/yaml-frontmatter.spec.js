import YAMLFrontmatter from '../yaml-frontmatter';

const YamlFrontmatterFormatter = new YAMLFrontmatter();

describe('YAMLFrontmatter', () => {
  it('should parse YAML with --- delimiters', () => {
    expect(
      YamlFrontmatterFormatter.fromFile('---\ntitle: YAML\ndescription: Something longer\n---\nContent')
    ).toEqual(
      {
        title: 'YAML',
        description: 'Something longer',
        body: 'Content',
      }
    );
  });

  it('should parse YAML with ---yaml delimiters', () => {
    expect(
      YamlFrontmatterFormatter.fromFile('---yaml\ntitle: YAML\ndescription: Something longer\n---\nContent')
    ).toEqual(
      {
        title: 'YAML',
        description: 'Something longer',
        body: 'Content',
      }
    );
  });

  it('should overwrite any body param in the front matter', () => {
    expect(
      YamlFrontmatterFormatter.fromFile('---\ntitle: The Title\nbody: Something longer\n---\nContent')
    ).toEqual(
      {
        title: 'The Title',
        body: 'Content',
      }
    );
  });

  it('should parse TOML with +++ delimiters', () => {
    expect(
      YamlFrontmatterFormatter.fromFile('+++\ntitle = "TOML"\ndescription = "Front matter"\n+++\nContent')
    ).toEqual(
      {
        title: 'TOML',
        description: 'Front matter',
        body: 'Content',
      }
    );
  });

  it('should parse TOML with ---toml delimiters', () => {
    expect(
      YamlFrontmatterFormatter.fromFile('---toml\ntitle = "TOML"\ndescription = "Something longer"\n---\nContent')
    ).toEqual(
      {
        title: 'TOML',
        description: 'Something longer',
        body: 'Content',
      }
    );
  });

  it('should parse JSON with { } delimiters', () => {
    expect(
      YamlFrontmatterFormatter.fromFile('{\n"title": "The Title",\n"description": "Something longer"\n}\nContent')
    ).toEqual(
      {
        title: 'The Title',
        description: 'Something longer',
        body: 'Content',
      }
    );
  });

  it('should parse JSON with ---json delimiters', () => {
    expect(
      YamlFrontmatterFormatter.fromFile('---json\n{\n"title": "The Title",\n"description": "Something longer"\n}\n---\nContent')
    ).toEqual(
      {
        title: 'The Title',
        description: 'Something longer',
        body: 'Content',
      }
    );
  });

  it('should stringify YAML with --- delimiters', () => {
    expect(
      YamlFrontmatterFormatter.toFile({ body: 'Some content\nOn another line', tags: ['front matter', 'yaml'], title: 'YAML' })
    ).toEqual(
      [
        '---',
        'tags:',
        '  - front matter',
        '  - yaml',
        'title: YAML',
        '---',
        'Some content',
        'On another line\n',
      ].join('\n')
    );
  });
});
