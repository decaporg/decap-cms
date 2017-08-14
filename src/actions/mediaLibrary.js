export const OPEN_MEDIA_LIBRARY = 'OPEN_MEDIA_LIBRARY';
export const CLOSE_MEDIA_LIBRARY = 'CLOSE_MEDIA_LIBRARY';

export function openMediaLibrary() {
  return { type: OPEN_MEDIA_LIBRARY };
}

export function closeMediaLibrary() {
  return { type: CLOSE_MEDIA_LIBRARY };
}
