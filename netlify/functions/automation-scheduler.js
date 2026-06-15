/**
 * HostPilot Automation Scheduler
 * Runs every hour via Netlify Scheduled Functions.
 *
 * Delivery priority:
 *  1. Airbnb/VRBO/Booking.com bookings → Hospitable API (native platform delivery)
 *  2. Direct bookings with email        → SMTP or SendGrid email
 *  3. OTA bookings with no Hospitable   → pending banner in HostPilot (copy-paste fallback)
 *
 * Environment variables (set in Netlify dashboard):
 *   SUPABASE_URL   your Supabase project URL
 *   SUPABASE_KEY   your Supabase service_role key
 */

import nodemailer from "nodemailer";

// ─── Supabase helpers ─────────────────────────────────────────────────────────
const SB_URL = process.env.SUPABASE_URL;
const SB_KEY  = process.env.SUPABASE_KEY;

async function sbGet(key) {
  if (!SB_URL || !SB_KEY) throw new Error("Supabase env vars not set");
  const res = await fetch(
    `${SB_URL}/rest/v1/hostpilot_data?key=eq.${encodeURIComponent(key)}&select=value`,
    { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }
  );
  const rows = await res.json();
  if (!rows?.length) return null;
  try { return JSON.parse(rows[0].value); } catch { return rows[0].value; }
}

async function sbSet(key, value) {
  await fetch(`${SB_URL}/rest/v1/hostpilot_data`, {
    method: "POST",
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify({ key, value: JSON.stringify(value), updated_at: new Date().toISOString() }),
  });
}

// ─── Hospitable API helpers ───────────────────────────────────────────────────
// Auth: Bearer token (Personal Access Token from Hospitable → Settings → API)
// Base URL: https://api.hospitable.com

async function hospRequest(method, path, body, token) {
  if (!token) throw new Error("Hospitable API token not configured in Settings");
  const res = await fetch(`https://api.hospitable.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Hospitable ${method} ${path} → ${res.status}: ${text}`);
  try { return JSON.parse(text); } catch { return text; }
}

// Find the Hospitable reservation matching our HostPilot booking
// Matches by check-in date, then narrows by guest first name
async function findHospitableReservation(booking, token) {
  // GET /v1/reservations?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&include=guest
  const data = await hospRequest(
    "GET",
    `/v1/reservations?start_date=${booking.ci}&end_date=${booking.ci}&include=guest`,
    null, token
  );

  const reservations = data?.data || data?.reservations || data || [];
  if (!reservations.length) return null;

  // Match by guest first name
  const firstName = booking.guest?.split(" ")[0]?.toLowerCase();
  const match = reservations.find(r => {
    const gFirst = (r.guest?.first_name || r.guest_name || "").toLowerCase();
    return gFirst.includes(firstName) || firstName.includes(gFirst);
  });

  return match || (reservations.length === 1 ? reservations[0] : null);
}

// Send message through Hospitable → delivers natively to Airbnb/VRBO
async function sendViaHospitable(booking, message, token) {
  const reservation = await findHospitableReservation(booking, token);
  if (!reservation) {
    throw new Error(`No Hospitable reservation found for ${booking.guest} checking in ${booking.ci}`);
  }

  const reservationId = reservation.id || reservation.uuid;
  // POST /v1/reservations/{id}/messages
  await hospRequest(
    "POST",
    `/v1/reservations/${reservationId}/messages`,
    { message },
    token
  );

  return reservationId;
}

// ─── Template variable filler ─────────────────────────────────────────────────
function fillTemplate(text, booking, prop, lockCode) {
  const firstName = (booking.guest || "Guest").split(" ")[0];
  return text
    .replace(/\{name\}/g, firstName)
    .replace(/\{guest\}/g, firstName)
    .replace(/\{property\}/g, prop?.name || "the property")
    .replace(/\{checkin\}/g, fmtDate(booking.ci))
    .replace(/\{checkout\}/g, fmtDate(booking.co))
    .replace(/\{checkintime\}/g, prop?.checkIn || "4:00 PM")
    .replace(/\{checkouttime\}/g, prop?.checkOut || "11:00 AM")
    .replace(/\{code\}/g, lockCode || "****")
    .replace(/\{wifi\}/g, prop?.wifi || "see welcome guide")
    .replace(/\{wifipassword\}/g, prop?.wifiPw || "see welcome guide")
    .replace(/\{address\}/g, prop?.addr || "");
}

