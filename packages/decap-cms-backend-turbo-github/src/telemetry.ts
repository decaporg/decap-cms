/**
 * Fire-and-forget CMS-editor-side usage telemetry (see docs/beta-telemetry.md
 * in decap-turbo). Posts to the `telemetry` Supabase Edge Function, which
 * enforces auth and the opt-out flag server-side — this call is deliberately
 * not awaited by its callers and never throws, so a failure here can never
 * disrupt the editing experience.
 */
export function recordCmsEvent(
  baseUrl: string,
  anonKey: string,
  accessToken: string | null | undefined,
  eventName: string,
  siteId: string,
  props: Record<string, unknown> = {},
): void {
  if (!accessToken) return;

  fetch(`${baseUrl}/functions/v1/telemetry`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: anonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ event_name: eventName, site_id: siteId, props }),
  }).catch(() => {
    // Swallowed on purpose — telemetry must never disrupt the editor.
  });
}
