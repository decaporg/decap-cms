import { createHyperscript } from 'slate-hyperscript';

const h = createHyperscript({
  blocks: {
    paragraph: 'p',
    'heading-one': 'h1',
    'heading-two': 'h2',
    'heading-three': 'h3',
    'heading-four': 'h4',
    'heading-five': 'h5',
    'heading-six': 'h6',
    quote: 'quote',
    'code-block': 'code-block',
    'bulleted-list': 'ul',
    'numbered-list': 'ol',
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
