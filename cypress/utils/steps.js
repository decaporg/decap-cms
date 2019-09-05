const { notifications, workflowStatus } = require('./constants');

function login(user) {
  cy.viewport(1200, 1200);
  if (user) {
    cy.visit('/', {
      onBeforeLoad: () => {
        window.localStorage.setItem('netlify-cms-user', JSON.stringify(user));
      },
    });
  } else {
    cy.visit('/');
    cy.contains('button', 'Login').click();
  }
}

function assertNotification(message) {
  if (Array.isArray(message)) {
    console.log(message);
    const messages = message.reverse();
    cy.get('.notif__container div')
      .should('have.length.of', messages.length)
      .each((el, idx) => {
        cy.wrap(el)
          .contains(messages[idx])
          .invoke('hide');
      });
  } else {
    cy.get('.notif__container').within(() => {
      cy.contains(message).invoke('hide');
    });
  }
}

function exitEditor() {
  cy.contains('a[href^="#/collections/"]', 'Writing in').click();
}

function goToWorkflow() {
  cy.contains('a', 'Workflow').click();
}

function goToCollections() {
  cy.contains('a', 'Content').click();
}

function updateWorkflowStatus({ title }, fromColumnHeading, toColumnHeading) {
  cy.contains('h2', fromColumnHeading)
    .parent()
    .contains('a', title)
    .trigger('dragstart', {
      dataTransfer: {},
      force: true,
    });
  cy.contains('h2', toColumnHeading)
    .parent()
    .trigger('drop', {
      dataTransfer: {},
      force: true,
    });
  assertNotification(notifications.updated);
}

function publishWorkflowEntry({ title }) {
  cy.contains('h2', workflowStatus.ready)
    .parent()
    .within(() => {
      cy.contains('a', title)
        .parent()
        .within(() => {
          cy.contains('button', 'Publish new entry').click({ force: true });
        });
    });
  assertNotification(notifications.published);
}

function deleteWorkflowEntry({ title }) {
  cy.contains('a', title)
    .parent()
    .within(() => {
      cy.contains('button', 'Delete new entry').click({ force: true });
    });

  assertNotification(notifications.deletedUnpublished);
}

function assertWorkflowStatusInEditor(status) {
  cy.contains('[role="button"]', 'Set status').as('setStatusButton');
  cy.get('@setStatusButton')
    .parent()
    .within(() => {
      cy.get('@setStatusButton').click();
      cy.contains('[role="menuitem"] span', status)
        .parent()
        .within(() => {
          cy.get('svg');
        });
      cy.get('@setStatusButton').click();
    });
}

function assertPublishedEntry(entry) {
  if (Array.isArray(entry)) {
    const entries = entry.reverse();
    cy.get('a h2').then(els => {
      cy.wrap(els.slice(0, entries.length)).each((el, idx) => {
        cy.wrap(el).contains(entries[idx].title);
      });
    });
  } else {
    cy.get('a h2')
      .first()
      .contains(entry.title);
  }
}

function deleteEntryInEditor() {
  cy.contains('button', 'Delete').click();
  assertNotification(notifications.deletedUnpublished);
}

function assertOnCollectionsPage() {
  cy.url().should('contain', '/#/collections/posts');
  cy.contains('h2', 'Collections');
}

function assertEntryDeleted(entry) {
  if (Array.isArray(entry)) {
    const titles = entry.map(e => e.title);
    cy.get('a h2').each(el => {
      expect(titles).not.to.include(el.text());
    });
  } else {
    cy.get('a h2').each(el => {
      expect(entry.title).not.to.equal(el.text());
    });
  }
}

function assertWorkflowStatus({ title }, status) {
  cy.contains('h2', status)
    .parent()
    .contains('a', title);
}

function updateWorkflowStatusInEditor(newStatus) {
  cy.contains('[role="button"]', 'Set status').as('setStatusButton');
  cy.get('@setStatusButton')
    .parent()
    .within(() => {
      cy.get('@setStatusButton').click();
      cy.contains('[role="menuitem"] span', newStatus).click();
    });
  assertNotification(notifications.updated);
}

