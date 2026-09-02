import styled from '@emotion/styled';
import { colorsRaw } from 'decap-cms-ui-default';

/**
 * The header's deploy indicator. See decap-turbo/docs/deploy-status-plan.md §A8.
 *
 * Toasts announce events and then leave; between "Saved · Publishing…"
 * dismissing and "your change is live" arriving, nothing on screen said what
 * was happening, and a build can run for many minutes. State needs a place
 * that is not an interruption.
 *
 * It is the nav item rather than a badge beside it, on purpose: two doors to
 * the same page is clutter, and folding the state into the door means the one
 * always-visible element also carries the live answer.
 */

export const StatusDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  background-color: ${props => props.color};
`;

/**
 * `yellow` in this palette is a pale background tint — invisible as an 8px
 * dot — so the in-progress states borrow the text colour that pairs with it.
 */
export const DEPLOY_STATE_COLORS = {
  success: colorsRaw.green,
  failed: colorsRaw.redDark,
  building: colorsRaw.brown,
  pending: colorsRaw.brown,
  canceled: colorsRaw.gray,
};

/**
 * What the nav item says and what colour its dot is.
 *
 * Publishing beats everything: an editor with a save in flight is asking about
 * that save, not about a build that finished before it.
 */
export function deployIndicator(pendingCount, latest) {
  if (pendingCount > 0) {
    return { key: 'app.header.deploysPublishing', color: DEPLOY_STATE_COLORS.building };
  }
  if (!latest) {
    return { key: 'app.header.deploys', color: colorsRaw.gray };
  }
  if (latest.state === 'failed') {
    return { key: 'app.header.deploysFailed', color: DEPLOY_STATE_COLORS.failed };
  }
  if (latest.state === 'building' || latest.state === 'pending') {
    return { key: 'app.header.deploysBuilding', color: DEPLOY_STATE_COLORS.building };
  }
  if (latest.state === 'success') {
    return { key: 'app.header.deploys', color: DEPLOY_STATE_COLORS.success };
  }
  // `canceled` alone says nothing an editor can act on — the change is still
  // going to ship inside a newer deploy.
  return { key: 'app.header.deploys', color: colorsRaw.gray };
}
