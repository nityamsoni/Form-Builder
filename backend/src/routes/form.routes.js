const express = require("express");
const router = express.Router();
const formController = require("../controllers/form.controller");
const { requireAuth } = require("../middleware/auth.middleware");

router.post("/", requireAuth, formController.createForm);
router.get("/", requireAuth, formController.listForms);
router.get("/:id", requireAuth, formController.getForm);
router.patch("/:id", requireAuth, formController.updateForm);
router.delete("/:id", requireAuth, formController.deleteForm);

module.exports = router;