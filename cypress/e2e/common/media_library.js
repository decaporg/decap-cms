import '../../utils/dismiss-local-backup';
import {
  login,
  goToMediaLibrary,
  newPost,
  populateEntry,
  exitEditor,
  goToWorkflow,
  updateWorkflowStatus,
  publishWorkflowEntry,
  goToEntry,
  goToCollections,
} from '../../utils/steps';
import { workflowStatus } from '../../utils/constants';

function logFailPoint(label) {
  cy.then(() => {
    const currentWindow = Cypress.state('window');
    const href = currentWindow?.location?.href;
    const body = currentWindow?.document?.body;
    const bodyText = body?.innerText || '';
    const loadingVisible = bodyText.includes('Loading...');
    const uploadingVisible = bodyText.includes('Uploading...');
    const cardImageCount = currentWindow?.document?.querySelectorAll('img[class*="CardImage"]').length || 0;

    console.log(
      `[FAIL-POINT] ${label} href=${href} loading=${loadingVisible} uploading=${uploadingVisible} cardImages=${cardImageCount}`,
    );
  });
}

function uploadMediaFile() {
  assertNoImagesInLibrary();

  const fixture = 'cypress/fixtures/media/netlify.png';
  cy.get('input[type="file"]').selectFile(fixture, { force: true });
  cy.contains('span', 'Uploading...').should('not.exist');

  assertImagesInLibrary();
}

function assertImagesInLibrary() {
  cy.get('img[class*="CardImage"]').should('exist');
}

function assertNoImagesInLibrary() {
  cy.get('h1')
    .contains('Loading...')
    .should('not.exist');
  cy.get('img[class*="CardImage"]').should('not.exist');
}

function deleteImage() {
  cy.get('img[class*="CardImage"]').click();
  cy.contains('button', 'Delete selected').click();
  assertNoImagesInLibrary();
}

function chooseSelectedMediaFile() {
  cy.contains('button', 'Choose selected').should('not.be.disabled');
  cy.contains('button', 'Choose selected').click();
}

function chooseAnImage() {
  cy.contains('button', 'Choose an image').click();
}

function waitForEntryToLoad() {
  cy.contains('button', 'Saving...').should('not.exist');
  cy.then(() => {
    const clock = cy.state('clock');
    if (clock) {
      clock.tick(5000);
    }
  });
  cy.contains('div', 'Loading entry...').should('not.exist');
}

function matchImageSnapshot() {
  // cy.matchImageSnapshot();
}

function newPostAndUploadImage() {
  newPost();
  chooseAnImage();
  uploadMediaFile();
}

function newPostWithImage(entry) {
  newPostAndUploadImage();
  chooseSelectedMediaFile();
  populateEntry(entry);
  waitForEntryToLoad();
}

function publishPostWithImage(entry) {
  newPostWithImage(entry);
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(500);
  exitEditor();
  goToWorkflow();
  updateWorkflowStatus(entry, workflowStatus.draft, workflowStatus.ready);
  publishWorkflowEntry(entry);
}

function closeMediaLibrary() {
  cy.get('button[class*="CloseButton"]').click();
}

function switchToGridView() {
  cy.get('div[class*="ViewControls"]').within(() => {
    cy.get('button')
      .last()
      .click();
  });
}

function assertGridEntryImage(entry) {
  cy.contains('li', entry.title).within(() => {
    cy.get('div[class*="CardImage"]').should('be.visible');
  });
}

export default function({ entries, getUser }) {
  beforeEach(() => {
    console.log('[media_library.beforeEach] START');
    const user = getUser && getUser();
    console.log('[media_library.beforeEach] user=', user ? JSON.stringify(user) : 'none');
    login(user);
    console.log('[media_library.beforeEach] login() returned');
  });

  it('can upload image from global media library', () => {
    Cypress.once('fail', error => {
      const currentWindow = Cypress.state('window');
      const href = currentWindow?.location?.href;
      const body = currentWindow?.document?.body;
      const snippet = (body?.innerText || '').slice(0, 1200);
      const cardImageCount = currentWindow?.document?.querySelectorAll('img[class*="CardImage"]').length || 0;

      console.error('[FAIL-POINT] can upload image from global media library - FAILED');
      console.error(`[FAIL-POINT] href=${href} cardImages=${cardImageCount}`);
      console.error(`[FAIL-POINT] bodySnippet=${snippet}`);

      throw error;
    });

    console.log('[TEST] can upload image from global media library - START');
    logFailPoint('before-goToMediaLibrary');
    goToMediaLibrary();
    logFailPoint('after-goToMediaLibrary');
    console.log('[TEST] goToMediaLibrary() completed');
    logFailPoint('before-uploadMediaFile');
    uploadMediaFile();
    logFailPoint('after-uploadMediaFile');
    console.log('[TEST] uploadMediaFile() completed');
    matchImageSnapshot();
    logFailPoint('before-closeMediaLibrary');
    closeMediaLibrary();
    logFailPoint('after-closeMediaLibrary');
    console.log('[TEST] can upload image from global media library - END');
  });

  it('can delete image from global media library', () => {
    goToMediaLibrary();
    uploadMediaFile();
    closeMediaLibrary();
    goToMediaLibrary();
    deleteImage();
    matchImageSnapshot();
    closeMediaLibrary();
  });

  it('can upload image from entry media library', () => {
    newPostAndUploadImage();
    matchImageSnapshot();
    closeMediaLibrary();
    exitEditor();
  });

  it('can save entry with image', () => {
    newPostWithImage(entries[0]);
    matchImageSnapshot();
    exitEditor();
  });

  it('can publish entry with image', () => {
    publishPostWithImage(entries[0]);
    goToEntry(entries[0]);
    waitForEntryToLoad();
    matchImageSnapshot();
  });

  it('should not show draft entry image in global media library', () => {
    newPostWithImage(entries[0]);
    cy.then(() => {
      const clock = cy.state('clock');
      if (clock) {
        clock.tick(150);
        clock.tick(150);
        // eslint-disable-next-line cypress/no-unnecessary-waiting
        cy.wait(500);
      }
      exitEditor();
      goToMediaLibrary();
      assertNoImagesInLibrary();
      matchImageSnapshot();
    });
  });

  it('should show published entry image in global media library', () => {
    publishPostWithImage(entries[0]);
    cy.then(() => {
      const clock = cy.state('clock');
      if (clock) {
        clock.tick();
      }
    });
    goToMediaLibrary();
    assertImagesInLibrary();
    matchImageSnapshot();
  });

  it('should show published entry image in grid view', () => {
    publishPostWithImage(entries[0]);
    goToCollections();
    switchToGridView();
    assertGridEntryImage(entries[0]);

    matchImageSnapshot();
  });
}
