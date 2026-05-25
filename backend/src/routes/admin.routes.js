const express = require("express");
const adminController = require("../controllers/admin.controller");
const { requireAdmin } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/login", adminController.login);
router.get("/overview", requireAdmin, adminController.overview);

module.exports = router;