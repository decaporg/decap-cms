import { describe, expect, it } from 'vitest';

import { FILES, FOLDER } from '@/core/constants/collectionTypes';
import { isNotesEnabled } from '@/core/lib/notes';

describe('isNotesEnabled (decaporg #7563)', () => {
  it('follows the collection editor.notes setting, off by default', () => {
    expect(isNotesEnabled({ name: 'posts', type: FOLDER } as any, 'a')).toBe(false);
    expect(isNotesEnabled({ name: 'posts', type: FOLDER, editor: { notes: true } } as any, 'a')).toBe(true);
    expect(isNotesEnabled(undefined, 'a')).toBe(false);
  });

  it('lets a file in a files collection override the collection', () => {
    const collection = {
      name: 'pages',
      type: FILES,
      editor: { notes: true },
      files: [
        { name: 'about', file: 'about.md', editor: { notes: false } },
        { name: 'home', file: 'home.md' },
      ],
    } as any;

    expect(isNotesEnabled(collection, 'about')).toBe(false);
    expect(isNotesEnabled(collection, 'home')).toBe(true);
  });
});
