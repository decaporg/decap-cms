import { newPost, populateEntry, publishEntry, flushClockAndSave } from '../../utils/steps';

const enterTranslation = str => {
  cy.get(`[id^="title-field"]`)
    .first()
    .clear({ force: true });
  cy.get(`[id^="title-field"]`)
    .first()
    .type(str, { force: true });
};

const createAndTranslate = entry => {
  newPost();
  // fill the main entry
  populateEntry(entry, () => undefined);

  // fill the translation
  cy.get('.Pane2').within(() => {
    enterTranslation('de');

    cy.contains('span', 'Writing in DE').click();
    cy.contains('span', 'fr').click();

    enterTranslation('fr');
  });
};

export const updateTranslation = () => {
  cy.get('.Pane2').within(() => {
    enterTranslation('fr fr');

    cy.contains('span', 'Writing in FR').click();
    cy.contains('span', 'de').click();

    enterTranslation('de de');
  });
  cy.contains('button', 'Save').click();
};

export const assertTranslation = () => {
  cy.get('.Pane2').within(() => {
    cy.get(`[id^="title-field"]`).should('have.value', 'de');

    cy.contains('span', 'Writing in DE').click();
    cy.contains('span', 'fr').click();

    cy.get(`[id^="title-field"]`).should('have.value', 'fr');
  });
};

export const createEntryTranslateAndPublish = entry => {
  createAndTranslate(entry);
  publishEntry();
};

export const createEntryTranslateAndSave = entry => {
  createAndTranslate(entry);
  flushClockAndSave();
};
