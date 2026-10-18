/**
 * Fire-and-forget CMS usage telemetry to the `telemetry` edge function, which
 * enforces auth and the opt-out server-side. Never awaited, never throws.
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
