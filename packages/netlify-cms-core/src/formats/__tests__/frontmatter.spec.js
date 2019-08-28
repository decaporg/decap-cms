import {
  FrontmatterInfer,
  frontmatterJSON,
  frontmatterTOML,
  frontmatterYAML,
} from '../frontmatter';

jest.mock('../../valueObjects/AssetProxy.js');

describe('Frontmatter', () => {
  it('should parse YAML with --- delimiters', () => {
    expect(
      FrontmatterInfer.fromFile('---\ntitle: YAML\ndescription: Something longer\n---\nContent'),
    ).toEqual({
      title: 'YAML',
      description: 'Something longer',
      body: 'Content',
    });
  });

  it('should parse YAML with --- delimiters when it is explicitly set as the format without a custom delimiter', () => {
    expect(
      frontmatterYAML().fromFile('---\ntitle: YAML\ndescription: Something longer\n---\nContent'),
    ).toEqual({
      title: 'YAML',
      description: 'Something longer',
      body: 'Content',
    });
  });

  it('should parse YAML with custom delimiters when it is explicitly set as the format with a custom delimiter', () => {
    expect(
      frontmatterYAML('~~~').fromFile(
        '~~~\ntitle: YAML\ndescription: Something longer\n~~~\nContent',
      ),
    ).toEqual({
      title: 'YAML',
      description: 'Something longer',
      body: 'Content',
    });
  });

  it('should parse YAML with custom delimiters when it is explicitly set as the format with different custom delimiters', () => {
    expect(
      frontmatterYAML(['~~~', '^^^']).fromFile(
        '~~~\ntitle: YAML\ndescription: Something longer\n^^^\nContent',
      ),
    ).toEqual({
      title: 'YAML',
      description: 'Something longer',
      body: 'Content',
    });
  });

  it('should parse YAML with ---yaml delimiters', () => {
    expect(
      FrontmatterInfer.fromFile(
        '---yaml\ntitle: YAML\ndescription: Something longer\n---\nContent',
      ),
    ).toEqual({
      title: 'YAML',
      description: 'Something longer',
      body: 'Content',
    });
  });

  it('should overwrite any body param in the front matter', () => {
    expect(
      FrontmatterInfer.fromFile('---\ntitle: The Title\nbody: Something longer\n---\nContent'),
    ).toEqual({
      title: 'The Title',
      body: 'Content',
    });
  });

  it('should parse TOML with +++ delimiters', () => {
    expect(
      FrontmatterInfer.fromFile('+++\ntitle = "TOML"\ndescription = "Front matter"\n+++\nContent'),
    ).toEqual({
      title: 'TOML',
      description: 'Front matter',
      body: 'Content',
    });
  });

  it('should parse TOML with 0.5 style dates', () => {
    expect(
      FrontmatterInfer.fromFile('+++\ntitle = "TOML"\ndate = 2018-12-24\n+++\nContent'),
    ).toEqual({
      title: 'TOML',
      date: new Date('2018-12-24T00:00:00.000Z'),
      body: 'Content',
    });
  });

  it('should parse TOML with +++ delimiters when it is explicitly set as the format without a custom delimiter', () => {
    expect(
      frontmatterTOML('~~~').fromFile(
        '~~~\ntitle = "TOML"\ndescription = "Front matter"\n~~~\nContent',
      ),
    ).toEqual({
      title: 'TOML',
      description: 'Front matter',
      body: 'Content',
    });
  });

  it('should parse TOML with ---toml delimiters', () => {
    expect(
      FrontmatterInfer.fromFile(
        '---toml\ntitle = "TOML"\ndescription = "Something longer"\n---\nContent',
      ),
    ).toEqual({
      title: 'TOML',
      description: 'Something longer',
      body: 'Content',
    });
  });

  it('should parse JSON with { } delimiters', () => {
    expect(
      FrontmatterInfer.fromFile(
        '{\n"title": "The Title",\n"description": "Something longer"\n}\nContent',
      ),
    ).toEqual({
      title: 'The Title',
      description: 'Something longer',
      body: 'Content',
    });
  });

  it('should parse JSON with { } delimiters when it is explicitly set as the format without a custom delimiter', () => {
    expect(
      frontmatterJSON().fromFile(
        '{\n"title": "The Title",\n"description": "Something longer"\n}\nContent',
      ),
    ).toEqual({
      title: 'The Title',
      description: 'Something longer',
      body: 'Content',
    });
  });

  it('should parse JSON with { } delimiters when it is explicitly set as the format with a custom delimiter', () => {
    expect(
      frontmatterJSON('~~~').fromFile(
        '~~~\n"title": "The Title",\n"description": "Something longer"\n~~~\nContent',
      ),
    ).toEqual({
      title: 'The Title',
      description: 'Something longer',
      body: 'Content',
    });
  });

  it('should parse JSON with ---json delimiters', () => {
    expect(
      FrontmatterInfer.fromFile(
        '---json\n{\n"title": "The Title",\n"description": "Something longer"\n}\n---\nContent',
      ),
    ).toEqual({
      title: 'The Title',
      description: 'Something longer',
      body: 'Content',
    });
  });

  it('should stringify YAML with --- delimiters', () => {
    expect(
      FrontmatterInfer.toFile({
        body: 'Some content\nOn another line',
        tags: ['front matter', 'yaml'],
        title: 'YAML',
      }),
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
      ].join('\n'),
    );
  });

  it('should stringify YAML with missing body', () => {
    expect(FrontmatterInfer.toFile({ tags: ['front matter', 'yaml'], title: 'YAML' })).toEqual(
      ['---', 'tags:', '  - front matter', '  - yaml', 'title: YAML', '---', '', ''].join('\n'),
    );
  });

  it('should stringify YAML with --- delimiters when it is explicitly set as the format without a custom delimiter', () => {
    expect(
      frontmatterYAML().toFile({
        body: 'Some content\nOn another line',
        tags: ['front matter', 'yaml'],
        title: 'YAML',
      }),
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
      ].join('\n'),
    );
  });

  it('should stringify YAML with --- delimiters when it is explicitly set as the format with a custom delimiter', () => {
    expect(
      frontmatterYAML('~~~').toFile({
        body: 'Some content\nOn another line',
        tags: ['front matter', 'yaml'],
        title: 'YAML',
      }),
    ).toEqual(
      [
        '~~~',
        'tags:',
        '  - front matter',
        '  - yaml',
        'title: YAML',
        '~~~',
        'Some content',
        'On another line\n',
      ].join('\n'),
    );
  });

  it('should stringify YAML with --- delimiters when it is explicitly set as the format with different custom delimiters', () => {
    expect(
      frontmatterYAML(['~~~', '^^^']).toFile({
        body: 'Some content\nOn another line',
        tags: ['front matter', 'yaml'],
        title: 'YAML',
      }),
    ).toEqual(
      [
        '~~~',
        'tags:',
        '  - front matter',
        '  - yaml',
        'title: YAML',
        '^^^',
        'Some content',
        'On another line\n',
      ].join('\n'),
    );
  });

  it('should stringify TOML with +++ delimiters when it is explicitly set as the format without a custom delimiter', () => {
    expect(
      frontmatterTOML().toFile({
        body: 'Some content\nOn another line',
        tags: ['front matter', 'toml'],
        title: 'TOML',
      }),
    ).toEqual(
      [
        '+++',
        'tags = ["front matter", "toml"]',
        'title = "TOML"',
        '+++',
        'Some content',
        'On another line\n',
      ].join('\n'),
    );
  });

  it('should stringify TOML with +++ delimiters when it is explicitly set as the format with a custom delimiter', () => {
    expect(
      frontmatterTOML('~~~').toFile({
        body: 'Some content\nOn another line',
        tags: ['front matter', 'toml'],
        title: 'TOML',
      }),
    ).toEqual(
      [
        '~~~',
        'tags = ["front matter", "toml"]',
        'title = "TOML"',
        '~~~',
        'Some content',
        'On another line\n',
      ].join('\n'),
    );
  });

  it('should stringify JSON with { } delimiters when it is explicitly set as the format without a custom delimiter', () => {
    expect(
      frontmatterJSON().toFile({
        body: 'Some content\nOn another line',
        tags: ['front matter', 'json'],
        title: 'JSON',
      }),
    ).toEqual(
      [
        '{',
        '"tags": [',
        '    "front matter",',
        '    "json"',
        '  ],',
        '  "title": "JSON"',
        '}',
        'Some content',
        'On another line\n',
      ].join('\n'),
    );
  });

  it('should stringify JSON with { } delimiters when it is explicitly set as the format with a custom delimiter', () => {
    expect(
      frontmatterJSON('~~~').toFile({
        body: 'Some content\nOn another line',
        tags: ['front matter', 'json'],
        title: 'JSON',
      }),
    ).toEqual(
      [
        '~~~',
        '"tags": [',
        '    "front matter",',
        '    "json"',
        '  ],',
        '  "title": "JSON"',
        '~~~',
        'Some content',
        'On another line\n',
      ].join('\n'),
    );
  });
});
