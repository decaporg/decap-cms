import '../../utils/dismiss-local-backup';
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
  assertWorkflowStatusInEditor,
  assertPublishedEntry,
  deleteEntryInEditor,
  assertOnCollectionsPage,
  assertEntryDeleted,
  assertWorkflowStatus,
  updateWorkflowStatusInEditor,
} from '../../utils/steps';
import { workflowStatus, editorStatus } from '../../utils/constants';
import { entry1, entry2, entry3 } from './entries';
import * as specUtils from './spec_utils';

export default function({ use_graphql }) {
  let taskResult = { data: {} };

  before(() => {
    specUtils.before(taskResult, { use_graphql, open_authoring: false });
  });

  after(() => {
    specUtils.after(taskResult);
  });

  beforeEach(() => {
    specUtils.beforeEach(taskResult);
  });

  afterEach(() => {
    specUtils.afterEach(taskResult);
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
}
