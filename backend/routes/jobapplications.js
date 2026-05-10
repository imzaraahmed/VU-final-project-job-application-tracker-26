const express = require("express");
const router = express.Router();
const db = require("../db");
const multer = require("multer");
const path = require("path");
const axios = require("axios");
const bcrypt = require("bcrypt");
const { signAccessToken, getExpiresIn } = require("../services/jwt");

/** MySQL table for applicant accounts (formerly `job_application`) */
const USERS_TABLE = "`users`";

// =============================
// Multer Storage Configuration
// =============================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

// Allow only PDF, DOC, DOCX
const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const allowedTypes = [".pdf", ".doc", ".docx"];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF/DOC/DOCX files allowed"));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// =============================
// LOGIN Applicant (JWT + optional bcrypt hashes)
// =============================
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password are required",
    });
  }

  const sql = `
    SELECT id, first_name, last_name, email, password AS password_hash
    FROM ${USERS_TABLE}
    WHERE email = ?
    LIMIT 1
  `;

  db.query(sql, [email], async (err, result) => {
    if (err) {
      return res.status(500).json({
        message: "Database error",
      });
    }

    if (!result.length) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const row = result[0];
    const stored = row.password_hash;

    let passwordOk = false;
    try {
      if (typeof stored === "string" && stored.startsWith("$2")) {
        passwordOk = await bcrypt.compare(String(password), stored);
      } else {
        passwordOk = stored === password;
      }
    } catch {
      passwordOk = false;
    }

    if (!passwordOk) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const user = {
      id: row.id,
      first_name: row.first_name,
      last_name: row.last_name,
      email: row.email,
    };

    let token;
    try {
      token = signAccessToken(user);
    } catch (e) {
      console.error("JWT sign:", e.message);
      return res.status(500).json({
        message: "Authentication misconfiguration",
      });
    }

    return res.status(200).json({
      message: "Login successful",
      token,
      token_type: "Bearer",
      expires_in: getExpiresIn(),
      user,
    });
  });
});


// =============================
// GET Single Profile
// =============================
router.get("/:id", (req, res) => {
  db.query(
    `SELECT * FROM ${USERS_TABLE} WHERE id = ?`,
    [req.params.id],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json(result);
    }
  );
});


// =============================
// UPDATE Profile WITH FILE
// =============================
router.put("/:id", upload.single("resume"), (req, res) => {
  const {
    first_name,
    last_name,
    email,
    //password,
    phone,
    position,
    available_start_date,
    employment_status,
  } = req.body;

  const { id } = req.params;

  let resumePath = null;

  if (req.file) {
    resumePath = `uploads/${req.file.filename}`;
  }

  let sql;
  let values;

  if (resumePath) {
    // If new resume uploaded
    sql = `
      UPDATE ${USERS_TABLE}
      SET first_name=?, last_name=?, email=?, phone=?, position=?, 
          available_start_date=?, employment_status=?, resume=?
      WHERE id=?
    `;

    values = [
      first_name,
      last_name,
      email,
      phone,
      position,
      available_start_date,
      employment_status,
      resumePath,
      id,
    ];
  } else {
    // If no resume uploaded
    sql = `
      UPDATE ${USERS_TABLE}
      SET first_name=?, last_name=?, email=?, phone=?, position=?, 
          available_start_date=?, employment_status=?
      WHERE id=?
    `;

    values = [
      first_name,
      last_name,
      email,
      //password,
      phone,
      position,
      available_start_date,
      employment_status,
      id,
    ];
  }

  db.query(sql, values, (err, result) => {
    if (err) return res.status(500).json(err);

    res.json({
      message: "Profile updated successfully",
      resume: resumePath || "Not changed",
    });
  });
});


// =============================
// GET All Applicants
// =============================
router.get("/", (req, res) => {
  const sql = `SELECT * FROM ${USERS_TABLE}`;

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({
        error: "Database error",
        details: err,
      });
    }

    res.status(200).json({
      message: "Applicants fetched successfully",
      total: results.length,
      data: results,
    });
  });
});




// =============================
// CREATE New Applicant WITH FILE + reCAPTCHA
// =============================
router.post("/", upload.single("resume"), async (req, res) => {

  console.log("this function is being called")
  try {
    const {
      first_name,
      last_name,
      email,
      password,
      phone,
      position,
      available_start_date,
      employment_status,
      captchaToken, // coming from frontend
    } = req.body;

    // =============================
    // 1️⃣ Verify reCAPTCHA First
    // =============================
    if (!captchaToken) {
      return res.status(400).json({
        message: "reCAPTCHA token missing",
      });
    }

    const verifyURL = "https://www.google.com/recaptcha/api/siteverify";

    const captchaResponse = await axios.post(
      verifyURL,
      null,
      {
        params: {
          secret: process.env.RECAPTCHA_SECRET_KEY,
          response: captchaToken,
        },
      }
    );

    if (!captchaResponse.data.success) {
      return res.status(403).json({
        message: "reCAPTCHA verification failed",
      });
    }

    // =============================
    // 2️⃣ Handle File Upload
    // =============================
    let resumePath = null;

    if (req.file) {
      resumePath = `uploads/${req.file.filename}`;
    }

    // =============================
    // 3️⃣ Hash password + insert into database
    // =============================
    let hashedPassword = password;
    try {
      if (password != null && String(password).length > 0) {
        hashedPassword = await bcrypt.hash(String(password), 12);
      }
    } catch (hashErr) {
      console.error("Password hash error:", hashErr);
      return res.status(500).json({
        message: "Could not process password",
      });
    }

    const sql = `
      INSERT INTO ${USERS_TABLE} 
      (first_name, last_name, email, phone, position, 
       available_start_date, employment_status, resume, password)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      first_name,
      last_name,
      email,
      phone,
      position,
      available_start_date,
      employment_status,
      resumePath,
      hashedPassword,
    ];

    db.query(sql, values, (err, result) => {
      if (err) {
        return res.status(500).json(err);
      }

      res.status(201).json({
        message: "Applicant created successfully",
        applicantId: result.insertId,
        resume: resumePath,
      });
    });

  } catch (error) {
    console.error("Error creating applicant:", error);
    res.status(500).json({
      message: "Server error",
    });
  }
});




// =============================
// DELETE Applicant
// =============================
router.delete("/:id", (req, res) => {
  const { id } = req.params;
    // Delete the applicant from the database
    const deleteSql = `DELETE FROM ${USERS_TABLE} WHERE id = ?`;
    db.query(deleteSql, [id], (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Applicant deleted successfully" });
    });
  });


module.exports = router;