import { getPhrases } from 'Constants/defaultPhrases';

// Prevents unsaved changes in dev local storage from being used
Cypress.on('window:confirm', message => {
  const {
    editor: {
      editor: { confirmLoadBackup },
    },
  } = getPhrases();

  switch (message) {
    case confirmLoadBackup:
      return false;
    default:
      return true;
  }
});
