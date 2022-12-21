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

function uploadMediaFile() {
  assertNoImagesInLibrary();

  const fixture = 'media/netlify.png';
  cy.get('input[type="file"]').attachFile(fixture);
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
  cy.contains('button', 'Choose selected').click();
}

function chooseAnImage() {
  cy.contains('button', 'Choose an image').click();
}

function waitForEntryToLoad() {
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
    login(getUser && getUser());
  });

  it('can upload image from global media library', () => {
    goToMediaLibrary();
    uploadMediaFile();
    matchImageSnapshot();
    closeMediaLibrary();
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
    exitEditor();
    goToMediaLibrary();
    assertNoImagesInLibrary();
    matchImageSnapshot();
  });

  it('should show published entry image in global media library', () => {
    publishPostWithImage(entries[0]);
    cy.clock().tick();
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
