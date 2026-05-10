const express = require("express");
const router = express.Router();
const db = require("../db");
const { processDueReminders } = require("../services/reminderNotifier");

function safeSqlIdentifier(name, fallback) {
  const raw = (name ?? "").toString().trim();
  const chosen = raw.length ? raw : fallback;
  return /^[a-zA-Z0-9_]+$/.test(chosen) ? chosen : fallback;
}

const REMINDERS_SCHEMA = safeSqlIdentifier(process.env.DB_JOBS_DATABASE, "jat_v2");
const FALLBACK_CONN_DB = safeSqlIdentifier(process.env.DB_NAME, "my_first_db");
const NOTIFICATIONS_SCHEMA = safeSqlIdentifier(
  process.env.DB_NOTIFICATIONS_DATABASE,
  REMINDERS_SCHEMA
);
const NOTIFICATIONS_TABLE = safeSqlIdentifier(process.env.DB_NOTIFICATIONS_TABLE, "notifications");
const NOTIFICATIONS_QTN = `\`${NOTIFICATIONS_SCHEMA}\`.\`${NOTIFICATIONS_TABLE}\``;

function parsePositiveInt(raw) {
  const n = Number.parseInt(String(raw), 10);
  if (!Number.isInteger(n) || n < 1) return null;
  return n;
}

function parseBoolInt(raw, fallback = null) {
  if (raw === null || raw === undefined || String(raw).trim() === "") return fallback;
  const v = String(raw).trim().toLowerCase();
  if (v === "1" || v === "true" || v === "yes") return 1;
  if (v === "0" || v === "false" || v === "no") return 0;
  return null;
}

router.get("/unread-count", (req, res) => {
  const userId = parsePositiveInt(req.query.user_id);
  if (userId === null) {
    return res.status(400).json({ message: "user_id query parameter is required and must be a positive integer" });
  }

  const sql = `
    SELECT COUNT(*) AS c
    FROM ${NOTIFICATIONS_QTN}
    WHERE user_id = ? AND is_read = 0
  `;
  db.query(sql, [userId], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: "Database error while counting notifications", details: err.message });
    }
    const count = rows[0] && rows[0].c !== undefined ? Number(rows[0].c) : 0;
    return res.status(200).json({ message: "OK", unread_count: count });
  });
});

router.patch("/read-all", (req, res) => {
  const body = req.body || {};
  const userId = parsePositiveInt(body.user_id);
  if (userId === null) {
    return res.status(400).json({ message: "user_id is required and must be a positive integer" });
  }

  const sql = `
    UPDATE ${NOTIFICATIONS_QTN}
    SET is_read = 1, updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ? AND is_read = 0
  `;
  db.query(sql, [userId], (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Database error while marking notifications read", details: err.message });
    }
    return res.status(200).json({ message: "All notifications marked as read", affected: result.affectedRows });
  });
});

router.post("/run-reminder-check", (req, res) => {
  const secret = process.env.NOTIFICATION_CRON_SECRET;
  if (secret && String(secret).trim()) {
    const header = req.get("x-cron-secret");
    if (header !== String(secret)) {
      return res.status(403).json({ message: "Forbidden" });
    }
  }
  processDueReminders((err, summary) => {
    if (err) {
      return res.status(500).json({ message: "Reminder check failed", details: err.message });
    }
    return res.status(200).json({ message: "Reminder check completed", summary });
  });
});

router.get("/", (req, res) => {
  const userId = parsePositiveInt(req.query.user_id);
  if (userId === null) {
    return res.status(400).json({ message: "user_id query parameter is required and must be a positive integer" });
  }

  const unreadOnly = parseBoolInt(req.query.unread_only, 0);
  if (req.query.unread_only !== undefined && unreadOnly === null) {
    return res.status(400).json({ message: "unread_only must be 0, 1, true, or false" });
  }

  const limitRaw = req.query.limit !== undefined ? Number.parseInt(String(req.query.limit), 10) : 100;
  const limit = Number.isInteger(limitRaw) && limitRaw >= 1 && limitRaw <= 500 ? limitRaw : 100;

  const where = ["user_id = ?"];
  const values = [userId];
  if (unreadOnly === 1) {
    where.push("is_read = 0");
  }

  const sql = `
    SELECT id, user_id, reminder_id, job_id, title, message, is_read, sent_at, created_at, updated_at
    FROM ${NOTIFICATIONS_QTN}
    WHERE ${where.join(" AND ")}
    ORDER BY sent_at DESC, id DESC
    LIMIT ${limit}
  `;

  db.query(sql, values, (err, rows) => {
    if (err) {
      return res.status(500).json({ message: "Database error while listing notifications", details: err.message });
    }
    return res.status(200).json({
      message: "Notifications fetched successfully",
      total: rows.length,
      data: rows,
    });
  });
});

router.get("/:id", (req, res) => {
  const id = parsePositiveInt(req.params.id);
  const userId = parsePositiveInt(req.query.user_id);
  if (id === null) return res.status(400).json({ message: "Invalid id; expected a positive integer" });
  if (userId === null) {
    return res.status(400).json({ message: "user_id query parameter is required and must be a positive integer" });
  }

  const sql = `
    SELECT id, user_id, reminder_id, job_id, title, message, is_read, sent_at, created_at, updated_at
    FROM ${NOTIFICATIONS_QTN}
    WHERE id = ? AND user_id = ?
    LIMIT 1
  `;
  db.query(sql, [id, userId], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: "Database error while fetching notification", details: err.message });
    }
    if (!rows.length) return res.status(404).json({ message: "Notification not found" });
    return res.status(200).json({ message: "Notification fetched successfully", data: rows[0] });
  });
});

router.patch("/:id/read", (req, res) => {
  const id = parsePositiveInt(req.params.id);
  const body = req.body || {};
  const userId = parsePositiveInt(body.user_id);
  if (id === null) return res.status(400).json({ message: "Invalid id; expected a positive integer" });
  if (userId === null) {
    return res.status(400).json({ message: "user_id is required and must be a positive integer" });
  }

  const sql = `
    UPDATE ${NOTIFICATIONS_QTN}
    SET is_read = 1, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ?
  `;
  db.query(sql, [id, userId], (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Database error while updating notification", details: err.message });
    }
    if (result.affectedRows === 0) return res.status(404).json({ message: "Notification not found" });
    return res.status(200).json({ message: "Notification marked as read" });
  });
});

module.exports = router;
