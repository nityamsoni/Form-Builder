const express = require("express");
const router = express.Router();
const formController = require("../controllers/form.controller");

router.post("/", formController.createForm);
router.get("/", formController.listForms);
router.get("/:id", formController.getForm);
router.patch("/:id", formController.updateForm);
router.delete("/:id", formController.deleteForm);

module.exports = router;