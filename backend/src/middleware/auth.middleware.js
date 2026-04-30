const authService = require("../services/auth.service");

const getBearerToken = (headerValue) => {
  const value = String(headerValue || "");
  if (!value.toLowerCase().startsWith("bearer ")) {
    return null;
  }
  return value.slice(7).trim();
};

const requireAuth = async (req, res, next) => {
  try {
    const token = getBearerToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const payload = authService.verifyToken(token);
    req.user = {
      id: Number(payload.sub),
      email: payload.email,
      name: payload.name,
    };

    return next();
  } catch (_error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

module.exports = {
  requireAuth,
};
