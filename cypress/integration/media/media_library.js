import path from 'path';
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
} from '../../utils/steps';
import { workflowStatus } from '../../utils/constants';

function uploadMediaFile() {
  assertNoImagesInLibrary();

  const fixture = 'media/netlify.png';
  cy.fixture(fixture).then(fileContent => {
    cy.get('input[type="file"]').upload({
      fileContent,
      fileName: path.basename(fixture),
      mimeType: 'image/png',
    });
  });

  assertImagesInLibrary();
}

function assertImagesInLibrary() {
  cy.get('img[class*="CardImage"]').should('exist');
}

function assertNoImagesInLibrary() {
  cy.get('img[class*="CardImage"]').should('not.exist');
}

function chooseSelectedMediaFile() {
  cy.contains('button', 'Choose selected').click();
}

function chooseAnImage() {
  cy.contains('button', 'Choose an image').click();
}

function matchImageSnapshot() {
  // TODO: revisit once // https://github.com/cypress-io/cypress/issues/2102 is fixed
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
}

function publishPostWithImage(entry) {
  newPost();
  chooseAnImage();
  uploadMediaFile();
  chooseSelectedMediaFile();
  populateEntry(entry);
  exitEditor();
  goToWorkflow();
  updateWorkflowStatus(entry, workflowStatus.draft, workflowStatus.ready);
  publishWorkflowEntry(entry);
}

function closeMediaLibrary() {
  cy.get('button[class*="CloseButton"]').click();
}

export default function({ backend, entries }) {
  after(() => {
    cy.task('teardownBackend', { backend });
  });

  before(() => {
    Cypress.config('defaultCommandTimeout', 4000);
    cy.task('setupBackend', { backend });
  });

  beforeEach(() => {
    login();
  });

  it('can upload image from global media library', () => {
    goToMediaLibrary();
    uploadMediaFile();
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
}
