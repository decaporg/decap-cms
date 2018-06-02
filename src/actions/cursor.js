export const CURSOR_SET = 'CURSOR_SET';

export function setCursor(cursor, { collectionName, media }) {
  return {
    type: CURSOR_SET,
    payload: {
      cursor,
      collectionName,
      media,
    },
  }
}
