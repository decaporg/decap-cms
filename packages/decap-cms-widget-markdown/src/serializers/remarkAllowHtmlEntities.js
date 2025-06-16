/**
 * remark-parse v9+ plugin to prevent HTML entity decoding in text nodes.
 * This disables entity decoding by providing a micromark text extension.
 */
export default function remarkAllowHtmlEntities() {
  // Micromark text extension that disables entity decoding
  const micromarkExtension = {
    text: {
      resolveAll(events/*, context*/) {
        for (const event of events) {
          if (
            event[1].type === 'characterReference' ||
            event[1].type === 'characterEscape'
          ) {
            event[1].type = 'data';
          }
        }
        return events;
      },
    },
  };

  // remark-parse v9+ expects micromarkExtensions to be an object, not an array
  const existing = this.data('micromarkExtensions') || {};
  this.data('micromarkExtensions', {
    ...existing,
    text: [
      ...(existing.text || []),
      micromarkExtension.text,
    ],
  });
}
