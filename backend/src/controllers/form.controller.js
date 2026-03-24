const formService = require("../services/form.service");

// POST /forms
const createForm = async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim();
    if (!name) {
      return res.status(400).json({ error: "Form name is required" });
    }

    const form = await formService.createForm(req.body);
    res.status(201).json(form);
  } catch (error) {
    if (String(error?.message || "").includes("does not exist")) {
      return res.status(500).json({
        error:
          "Database schema is out of date. Run Prisma migration and regenerate the client.",
      });
    }

    res.status(500).json({ error: error.message });
  }
};

// GET /forms
const listForms = async (req, res) => {
  try {
    const forms = await formService.listForms();
    res.json(forms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /forms/:id
const getForm = async (req, res) => {
  try {
    const form = await formService.getFormById(req.params.id);
    if (!form) return res.status(404).json({ message: "Form not found" });

    res.json(form);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PATCH /forms/:id
const updateForm = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "Invalid form id" });
    }

    const name = String(req.body?.name || "").trim();
    if (!name) {
      return res.status(400).json({ error: "Form name is required" });
    }

    const form = await formService.updateForm(id, { name });
    res.json(form);
  } catch (error) {
    if (String(error?.code || "") === "P2025") {
      return res.status(404).json({ error: "Form not found" });
    }

    res.status(500).json({ error: error.message });
  }
};

// DELETE /forms/:id
const deleteForm = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "Invalid form id" });
    }

    await formService.deleteForm(id);
    res.status(204).send();
  } catch (error) {
    if (String(error?.code || "") === "P2025") {
      return res.status(404).json({ error: "Form not found" });
    }

    if (String(error?.code || "") === "P2003") {
      return res.status(409).json({
        error: "Form cannot be deleted due to linked data constraints.",
      });
    }

    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createForm,
  listForms,
  getForm,
  updateForm,
  deleteForm,
};