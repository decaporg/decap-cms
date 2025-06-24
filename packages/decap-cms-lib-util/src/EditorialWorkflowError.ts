export const EDITORIAL_WORKFLOW_ERROR = 'EDITORIAL_WORKFLOW_ERROR';

export default class EditorialWorkflowError extends Error {
  message: string;
  notUnderEditorialWorkflow: boolean;
  constructor(message: string, notUnderEditorialWorkflow: boolean) {
    super(message);
    this.message = message;
    this.notUnderEditorialWorkflow = notUnderEditorialWorkflow;
    this.name = EDITORIAL_WORKFLOW_ERROR;
  }
}
