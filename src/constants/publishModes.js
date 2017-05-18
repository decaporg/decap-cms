import { Map, OrderedMap } from 'immutable';
import { __ } from '../i18n';


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
  [status.get('DRAFT')]: __('Draft'),
  [status.get('PENDING_REVIEW')]: __('Waiting for Review'),
  [status.get('PENDING_PUBLISH')]: __('Waiting to go live'),
});
