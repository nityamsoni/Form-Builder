const submissionService = require("../services/submission.service");

const createSubmission = async (req, res) => {
  try {
    const submission = await submissionService.createSubmission({
      formId: req.params.formId,
      payload: req.body?.payload || {},
      versionId: req.body?.versionId,
      meta: req.body?.meta || null,
    });

    res.status(201).json(submission);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getSubmissions = async (req, res) => {
  try {
    const data = await submissionService.listSubmissions(
      req.params.formId,
      req.query.limit
    );

    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  createSubmission,
  getSubmissions,
};