/**
 * Jobs CRUD routes
 * ----------------
 * Reads/writes the `jobs` table in the MySQL schema `jat_v2` (or overrides via env).
 * The main app connection may use a different default database (e.g. applicants);
 * all queries here use fully qualified table names so they still hit the correct schema.
 *
 * Environment (optional):
 *   DB_JOBS_DATABASE — MySQL schema/database name (default: jat_v2)
 *   DB_JOBS_TABLE    — table name (default: jobs)
 *
 * Expected columns:
 *   job_id, job_title, company_name, job_location, job_type, salary_range,
 *   job_description, requirements, posted_date, application_deadline,
 *   status (enum-like string — see ALLOWED_JOB_STATUSES), user_id (FK → users.id),
 *   created_at
 *
 * Optional env for FK lookups:
 *   DB_USERS_DATABASE — schema containing `users` (default: DB_NAME from .env)
 *   DB_USERS_TABLE    — table name (default: users)
 */

const express = require("express");
const router = express.Router();
const db = require("../db");
const fs = require("fs");
const multer = require("multer");
const path = require("path");

// ---------------------------------------------------------------------------
// Config: qualified table name (schema.table) for cross-database access
// ---------------------------------------------------------------------------

/**
 * Restrict identifiers to alphanumeric + underscore so env values cannot break out of backticks.
 * @param {string|undefined} name
 * @param {string} fallback
 */
function safeSqlIdentifier(name, fallback) {
  const raw = (name ?? "").toString().trim();
  const chosen = raw.length ? raw : fallback;
  return /^[a-zA-Z0-9_]+$/.test(chosen) ? chosen : fallback;
}

const JOBS_SCHEMA = safeSqlIdentifier(process.env.DB_JOBS_DATABASE, "jat_v2");
const JOBS_TABLE = safeSqlIdentifier(process.env.DB_JOBS_TABLE, "jobs");
const DOCUMENTS_TABLE = safeSqlIdentifier(process.env.DB_DOCUMENTS_TABLE, "documents");
/** Backtick-wrapped `schema`.`table` for use in SQL strings */
const JOBS_QTN = `\`${JOBS_SCHEMA}\`.\`${JOBS_TABLE}\``;
const DOCUMENTS_QTN = `\`${JOBS_SCHEMA}\`.\`${DOCUMENTS_TABLE}\``;

const FALLBACK_CONN_DB = safeSqlIdentifier(process.env.DB_NAME, "my_first_db");
const USERS_SCHEMA = safeSqlIdentifier(process.env.DB_USERS_DATABASE, FALLBACK_CONN_DB);
const USERS_TABLE_NAME = safeSqlIdentifier(process.env.DB_USERS_TABLE, "users");
const USERS_QTN = `\`${USERS_SCHEMA}\`.\`${USERS_TABLE_NAME}\``;

/** Application pipeline status values (must match DB / frontend allowed set) */
const ALLOWED_JOB_STATUSES = Object.freeze([
  "Not Applied",
  "Applied",
  "Interview Call",
  "Interview Given",
  "Test Call",
  "Test Given",
  "Offer Received",
  "Offer Accepted",
  "Rejected",
]);

const DEFAULT_JOB_STATUS = "Not Applied";

/**
 * @param {unknown} raw
 * @returns {string|null} normalized allowed status or null if invalid / empty when disallowed
 */
function parseJobStatusValue(raw) {
  if (raw === null || raw === undefined) return DEFAULT_JOB_STATUS;
  const s = String(raw).trim();
  if (s === "") return DEFAULT_JOB_STATUS;
  return ALLOWED_JOB_STATUSES.includes(s) ? s : null;
}

const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const uploadDocumentFile = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [".pdf", ".doc", ".docx"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
      return;
    }
    cb(new Error("Only PDF/DOC/DOCX files are allowed"));
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

/** Columns the client may send on create/update (excluding job_id and created_at) */
const JOBS_WRITABLE_FIELDS = [
  "job_title",
  "company_name",
  "job_location",
  "job_type",
  "salary_range",
  "job_description",
  "requirements",
  "posted_date",
  "application_deadline",
  "status",
];

/**
 * Parse route param as positive integer primary key.
 * @param {string} raw
 * @returns {number|null}
 */
function parseJobId(raw) {
  const n = Number.parseInt(String(raw), 10);
  if (!Number.isInteger(n) || n < 1) return null;
  return n;
}

