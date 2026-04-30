const express = require("express");
const router = express.Router();
const fieldController = require("../controllers/field.controller");
const { requireAuth } = require("../middleware/auth.middleware");

router.post("/", requireAuth, fieldController.createField);
router.get("/:formId", requireAuth, fieldController.getFields);

module.exports = router;
