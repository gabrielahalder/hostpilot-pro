/**
 * HostPilot iCal Proxy
 * Fetches iCal URLs server-side to avoid CORS restrictions.
 * Airbnb and VRBO block browser and public proxy requests but allow
 * normal server-to-server requests like this one.
 *
 * Usage: GET /api/ical-proxy?url=https://www.airbnb.com/calendar/ical/...
 */

export default async function handler(req) {
  // Only allow GET requests
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Get the URL from query params
  const requestUrl = new URL(req.url);
  const icalUrl = requestUrl.searchParams.get("url");

  if (!icalUrl) {
    return new Response(JSON.stringify({ error: "Missing url parameter" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Only allow Airbnb, VRBO, and Booking.com iCal URLs for security
  const allowed = [
    "airbnb.com",
    "vrbo.com",
    "homeaway.com",
    "booking.com",
    "admin.booking.com",
  ];
  const isAllowed = allowed.some(domain => icalUrl.includes(domain));
  if (!isAllowed) {
    return new Response(JSON.stringify({ error: "URL not from an allowed domain" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const response = await fetch(icalUrl, {
      headers: {
        // Mimic a normal calendar app request
        "User-Agent": "Mozilla/5.0 (compatible; CalendarSync/1.0)",
        "Accept": "text/calendar, application/calendar+json, */*",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `Upstream returned ${response.status}` }),
        { status: response.status, headers: { "Content-Type": "application/json" } }
      );
    }

    const icsText = await response.text();

    if (!icsText.includes("BEGIN:VCALENDAR")) {
      return new Response(
        JSON.stringify({ error: "Response is not a valid iCal feed" }),
        { status: 422, headers: { "Content-Type": "application/json" } }
      );
    }

    // Return the iCal data with CORS headers so the browser can read it
    return new Response(icsText, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-cache, no-store",
      },
    });

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export const config = {
  path: "/api/ical-proxy",
};
