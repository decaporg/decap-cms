import { Map } from 'immutable';

// Create/edit workflow modes
export const SIMPLE = 'simple';
export const EDITORIAL_WORKFLOW = 'editorial_workflow';

// Available status
export const status = {
  DRAFT: 'draft',
  PENDING_REVIEW: 'pending_review',
  PENDING_PUBLISH: 'pending_publish',
};

export const statusDescriptions = Map({
  [status.DRAFT]: 'Draft',
  [status.PENDING_REVIEW]: 'Waiting for Review',
  [status.PENDING_PUBLISH]: 'Waiting to go live',
});
