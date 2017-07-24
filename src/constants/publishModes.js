import { Map, OrderedMap } from 'immutable';
import polyglot from '../i18n';

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
  [status.get('DRAFT')]: polyglot.t('draft'),
  [status.get('PENDING_REVIEW')]: polyglot.t('review_waiting'),
  [status.get('PENDING_PUBLISH')]: polyglot.t('go_live_waiting'),
});
