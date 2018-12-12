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

export const statusLabels = Map({
  [status.get('DRAFT')]: Map({ name: 'draft', color: 'fad8c7' }),
  [status.get('PENDING_REVIEW')]: Map({ name: 'pending: review', color: 'fef2c0' }),
  [status.get('PENDING_PUBLISH')]: Map({ name: 'pending: publish', color: 'c2e0c6' }),
});
