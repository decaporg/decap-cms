import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import { Icon, colorsRaw } from 'decap-cms-ui-default';

/**
 * The header's deploy indicator: state between the save toast and the "live"
 * one needs a place that is not an interruption. It is the nav item itself,
 * not a badge beside it, so there are not two doors to the same page.
 */

const DotIcon = styled(Icon)`
  color: ${props => props.color};
  flex-shrink: 0;
`;

/** The `circle` icon rather than a styled span, so it lines up with the other nav icons. */
export function StatusDot({ color }) {
  return <DotIcon type="circle" color={color} />;
}

StatusDot.propTypes = {
  color: PropTypes.string.isRequired,
};

/** `yellow` is a pale background tint, invisible as a dot, so in-progress uses brown. */
export const DEPLOY_STATE_COLORS = {
  success: colorsRaw.green,
  failed: colorsRaw.redDark,
  building: colorsRaw.brown,
  pending: colorsRaw.brown,
  canceled: colorsRaw.gray,
  // Not a host state: a build that stopped being mentioned, so no outcome.
  stalled: colorsRaw.gray,
};

/**
 * How long an unfinished deploy may go unmentioned before we stop calling it
 * "building": a deleted branch's preview is never reported again. Generous, so
 * it never overtakes a slow but healthy build.
 */
export const STALE_AFTER_MS = 30 * 60 * 1000;

/**
 * Whether an unfinished deploy has gone quiet too long to call it "building".
 * Presentation only: going quiet is not the same claim as failing.
 */
export function isStaleDeploy(row, now = Date.now()) {
  if (!row || (row.state !== 'building' && row.state !== 'pending')) {
    return false;
  }
  const at = Date.parse(row.updated_at);
  return Number.isFinite(at) && now - at > STALE_AFTER_MS;
}

/**
 * What the nav item says and what colour its dot is. Publishing beats
 * everything: an editor with a save in flight is asking about that save.
 */
export function deployIndicator(pendingCount, latest, now = Date.now()) {
  if (pendingCount > 0) {
    return { key: 'app.header.deploysPublishing', color: DEPLOY_STATE_COLORS.building };
  }
  // A stale build must not say "Building" forever: waiting will not help.
  if (!latest || isStaleDeploy(latest, now)) {
    return { key: 'app.header.deploys', color: colorsRaw.gray };
  }
  if (latest.state === 'failed') {
    return { key: 'app.header.deploysFailed', color: DEPLOY_STATE_COLORS.failed };
  }
  if (latest.state === 'building' || latest.state === 'pending') {
    return { key: 'app.header.deploysBuilding', color: DEPLOY_STATE_COLORS.building };
  }
  // `canceled` counts as deployed: the site still serves the last success, and
  // a superseded build's change ships inside the newer one.
  return { key: 'app.header.deploysDeployed', color: DEPLOY_STATE_COLORS.success };
}
