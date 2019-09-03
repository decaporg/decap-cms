import '../../utils/dismiss-local-backup';
import {
  login,
  createPostAndExit,
  updateExistingPostAndExit,
  goToWorkflow,
  deleteWorkflowEntry,
  updateWorkflowStatus,
  publishWorkflowEntry,
} from '../../utils/steps';
import { workflowStatus } from '../../utils/constants';
import { entry1, entry2 } from './entries';

export default function({ use_graphql }) {
  let taskResult = { data: {} };

  const backend = 'github';

  before(() => {
    Cypress.config('taskTimeout', 1200000);
    Cypress.config('defaultCommandTimeout', 60000);
    cy.task('setupBackend', { backend }).then(data => {
      taskResult.data = data;
    });
    cy.task('updateBackendOptions', { backend, options: { use_graphql, open_authoring: true } });
  });

  after(() => {
    cy.task('teardownBackend', { backend, ...taskResult.data });
    cy.task('restoreDefaults');
  });

  afterEach(() => {
    cy.task('teardownBackendTest', { backend, ...taskResult.data });
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

  it('successfully forks repository and loads', () => {
    login(taskResult.data.forkUser);
  });

  it('can create an entry on fork', () => {
    login(taskResult.data.forkUser);
    createPostAndExit(entry1);
  });

  it('can update a draft entry on fork', () => {
    login(taskResult.data.user);
    createPostAndExit(entry1);
    updateExistingPostAndExit(entry1, entry2);
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

  it('can return entry to draft and delete it', () => {
    login(taskResult.data.forkUser);
    createPostAndExit(entry1);
    goToWorkflow();
    updateWorkflowStatus(entry1, workflowStatus.draft, workflowStatus.review);

    updateWorkflowStatus(entry1, workflowStatus.review, workflowStatus.draft);
    deleteWorkflowEntry(entry1);
  });
}