/**
 * @param {string|number|undefined|null} raw
 * @returns {number|null}
 */
function parseUserId(raw) {
  const n = Number.parseInt(String(raw), 10);
  if (!Number.isInteger(n) || n < 1) return null;
  return n;
}

/**
 * @param {number} userId
 * @param {(err: Error|null, exists: boolean) => void} callback
 */
function ensureUserExists(userId, callback) {
  const sql = `SELECT id FROM ${USERS_QTN} WHERE id = ? LIMIT 1`;
  db.query(sql, [userId], (err, rows) => {
    if (err) return callback(err, false);
    callback(null, rows.length > 0);
  });
}

function parseDocumentType(raw) {
  const type = String(raw ?? "").trim().toLowerCase();
  if (type === "resume") return "resume";
  if (type === "cover_letter") return "cover_letter";
  return null;
}

function parseDocumentId(raw) {
  const n = Number.parseInt(String(raw), 10);
  if (!Number.isInteger(n) || n < 1) return null;
  return n;
}

// ---------------------------------------------------------------------------
// GET /api/jobs — list all jobs (newest first when created_at exists)
// Optional query: ?user_id= — only jobs for that user
// ---------------------------------------------------------------------------
router.get("/", (req, res) => {
  const rawUserFilter = req.query.user_id;
  let filterUserId = null;
  if (rawUserFilter !== undefined && rawUserFilter !== null && String(rawUserFilter).trim() !== "") {
    filterUserId = parseUserId(rawUserFilter);
    if (filterUserId === null) {
      return res.status(400).json({ message: "Invalid user_id query parameter; expected a positive integer" });
    }
  }

  const whereClause = filterUserId !== null ? " WHERE user_id = ?" : "";

  const sql = `
    SELECT
      job_id,
      user_id,
      job_title,
      company_name,
      job_location,
      job_type,
      salary_range,
      job_description,
      requirements,
      posted_date,
      application_deadline,
      status,
      created_at
    FROM ${JOBS_QTN}
    ${whereClause}
    ORDER BY created_at DESC, job_id DESC
  `;

  db.query(sql, filterUserId !== null ? [filterUserId] : [], (err, rows) => {
    if (err) {
      return res.status(500).json({
        message: "Database error while listing jobs",
        details: err.message,
      });
    }

    return res.status(200).json({
      message: "Jobs fetched successfully",
      total: rows.length,
      data: rows,
    });
  });
});

// ---------------------------------------------------------------------------
// GET /api/jobs/:job_id — single job by primary key
// ---------------------------------------------------------------------------
router.get("/:job_id", (req, res) => {
  const jobId = parseJobId(req.params.job_id);
  if (jobId === null) {
    return res.status(400).json({ message: "Invalid job_id; expected a positive integer" });
  }

  const sql = `
    SELECT
      job_id,
      user_id,
      job_title,
      company_name,
      job_location,
      job_type,
      salary_range,
      job_description,
      requirements,
      posted_date,
      application_deadline,
      status,
      created_at
    FROM ${JOBS_QTN}
    WHERE job_id = ?
    LIMIT 1
  `;

  db.query(sql, [jobId], (err, rows) => {
    if (err) {
      return res.status(500).json({
        message: "Database error while fetching job",
        details: err.message,
      });
    }

    if (!rows.length) {
      return res.status(404).json({ message: "Job not found" });
    }

    return res.status(200).json({
      message: "Job fetched successfully",
      data: rows[0],
    });
  });
});

