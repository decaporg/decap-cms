import { get, isEmpty, reduce, pull } from 'lodash';
import unified from 'unified';
import u from 'unist-builder';
import markdownToRemarkPlugin from 'remark-parse';
import remarkToMarkdownPlugin from 'remark-stringify';
import remarkToRehype from 'remark-rehype';
import rehypeToHtml from 'rehype-stringify';
import htmlToRehype from 'rehype-parse';
import rehypeToRemark from 'rehype-remark';
import remarkToRehypeShortcodes from './remarkRehypeShortcodes';
import rehypePaperEmoji from './rehypePaperEmoji';
import remarkAssertParents from './remarkAssertParents';
import remarkPaddedLinks from './remarkPaddedLinks';
import remarkWrapHtml from './remarkWrapHtml';
import remarkToSlatePlugin from './remarkSlate';
import remarkSquashReferences from './remarkSquashReferences';
import remarkImagesToText from './remarkImagesToText';
import remarkShortcodes from './remarkShortcodes';
import remarkEscapeMarkdownEntities from './remarkEscapeMarkdownEntities'
import slateToRemarkParser from './slateRemark';
import registry from '../../../../lib/registry';

/**
 * This module contains all serializers for the Markdown widget.
 *
 * The value of a Markdown widget is transformed to various formats during
 * editing, and these formats are referenced throughout serializer source
 * documentation. Below is brief glossary of the formats used.
 *
 * - Markdown {string}
 *   The stringified Markdown value. The value of the field is persisted
 *   (stored) in this format, and the stringified value is also used when the
 *   editor is in "raw" Markdown mode.
 *
 * - MDAST {object}
 *   Also loosely referred to as "Remark". MDAST stands for MarkDown AST
 *   (Abstract Syntax Tree), and is an object representation of a Markdown
 *   document. Underneath, it's a Unist tree with a Markdown-specific schema. An
 *   MDAST is used as the source of truth for any Markdown field within the CMS
 *   once the Markdown string value is loaded.  MDAST syntax is a part of the
 *   Unified ecosystem, and powers the Remark processor, so Remark plugins may
 *   be used.
 *
 * - HAST {object}
 *   Also loosely referred to as "Rehype". HAST, similar to MDAST, is an object
 *   representation of an HTML document.  The field value takes this format
 *   temporarily before the document is stringified to HTML.
 *
 * - HTML {string}
 *   The field value is stringifed to HTML for preview purposes - the HTML value
 *   is never parsed, it is output only.
 *
 * - Slate Raw AST {object}
 *   Slate's Raw AST is a very simple and unopinionated object representation of
 *   a document in a Slate editor. We define our own Markdown-specific schema
 *   for serialization to/from Slate's Raw AST and MDAST.
 *
 * Overview of the Markdown widget serialization life cycle:
 *
 * - Entry Load
 *   When an entry is loaded, all Markdown widget values are serialized to
 *   MDAST within the entry draft.
 *
 * - Visual Editor Render
 *   When a Markdown widget using the visual editor renders, it converts the
 *   MDAST value from the entry draft to Slate's Raw AST, and renders that.
 *
 * - Visual Editor Update
 *   When the value of a Markdown field is changed in the visual editor, the
 *   resulting Slate Raw AST is converted back to MDAST, and the MDAST value is
 *   set as the new state of the field in the entry draft.
 *
 * - Visual Editor Paste
 *   When a value is pasted to the visual editor, the pasted value is checked
 *   for HTML data. If HTML is found, the value is deserialized to an HAST, then
 *   to MDAST, and finally to Slate's Raw AST. If no HTML is found, the plain
 *   text value of the paste is serialized to Slate's Raw AST via the Slate
 *   Plain serializer. The deserialized fragment is then inserted to the Slate
 *   document.
 *
 * - Raw Editor Render
 *   When a Markdown widget using the raw editor (Markdown switch activated),
 *   it stringifies the MDAST from the entry draft to Markdown, and runs the
 *   stringified Markdown through Slate's Plain serializer, which outputs a
 *   Slate Raw AST of the plain text, which is then rendered in the editor.
 *
 * - Raw Editor Update
 *   When the value of a Markdown field is changed in the raw editor, the
 *   resulting Slate Raw AST is stringified back to a string, and the string
 *   value is then parsed as Markdown into an MDAST. The MDAST value is
 *   set as the new state of the field in the entry draft.
 *
 * - Raw Editor Paste
 *   When a value is pasted to the raw editor, the text value of the paste is
 *   serialized to Slate's Raw AST via the Slate Plain serializer. The
 *   deserialized fragment is then inserted to the Slate document.
 *
 * - Preview Pane Render
 *   When the preview pane renders the value of a Markdown widget, it first
 *   converts the MDAST value to HAST, stringifies the HAST to HTML, and
 *   renders that.
 *
 * - Entry Persist (Save)
 *   On persist, the MDAST value in the entry draft is stringified back to
 *   a Markdown string for storage.
 */


