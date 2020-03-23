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
  validateObjectFieldsAndExit,
  validateNestedObjectFieldsAndExit,
  validateListFieldsAndExit,
  unpublishEntry,
  publishEntryInEditor,
  duplicateEntry,
} from '../utils/steps';
import { setting1, setting2, workflowStatus, editorStatus, publishTypes } from '../utils/constants';
import { fromJS } from 'immutable';

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

  it('successfully loads', () => {
    login();
  });

  it('can create an entry', () => {
    login();
    createPostAndExit(entry1);
  });

  it('can validate object fields', () => {
    login();
    validateObjectFieldsAndExit(setting1);
  });

  it('can validate fields nested in an object field', () => {
    login();
    validateNestedObjectFieldsAndExit(setting1);
  });

  it('can validate list fields', () => {
    login();
    validateListFieldsAndExit(setting2);
  });

  it('can publish an editorial workflow entry', () => {
    login();
    createPostAndExit(entry1);
    goToWorkflow();
    updateWorkflowStatus(entry1, workflowStatus.draft, workflowStatus.ready);
    publishWorkflowEntry(entry1);
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
    cy.visit('/', {
      onBeforeLoad: window => {
        window.CMS_MANUAL_INIT = true;
      },
      onLoad: window => {
        window.CMS.init({
          config: fromJS({
            backend: {
              name: 'test-repo',
            },
            publish_mode: 'editorial_workflow',
            load_config_file: false,
            media_folder: 'assets/uploads',
            collections: [
              {
                label: 'Posts',
                name: 'post',
                folder: '_posts',
                label_singular: 'Post',
                create: true,
                publish: false,
                fields: [
                  { label: 'Title', name: 'title', widget: 'string', tagname: 'h1' },
                  {
                    label: 'Publish Date',
                    name: 'date',
                    widget: 'datetime',
                    dateFormat: 'YYYY-MM-DD',
                    timeFormat: 'HH:mm',
                    format: 'YYYY-MM-DD HH:mm',
                  },
                  {
                    label: 'Cover Image',
                    name: 'image',
                    widget: 'image',
                    required: false,
                    tagname: '',
                  },
                  {
                    label: 'Body',
                    name: 'body',
                    widget: 'markdown',
                    hint: 'Main content goes here.',
                  },
                ],
              },
            ],
          }),
        });
      },
    });
    cy.contains('button', 'Login').click();
    createPost(entry1);
    cy.contains('span', 'Publish').should('not.exist');
    exitEditor();
    goToWorkflow();
    updateWorkflowStatus(entry1, workflowStatus.draft, workflowStatus.ready);
    cy.contains('button', 'Publish new entry').should('not.exist');
  });
});