function fmtDate(d) {
  if (!d) return "";
  const dt = new Date(d + "T12:00:00");
  return dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

// ─── Timing check ─────────────────────────────────────────────────────────────
function shouldFire(auto, booking, now) {
  const ci = new Date(booking.ci + "T15:00:00");
  const co = new Date(booking.co + "T11:00:00");
  const offsetMs = (auto.offset || 0) * (auto.unit === "days" ? 86400000 : 3600000);

  let targetTime;
  switch (auto.triggerType || "before_checkin") {
    case "before_checkin":  targetTime = new Date(ci.getTime() - offsetMs); break;
    case "on_checkin":      targetTime = ci; break;
    case "during_stay":     targetTime = new Date(ci.getTime() + ((auto.offset || 2) - 1) * 86400000); break;
    case "before_checkout": targetTime = new Date(co.getTime() - offsetMs); break;
    case "after_checkout":  targetTime = new Date(co.getTime() + offsetMs); break;
    default: return false;
  }

  const diff = now.getTime() - targetTime.getTime();
  return diff >= 0 && diff < 3600000;
}

function alreadyFired(log, autoId, bookingId) {
  return (log || []).some(e => e.autoId === autoId && e.bookingId === bookingId);
}

// ─── Email senders ────────────────────────────────────────────────────────────
async function sendSmtp(settings, to, subject, body) {
  const transport = nodemailer.createTransport({
    host: settings.smtpHost,
    port: parseInt(settings.smtpPort || "587"),
    secure: settings.smtpPort === "465",
    auth: { user: settings.smtpUser, pass: settings.smtpPass },
  });
  await transport.sendMail({
    from: `"${settings.emailFromName || "HostPilot"}" <${settings.smtpFrom}>`,
    to, subject,
    text: body,
    html: body.replace(/\n/g, "<br>"),
  });
}

async function sendSendGrid(settings, to, subject, body) {
  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${settings.sendgridKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: settings.smtpFrom, name: settings.emailFromName || "HostPilot" },
      subject,
      content: [
        { type: "text/plain", value: body },
        { type: "text/html", value: body.replace(/\n/g, "<br>") },
      ],
    }),
  });
  if (!res.ok) throw new Error(`SendGrid ${res.status}: ${await res.text()}`);
}

