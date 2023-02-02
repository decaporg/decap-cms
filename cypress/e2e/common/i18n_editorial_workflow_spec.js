import '../../utils/dismiss-local-backup';
import {
  login,
  goToWorkflow,
  updateWorkflowStatus,
  exitEditor,
  publishWorkflowEntry,
  goToEntry,
  updateWorkflowStatusInEditor,
  publishEntryInEditor,
  assertPublishedEntryInEditor,
  assertUnpublishedEntryInEditor,
  assertUnpublishedChangesInEditor,
} from '../../utils/steps';
import { createEntryTranslateAndSave, assertTranslation, updateTranslation } from './i18n';
import { workflowStatus, editorStatus, publishTypes } from '../../utils/constants';

export default function({ entry, getUser }) {
  const structures = ['multiple_folders', 'multiple_files', 'single_file'];
  structures.forEach(structure => {
    it(`can create and publish entry with translation in ${structure} mode`, () => {
      cy.task('updateConfig', { i18n: { structure } });

      login(getUser());

      createEntryTranslateAndSave(entry);
      assertUnpublishedEntryInEditor();
      exitEditor();
      goToWorkflow();
      updateWorkflowStatus(entry, workflowStatus.draft, workflowStatus.ready);
      publishWorkflowEntry(entry);
      goToEntry(entry);
      assertTranslation();
      assertPublishedEntryInEditor();
    });

    it(`can update translated entry in ${structure} mode`, () => {
      cy.task('updateConfig', { i18n: { structure: 'multiple_folders' } });

      login(getUser());

      createEntryTranslateAndSave(entry);
      assertUnpublishedEntryInEditor();
      updateWorkflowStatusInEditor(editorStatus.ready);
      publishEntryInEditor(publishTypes.publishNow);
      exitEditor();
      goToEntry(entry);
      assertTranslation();
      assertPublishedEntryInEditor();
      updateTranslation();
      assertUnpublishedChangesInEditor();
    });
  });
}
