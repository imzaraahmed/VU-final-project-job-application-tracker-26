const express = require("express");
const router = express.Router();
const db = require("../db");
const { authenticateToken } = require("../middleware/authMiddleware");

const USERS_TABLE = "`users`";

/**
 * Protected example: returns authenticated user derived from JWT.
 * Requires: Authorization: Bearer <access_token>
 */
router.get("/me", authenticateToken, (req, res) => {
  const sql = `
    SELECT id, first_name, last_name, email
    FROM ${USERS_TABLE}
    WHERE id = ?
    LIMIT 1
  `;

  db.query(sql, [req.user.id], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: "Database error" });
    }
    const row = Array.isArray(rows) && rows[0];
    if (!row) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      user: {
        id: row.id,
        first_name: row.first_name,
        last_name: row.last_name,
        email: row.email,
      },
    });
  });
});

module.exports = router;
