import { en } from '../../packages/decap-cms-locales/src';

// Prevents unsaved changes in dev local storage from being used
Cypress.on('window:confirm', message => {
  const {
    editor: {
      editor: { confirmLoadBackup },
    },
  } = en;

  switch (message) {
    case confirmLoadBackup:
      return false;
    default:
      return true;
  }
});
