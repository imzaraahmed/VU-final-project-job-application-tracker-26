const express = require("express");
const router = express.Router();
const db = require("../db");

function safeSqlIdentifier(name, fallback) {
  const raw = (name ?? "").toString().trim();
  const chosen = raw.length ? raw : fallback;
  return /^[a-zA-Z0-9_]+$/.test(chosen) ? chosen : fallback;
}

const REMINDERS_SCHEMA = safeSqlIdentifier(process.env.DB_JOBS_DATABASE, "jat_v2");
const REMINDERS_TABLE = safeSqlIdentifier(process.env.DB_REMINDERS_TABLE, "reminders");
const JOBS_TABLE = safeSqlIdentifier(process.env.DB_JOBS_TABLE, "jobs");
const FALLBACK_CONN_DB = safeSqlIdentifier(process.env.DB_NAME, "my_first_db");
const USERS_SCHEMA = safeSqlIdentifier(process.env.DB_USERS_DATABASE, FALLBACK_CONN_DB);
const USERS_TABLE = safeSqlIdentifier(process.env.DB_USERS_TABLE, "users");

const REMINDERS_QTN = `\`${REMINDERS_SCHEMA}\`.\`${REMINDERS_TABLE}\``;
const USERS_QTN = `\`${USERS_SCHEMA}\`.\`${USERS_TABLE}\``;
const JOBS_QTN = `\`${REMINDERS_SCHEMA}\`.\`${JOBS_TABLE}\``;

const ALLOWED_REMINDER_STATUSES = Object.freeze(["pending", "completed", "dismissed"]);

function parsePositiveInt(raw) {
  const n = Number.parseInt(String(raw), 10);
  if (!Number.isInteger(n) || n < 1) return null;
  return n;
}

function parseReminderStatus(raw, fallback = "pending") {
  if (raw === null || raw === undefined || String(raw).trim() === "") return fallback;
  const value = String(raw).trim().toLowerCase();
  if (!ALLOWED_REMINDER_STATUSES.includes(value)) return null;
  return value;
}

function parseNullableDateTime(raw) {
  if (raw === null || raw === undefined) return null;
  const value = String(raw).trim();
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function toMySqlDateTime(dateObj) {
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
  const dd = String(dateObj.getDate()).padStart(2, "0");
  const hh = String(dateObj.getHours()).padStart(2, "0");
  const mi = String(dateObj.getMinutes()).padStart(2, "0");
  const ss = String(dateObj.getSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

function ensureUserExists(userId, callback) {
  const sql = `SELECT id FROM ${USERS_QTN} WHERE id = ? LIMIT 1`;
  db.query(sql, [userId], (err, rows) => {
    if (err) return callback(err, false);
    callback(null, rows.length > 0);
  });
}

function ensureJobForUser(jobId, userId, callback) {
  const sql = `SELECT job_id FROM ${JOBS_QTN} WHERE job_id = ? AND user_id = ? LIMIT 1`;
  db.query(sql, [jobId, userId], (err, rows) => {
    if (err) return callback(err, false);
    callback(null, rows.length > 0);
  });
}

router.get("/", (req, res) => {
  const userId = parsePositiveInt(req.query.user_id);
  if (userId === null) {
    return res.status(400).json({ message: "user_id query parameter is required and must be a positive integer" });
  }

  const status = req.query.status ? parseReminderStatus(req.query.status, "pending") : null;
  if (req.query.status && status === null) {
    return res.status(400).json({
      message: `status must be one of: ${ALLOWED_REMINDER_STATUSES.join(", ")}`,
    });
  }

  const where = ["user_id = ?"];
  const values = [userId];
  if (status) {
    where.push("status = ?");
    values.push(status);
  }

  const sql = `
    SELECT id, user_id, job_id, title, description, reminder_datetime, status, snoozed_until, created_at, updated_at
    FROM ${REMINDERS_QTN}
    WHERE ${where.join(" AND ")}
    ORDER BY COALESCE(snoozed_until, reminder_datetime) ASC, id DESC
  `;

  db.query(sql, values, (err, rows) => {
    if (err) {
      return res.status(500).json({ message: "Database error while listing reminders", details: err.message });
    }
    return res.status(200).json({
      message: "Reminders fetched successfully",
      total: rows.length,
      data: rows,
    });
  });
});

router.get("/:id", (req, res) => {
  const reminderId = parsePositiveInt(req.params.id);
  const userId = parsePositiveInt(req.query.user_id);
  if (reminderId === null) return res.status(400).json({ message: "Invalid id; expected a positive integer" });
  if (userId === null) {
    return res.status(400).json({ message: "user_id query parameter is required and must be a positive integer" });
  }

  const sql = `
    SELECT id, user_id, job_id, title, description, reminder_datetime, status, snoozed_until, created_at, updated_at
    FROM ${REMINDERS_QTN}
    WHERE id = ? AND user_id = ?
    LIMIT 1
  `;
  db.query(sql, [reminderId, userId], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: "Database error while fetching reminder", details: err.message });
    }
    if (!rows.length) return res.status(404).json({ message: "Reminder not found" });
    return res.status(200).json({ message: "Reminder fetched successfully", data: rows[0] });
  });
});

