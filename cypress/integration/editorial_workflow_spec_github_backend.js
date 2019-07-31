import '../utils/dismiss-local-backup';
import {
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
} from '../utils/steps';
import { workflowStatus, editorStatus } from '../utils/constants';

const entry1 = {
  title: 'first title',
  body: 'first body',
  description: 'first description',
  category: 'first category',
  tags: 'tag1',
};
const entry2 = {
  title: 'second title',
  body: 'second body',
  description: 'second description',
  category: 'second category',
  tags: 'tag2',
};
const entry3 = {
  title: 'third title',
  body: 'third body',
  description: 'third description',
  category: 'third category',
  tags: 'tag3',
};

describe('Github Backend Editorial Workflow', () => {
  let taskResult = { data: {} };

  const backend = 'github';

  before(() => {
    Cypress.config('taskTimeout', 1200000);
    Cypress.config('defaultCommandTimeout', 60000);
    cy.task('setupBackend', { backend }).then(data => {
      taskResult.data = data;
    });
  });

  after(() => {
    cy.task('teardownBackend', { backend, ...taskResult.data });
    cy.task('restoreDefaults');
  });

  [{ use_graphql: false }, { use_graphql: true }].forEach(options => {
    describe(JSON.stringify(options), () => {
      before(() => {
        cy.task('updateBackendOptions', { backend, options });
      });

      afterEach(() => {
        cy.task('teardownBackendTest', { backend, ...taskResult.data });
      });

      describe(JSON.stringify({ fork_workflow: false }), () => {
        before(() => {
          cy.task('updateBackendOptions', { backend, options: { fork_workflow: false } });
        });

        it('successfully loads', () => {
          login(taskResult.data.user);
        });

        it('can create an entry', () => {
          login(taskResult.data.user);
          createPostAndExit(entry1);
        });

        it('can update an entry', () => {
          login(taskResult.data.user);
          createPostAndExit(entry1);
          updateExistingPostAndExit(entry1, entry2);
        });

        it('can publish an editorial workflow entry', () => {
          login(taskResult.data.user);
          createPostAndExit(entry1);
          goToWorkflow();
          updateWorkflowStatus(entry1, workflowStatus.draft, workflowStatus.ready);
          publishWorkflowEntry(entry1);
        });

        it('can change workflow status', () => {
          login(taskResult.data.user);
          createPostAndExit(entry1);
          goToWorkflow();
          updateWorkflowStatus(entry1, workflowStatus.draft, workflowStatus.review);
          updateWorkflowStatus(entry1, workflowStatus.review, workflowStatus.ready);
          updateWorkflowStatus(entry1, workflowStatus.ready, workflowStatus.review);
          updateWorkflowStatus(entry1, workflowStatus.review, workflowStatus.draft);
          updateWorkflowStatus(entry1, workflowStatus.draft, workflowStatus.ready);
        });

        it('can change status on and publish multiple entries', () => {
          login(taskResult.data.user);
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
          login(taskResult.data.user);
          createPost(entry1);
          deleteEntryInEditor();
          assertOnCollectionsPage();
          assertEntryDeleted(entry1);
        });

        it('can update workflow status from within the editor', () => {
          login(taskResult.data.user);
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
      });

      describe(JSON.stringify({ fork_workflow: true }), () => {
        before(() => {
          cy.task('updateBackendOptions', { backend, options: { fork_workflow: true } });
        });

        it('successfully forks repository and loads', () => {
          login(taskResult.data.forkUser);
        });

        it('can create an entry on fork', () => {
          login(taskResult.data.forkUser);
          createPostAndExit(entry1);
        });

        it('can change entry status from fork', () => {
          login(taskResult.data.forkUser);
          createPostAndExit(entry1);
          goToWorkflow();
          updateWorkflowStatus(entry1, workflowStatus.draft, workflowStatus.review);
        });

        it('can delete review entry from fork', () => {
          login(taskResult.data.forkUser);
          createPostAndExit(entry1);
          goToWorkflow();
          updateWorkflowStatus(entry1, workflowStatus.draft, workflowStatus.review);
          deleteWorkflowEntry(entry1);
        });

        it('can return entry to drat and delete it', () => {
          login(taskResult.data.forkUser);
          createPostAndExit(entry1);
          goToWorkflow();
          updateWorkflowStatus(entry1, workflowStatus.draft, workflowStatus.review);

          updateWorkflowStatus(entry1, workflowStatus.review, workflowStatus.draft);
          deleteWorkflowEntry(entry1);
        });
      });
    });
  });
});
