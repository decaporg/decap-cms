import { Map, OrderedMap } from 'immutable';

// Create/edit workflow modes
export const SIMPLE = 'simple';
export const EDITORIAL_WORKFLOW = 'editorial_workflow';

// Available status
export const status = OrderedMap({
  DRAFT: 'draft',
  PENDING_REVIEW: 'pending_review',
  PENDING_PUBLISH: 'pending_publish',
});

export const statusDescriptions = Map({
  [status.get('DRAFT')]: 'Draft',
  [status.get('PENDING_REVIEW')]: 'Waiting for Review',
  [status.get('PENDING_PUBLISH')]: 'Waiting to go live',
});
