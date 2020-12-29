import { isDraft } from 'immer';

export const throwIfNotDraft = (maybeDraft: unknown) => {
  if (!isDraft(maybeDraft)) {
    throw new Error(`This function can be used only with Immer's draft object`);
  }
};
