const express = require("express");
const router = express.Router({ mergeParams: true });
const submissionController = require("../controllers/submission.controller");

router.post("/", submissionController.createSubmission);
router.get("/", submissionController.getSubmissions);

module.exports = router;