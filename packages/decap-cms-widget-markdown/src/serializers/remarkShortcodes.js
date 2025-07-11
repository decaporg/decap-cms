export function remarkParseShortcodes({ plugins }) {
  const Parser = this.Parser;
  const tokenizers = Parser.prototype.blockTokenizers;
  const methods = Parser.prototype.blockMethods;

  tokenizers.shortcode = createShortcodeTokenizer({ plugins });

  methods.unshift('shortcode');
}

function createShortcodeTokenizer({ plugins }) {
  plugins.forEach(plugin => {
    if (plugin.pattern.flags.includes('m')) {
      console.warn(
        `Invalid RegExp: editor component '${plugin.id}' must not use the multiline flag in its pattern.`,
      );
    }
  });
  return function tokenizeShortcode(eat, value, silent) {
    let match;
    const potentialMatchValue = value.split('\n\n')[0].trimEnd();
    const plugin = plugins.find(plugin => {
      match = value.match(plugin.pattern);
      if (!match) {
        match = potentialMatchValue.match(plugin.pattern);
      }

      return !!match;
    });

    if (match) {
      if (match.index > 0) {
        console.warn(
          `Invalid RegExp: editor component '${plugin.id}' must match from the beginning of the block.`,
        );
      }
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
