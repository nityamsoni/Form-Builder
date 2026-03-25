const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const router = express.Router();

const uploadsRoot = path.resolve(__dirname, "../../uploads");

const safeSegment = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "") || "item";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const formId = safeSegment(req.params.formId || "unknown_form");
    const fieldName = safeSegment(req.params.fieldName || "file");
    const targetDir = path.join(uploadsRoot, `form_${formId}`, fieldName);

    fs.mkdirSync(targetDir, { recursive: true });
    cb(null, targetDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "") || "";
    const base = safeSegment(path.basename(file.originalname || "upload", ext));
    const stamp = `${Date.now()}_${Math.round(Math.random() * 1e9)}`;
    cb(null, `${base}_${stamp}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024,
  },
});

router.post("/form/:formId/field/:fieldName", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const relativePath = path.relative(uploadsRoot, req.file.path).split(path.sep).join("/");
  const url = `/uploads/${relativePath}`;

  res.status(201).json({
    filename: req.file.filename,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
    path: relativePath,
    url,
  });
});

module.exports = router;
