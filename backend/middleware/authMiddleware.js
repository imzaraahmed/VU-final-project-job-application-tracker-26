const jwt = require("jsonwebtoken");
const { getJwtSecret } = require("../services/jwt");

/**
 * Expects `Authorization: Bearer <token>`.
 * On success sets `req.user` = { id, email, first_name, last_name }.
 */
function authenticateToken(req, res, next) {
  const header = req.headers.authorization || req.headers.Authorization;
  if (!header || typeof header !== "string") {
    return res.status(401).json({ message: "Authorization header required" });
  }

  const parts = header.split(/\s+/);
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    return res.status(401).json({
      message: 'Invalid Authorization format. Use: Bearer <token>',
    });
  }

  const token = parts[1];
  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  let secret;
  try {
    secret = getJwtSecret();
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: "Server authentication misconfiguration" });
  }

  try {
    const payload = jwt.verify(token, secret, {
      issuer: "job-application-tracker-api",
      audience: "jat-frontend",
    });

    const id = Number(payload.sub);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(403).json({ message: "Invalid token subject" });
    }

    req.user = {
      id,
      email: String(payload.email ?? ""),
      first_name: String(payload.first_name ?? ""),
      last_name: String(payload.last_name ?? ""),
    };

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    if (err.name === "JsonWebTokenError") {
      return res.status(403).json({ message: "Invalid token" });
    }
    console.error("JWT verify:", err);
    return res.status(403).json({ message: "Token verification failed" });
  }
}

module.exports = { authenticateToken };
