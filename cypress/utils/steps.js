const { notifications, workflowStatus, editorStatus, publishTypes } = require('./constants');

function login(user) {
  cy.viewport(1200, 1200);
  if (user) {
    cy.visit('/', {
      onBeforeLoad: () => {
        // https://github.com/cypress-io/cypress/issues/1208
        window.indexedDB.deleteDatabase('localforage');
        window.localStorage.setItem('netlify-cms-user', JSON.stringify(user));
        if (user.netlifySiteURL) {
          window.localStorage.setItem('netlifySiteURL', user.netlifySiteURL);
        }
      },
    });
    if (user.netlifySiteURL && user.email && user.password) {
      cy.get('input[name="email"]')
        .clear()
        .type(user.email);
      cy.get('input[name="password"]')
        .clear()
        .type(user.password);
      cy.contains('button', 'Login').click();
    }
  } else {
    cy.visit('/');
    cy.contains('button', 'Login').click();
  }
  cy.contains('a', 'New Post');
}

function assertNotification(message) {
  cy.get('.notif__container').within(() => {
    cy.contains(message);
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500);
    cy.contains(message).invoke('hide');
  });
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

function goToMediaLibrary() {
  cy.contains('button', 'Media').click();
}

function goToEntry(entry) {
  goToCollections();
  cy.get('a h2')
    .first()
    .contains(entry.title)
    .click();
}

function updateWorkflowStatus({ title }, fromColumnHeading, toColumnHeading) {
  cy.contains('h2', fromColumnHeading)
    .parent()
    .contains('a', title)
    .drag();
  cy.contains('h2', toColumnHeading)
    .parent()
    .drop();
  assertNotification(notifications.updated);
}

function publishWorkflowEntry({ title }, timeout) {
  cy.contains('h2', workflowStatus.ready, { timeout })
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
}

function assertEntryDeleted(entry) {
  cy.get('body').then($body => {
    const entriesHeaders = $body.find('a h2');
    if (entriesHeaders.length > 0) {
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
  });
}

function assertWorkflowStatus({ title }, status) {
  cy.contains('h2', status)
    .parent()
    .contains('a', title);
}

function updateWorkflowStatusInEditor(newStatus) {
  selectDropdownItem('Set status', newStatus);
  assertNotification(notifications.updated);
}

function publishEntryInEditor(publishType) {
  selectDropdownItem('Publish', publishType);
  assertNotification(notifications.published);
}

function selectDropdownItem(label, item) {
  cy.contains('[role="button"]', label).as('dropDownButton');
  cy.get('@dropDownButton')
    .parent()
    .within(() => {
      cy.get('@dropDownButton').click();
      cy.contains('[role="menuitem"] span', item).click();
    });
}

function flushClockAndSave() {
  cy.clock().then(clock => {
    // some input fields are de-bounced thus require advancing the clock
    if (clock) {
      // https://github.com/cypress-io/cypress/issues/1273
      clock.tick(150);
      clock.tick(150);
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(500);
    }

    cy.get('input')
      .first()
      .click();
    cy.contains('button', 'Save').click();
    assertNotification(notifications.saved);
  });
}

function populateEntry(entry, onDone = flushClockAndSave) {
  const keys = Object.keys(entry);
  for (const key of keys) {
    const value = entry[key];
    if (key === 'body') {
      cy.getMarkdownEditor()
        .click()
        .clear()
        .type(value);
    } else {
      cy.get(`[id^="${key}-field"]`)
        .clear()
        .type(value);
    }
  }

  onDone();
}

function newPost() {
  cy.contains('a', 'New Post').click();
}

function createPost(entry) {
  newPost();
  populateEntry(entry);
}

function createPostAndExit(entry) {
  createPost(entry);
  exitEditor();
}

function publishEntry() {
  cy.clock().then(clock => {
    // some input fields are de-bounced thus require advancing the clock
    if (clock) {
      // https://github.com/cypress-io/cypress/issues/1273
      clock.tick(150);
      clock.tick(150);
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(500);
    }

    cy.contains('[role="button"]', 'Publish').as('publishButton');
    cy.get('@publishButton')
      .parent()
      .within(() => {
        cy.get('@publishButton').click();
        cy.contains('[role="menuitem"] span', 'Publish now').click();
      });
    assertNotification(notifications.saved);
  });
}

function createPostAndPublish(entry) {
  cy.contains('a', 'New Post').click();
  populateEntry(entry, publishEntry);
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

function unpublishEntry(entry) {
  goToCollections();
  cy.contains('h2', entry.title)
    .parent()
    .click({ force: true });
  selectDropdownItem('Published', 'Unpublish');
  assertNotification(notifications.unpublished);
  goToWorkflow();
  assertWorkflowStatus(entry, workflowStatus.ready);
}

function duplicateEntry(entry) {
  selectDropdownItem('Published', 'Duplicate');
  cy.url().should('contain', '/#/collections/posts/new');
  flushClockAndSave();
  updateWorkflowStatusInEditor(editorStatus.ready);
  publishEntryInEditor(publishTypes.publishNow);
  exitEditor();
  cy.get('a h2').should($h2s => {
    expect($h2s.eq(0)).to.contain(entry.title);
    expect($h2s.eq(1)).to.contain(entry.title);
  });
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
  cy.getMarkdownEditor()
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
  createPostAndPublish,
  updateExistingPostAndExit,
  exitEditor,
  goToWorkflow,
  goToCollections,
  goToMediaLibrary,
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
  unpublishEntry,
  publishEntryInEditor,
  duplicateEntry,
  newPost,
  populateEntry,
  goToEntry,
};
