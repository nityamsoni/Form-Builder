const submissionService = require("../services/submission.service");
const authService = require("../services/auth.service");

const getOptionalUserId = (req) => {
  const headerValue = String(req.headers.authorization || "");
  if (!headerValue.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  const token = headerValue.slice(7).trim();
  if (!token) {
    return null;
  }

  try {
    const payload = authService.verifyToken(token);
    if (payload.role === "admin") {
      return null;
    }

    const userId = Number(payload.sub);
    return Number.isFinite(userId) ? userId : null;
  } catch (_error) {
    return null;
  }
};

const createSubmission = async (req, res) => {
  try {
    const submission = await submissionService.createSubmission({
      formId: req.params.formId,
      payload: req.body?.payload || {},
      versionId: req.body?.versionId,
      meta: req.body?.meta || null,
      userId: getOptionalUserId(req),
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
      req.query.limit,
      req.user
    );

    res.json(data);
  } catch (error) {
    if (String(error?.message || "") === "Form not found") {
      return res.status(404).json({ error: "Form not found" });
    }

    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  createSubmission,
  getSubmissions,
};