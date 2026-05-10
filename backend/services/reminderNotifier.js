const db = require("../db");
const { sendNotificationEmail } = require("./mailer");

function safeSqlIdentifier(name, fallback) {
  const raw = (name ?? "").toString().trim();
  const chosen = raw.length ? raw : fallback;
  return /^[a-zA-Z0-9_]+$/.test(chosen) ? chosen : fallback;
}

const REMINDERS_SCHEMA = safeSqlIdentifier(process.env.DB_JOBS_DATABASE, "jat_v2");
const REMINDERS_TABLE = safeSqlIdentifier(process.env.DB_REMINDERS_TABLE, "reminders");
const FALLBACK_CONN_DB = safeSqlIdentifier(process.env.DB_NAME, "my_first_db");
const USERS_SCHEMA = safeSqlIdentifier(process.env.DB_USERS_DATABASE, FALLBACK_CONN_DB);
const USERS_TABLE = safeSqlIdentifier(process.env.DB_USERS_TABLE, "users");
const NOTIFICATIONS_SCHEMA = safeSqlIdentifier(process.env.DB_NOTIFICATIONS_DATABASE, REMINDERS_SCHEMA);
const NOTIFICATIONS_TABLE = safeSqlIdentifier(process.env.DB_NOTIFICATIONS_TABLE, "notifications");

const REMINDERS_QTN = `\`${REMINDERS_SCHEMA}\`.\`${REMINDERS_TABLE}\``;
const USERS_QTN = `\`${USERS_SCHEMA}\`.\`${USERS_TABLE}\``;
const NOTIFICATIONS_QTN = `\`${NOTIFICATIONS_SCHEMA}\`.\`${NOTIFICATIONS_TABLE}\``;

function toMySqlDateTime(dateObj) {
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
  const dd = String(dateObj.getDate()).padStart(2, "0");
  const hh = String(dateObj.getHours()).padStart(2, "0");
  const mi = String(dateObj.getMinutes()).padStart(2, "0");
  const ss = String(dateObj.getSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

/**
 * For each pending reminder that is due, inserts one in-app row (deduped per effective due time)
 * and sends email when SMTP is configured.
 * @param {(err: Error|null, summary?: { processed: number; inserted: number; emailsAttempted: number }) => void} callback
 */
function processDueReminders(callback) {
  const sql = `
    SELECT r.id, r.user_id, r.job_id, r.title, r.description,
      r.reminder_datetime, r.snoozed_until,
      COALESCE(r.snoozed_until, r.reminder_datetime) AS effective_due
    FROM ${REMINDERS_QTN} r
    WHERE r.status = 'pending'
      AND COALESCE(r.snoozed_until, r.reminder_datetime) <= NOW()
  `;

  db.query(sql, [], (err, rows) => {
    if (err) return callback(err);

    const list = rows || [];
    if (!list.length) return callback(null, { processed: 0, inserted: 0, emailsAttempted: 0 });

    let inserted = 0;
    let emailsAttempted = 0;
    let pending = list.length;
    let firstErr = null;

    const doneOne = (e) => {
      if (e && !firstErr) firstErr = e;
      pending -= 1;
      if (pending === 0) {
        if (firstErr) return callback(firstErr);
        return callback(null, { processed: list.length, inserted, emailsAttempted });
      }
    };

    for (const row of list) {
      const effectiveDue = row.effective_due;
      const effectiveDueSql =
        effectiveDue instanceof Date ? toMySqlDateTime(effectiveDue) : String(effectiveDue);

      const dupSql = `
        SELECT id FROM ${NOTIFICATIONS_QTN}
        WHERE reminder_id = ? AND sent_at >= ?
        LIMIT 1
      `;
      db.query(dupSql, [row.id, effectiveDueSql], (dupErr, dupRows) => {
        if (dupErr) return doneOne(dupErr);
        if (dupRows.length) return doneOne(null);

        const title = `Reminder: ${String(row.title || "").trim() || "Job reminder"}`;
        const message =
          row.description && String(row.description).trim()
            ? String(row.description).trim()
            : `Your reminder "${String(row.title || "").trim()}" is due.`;

        const ins = `
          INSERT INTO ${NOTIFICATIONS_QTN}
            (user_id, reminder_id, job_id, title, message, is_read, sent_at)
          VALUES (?, ?, ?, ?, ?, 0, NOW())
        `;
        const jobId = row.job_id === null || row.job_id === undefined ? null : Number(row.job_id);

        db.query(ins, [row.user_id, row.id, Number.isFinite(jobId) ? jobId : null, title, message], (insErr, insRes) => {
          if (insErr) return doneOne(insErr);
          inserted += 1;

          const userSql = `SELECT email, first_name, last_name FROM ${USERS_QTN} WHERE id = ? LIMIT 1`;
          db.query(userSql, [row.user_id], async (userErr, userRows) => {
            if (userErr) return doneOne(userErr);
            const u = userRows[0];
            const email = u && u.email ? String(u.email).trim() : "";
            if (email) {
              emailsAttempted += 1;
              const name = [u.first_name, u.last_name].filter(Boolean).join(" ").trim();
              await sendNotificationEmail({
                to: email,
                subject: title,
                text: `${name ? `Hi ${name},\n\n` : ""}${message}\n\n— Job Application Tracker`,
              });
            }
            return doneOne(null);
          });
        });
      });
    }
  });
}

module.exports = { processDueReminders };