/**
 * Deserialize a Markdown string to an MDAST.
 */
export const markdownToRemark = markdown => {

  /**
   * Disabling tokenizers allows us to turn off features within the Remark
   * parser.
   */
  function disableTokenizers() {

    /**
     * Turn off soft breaks until we can properly support them across both
     * editors.
     */
    pull(this.Parser.prototype.inlineMethods, 'break');
  }

  /**
   * Parse the Markdown string input to an MDAST.
   */
  const parsed = unified()
    .use(markdownToRemarkPlugin, { fences: true, pedantic: true, commonmark: true })
    .use(disableTokenizers)
    .parse(markdown);

  /**
   * Further transform the MDAST with plugins.
   */
  const result = unified()
    .use(remarkSquashReferences)
    .use(remarkImagesToText)
    .use(remarkShortcodes, { plugins: registry.getEditorComponents() })
    .runSync(parsed);

  return result;
};


/**
 * Serialize an MDAST to a Markdown string.
 */
export const remarkToMarkdown = obj => {
  /**
   * Rewrite the remark-stringify text visitor to simply return the text value,
   * without encoding or escaping any characters. This means we're completely
   * trusting the markdown that we receive.
   */
  function remarkAllowAllText() {
    const Compiler = this.Compiler;
    const visitors = Compiler.prototype.visitors;
    visitors.text = node => node.value;
  };

  /**
   * Provide an empty MDAST if no value is provided.
   */
  const mdast = obj || u('root', [u('paragraph', [u('text', '')])]);

  const remarkToMarkdownPluginOpts = {
    commonmark: true,
    fences: true,
    pedantic: true,
    listItemIndent: '1',

    // Settings to emulate the defaults from the Prosemirror editor, not
    // necessarily optimal. Should eventually be configurable.
    bullet: '*',
    strong: '*',
    rule: '-',
  };

  /**
   * Escape markdown entities found in text and html nodes within the MDAST.
   */
  const escapedMdast = unified()
    .use(remarkEscapeMarkdownEntities)
    .runSync(mdast);

  const markdown = unified()
    .use(remarkToMarkdownPlugin, remarkToMarkdownPluginOpts)
    .use(remarkAllowAllText)
    .stringify(escapedMdast);

  return markdown;
};


/**
 * Convert an MDAST to an HTML string.
 */
export const remarkToHtml = (mdast, getAsset) => {
  const hast = unified()
    .use(remarkToRehypeShortcodes, { plugins: registry.getEditorComponents(), getAsset })
    .use(remarkToRehype, { allowDangerousHTML: true })
    .runSync(mdast);

  const html = unified()
    .use(rehypeToHtml, { allowDangerousHTML: true, allowDangerousCharacters: true })
    .stringify(hast);

  return html;
}


/**
 * Deserialize an HTML string to Slate's Raw AST. Currently used for HTML
 * pastes.
 */
export const htmlToSlate = html => {
  const hast = unified()
    .use(htmlToRehype, { fragment: true })
    .parse(html);

  const mdast = unified()
    .use(rehypePaperEmoji)
    .use(rehypeToRemark, { minify: false })
    .runSync(hast);

  const slateRaw = unified()
    .use(remarkAssertParents)
    .use(remarkPaddedLinks)
    .use(remarkImagesToText)
    .use(remarkShortcodes, { plugins: registry.getEditorComponents() })
    .use(remarkWrapHtml)
    .use(remarkToSlatePlugin)
    .runSync(mdast);

  return slateRaw;
};


/**
 * Convert an MDAST to Slate's Raw AST.
 */
export const remarkToSlate = mdast => {
  const result = unified()
    .use(remarkWrapHtml)
    .use(remarkToSlatePlugin)
    .runSync(mdast);
  return result;
};


/**
 * Convert a Slate Raw AST to MDAST.
 *
 * Requires shortcode plugins to parse shortcode nodes back to text.
 *
 * Note that Unified is not utilized for the conversion from Slate's Raw AST to
 * MDAST. The conversion is manual because Unified can only operate on Unist
 * trees.
 */
export const slateToRemark = (raw) => {
  const mdast = slateToRemarkParser(raw, { shortcodePlugins: registry.getEditorComponents() });
  return mdast;
};
