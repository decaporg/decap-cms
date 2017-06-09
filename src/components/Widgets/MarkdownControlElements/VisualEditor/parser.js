import unified from 'unified';
import markdown from 'remark-parse';
import { Mark } from 'prosemirror-model';
import markdownToProseMirror from './markdownToProseMirror';

const state = { activeMarks: Mark.none, textsArray: [] };

/**
 * Uses unified to parse markdown and apply plugins.
 * @param {string} src raw markdown
 * @returns {Node} a ProseMirror Node
 */
function parser(src) {
  const result = unified()
    .use(markdown, { commonmark: true, footnotes: true, pedantic: true })
    .parse(src);

  return unified()
    .use(markdownToProseMirror, { state })
    .runSync(result);
}

/**
 * Gets the parser and makes schema and plugins available at top scope.
 * @param {Schema} schema - a ProseMirror schema
 * @param {Map} plugins - Immutable Map of registered plugins
 */
function parserGetter(schema, plugins) {
  state.schema = schema;
  state.plugins = plugins;
  return parser;
}

export default parserGetter;
