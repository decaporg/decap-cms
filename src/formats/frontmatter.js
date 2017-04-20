import preliminaries from 'preliminaries';
import yamlParser from 'preliminaries-parser-yaml';
import tomlParser from 'preliminaries-parser-toml';
import YAML from './yaml';

// Automatically register parsers
preliminaries(true);
yamlParser(true);
tomlParser(true);

export default class Frontmatter {
  fromFile(content) {
    const result = preliminaries.parse(content);
    const data = result.data;
    data.body = result.content;
    return data;
  }

  toFile(data, sortedKeys) {
    const meta = {};
    let body = '';
    Object.keys(data).forEach((key) => {
      if (key === 'body') {
        body = data[key];
      } else {
        meta[key] = data[key];
      }
    });

    // always stringify to YAML
    const parser = {
      stringify(metadata) {
        return new YAML().toFile(metadata, sortedKeys);
      },
    };
    return preliminaries.stringify(body, meta, { lang: "yaml", delims: "---", parser });
  }
}
