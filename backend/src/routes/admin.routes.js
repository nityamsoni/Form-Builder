const express = require("express");
const adminController = require("../controllers/admin.controller");
const { requireAdmin } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/login", adminController.login);
router.get("/overview", requireAdmin, adminController.overview);
router.get("/users", requireAdmin, adminController.listUsers);
router.get("/users/:id", requireAdmin, adminController.getUser);
router.patch("/users/:id/role", requireAdmin, adminController.updateUserRole);
router.patch("/users/:id/status", requireAdmin, adminController.updateUserStatus);
router.post("/users/:id/reset-password", requireAdmin, adminController.resetUserPassword);
router.delete("/users/:id", requireAdmin, adminController.deleteUser);
router.get("/audit", requireAdmin, adminController.auditLogs);

module.exports = router;