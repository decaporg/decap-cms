export function remarkParseShortcodes({ plugins }) {
  const Parser = this.Parser;
  const tokenizers = Parser.prototype.blockTokenizers;
  const methods = Parser.prototype.blockMethods;

  tokenizers.shortcode = createShortcodeTokenizer({ plugins });

  methods.unshift('shortcode');
}

export function getLinesWithOffsets(value) {
  const SEPARATOR = '\n\n';
  const splitted = value.split(SEPARATOR);
  const trimmedLines = splitted
    .reduce(
      (acc, line) => {
        const { start: previousLineStart, originalLength: previousLineOriginalLength } =
          acc[acc.length - 1];

        return [
          ...acc,
          {
            line: line.trimEnd(),
            start: previousLineStart + previousLineOriginalLength + SEPARATOR.length,
            originalLength: line.length,
          },
        ];
      },
      [{ start: -SEPARATOR.length, originalLength: 0 }],
    )
    .slice(1)
    .map(({ line, start }) => ({ line, start }));
  return trimmedLines;
}

function matchFromLines({ trimmedLines, plugin }) {
  for (const { line, start } of trimmedLines) {
    const match = line.match(plugin.pattern);
    if (match) {
      match.index += start;
      return match;
    }
  }
}

function createShortcodeTokenizer({ plugins }) {
  return function tokenizeShortcode(eat, value, silent) {
    // Plugin patterns may rely on `^` and `$` tokens, even if they don't
    // use the multiline flag. To support this, we fall back to searching
    // through each line individually, trimming trailing whitespace and
    // newlines, if we don't initially match on a pattern. We keep track of
    // the starting position of each line so that we can sort correctly
    // across the full multiline matches.
    const trimmedLines = getLinesWithOffsets(value);

    // Attempt to find a regex match for each plugin's pattern, and then
    // select the first by its occurrence in `value`. This ensures we won't
    // skip a plugin that occurs later in the plugin registry, but earlier
    // in the `value`.
    const [{ plugin, match } = {}] = plugins
      .toArray()
      .map(plugin => ({
        match: value.match(plugin.pattern) || matchFromLines({ trimmedLines, plugin }),
        plugin,
      }))
      .filter(({ match }) => !!match)
      .sort((a, b) => a.match.index - b.match.index);

    if (match) {
      if (silent) {
        return true;
      }

      const shortcodeData = plugin.fromBlock(match);

      try {
        return eat(match[0])({
          type: 'shortcode',
          data: { shortcode: plugin.id, shortcodeData },
        });
      } catch (e) {
        console.warn(
          `Sent invalid data to remark. Plugin: ${plugin.id}. Value: ${
            match[0]
          }. Data: ${JSON.stringify(shortcodeData)}`,
        );
        return false;
      }
    }
  };
}

export function createRemarkShortcodeStringifier({ plugins }) {
  return function remarkStringifyShortcodes() {
    const Compiler = this.Compiler;
    const visitors = Compiler.prototype.visitors;

    visitors.shortcode = shortcode;

    function shortcode(node) {
      const { data } = node;
      const plugin = plugins.find(plugin => data.shortcode === plugin.id);
      return plugin.toBlock(data.shortcodeData);
    }
  };
}
