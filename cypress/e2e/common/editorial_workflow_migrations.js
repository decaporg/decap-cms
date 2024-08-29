import '../../utils/dismiss-local-backup';
import {
  login,
  createPostAndExit,
  goToWorkflow,
  goToCollections,
  updateWorkflowStatus,
  publishWorkflowEntry,
  assertPublishedEntry,
} from '../../utils/steps';
import { workflowStatus } from '../../utils/constants';

const versions = ['2.9.7', '2.10.24'];

export default function({ entries, getUser }) {
  versions.forEach(version => {
    it(`migrate from ${version} to latest`, () => {
      cy.task('switchToVersion', {
        version,
      });
      cy.reload();

      login(getUser());
      createPostAndExit(entries[0]);
      createPostAndExit(entries[1]);
      createPostAndExit(entries[2]);
      goToWorkflow();
      updateWorkflowStatus(entries[2], workflowStatus.draft, workflowStatus.ready);
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(1500); // older versions of the CMS didn't wait fully for the update to be resolved
      updateWorkflowStatus(entries[1], workflowStatus.draft, workflowStatus.ready);
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(1500); // older versions of the CMS didn't wait fully for the update to be resolved
      updateWorkflowStatus(entries[0], workflowStatus.draft, workflowStatus.ready);
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(1500); // older versions of the CMS didn't wait fully for the update to be resolved

      cy.task('switchToVersion', {
        version: 'latest',
      });
      cy.reload();

      // allow migration code to run for 5 minutes
      publishWorkflowEntry(entries[2], 5 * 60 * 1000);
      publishWorkflowEntry(entries[1]);
      publishWorkflowEntry(entries[0]);
      goToCollections();
      assertPublishedEntry([entries[2], entries[1], entries[0]]);
    });
  });
}
