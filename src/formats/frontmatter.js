import matter from 'gray-matter';
import TOML from './toml';
import YAML from './yaml';

const tomlFormatter = new TOML();

const parsers = {
  toml: tomlFormatter.fromFile.bind(tomlFormatter),
  json: (input) => {
    let JSONinput = input.trim();
    // Fix JSON if leading and trailing brackets were trimmed.
    if (JSONinput.substr(0, 1) !== '{') {
      JSONinput = '{' + JSONinput;
    }
    if (JSONinput.substr(-1) !== '}') {
      JSONinput = JSONinput + '}';
    }
    return matter.engines.json.parse(JSONinput);
  },
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

export default class Frontmatter {
  fromFile(content) {
    const result = matter(content, { engines: parsers, ...inferFrontmatterFormat(content) });
    return {
      ...result.data,
      body: result.content,
    };
  }

  toFile(data, sortedKeys) {
    const { body, ...meta } = data;

    // always stringify to YAML
    const parser = {
      stringify(metadata) {
        return new YAML().toFile(metadata, sortedKeys);
      },
    };
    return matter.stringify(body, meta, { language: "yaml", delimiters: "---", engines: { yaml: parser } });
  }
}
