const WORKFLOW_STATUSES = ['draft', 'pending_review', 'pending_publish'];
const WORKFLOW_ICONS = {
  draft: 'edit-3',
  pending_review: 'hard-drive',
  pending_publish: 'check',
};
const WORKFLOW_COLORS = {
  draft: 'blue',
  pending_review: 'yellow',
  pending_publish: 'green',
};
const WORKFLOW_STATUSES_TRANSLATED_KEY = {
  draft: 'workflow.workflowList.draftHeader',
  pending_review: 'workflow.workflowList.inReviewHeader',
  pending_publish: 'workflow.workflowList.readyHeader',
};
const WORKFLOW_DATA = {
  draft: {
    icon: WORKFLOW_ICONS['draft'],
    color: WORKFLOW_COLORS['draft'],
    label: WORKFLOW_STATUSES_TRANSLATED_KEY['draft'],
  },
  pending_review: {
    icon: WORKFLOW_ICONS['pending_review'],
    color: WORKFLOW_COLORS['pending_review'],
    label: WORKFLOW_STATUSES_TRANSLATED_KEY['pending_review'],
  },
  pending_publish: {
    icon: WORKFLOW_ICONS['pending_publish'],
    color: WORKFLOW_COLORS['pending_publish'],
    label: WORKFLOW_STATUSES_TRANSLATED_KEY['pending_publish'],
  },
};

type WorkflowStatus = keyof typeof WORKFLOW_STATUSES;
type WorkflowIcon = keyof typeof WORKFLOW_ICONS;
type WorkflowColor = keyof typeof WORKFLOW_COLORS;
type WorkflowData = typeof WORKFLOW_DATA;

export function getWorkflowStatusIconName(workflowStatus: WorkflowStatus): WorkflowIcon {
  return WORKFLOW_ICONS[workflowStatus];
}

export function getWorkflowStatusTranslatedKey(workflowStatus: WorkflowStatus): string {
  return WORKFLOW_STATUSES_TRANSLATED_KEY[workflowStatus];
}

export function getWorkflowStatusColor(workflowStatus: WorkflowStatus): WorkflowColor {
  return WORKFLOW_COLORS[workflowStatus];
}

export function getWorkflowStatusData(workflowStatus: WorkflowStatus): WorkflowData {
  return WORKFLOW_DATA[workflowStatus];
}
