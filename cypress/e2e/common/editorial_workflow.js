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

export default function({ entries, getUser }) {
  it('successfully loads', () => {
    login(getUser());
  });

  it('can create an entry', () => {
    login(getUser());
    createPostAndExit(entries[0]);
  });

  it('can update an entry', () => {
    login(getUser());
    createPostAndExit(entries[0]);
    updateExistingPostAndExit(entries[0], entries[1]);
  });

  it('can publish an editorial workflow entry', () => {
    login(getUser());
    createPostAndExit(entries[0]);
    goToWorkflow();
    updateWorkflowStatus(entries[0], workflowStatus.draft, workflowStatus.ready);
    publishWorkflowEntry(entries[0]);
  });

  it('can change workflow status', () => {
    login(getUser());
    createPostAndExit(entries[0]);
    goToWorkflow();
    updateWorkflowStatus(entries[0], workflowStatus.draft, workflowStatus.review);
    updateWorkflowStatus(entries[0], workflowStatus.review, workflowStatus.ready);
    updateWorkflowStatus(entries[0], workflowStatus.ready, workflowStatus.review);
    updateWorkflowStatus(entries[0], workflowStatus.review, workflowStatus.draft);
    updateWorkflowStatus(entries[0], workflowStatus.draft, workflowStatus.ready);
  });

  it('can change status on and publish multiple entries', () => {
    login(getUser());
    createPostAndExit(entries[0]);
    createPostAndExit(entries[1]);
    createPostAndExit(entries[2]);
    goToWorkflow();
    updateWorkflowStatus(entries[2], workflowStatus.draft, workflowStatus.ready);
    updateWorkflowStatus(entries[1], workflowStatus.draft, workflowStatus.ready);
    updateWorkflowStatus(entries[0], workflowStatus.draft, workflowStatus.ready);
    publishWorkflowEntry(entries[2]);
    publishWorkflowEntry(entries[1]);
    publishWorkflowEntry(entries[0]);
    goToCollections();
    assertPublishedEntry([entries[2], entries[1], entries[0]]);
  });

  it('can delete an entry', () => {
    login(getUser());
    createPost(entries[0]);
    deleteEntryInEditor();
    assertOnCollectionsPage();
    assertEntryDeleted(entries[0]);
  });

  it('can update workflow status from within the editor', () => {
    login(getUser());
    createPost(entries[0]);
    assertWorkflowStatusInEditor(editorStatus.draft);
    updateWorkflowStatusInEditor(editorStatus.review);
    assertWorkflowStatusInEditor(editorStatus.review);
    updateWorkflowStatusInEditor(editorStatus.ready);
    assertWorkflowStatusInEditor(editorStatus.ready);
    exitEditor();
    goToWorkflow();
    assertWorkflowStatus(entries[0], workflowStatus.ready);
  });
}