function populateEntry(entry) {
  const keys = Object.keys(entry);
  for (let key of keys) {
    const value = entry[key];
    if (key === 'body') {
      cy.get('[data-slate-editor]')
        .click()
        .clear()
        .type(value);
    } else {
      cy.get(`[id^="${key}-field"]`)
        .clear()
        .type(value);
    }
  }

  cy.get('input')
    .first()
    .click();
  cy.contains('button', 'Save').click();
  assertNotification(notifications.saved);
}

function createPost(entry) {
  cy.contains('a', 'New Post').click();
  populateEntry(entry);
}

function createPostAndExit(entry) {
  createPost(entry);
  exitEditor();
}

function updateExistingPostAndExit(fromEntry, toEntry) {
  goToWorkflow();
  cy.contains('h2', fromEntry.title)
    .parent()
    .click({ force: true });
  populateEntry(toEntry);
  exitEditor();
  goToWorkflow();
  cy.contains('h2', toEntry.title);
}

function validateObjectFields({ limit, author }) {
  cy.get('a[href^="#/collections/settings"]').click();
  cy.get('a[href^="#/collections/settings/entries/general"]').click();
  cy.get('input[type=number]').type(limit);
  cy.contains('button', 'Save').click();
  assertNotification(notifications.error.missingField);
  cy.contains('label', 'Default Author').click();
  cy.focused().type(author);
  cy.contains('button', 'Save').click();
  assertNotification(notifications.saved);
}

function validateNestedObjectFields({ limit, author }) {
  cy.get('a[href^="#/collections/settings"]').click();
  cy.get('a[href^="#/collections/settings/entries/general"]').click();
  cy.contains('label', 'Default Author').click();
  cy.focused().type(author);
  cy.contains('button', 'Save').click();
  assertNotification(notifications.error.missingField);
  cy.get('input[type=number]').type(limit + 1);
  cy.contains('button', 'Save').click();
  assertFieldValidationError(notifications.validation.range);
  cy.get('input[type=number]')
    .clear()
    .type(-1);
  cy.contains('button', 'Save').click();
  assertFieldValidationError(notifications.validation.range);
  cy.get('input[type=number]')
    .clear()
    .type(limit);
  cy.contains('button', 'Save').click();
  assertNotification(notifications.saved);
}

function validateListFields({ name, description }) {
  cy.get('a[href^="#/collections/settings"]').click();
  cy.get('a[href^="#/collections/settings/entries/authors"]').click();
  cy.contains('button', 'Add').click();
  cy.contains('button', 'Save').click();
  assertNotification(notifications.error.missingField);
  cy.get('input')
    .eq(2)
    .type(name);
  cy.get('[data-slate-editor]')
    .eq(2)
    .type(description);
  cy.contains('button', 'Save').click();
}

function validateObjectFieldsAndExit(setting) {
  validateObjectFields(setting);
  exitEditor();
}

function validateNestedObjectFieldsAndExit(setting) {
  validateNestedObjectFields(setting);
  exitEditor();
}

function validateListFieldsAndExit(setting) {
  validateListFields(setting);
  exitEditor();
}

function assertFieldValidationError({ message, fieldLabel }) {
  cy.contains('label', fieldLabel)
    .siblings('ul[class*=ControlErrorsList]')
    .contains(message);
}

module.exports = {
  login,
  createPost,
  createPostAndExit,
  updateExistingPostAndExit,
  exitEditor,
  goToWorkflow,
  goToCollections,
  updateWorkflowStatus,
  publishWorkflowEntry,
  deleteWorkflowEntry,
  assertWorkflowStatusInEditor,
  assertPublishedEntry,
  deleteEntryInEditor,
  assertOnCollectionsPage,
  assertEntryDeleted,
  assertWorkflowStatus,
  updateWorkflowStatusInEditor,
  validateObjectFieldsAndExit,
  validateNestedObjectFieldsAndExit,
  validateListFieldsAndExit,
};
