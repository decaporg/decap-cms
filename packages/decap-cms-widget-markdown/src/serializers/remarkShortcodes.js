export function remarkParseShortcodes(options) {
  return function attacher() {
    const plugins = options?.plugins;
    if (!plugins) return;

    const micromarkExt = createShortcodeMicromarkExtension(plugins);
    const fromMarkdownExt = createShortcodeFromMarkdownExtension(plugins);

    const existingMicromark = this.data('micromarkExtensions') || [];
    this.data('micromarkExtensions', [...existingMicromark, micromarkExt]);

    const existingFromMarkdown = this.data('fromMarkdown') || [];
    this.data('fromMarkdown', [...existingFromMarkdown, fromMarkdownExt]);
  };
}

function createShortcodeMicromarkExtension(plugins) {
  // Build a regex that matches any plugin's pattern at the start of a line
  const patterns = plugins.toArray().map(p => p.pattern.source);
  const combinedPattern = new RegExp(`^(${patterns.join('|')})`, 'm');

  return {
    flow: [
      {
        tokenize: (effects, ok, nok) => {
          return function start(code) {
            if (code !== 91 /* [ */) return nok(code); // '['

            let buffer = '';
            const next = code;

            function read(code) {
              if (code === null || code === 10 /* \n */) {
                // End of line or file
                const match = buffer.match(combinedPattern);
                if (match) {
                  effects.enter('shortcode');
                  for (let i = 0; i < match[0].length; i++) {
                    effects.consume(buffer.charCodeAt(i));
                  }
                  effects.exit('shortcode');
                  // Consume rest of line if any
                  return ok(code);
                }
                return nok(code);
              }
              buffer += String.fromCharCode(code);
              return read;
            }

            return read(next);
          };
        },
        resolveTo: 'paragraph',
        resolveAll: false,
      }
    ],
  };
}

function createShortcodeFromMarkdownExtension(plugins) {
  return {
    enter: {
      shortcode(token) {
        this.enter(
          {
            type: 'shortcode',
            value: this.sliceSerialize(token),
            data: { shortcode: null, shortcodeData: null },
          },
          token,
        );
      },
    },
    exit: {
      shortcode(token) {
        const node = this.stack[this.stack.length - 1];
        const value = node.value;

        // Try all plugins to find a match
        let found = false;
        for (const plugin of plugins.toArray()) {
          const match = value.match(plugin.pattern);
          if (match) {
            node.data.shortcode = plugin.id;
            try {
              node.data.shortcodeData = plugin.fromBlock(match);
            } catch (e) {
              console.warn(
                `Error in shortcode plugin "${plugin.id}" fromBlock: ${e.message}`,
              );
              node.data.shortcodeData = null;
            }
            found = true;
            break;
          }
        }
        if (!found) {
          console.warn(
            `No matching shortcode plugin found for: "${value.trim()}"`
          );
        }
        this.exit(token);
      },
    },
  };
}

export function createRemarkShortcodeStringifier({ plugins }) {
  return function remarkStringifyShortcodes() {
    // For remark-stringify v10+, return a handler object
    return {
      handlers: {
        shortcode(node) {
          const { data } = node;
          const plugin = plugins.find(plugin => data.shortcode === plugin.id);
          return plugin ? plugin.toBlock(data.shortcodeData) : '';
        },
      },
    };
  };
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
