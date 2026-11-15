// Fire-and-forget events to Amplitude's HTTP API. Only runs if AMPLITUDE_API_KEY is set.
export async function track(event: string, props: Record<string, unknown> = {}, deviceId = "delarp-server") {
  const key = process.env.AMPLITUDE_API_KEY;
  if (!key) return;
  try {
    await fetch("https://api2.amplitude.com/2/httpapi", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        api_key: key,
        events: [{ event_type: event, device_id: deviceId, event_properties: props, time: Date.now() }],
      }),
    });
  } catch {
    // the metrics are stupid anyway
  }
}
