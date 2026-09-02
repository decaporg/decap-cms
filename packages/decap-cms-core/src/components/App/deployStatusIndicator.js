import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import { Icon, colorsRaw } from 'decap-cms-ui-default';

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

const DotIcon = styled(Icon)`
  color: ${props => props.color};
  flex-shrink: 0;
`;

/**
 * The `circle` icon rather than a styled span, so the indicator occupies the
 * exact same box as `page`, `workflow` and `media-alt` and lines up with them.
 * Its artwork is a small dot centred in a 24px viewBox — the visual weight of
 * a status dot, the footprint of an icon.
 */
export function StatusDot({ color }) {
  return <DotIcon type="circle" color={color} />;
}

StatusDot.propTypes = {
  color: PropTypes.string.isRequired,
};

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
  // A green dot beside the word "Deploys" leaves the reader to work out what
  // green means. Naming the state costs nothing and is the whole point of the
  // indicator, so it says the state whenever it knows one.
  //
  // `canceled` counts as deployed: the site is still serving the last
  // successful deploy, and a superseded build has lost nothing — its change
  // ships inside the newer one.
  return { key: 'app.header.deploysDeployed', color: DEPLOY_STATE_COLORS.success };
}
