import matter from 'gray-matter';
import tomlFormatter from './toml';
import yamlFormatter from './yaml';
import jsonFormatter from './json';

const parsers = {
  toml: input => tomlFormatter.fromFile(input),
  json: input => {
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
  yaml: input => yamlFormatter.fromFile(input),
}

function inferFrontmatterFormat(str) {
  const firstLine = str.substr(0, str.indexOf('\n')).trim();
  if ((firstLine.length > 3) && (firstLine.substr(0, 3) === "---")) {
    // No need to infer, `gray-matter` will handle things like `---toml` for us.
    return;
  }
  switch (firstLine) {
    case "---":
      return { language: "yaml", delimiters: "---" };
    case "+++":
      return { language: "toml", delimiters: "+++" };
    case "{":
      return { language: "json", delimiters: ["{", "}"] };
    default:
      throw "Unrecognized front-matter format.";
  }
}

export default {
  fromFile(content) {
    const result = matter(content, { engines: parsers, ...inferFrontmatterFormat(content) });
    return {
      ...result.data,
      body: result.content,
    };
  },

  toFile(data, sortedKeys) {
    const { body, ...meta } = data;

    // always stringify to YAML
    const parser = {
      stringify(metadata) {
        return yamlFormatter.toFile(metadata, sortedKeys);
      },
    };
    return matter.stringify(body, meta, { language: "yaml", delimiters: "---", engines: { yaml: parser } });
  }
}
