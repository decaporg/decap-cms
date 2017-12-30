import { Map, OrderedMap } from 'immutable';
import i18n from '../i18n';

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
  [status.get('DRAFT')]: i18n.t('draft'),
  [status.get('PENDING_REVIEW')]: i18n.t('review_waiting'),
  [status.get('PENDING_PUBLISH')]: i18n.t('go_live_waiting'),
});
