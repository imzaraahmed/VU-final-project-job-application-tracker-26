const express = require("express");
const router = express.Router();
const db = require("../db");
const multer = require("multer");
const path = require("path");

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
// GET Single Profile
// =============================
router.get("/:id", (req, res) => {
  db.query(
    "SELECT * FROM job_application WHERE id = ?",
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
      UPDATE job_application
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
      UPDATE job_application
      SET first_name=?, last_name=?, email=?, phone=?, position=?, 
          available_start_date=?, employment_status=?
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
  const sql = "SELECT * FROM job_application";

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
// CREATE New Applicant WITH FILE
// =============================
router.post("/", upload.single("resume"), (req, res) => {
  const {
    first_name,
    last_name,
    email,
    phone,
    position,
    available_start_date,
    employment_status,
  } = req.body;

  let resumePath = null;

  // If resume uploaded
  if (req.file) {
    resumePath = `uploads/${req.file.filename}`;
  }

  const sql = `
    INSERT INTO job_application 
    (first_name, last_name, email, phone, position, 
     available_start_date, employment_status, resume)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
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
  ];

  db.query(sql, values, (err, result) => {
    if (err) return res.status(500).json(err);

    res.status(201).json({
      message: "Applicant created successfully",
      applicantId: result.insertId,
      resume: resumePath,
    });
  });
});



// =============================
// DELETE Applicant
// =============================
router.delete("/:id", (req, res) => {
  const { id } = req.params;
    // Delete the applicant from the database
    const deleteSql = "DELETE FROM job_application WHERE id = ?";
    db.query(deleteSql, [id], (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Applicant deleted successfully" });
    });
  });


module.exports = router;