router.post("/", (req, res) => {
  const body = req.body || {};
  const userId = parsePositiveInt(body.user_id);
  const jobId = body.job_id === null || body.job_id === undefined || String(body.job_id).trim() === "" ? null : parsePositiveInt(body.job_id);
  const title = String(body.title ?? "").trim();
  const description = body.description === undefined || body.description === null ? null : String(body.description).trim();
  const reminderDateObj = parseNullableDateTime(body.reminder_datetime);
  const status = parseReminderStatus(body.status, "pending");
  const snoozedUntilObj = parseNullableDateTime(body.snoozed_until);

  if (userId === null) return res.status(400).json({ message: "user_id is required and must be a positive integer" });
  if (!title) return res.status(400).json({ message: "title is required" });
  if (!reminderDateObj) return res.status(400).json({ message: "reminder_datetime is required and must be a valid date-time" });
  if (status === null) {
    return res.status(400).json({
      message: `status must be one of: ${ALLOWED_REMINDER_STATUSES.join(", ")}`,
    });
  }
  if (body.job_id !== null && body.job_id !== undefined && String(body.job_id).trim() !== "" && jobId === null) {
    return res.status(400).json({ message: "job_id must be a positive integer when provided" });
  }
  if (body.snoozed_until !== null && body.snoozed_until !== undefined && String(body.snoozed_until).trim() !== "" && !snoozedUntilObj) {
    return res.status(400).json({ message: "snoozed_until must be a valid date-time when provided" });
  }

  ensureUserExists(userId, (userErr, userExists) => {
    if (userErr) return res.status(500).json({ message: "Database error while validating user_id", details: userErr.message });
    if (!userExists) return res.status(400).json({ message: "user_id does not reference an existing user" });

    const insertRecord = () => {
      const sql = `
        INSERT INTO ${REMINDERS_QTN}
          (user_id, job_id, title, description, reminder_datetime, status, snoozed_until)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      const values = [
        userId,
        jobId,
        title,
        description || null,
        toMySqlDateTime(reminderDateObj),
        status,
        snoozedUntilObj ? toMySqlDateTime(snoozedUntilObj) : null,
      ];
      db.query(sql, values, (err, result) => {
        if (err) return res.status(500).json({ message: "Database error while creating reminder", details: err.message });
        return res.status(201).json({ message: "Reminder created successfully", id: result.insertId });
      });
    };

    if (jobId !== null) {
      ensureJobForUser(jobId, userId, (jobErr, jobExists) => {
        if (jobErr) return res.status(500).json({ message: "Database error while validating job_id", details: jobErr.message });
        if (!jobExists) return res.status(400).json({ message: "job_id does not reference an existing job for this user" });
        insertRecord();
      });
      return;
    }

    insertRecord();
  });
});

router.put("/:id", (req, res) => {
  const reminderId = parsePositiveInt(req.params.id);
  const body = req.body || {};
  const userId = parsePositiveInt(body.user_id);

  if (reminderId === null) return res.status(400).json({ message: "Invalid id; expected a positive integer" });
  if (userId === null) return res.status(400).json({ message: "user_id is required and must be a positive integer" });

  const assignments = [];
  const values = [];

  if (Object.prototype.hasOwnProperty.call(body, "title")) {
    const title = String(body.title ?? "").trim();
    if (!title) return res.status(400).json({ message: "title cannot be empty" });
    assignments.push("title = ?");
    values.push(title);
  }
  if (Object.prototype.hasOwnProperty.call(body, "description")) {
    const description = body.description === null || body.description === undefined ? null : String(body.description).trim();
    assignments.push("description = ?");
    values.push(description || null);
  }
  if (Object.prototype.hasOwnProperty.call(body, "status")) {
    const status = parseReminderStatus(body.status, "pending");
    if (status === null) {
      return res.status(400).json({
        message: `status must be one of: ${ALLOWED_REMINDER_STATUSES.join(", ")}`,
      });
    }
    assignments.push("status = ?");
    values.push(status);
  }
  if (Object.prototype.hasOwnProperty.call(body, "reminder_datetime")) {
    const reminderDateObj = parseNullableDateTime(body.reminder_datetime);
    if (!reminderDateObj) return res.status(400).json({ message: "reminder_datetime must be a valid date-time" });
    assignments.push("reminder_datetime = ?");
    values.push(toMySqlDateTime(reminderDateObj));
  }
  if (Object.prototype.hasOwnProperty.call(body, "snoozed_until")) {
    if (body.snoozed_until === null || String(body.snoozed_until).trim() === "") {
      assignments.push("snoozed_until = ?");
      values.push(null);
    } else {
      const snoozedUntilObj = parseNullableDateTime(body.snoozed_until);
      if (!snoozedUntilObj) return res.status(400).json({ message: "snoozed_until must be a valid date-time" });
      assignments.push("snoozed_until = ?");
      values.push(toMySqlDateTime(snoozedUntilObj));
    }
  }

  const updateWithJobId = (jobId) => {
    assignments.push("job_id = ?");
    values.push(jobId);
    finalizeUpdate();
  };

  const finalizeUpdate = () => {
    if (!assignments.length) {
      return res.status(400).json({
        message: "No updatable fields provided. Allowed: title, description, reminder_datetime, status, snoozed_until, job_id",
      });
    }

    const sql = `
      UPDATE ${REMINDERS_QTN}
      SET ${assignments.join(", ")}
      WHERE id = ? AND user_id = ?
    `;
    db.query(sql, [...values, reminderId, userId], (err, result) => {
      if (err) return res.status(500).json({ message: "Database error while updating reminder", details: err.message });
      if (result.affectedRows === 0) return res.status(404).json({ message: "Reminder not found" });
      return res.status(200).json({ message: "Reminder updated successfully" });
    });
  };

  if (Object.prototype.hasOwnProperty.call(body, "job_id")) {
    if (body.job_id === null || String(body.job_id).trim() === "") {
      updateWithJobId(null);
      return;
    }

    const jobId = parsePositiveInt(body.job_id);
    if (jobId === null) return res.status(400).json({ message: "job_id must be a positive integer when provided" });

    ensureJobForUser(jobId, userId, (jobErr, jobExists) => {
      if (jobErr) return res.status(500).json({ message: "Database error while validating job_id", details: jobErr.message });
      if (!jobExists) return res.status(400).json({ message: "job_id does not reference an existing job for this user" });
      updateWithJobId(jobId);
    });
    return;
  }

  finalizeUpdate();
});

router.delete("/:id", (req, res) => {
  const reminderId = parsePositiveInt(req.params.id);
  const userId = parsePositiveInt(req.query.user_id);

  if (reminderId === null) return res.status(400).json({ message: "Invalid id; expected a positive integer" });
  if (userId === null) {
    return res.status(400).json({ message: "user_id query parameter is required and must be a positive integer" });
  }

  const sql = `DELETE FROM ${REMINDERS_QTN} WHERE id = ? AND user_id = ?`;
  db.query(sql, [reminderId, userId], (err, result) => {
    if (err) return res.status(500).json({ message: "Database error while deleting reminder", details: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ message: "Reminder not found" });
    return res.status(200).json({ message: "Reminder deleted successfully" });
  });
});

module.exports = router;
