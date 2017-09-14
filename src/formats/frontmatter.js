import matter from 'gray-matter';
import tomlEng from 'toml';
import YAML from './yaml';

function inferFrontmatterFormat(str) {
  const firstLine = str.substr(0, str.indexOf('\n')).trim();
  switch (firstLine) {
    case "---":
      return { language: "yaml", delimiters: "---" };
    case "+++":
      return { language: "toml", delimiters: "+++", engines: { toml: tomlEng.parse.bind(tomlEng) } };
    case "{":
      return { language: "json", delimiters: ["{", "}"], engines: { json: ((input) => matter.engines.json.parse('{' + input + '}')) } };
  }
}

export default class Frontmatter {
  fromFile(content) {
    const result = matter(content, inferFrontmatterFormat(content));
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
    return matter.stringify(body, meta, { language: "yaml", delimiters: "---", engines: { yaml: parser } });
  }
}