// ---------------------------------------------------------------------------
// POST /api/jobs — create job (job_id auto; created_at left to DB default if set)
// ---------------------------------------------------------------------------
router.post("/", (req, res) => {
  const body = req.body || {};

  // Minimum required fields for a usable listing (adjust if your schema allows NULLs)
  const { job_title, company_name } = body;
  if (!job_title || !company_name) {
    return res.status(400).json({
      message: "job_title and company_name are required",
    });
  }

  const statusVal = parseJobStatusValue(body.status);
  if (statusVal === null) {
    return res.status(400).json({
      message: `status must be one of: ${ALLOWED_JOB_STATUSES.join(", ")}`,
    });
  }

  const userId = parseUserId(body.user_id);
  if (userId === null) {
    return res.status(400).json({
      message: "user_id is required and must be a positive integer (existing user)",
    });
  }

  ensureUserExists(userId, (existErr, exists) => {
    if (existErr) {
      return res.status(500).json({
        message: "Database error while validating user_id",
        details: existErr.message,
      });
    }
    if (!exists) {
      return res.status(400).json({
        message: "user_id does not reference an existing user",
      });
    }

    const sql = `
    INSERT INTO ${JOBS_QTN} (
      job_title,
      company_name,
      job_location,
      job_type,
      salary_range,
      job_description,
      requirements,
      posted_date,
      application_deadline,
      status,
      user_id
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

    const values = [
      job_title,
      company_name,
      body.job_location ?? null,
      body.job_type ?? null,
      body.salary_range ?? null,
      body.job_description ?? null,
      body.requirements ?? null,
      body.posted_date ?? null,
      body.application_deadline ?? null,
      statusVal,
      userId,
    ];

    db.query(sql, values, (err, result) => {
      if (err) {
        return res.status(500).json({
          message: "Database error while creating job",
          details: err.message,
        });
      }

      return res.status(201).json({
        message: "Job created successfully",
        job_id: result.insertId,
      });
    });
  });
});

// ---------------------------------------------------------------------------
// POST /api/jobs/:job_id/documents — upload and attach document to a job
// ---------------------------------------------------------------------------
router.post("/:job_id/documents", uploadDocumentFile.single("document"), (req, res) => {
  const jobId = parseJobId(req.params.job_id);
  if (jobId === null) {
    return res.status(400).json({ message: "Invalid job_id; expected a positive integer" });
  }

  const documentName = String(req.body.document_name ?? "").trim();
  const type = parseDocumentType(req.body.type);

  if (!documentName) {
    return res.status(400).json({ message: "document_name is required" });
  }
  if (!type) {
    return res.status(400).json({ message: "type must be 'resume' or 'cover_letter'" });
  }
  if (!req.file) {
    return res.status(400).json({ message: "document file is required" });
  }

  const filePath = `uploads/${req.file.filename}`;
  const checkJobSql = `SELECT job_id FROM ${JOBS_QTN} WHERE job_id = ? LIMIT 1`;
  db.query(checkJobSql, [jobId], (checkErr, checkRows) => {
    if (checkErr) {
      return res.status(500).json({
        message: "Database error while validating job",
        details: checkErr.message,
      });
    }

    if (!checkRows.length) {
      return res.status(404).json({ message: "Job not found" });
    }

    const insertSql = `
      INSERT INTO ${DOCUMENTS_QTN} (job_id, document_name, type, file_path)
      VALUES (?, ?, ?, ?)
    `;
    db.query(insertSql, [jobId, documentName, type, filePath], (err, result) => {
      if (err) {
        return res.status(500).json({
          message: "Database error while saving document",
          details: err.message,
        });
      }

      return res.status(201).json({
        message: "Document uploaded successfully",
        id: result.insertId,
        job_id: jobId,
        document_name: documentName,
        type,
        file_path: filePath,
      });
    });
  });
});

// ---------------------------------------------------------------------------
// GET /api/jobs/:job_id/documents — list documents attached to a job
// ---------------------------------------------------------------------------
router.get("/:job_id/documents", (req, res) => {
  const jobId = parseJobId(req.params.job_id);
  if (jobId === null) {
    return res.status(400).json({ message: "Invalid job_id; expected a positive integer" });
  }

  const sql = `
    SELECT id, job_id, document_name, type, file_path, created_at
    FROM ${DOCUMENTS_QTN}
    WHERE job_id = ?
    ORDER BY created_at DESC, id DESC
  `;
  db.query(sql, [jobId], (err, rows) => {
    if (err) {
      return res.status(500).json({
        message: "Database error while listing documents",
        details: err.message,
      });
    }
    return res.status(200).json({
      message: "Documents fetched successfully",
      total: rows.length,
      data: rows,
    });
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/jobs/:job_id/documents/:id — delete a single document
// ---------------------------------------------------------------------------
router.delete("/:job_id/documents/:id", (req, res) => {
  const jobId = parseJobId(req.params.job_id);
  const documentId = parseDocumentId(req.params.id);
  if (jobId === null) {
    return res.status(400).json({ message: "Invalid job_id; expected a positive integer" });
  }
  if (documentId === null) {
    return res.status(400).json({ message: "Invalid document id; expected a positive integer" });
  }

  const selectSql = `
    SELECT id, file_path
    FROM ${DOCUMENTS_QTN}
    WHERE id = ? AND job_id = ?
    LIMIT 1
  `;

  db.query(selectSql, [documentId, jobId], (selectErr, rows) => {
    if (selectErr) {
      return res.status(500).json({
        message: "Database error while fetching document",
        details: selectErr.message,
      });
    }
    if (!rows.length) {
      return res.status(404).json({ message: "Document not found" });
    }

    const filePath = String(rows[0].file_path ?? "");
    const deleteSql = `DELETE FROM ${DOCUMENTS_QTN} WHERE id = ? AND job_id = ?`;
    db.query(deleteSql, [documentId, jobId], (deleteErr, result) => {
      if (deleteErr) {
        return res.status(500).json({
          message: "Database error while deleting document",
          details: deleteErr.message,
        });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Document not found" });
      }

      if (filePath) {
        const absoluteFilePath = path.resolve(process.cwd(), filePath);
        fs.unlink(absoluteFilePath, () => {
          // Ignore unlink errors (file might already be missing)
        });
      }

      return res.status(200).json({ message: "Document deleted successfully" });
    });
  });
});

// ---------------------------------------------------------------------------
// PUT /api/jobs/:job_id — partial update (only fields present in JSON body)
// ---------------------------------------------------------------------------
router.put("/:job_id", (req, res) => {
  const jobId = parseJobId(req.params.job_id);
  if (jobId === null) {
    return res.status(400).json({ message: "Invalid job_id; expected a positive integer" });
  }

  const body = req.body || {};
  const assignments = [];
  const values = [];

  if (Object.prototype.hasOwnProperty.call(body, "status")) {
    const raw = body.status;
    const normalized =
      raw === null || raw === undefined || String(raw).trim() === ""
        ? DEFAULT_JOB_STATUS
        : String(raw).trim();
    if (!ALLOWED_JOB_STATUSES.includes(normalized)) {
      return res.status(400).json({
        message: `status must be one of: ${ALLOWED_JOB_STATUSES.join(", ")}`,
      });
    }
    assignments.push("`status` = ?");
    values.push(normalized);
  }

  const runUpdate = () => {
    for (const field of JOBS_WRITABLE_FIELDS) {
      if (field === "status") continue;
      if (Object.prototype.hasOwnProperty.call(body, field)) {
        assignments.push(`\`${field}\` = ?`);
        values.push(body[field]);
      }
    }

    if (!assignments.length) {
      return res.status(400).json({
        message: `No updatable fields provided. Allowed: ${JOBS_WRITABLE_FIELDS.join(", ")}, user_id`,
      });
    }

    values.push(jobId);

    const sql = `
    UPDATE ${JOBS_QTN}
    SET ${assignments.join(", ")}
    WHERE job_id = ?
  `;

    db.query(sql, values, (err, result) => {
      if (err) {
        return res.status(500).json({
          message: "Database error while updating job",
          details: err.message,
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Job not found" });
      }

      return res.status(200).json({
        message: "Job updated successfully",
        affectedRows: result.affectedRows,
      });
    });
  };

  if (Object.prototype.hasOwnProperty.call(body, "user_id")) {
    const uid = parseUserId(body.user_id);
    if (uid === null) {
      return res.status(400).json({ message: "user_id must be a positive integer" });
    }
    ensureUserExists(uid, (existErr, exists) => {
      if (existErr) {
        return res.status(500).json({
          message: "Database error while validating user_id",
          details: existErr.message,
        });
      }
      if (!exists) {
        return res.status(400).json({ message: "user_id does not reference an existing user" });
      }
      assignments.push("`user_id` = ?");
      values.push(uid);
      runUpdate();
    });
    return;
  }

  runUpdate();
});

// ---------------------------------------------------------------------------
// DELETE /api/jobs/:job_id — remove a job row
// ---------------------------------------------------------------------------
router.delete("/:job_id", (req, res) => {
  const jobId = parseJobId(req.params.job_id);
  if (jobId === null) {
    return res.status(400).json({ message: "Invalid job_id; expected a positive integer" });
  }

  const sql = `DELETE FROM ${JOBS_QTN} WHERE job_id = ?`;

  db.query(sql, [jobId], (err, result) => {
    if (err) {
      return res.status(500).json({
        message: "Database error while deleting job",
        details: err.message,
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Job not found" });
    }

    return res.status(200).json({
      message: "Job deleted successfully",
      affectedRows: result.affectedRows,
    });
  });
});

router.use((err, _req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: err.message });
  }
  if (err) {
    return res.status(400).json({ message: err.message || "Upload failed" });
  }
  return next();
});

module.exports = router;
