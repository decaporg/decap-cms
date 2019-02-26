import matter from 'gray-matter';
import tomlFormatter from './toml';
import yamlFormatter from './yaml';
import jsonFormatter from './json';

const parsers = {
  toml: {
    parse: input => tomlFormatter.fromFile(input),
    stringify: (metadata, { sortedKeys }) => tomlFormatter.toFile(metadata, sortedKeys),
  },
  json: {
    parse: input => {
      let JSONinput = input.trim();
      // Fix JSON if leading and trailing brackets were trimmed.
      if (JSONinput.substr(0, 1) !== '{') {
        JSONinput = '{' + JSONinput;
      }
      if (JSONinput.substr(-1) !== '}') {
        JSONinput = JSONinput + '}';
      }
      return jsonFormatter.fromFile(JSONinput);
    },
    stringify: (metadata, { sortedKeys }) => {
      let JSONoutput = jsonFormatter.toFile(metadata, sortedKeys).trim();
      // Trim leading and trailing brackets.
      if (JSONoutput.substr(0, 1) === '{' && JSONoutput.substr(-1) === '}') {
        JSONoutput = JSONoutput.substring(1, JSONoutput.length - 1);
      }
      return JSONoutput;
    },
  },
  yaml: {
    parse: input => yamlFormatter.fromFile(input),
    stringify: (metadata, { sortedKeys }) => yamlFormatter.toFile(metadata, sortedKeys),
  },
};

function inferFrontmatterFormat(str) {
  const firstLine = str.substr(0, str.indexOf('\n')).trim();
  if (firstLine.length > 3 && firstLine.substr(0, 3) === '---') {
    // No need to infer, `gray-matter` will handle things like `---toml` for us.
    return;
  }
  switch (firstLine) {
    case '---':
      return getFormatOpts('yaml');
    case '+++':
      return getFormatOpts('toml');
    case '{':
      return getFormatOpts('json');
    default:
      console.warn('Unrecognized front-matter format.');
  }
}

export const getFormatOpts = format =>
  ({
    yaml: { language: 'yaml', delimiters: '---' },
    toml: { language: 'toml', delimiters: '+++' },
    json: { language: 'json', delimiters: ['{', '}'] },
  }[format]);

class FrontmatterFormatter {
  constructor(format, customDelimiter) {
    this.format = getFormatOpts(format);
    this.customDelimiter = customDelimiter;
  }

  fromFile(content) {
    const format = this.format || inferFrontmatterFormat(content);
    if (this.customDelimiter) this.format.delimiters = this.customDelimiter;
    const result = matter(content, { engines: parsers, ...format });
    return {
      ...result.data,
      body: result.content,
    };
  }

  toFile(data, sortedKeys) {
    const { body = '', ...meta } = data;

    // Stringify to YAML if the format was not set
    const format = this.format || getFormatOpts('yaml');
    if (this.customDelimiter) this.format.delimiters = this.customDelimiter;

    // `sortedKeys` is not recognized by gray-matter, so it gets passed through to the parser
    return matter.stringify(body, meta, { engines: parsers, sortedKeys, ...format });
  }
}

export const FrontmatterInfer = new FrontmatterFormatter();
export const frontmatterYAML = customDelimiter => new FrontmatterFormatter('yaml', customDelimiter);
export const frontmatterTOML = customDelimiter => new FrontmatterFormatter('toml', customDelimiter);
export const frontmatterJSON = customDelimiter => new FrontmatterFormatter('json', customDelimiter);
