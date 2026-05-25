const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../prisma/client");

const TOKEN_TTL = process.env.JWT_EXPIRES_IN || "7d";
const JWT_SECRET = process.env.JWT_SECRET || "dev-only-secret-change-me";

const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role || "user",
  isActive: user.isActive !== false,
  createdAt: user.createdAt,
});

const signToken = (user) => {
  return jwt.sign(
    {
      sub: String(user.id),
      email: user.email,
      name: user.name,
      role: user.role || "user",
    },
    JWT_SECRET,
    { expiresIn: TOKEN_TTL }
  );
};

const assertValidEmail = (email) => {
  const normalized = String(email || "").trim().toLowerCase();
  if (!normalized || !/^\S+@\S+\.\S+$/.test(normalized)) {
    throw new Error("Valid email is required");
  }
  return normalized;
};

const assertValidPassword = (password) => {
  const value = String(password || "");
  if (value.length < 8) {
    throw new Error("Password must be at least 8 characters long");
  }
  return value;
};

const assertValidName = (name) => {
  const value = String(name || "").trim();
  if (!value) {
    throw new Error("Name is required");
  }
  if (value.length > 80) {
    throw new Error("Name is too long");
  }
  return value;
};

const register = async ({ name, email, password }) => {
  const safeName = assertValidName(name);
  const safeEmail = assertValidEmail(email);
  const safePassword = assertValidPassword(password);

  const existing = await prisma.user.findUnique({
    where: { email: safeEmail },
    select: { id: true },
  });

  if (existing) {
    throw new Error("An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(safePassword, 12);

  const user = await prisma.user.create({
    data: {
      name: safeName,
      email: safeEmail,
      passwordHash,
      role: "user",
      isActive: true,
    },
  });

  return {
    token: signToken(user),
    user: sanitizeUser(user),
  };
};

const login = async ({ email, password }) => {
  const safeEmail = assertValidEmail(email);
  const safePassword = String(password || "");

  const user = await prisma.user.findUnique({
    where: { email: safeEmail },
  });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  if (user.isActive === false) {
    throw new Error("Account is disabled");
  }

  const matches = await bcrypt.compare(safePassword, user.passwordHash);
  if (!matches) {
    throw new Error("Invalid email or password");
  }

  return {
    token: signToken(user),
    user: sanitizeUser(user),
  };
};

const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

const getProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: Number(userId) },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return sanitizeUser(user);
};

module.exports = {
  register,
  login,
  verifyToken,
  getProfile,
};
