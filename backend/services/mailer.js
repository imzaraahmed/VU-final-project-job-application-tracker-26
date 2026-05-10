const nodemailer = require("nodemailer");

function isSmtpConfigured() {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_FROM);
}

function createTransporter() {
  if (!isSmtpConfigured()) return null;
  const port = Number.parseInt(String(process.env.SMTP_PORT || "587"), 10);
  const secure =
    String(process.env.SMTP_SECURE || "").toLowerCase() === "true" || port === 465;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number.isFinite(port) ? port : 587,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS || "",
    },
  });
}

/**
 * @param {{ to: string; subject: string; text: string; html?: string }} opts
 * @returns {Promise<{ ok: boolean; skipped?: boolean; reason?: string }>}
 */
async function sendNotificationEmail(opts) {
  const to = String(opts.to || "").trim();
  if (!to) return { ok: false, skipped: true, reason: "no recipient" };

  const transport = createTransporter();
  if (!transport) {
    return { ok: false, skipped: true, reason: "smtp not configured" };
  }

  try {
    await transport.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html ?? opts.text.replace(/\n/g, "<br/>"),
    });
    return { ok: true };
  } catch (err) {
    console.error("sendNotificationEmail:", err.message);
    return { ok: false, skipped: false, reason: err.message };
  }
}

module.exports = { sendNotificationEmail, isSmtpConfigured };
