export function remarkParseShortcodes({ plugins }) {
  const Parser = this.Parser;
  const blockTokenizers = Parser.prototype.blockTokenizers;
  const blockMethods = Parser.prototype.blockMethods;
  const inlineTokenizers = Parser.prototype.inlineTokenizers;
  const inlineMethods = Parser.prototype.inlineMethods;

  blockTokenizers.shortcode = createShortcodeTokenizer({ plugins });
  blockMethods.unshift('shortcode');

  inlineTokenizers.inlineShortcode = createInlineShortcodeTokenizer({ plugins });
  inlineMethods.unshift('inlineShortcode');
}

function createShortcodeTokenizer({ plugins }) {
  plugins.forEach(plugin => {
    if (plugin.pattern && plugin.pattern.flags.includes('m')) {
      console.warn(
        `Invalid RegExp: editor component '${plugin.id}' must not use the multiline flag in its pattern.`,
      );
    }
  });
  return function tokenizeShortcode(eat, value, silent) {
    let match;
    const potentialMatchValue = value.split('\n\n')[0].trimEnd();
    const plugin = plugins.find(plugin => {
      if (plugin.type === 'inline') {
        return false;
      }
      let { pattern } = plugin;
      // Plugin patterns must start with a caret (^) to match the beginning of the block.
      // If the pattern does not start with a caret, we add it
      // to ensure that remark consumes only the shortcode, without any leading text.
      if (!pattern.source.startsWith('^')) {
        pattern = new RegExp(`^${pattern.source}`, pattern.flags);
      }

      match = value.match(pattern);
      if (!match) {
        match = potentialMatchValue.match(pattern);
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

      const shortcodeData = plugin.fromBlock
        ? plugin.fromBlock(match)
        : plugin.fromInline
        ? plugin.fromInline(match)
        : match;

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

function createInlineShortcodeTokenizer({ plugins }) {
  plugins.forEach(plugin => {
    if (plugin.type === 'inline' && plugin.pattern) {
      if (plugin.pattern.flags.includes('m')) {
        console.warn(
          `Invalid RegExp: inline editor component '${plugin.id}' must not use the multiline flag in its pattern.`,
        );
      }
      if (/(\.\*|\.\+)(?!\?)/.test(plugin.pattern.source)) {
        console.warn(
          `Potentially greedy RegExp in inline component '${plugin.id}': consider using non-greedy quantifier (e.g. .*? or .+?) or specific character classes to prevent overmatching within paragraphs.`,
        );
      }
    }
  });

  function tokenizeInlineShortcode(eat, value, silent) {
    let match;
    const plugin = plugins.find(plugin => {
      if (plugin.type !== 'inline') {
        return false;
      }
      let { pattern } = plugin;
      // Inline patterns must match at the current offset (leading ^)
      if (!pattern.source.startsWith('^')) {
        pattern = new RegExp(`^${pattern.source}`, pattern.flags);
      }

      match = value.match(pattern);
      return !!match;
    });

    if (match) {
      if (silent) {
        return true;
      }

      const shortcodeData = plugin.fromInline
        ? plugin.fromInline(match)
        : plugin.fromBlock
        ? plugin.fromBlock(match)
        : match;

      try {
        return eat(match[0])({
          type: 'inline-shortcode',
          data: {
            shortcode: plugin.id,
            shortcodeData,
            isVoid: plugin.isVoid !== false,
          },
        });
      } catch (e) {
        console.warn(
          `Sent invalid data to remark. Inline plugin: ${plugin.id}. Value: ${
            match[0]
          }. Data: ${JSON.stringify(shortcodeData)}`,
        );
        return false;
      }
    }
  }

  tokenizeInlineShortcode.locator = function locateInlineShortcode(value, fromIndex) {
    let minIndex = -1;
    plugins.forEach(plugin => {
      if (plugin.type !== 'inline') {
        return;
      }

      if (plugin.trigger) {
        const triggerIndex = value.indexOf(plugin.trigger, fromIndex);
        if (triggerIndex !== -1 && (minIndex === -1 || triggerIndex < minIndex)) {
          minIndex = triggerIndex;
        }
      } else {
        let searchPattern = plugin.pattern;
        if (searchPattern.source.startsWith('^')) {
          searchPattern = new RegExp(searchPattern.source.slice(1), searchPattern.flags);
        }
        const slice = value.slice(fromIndex);
        const match = slice.match(searchPattern);
        if (match && typeof match.index === 'number') {
          const foundIndex = fromIndex + match.index;
          if (minIndex === -1 || foundIndex < minIndex) {
            minIndex = foundIndex;
          }
        }
      }
    });
    return minIndex;
  };

  return tokenizeInlineShortcode;
}

export function createRemarkShortcodeStringifier({ plugins }) {
  return function remarkStringifyShortcodes() {
    const Compiler = this.Compiler;
    const visitors = Compiler.prototype.visitors;

    visitors.shortcode = shortcode;
    visitors['inline-shortcode'] = inlineShortcode;

    function shortcode(node) {
      const { data } = node;
      const plugin = plugins.find(plugin => data.shortcode === plugin.id);
      if (!plugin) return '';
      return plugin.toBlock
        ? plugin.toBlock(data.shortcodeData)
        : plugin.toInline
        ? plugin.toInline(data.shortcodeData)
        : '';
    }

    function inlineShortcode(node) {
      const { data } = node;
      const plugin = plugins.find(plugin => data.shortcode === plugin.id);
      if (!plugin) return '';
      return plugin.toInline
        ? plugin.toInline(data.shortcodeData)
        : plugin.toBlock
        ? plugin.toBlock(data.shortcodeData)
        : '';
    }
  };
}
