export const ADD_MEDIA = 'ADD_MEDIA';

export function addMedia(file) {
  return { type: ADD_MEDIA, payload: file };
}
