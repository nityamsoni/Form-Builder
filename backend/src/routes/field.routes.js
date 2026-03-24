const express = require("express");
const router = express.Router();
const fieldController = require("../controllers/field.controller");

router.post("/", fieldController.createField);
router.get("/:formId", fieldController.getFields);

module.exports = router;
