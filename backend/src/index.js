const express = require("express");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const cors = require("cors");

const app = express();
app.use(cors());
const PORT = process.env.PORT || 5000;

const fieldRoutes = require("./routes/field.routes");
const versionRoutes = require("./routes/version.routes");
const submissionRoutes = require("./routes/submission.routes");
const uploadRoutes = require("./routes/upload.routes");
const authRoutes = require("./routes/auth.routes");
const adminRoutes = require("./routes/admin.routes");


const formRoutes = require("./routes/form.routes");
const prisma = require("./prisma/client");
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/forms", formRoutes);
app.use("/forms/:formId/versions", versionRoutes);
app.use("/forms/:formId/submissions", submissionRoutes);
app.use("/uploads", uploadRoutes);
app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));
app.use("/fields", fieldRoutes);
app.get("/", (req, res) => {
  res.send("API Running 🚀");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "formbuilder-api" });
});

app.get("/health/db", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", database: "reachable" });
  } catch (error) {
    res.status(500).json({ status: "error", database: "unreachable" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});