const express = require("express");
const router = express.Router({ mergeParams: true });
const submissionController = require("../controllers/submission.controller");
const { requireAuth } = require("../middleware/auth.middleware");

router.post("/", submissionController.createSubmission);
router.get("/", requireAuth, submissionController.getSubmissions);

module.exports = router;