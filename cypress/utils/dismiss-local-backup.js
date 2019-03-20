// Prevents unsaved changes in dev local storage from being used
Cypress.on('window:confirm', message => {
  switch (message) {
    case 'A local backup was recovered for this entry, would you like to use it?':
      return false;
    default:
      return true;
  }
});
