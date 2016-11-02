import { MarkdownParser } from 'prosemirror-markdown';
import markdownit from 'markdown-it';

export default function createMarkdownParser(schema) {
  return new MarkdownParser(schema, markdownit("commonmark", {html: false}), {
    blockquote: {block: "blockquote"},
    paragraph: {block: "paragraph"},
    list_item: {block: "list_item"},
    bullet_list: {block: "bullet_list"},
    ordered_list: {block: "ordered_list", attrs: tok => ({order: +tok.attrGet("order") || 1})},
    heading: {block: "heading", attrs: tok => ({level: +tok.tag.slice(1)})},
    code_block: {block: "code_block"},
    fence: {block: "code_block"},
    hr: {node: "horizontal_rule"},
    image: {node: "image", attrs: tok => ({
      src: tok.attrGet("src"),
      title: tok.attrGet("title") || null,
      alt: tok.children[0] && tok.children[0].content || null
    })},
    hardbreak: {node: "hard_break"},

    em: {mark: "em"},
    strong: {mark: "strong"},
    link: {mark: "link", attrs: tok => ({
      href: tok.attrGet("href"),
      title: tok.attrGet("title") || null
    })},
    code_inline: {mark: "code"}
  });
}
