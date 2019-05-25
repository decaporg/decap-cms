import { createHyperscript } from 'slate-hyperscript';

const h = createHyperscript({
  blocks: {
    paragraph: 'paragraph',
    'heading-one': 'heading-one',
    'heading-two': 'heading-two',
    'heading-three': 'heading-three',
    'heading-four': 'heading-four',
    'heading-five': 'heading-five',
    'heading-six': 'heading-six',
    quote: 'quote',
    'code-block': 'code-block',
    'bulleted-list': 'bulleted-list',
    'numbered-list': 'numbered-list',
    'thematic-break': 'thematic-break',
    table: 'table',
  },
  inlines: {
    link: 'link',
    break: 'break',
    image: 'image',
  },
  marks: {
    b: 'bold',
    i: 'italic',
    s: 'strikethrough',
    code: 'code',
  },
});

export default h;