// ─── Main handler ─────────────────────────────────────────────────────────────
export default async function handler() {
  console.log("🕐 HostPilot automation scheduler running at", new Date().toISOString());

  if (!SB_URL || !SB_KEY) {
    console.error("❌ SUPABASE_URL or SUPABASE_KEY not set");
    return;
  }

  const [bookings, autos, settings, props, locks, existingLog, existingPending] =
    await Promise.all([
      sbGet("bookings_v1"),
      sbGet("autos_v1"),
      sbGet("settings_full_v1"),
      sbGet("properties_v2"),
      sbGet("locks_v1"),
      sbGet("automation_log_v1"),
      sbGet("automation_pending_v1"),
    ]);

  if (!bookings?.length) { console.log("No bookings found"); return; }
  if (!autos?.length)    { console.log("No automations found"); return; }

  const now = new Date();
  const log = existingLog || [];
  const pending = existingPending || [];
  const newLogEntries = [];
  const newPending = [...pending];

  const hospToken = settings?.hospitableToken;
  const hasHospitable = !!hospToken;

  const todayStr = now.toISOString().slice(0, 10);
  const activeBookings = bookings.filter(b =>
    b.status === "confirmed" && b.co >= todayStr && b.source !== "ical"
  );
  const guestAutos = (autos || []).filter(a =>
    a.active &&
    !["inventory_low", "weekly"].includes(a.triggerType) &&
    a.template?.trim()
  );

  for (const auto of guestAutos) {
    for (const booking of activeBookings) {
      if (auto.property && auto.property !== "all" && auto.property !== booking.prop) continue;
      if (alreadyFired(log, auto.id, booking.id)) continue;
      if (!shouldFire(auto, booking, now)) continue;

      const prop  = (props || []).find(p => p.id === booking.prop);
      const lock  = (locks || []).find(l => l.prop === booking.prop);
      const message = fillTemplate(auto.template, booking, prop, lock?.code);
      const isDirect = booking.platform === "Direct";
      const isOTA = ["Airbnb", "VRBO", "Booking.com"].includes(booking.platform);
      const guestName = booking.guest || "Guest";

      const logEntry = {
        id: `LOG_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        autoId: auto.id,
        autoName: auto.name,
        bookingId: booking.id,
        guest: guestName,
        prop: booking.prop,
        propName: prop?.name || booking.prop,
        platform: booking.platform,
        message,
        firedAt: now.toISOString(),
        status: "pending",
      };

      if (isOTA && hasHospitable) {
        // ── Route 1: OTA + Hospitable configured → send natively ──────────────
        try {
          const hospResId = await sendViaHospitable(booking, message, hospToken);
          logEntry.status = "sent_via_hospitable";
          logEntry.hospResId = hospResId;
          console.log(`✓ Sent via Hospitable → ${booking.platform} to ${guestName} for "${auto.name}"`);
        } catch (err) {
          logEntry.status = "failed";
          logEntry.error = err.message;
          console.error(`✗ Hospitable send failed for ${guestName}:`, err.message);
          // Fallback to copy-paste notification
          newPending.push({
            id: logEntry.id, autoName: auto.name, guest: guestName,
            prop: booking.prop, propName: prop?.name || booking.prop,
            platform: booking.platform, message, bookingId: booking.id,
            queuedAt: now.toISOString(), dismissed: false,
            error: `Hospitable failed: ${err.message} — please send manually`,
          });
        }

      } else if (isDirect && booking.email) {
        // ── Route 2: Direct booking → send email ──────────────────────────────
        try {
          const subject = `${auto.name} — ${prop?.name || "your stay"}`;
          if (settings?.emailProvider === "sendgrid" && settings?.sendgridKey) {
            await sendSendGrid(settings, booking.email, subject, message);
          } else if (settings?.smtpHost && settings?.smtpUser && settings?.smtpPass) {
            await sendSmtp(settings, booking.email, subject, message);
          } else {
            throw new Error("No email provider configured in Settings");
          }
          logEntry.status = "sent_email";
          console.log(`✓ Email sent to ${guestName} (${booking.email}) for "${auto.name}"`);
        } catch (err) {
          logEntry.status = "failed";
          logEntry.error = err.message;
          console.error(`✗ Email failed for ${guestName}:`, err.message);
        }

      } else {
        // ── Route 3: No Hospitable / no email → copy-paste banner ─────────────
        logEntry.status = "queued_for_copy";
        newPending.push({
          id: logEntry.id, autoName: auto.name, guest: guestName,
          prop: booking.prop, propName: prop?.name || booking.prop,
          platform: booking.platform, message, bookingId: booking.id,
          queuedAt: now.toISOString(), dismissed: false,
        });
        console.log(`📋 Queued copy-paste for ${guestName} on ${booking.platform} (no Hospitable token)`);
      }

      newLogEntries.push(logEntry);
    }
  }

  if (newLogEntries.length) {
    await sbSet("automation_log_v1", [...log, ...newLogEntries]);
    await sbSet("automation_pending_v1", newPending);
    console.log(`✅ Processed ${newLogEntries.length} automation(s)`);
  } else {
    console.log("✓ No automations to fire this hour");
  }
}
