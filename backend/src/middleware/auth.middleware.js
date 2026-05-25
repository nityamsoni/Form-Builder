const authService = require("../services/auth.service");

const getBearerToken = (headerValue) => {
  const value = String(headerValue || "");
  if (!value.toLowerCase().startsWith("bearer ")) {
    return null;
  }
  return value.slice(7).trim();
};

const buildAdminSession = (payload) => ({
  id: 0,
  name: payload.name || "Admin",
  email: payload.email || "admin@formbuilder.dev",
  role: "admin",
});

const resolveSession = async (token) => {
  const payload = authService.verifyToken(token);

  if (payload.role === "admin") {
    return buildAdminSession(payload);
  }

  const user = await authService.getProfile(Number(payload.sub));

  if (user.isActive === false) {
    throw new Error("Account is disabled");
  }

  return {
    ...user,
    role: user.role || "user",
  };
};

const requireAuth = async (req, res, next) => {
  try {
    const token = getBearerToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    req.user = await resolveSession(token);

    return next();
  } catch (_error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

const requireAdmin = async (req, res, next) => {
  try {
    const token = getBearerToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: "Admin authentication required" });
    }

    const payload = authService.verifyToken(token);
    if (payload.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    req.user = buildAdminSession(payload);
    return next();
  } catch (_error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

module.exports = {
  requireAuth,
  requireAdmin,
};
