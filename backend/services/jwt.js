const jwt = require("jsonwebtoken");

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || String(secret).length < 32) {
    throw new Error(
      "JWT_SECRET must be set in environment (minimum 32 characters for HS256)."
    );
  }
  return String(secret);
}

function getExpiresIn() {
  return process.env.JWT_EXPIRES_IN || "15m";
}

/**
 * @param {{ id: number, email: string, first_name: string, last_name: string }} user
 * @returns {string}
 */
function signAccessToken(user) {
  const payload = {
    sub: String(user.id),
    email: user.email,
    first_name: user.first_name ?? "",
    last_name: user.last_name ?? "",
  };

  const token = jwt.sign(payload, getJwtSecret(), {
    expiresIn: getExpiresIn(),
    issuer: "job-application-tracker-api",
    audience: "jat-frontend",
  });

  return token;
}

module.exports = {
  signAccessToken,
  getExpiresIn,
  getJwtSecret,
};
