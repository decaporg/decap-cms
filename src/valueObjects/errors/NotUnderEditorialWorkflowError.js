import BaseError from './BaseError';

/**
 * Error thrown when posts are not a part of an editorial workflow. 
 */
export default class NotUnderEditorialWorkflowError extends BaseError {
  
  /**
   * @param {String} message error message
   * @param {bool} 
   */  
  constructor(message, notUnderEditorialWorkflow) {
    super(message);
    this.notUnderEditorialWorkflow = notUnderEditorialWorkflow;
  }
}
