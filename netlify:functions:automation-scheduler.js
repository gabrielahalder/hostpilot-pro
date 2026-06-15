/**
 * HostPilot Automation Scheduler
 * Runs every hour via Netlify Scheduled Functions.
 *
 * What it does:
 *  1. Reads bookings, automations, settings, and properties from Supabase
 *  2. Checks each active automation against each upcoming booking
 *  3. For Direct bookings  → sends email immediately via SMTP or SendGrid
 *  4. For Airbnb/VRBO     → writes a pending notification to Supabase
 *     so HostPilot shows a banner: "Copy this message and paste into Airbnb"
 *  5. Logs every action to automation_log in Supabase
 *
 * Environment variables needed (set in Netlify dashboard → Site → Environment):
 *   SUPABASE_URL      your Supabase project URL
 *   SUPABASE_KEY      your Supabase service_role key (not anon key — needs write access)
 */

const nodemailer = require("nodemailer");

// ─── Supabase helpers ─────────────────────────────────────────────────────────
const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_KEY;

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

// ─── Should this automation fire for this booking right now? ──────────────────
function shouldFire(auto, booking, now) {
  const ci = new Date(booking.ci + "T15:00:00"); // check-in at 3pm
  const co = new Date(booking.co + "T11:00:00"); // checkout at 11am
  const offsetMs = (auto.offset || 0) * (auto.unit === "days" ? 86400000 : 3600000);

  let targetTime;
  switch (auto.triggerType || "before_checkin") {
    case "before_checkin":   targetTime = new Date(ci.getTime() - offsetMs); break;
    case "on_checkin":       targetTime = ci; break;
    case "during_stay":
      // offset = day number into stay (day 1 = check-in day)
      targetTime = new Date(ci.getTime() + ((auto.offset || 2) - 1) * 86400000);
      break;
    case "before_checkout":  targetTime = new Date(co.getTime() - offsetMs); break;
    case "after_checkout":   targetTime = new Date(co.getTime() + offsetMs); break;
    default: return false;
  }

  // Fire if target time is within the last hour (we run hourly)
  const diff = now.getTime() - targetTime.getTime();
  return diff >= 0 && diff < 3600000; // within the past hour
}

// ─── Check if we already fired this automation for this booking ───────────────
function alreadyFired(log, autoId, bookingId) {
  return (log || []).some(e => e.autoId === autoId && e.bookingId === bookingId);
}

// ─── Send email via SMTP ──────────────────────────────────────────────────────
async function sendSmtp(settings, to, subject, body) {
  const transport = nodemailer.createTransport({
    host: settings.smtpHost,
    port: parseInt(settings.smtpPort || "587"),
    secure: settings.smtpPort === "465",
    auth: { user: settings.smtpUser, pass: settings.smtpPass },
  });
  await transport.sendMail({
    from: `"${settings.emailFromName || "HostPilot"}" <${settings.smtpFrom}>`,
    to,
    subject,
    text: body,
    html: body.replace(/\n/g, "<br>"),
  });
}

// ─── Send email via SendGrid ──────────────────────────────────────────────────
async function sendSendGrid(settings, to, subject, body) {
  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${settings.sendgridKey}`,
      "Content-Type": "application/json",
    },
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
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`SendGrid error ${res.status}: ${err}`);
  }
}

// ─── Main handler ─────────────────────────────────────────────────────────────
export default async function handler() {
  console.log("🕐 HostPilot automation scheduler running at", new Date().toISOString());

  if (!SB_URL || !SB_KEY) {
    console.error("❌ SUPABASE_URL or SUPABASE_KEY not set in Netlify environment");
    return;
  }

  // Load everything from Supabase
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

  // Only look at confirmed upcoming + active bookings
  const todayStr = now.toISOString().slice(0, 10);
  const activeBookings = bookings.filter(b =>
    b.status === "confirmed" && b.co >= todayStr && b.source !== "ical"
  );

  // Only run guest-message automations (not inventory/weekly)
  const guestAutos = (autos || []).filter(a =>
    a.active &&
    !["inventory_low", "weekly"].includes(a.triggerType) &&
    a.template?.trim()
  );

  for (const auto of guestAutos) {
    for (const booking of activeBookings) {
      // Skip if wrong property
      if (auto.property && auto.property !== "all" && auto.property !== booking.prop) continue;
      // Skip if already fired
      if (alreadyFired(log, auto.id, booking.id)) continue;
      // Skip if not time yet
      if (!shouldFire(auto, booking, now)) continue;

      const prop = (props || []).find(p => p.id === booking.prop);
      const lock = (locks || []).find(l => l.prop === booking.prop);
      const message = fillTemplate(auto.template, booking, prop, lock?.code);
      const isDirect = booking.platform === "Direct";
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

      if (isDirect && booking.email) {
        // Send email directly
        try {
          const subject = `${auto.name} — ${prop?.name || "your stay"}`;
          if (settings?.emailProvider === "sendgrid" && settings?.sendgridKey) {
            await sendSendGrid(settings, booking.email, subject, message);
          } else if (settings?.smtpHost && settings?.smtpUser && settings?.smtpPass) {
            await sendSmtp(settings, booking.email, subject, message);
          } else {
            logEntry.status = "no_email_config";
            logEntry.error = "No email provider configured in Settings";
          }
          if (!logEntry.error) {
            logEntry.status = "sent";
            console.log(`✓ Email sent to ${guestName} (${booking.email}) for "${auto.name}"`);
          }
        } catch (err) {
          logEntry.status = "failed";
          logEntry.error = err.message;
          console.error(`✗ Email failed for ${guestName}:`, err.message);
        }
      } else {
        // OTA guest — queue for copy-paste notification in the app
        logEntry.status = "queued_for_copy";
        newPending.push({
          id: logEntry.id,
          autoName: auto.name,
          guest: guestName,
          prop: booking.prop,
          propName: prop?.name || booking.prop,
          platform: booking.platform,
          message,
          bookingId: booking.id,
          queuedAt: now.toISOString(),
          dismissed: false,
        });
        console.log(`📋 Queued copy-paste notification for ${guestName} on ${booking.platform}`);
      }

      newLogEntries.push(logEntry);
    }
  }

  // Save updated log and pending queue back to Supabase
  if (newLogEntries.length) {
    await sbSet("automation_log_v1", [...log, ...newLogEntries]);
    await sbSet("automation_pending_v1", newPending);
    console.log(`✅ Processed ${newLogEntries.length} automation(s)`);
  } else {
    console.log("✓ No automations to fire this hour");
  }
}
