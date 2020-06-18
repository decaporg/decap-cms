import '../utils/dismiss-local-backup';
import {
  login,
  createPost,
  createPostAndExit,
  exitEditor,
  goToWorkflow,
  goToCollections,
  updateWorkflowStatus,
  publishWorkflowEntry,
  assertWorkflowStatusInEditor,
  assertPublishedEntry,
  deleteEntryInEditor,
  assertOnCollectionsPage,
  assertEntryDeleted,
  assertWorkflowStatus,
  updateWorkflowStatusInEditor,
  unpublishEntry,
  publishEntryInEditor,
  duplicateEntry,
  goToEntry,
  populateEntry,
  publishAndCreateNewEntryInEditor,
  publishAndDuplicateEntryInEditor,
  assertNotification,
  assertFieldValidationError,
} from '../utils/steps';
import { workflowStatus, editorStatus, publishTypes, notifications } from '../utils/constants';

const entry1 = {
  title: 'first title',
  body: 'first body',
};
const entry2 = {
  title: 'second title',
  body: 'second body',
};
const entry3 = {
  title: 'third title',
  body: 'third body',
};

describe('Test Backend Editorial Workflow', () => {
  after(() => {
    cy.task('teardownBackend', { backend: 'test' });
  });

  before(() => {
    Cypress.config('defaultCommandTimeout', 4000);
    cy.task('setupBackend', { backend: 'test' });
  });

  beforeEach(() => {
    cy.task('updateConfig', { collections: [{ publish: true }] });
  });

  it('successfully loads', () => {
    login();
  });

  it('can create an entry', () => {
    login();
    createPost(entry1);

    // new entry should show 'Delete unpublished entry'
    cy.contains('button', 'Delete unpublished entry');
    cy.url().should(
      'eq',
      `http://localhost:8080/#/collections/posts/entries/1970-01-01-${entry1.title
        .toLowerCase()
        .replace(/\s/, '-')}`,
    );
    exitEditor();
  });

  it('can publish an editorial workflow entry', () => {
    login();
    createPostAndExit(entry1);
    goToWorkflow();
    updateWorkflowStatus(entry1, workflowStatus.draft, workflowStatus.ready);
    publishWorkflowEntry(entry1);
  });

  it('can update an entry', () => {
    login();
    createPostAndExit(entry1);
    goToWorkflow();
    updateWorkflowStatus(entry1, workflowStatus.draft, workflowStatus.ready);
    publishWorkflowEntry(entry1);

    goToEntry(entry1);
    populateEntry(entry2);
    // existing entry should show 'Delete unpublished changes'
    cy.contains('button', 'Delete unpublished changes');
    // existing entry slug should remain the same after save'
    cy.url().should(
      'eq',
      `http://localhost:8080/#/collections/posts/entries/1970-01-01-${entry1.title
        .toLowerCase()
        .replace(/\s/, '-')}`,
    );
    exitEditor();
  });

  it('can change workflow status', () => {
    login();
    createPostAndExit(entry1);
    goToWorkflow();
    updateWorkflowStatus(entry1, workflowStatus.draft, workflowStatus.review);
    updateWorkflowStatus(entry1, workflowStatus.review, workflowStatus.ready);
    updateWorkflowStatus(entry1, workflowStatus.ready, workflowStatus.review);
    updateWorkflowStatus(entry1, workflowStatus.review, workflowStatus.draft);
    updateWorkflowStatus(entry1, workflowStatus.draft, workflowStatus.ready);
  });

  it('can change status on and publish multiple entries', () => {
    login();
    createPostAndExit(entry1);
    createPostAndExit(entry2);
    createPostAndExit(entry3);
    goToWorkflow();
    updateWorkflowStatus(entry3, workflowStatus.draft, workflowStatus.ready);
    updateWorkflowStatus(entry2, workflowStatus.draft, workflowStatus.ready);
    updateWorkflowStatus(entry1, workflowStatus.draft, workflowStatus.ready);
    publishWorkflowEntry(entry3);
    publishWorkflowEntry(entry2);
    publishWorkflowEntry(entry1);
    goToCollections();
    assertPublishedEntry([entry3, entry2, entry1]);
  });

  it('can delete an entry', () => {
    login();
    createPost(entry1);
    deleteEntryInEditor();
    assertOnCollectionsPage();
    assertEntryDeleted(entry1);
  });

  it('can update workflow status from within the editor', () => {
    login();
    createPost(entry1);
    assertWorkflowStatusInEditor(editorStatus.draft);
    updateWorkflowStatusInEditor(editorStatus.review);
    assertWorkflowStatusInEditor(editorStatus.review);
    updateWorkflowStatusInEditor(editorStatus.ready);
    assertWorkflowStatusInEditor(editorStatus.ready);
    exitEditor();
    goToWorkflow();
    assertWorkflowStatus(entry1, workflowStatus.ready);
  });

  it('can unpublish an existing entry', () => {
    // first publish an entry
    login();
    createPostAndExit(entry1);
    goToWorkflow();
    updateWorkflowStatus(entry1, workflowStatus.draft, workflowStatus.ready);
    publishWorkflowEntry(entry1);
    // then unpublish it
    unpublishEntry(entry1);
  });

  it('can duplicate an existing entry', () => {
    login();
    createPost(entry1);
    updateWorkflowStatusInEditor(editorStatus.ready);
    publishEntryInEditor(publishTypes.publishNow);
    duplicateEntry(entry1);
  });

  it('cannot publish when "publish" is false', () => {
    cy.task('updateConfig', { collections: [{ publish: false }] });
    login();
    createPost(entry1);
    cy.contains('span', 'Publish').should('not.exist');
    exitEditor();
    goToWorkflow();
    updateWorkflowStatus(entry1, workflowStatus.draft, workflowStatus.ready);
    cy.contains('button', 'Publish new entry').should('not.exist');
  });

  it('can create a new entry, publish and create new', () => {
    login();
    createPost(entry1);
    updateWorkflowStatusInEditor(editorStatus.ready);

    publishAndCreateNewEntryInEditor(entry1);
  });

  it('can create a new entry, publish and duplicate', () => {
    login();
    createPost(entry1);
    updateWorkflowStatusInEditor(editorStatus.ready);
    publishAndDuplicateEntryInEditor(entry1);
  });

  const inSidebar = func => {
    cy.get('[class*=SidebarNavList]').within(func);
  };

  const inGrid = func => {
    cy.get('[class*=CardsGrid]').within(func);
  };

  it('can access nested collection items', () => {
    login();

    inSidebar(() => cy.contains('a', 'Pages').click());
    inSidebar(() => cy.contains('a', 'Directory'));
    inGrid(() => cy.contains('a', 'Root Page'));
    inGrid(() => cy.contains('a', 'Directory'));

    inSidebar(() => cy.contains('a', 'Directory').click());

    inGrid(() => cy.contains('a', 'Sub Directory'));
    inGrid(() => cy.contains('a', 'Another Sub Directory'));

    inSidebar(() => cy.contains('a', 'Sub Directory').click());
    inGrid(() => cy.contains('a', 'Nested Directory'));
    cy.url().should(
      'eq',
      'http://localhost:8080/#/collections/pages/filter/directory/sub-directory',
    );

    inSidebar(() => cy.contains('a', 'Pages').click());
    inSidebar(() => cy.contains('a', 'Pages').click());

    inGrid(() => cy.contains('a', 'Another Sub Directory').should('not.exist'));
  });

  it('can navigate to nested entry', () => {
    login();

    inSidebar(() => cy.contains('a', 'Pages').click());
    inSidebar(() => cy.contains('a', 'Directory').click());
    inGrid(() => cy.contains('a', 'Another Sub Directory').click());

    cy.url().should(
      'eq',
      'http://localhost:8080/#/collections/pages/entries/directory/another-sub-directory/index',
    );
  });

  it(`can create a new entry with custom path`, () => {
    login();

    inSidebar(() => cy.contains('a', 'Pages').click());
    inSidebar(() => cy.contains('a', 'Directory').click());
    inSidebar(() => cy.contains('a', 'Sub Directory').click());
    cy.contains('a', 'New Page').click();

    cy.get('[id^="path-field"]').should('have.value', 'directory/sub-directory');
    cy.get('[id^="path-field"]').type('/new-path');
    cy.get('[id^="title-field"]').type('New Path Title');
    cy.clock().then(clock => {
      clock.tick(150);
    });
    cy.contains('button', 'Save').click();
    assertNotification(notifications.saved);
    updateWorkflowStatusInEditor(editorStatus.ready);
    publishEntryInEditor(publishTypes.publishNow);
    exitEditor();

    inGrid(() => cy.contains('a', 'New Path Title'));
    inSidebar(() => cy.contains('a', 'Directory').click());
    inSidebar(() => cy.contains('a', 'Directory').click());
    inGrid(() => cy.contains('a', 'New Path Title').should('not.exist'));
  });

  it(`can't create an entry with an existing path`, () => {
    login();

    inSidebar(() => cy.contains('a', 'Pages').click());
    inSidebar(() => cy.contains('a', 'Directory').click());
    inSidebar(() => cy.contains('a', 'Sub Directory').click());

    cy.contains('a', 'New Page').click();
    cy.get('[id^="title-field"]').type('New Path Title');
    cy.clock().then(clock => {
      clock.tick(150);
    });
    cy.contains('button', 'Save').click();

    assertFieldValidationError({
      message: `Path 'directory/sub-directory' already exists`,
      fieldLabel: 'Path',
    });
  });

  it('can move an existing entry to a new path', () => {
    login();

    inSidebar(() => cy.contains('a', 'Pages').click());
    inGrid(() => cy.contains('a', 'Directory').click());

    cy.get('[id^="path-field"]').should('have.value', 'directory');
    cy.get('[id^="path-field"]').clear();
    cy.get('[id^="path-field"]').type('new-directory');
    cy.get('[id^="title-field"]').clear();
    cy.get('[id^="title-field"]').type('New Directory');
    cy.clock().then(clock => {
      clock.tick(150);
    });
    cy.contains('button', 'Save').click();
    assertNotification(notifications.saved);
    updateWorkflowStatusInEditor(editorStatus.ready);
    publishEntryInEditor(publishTypes.publishNow);
    exitEditor();

    inSidebar(() => cy.contains('a', 'New Directory').click());

    inGrid(() => cy.contains('a', 'Sub Directory'));
    inGrid(() => cy.contains('a', 'Another Sub Directory'));
  });
});
