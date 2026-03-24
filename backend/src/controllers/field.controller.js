const fieldService = require("../services/field.service");

// POST /fields
const createField = async (req, res) => {
  try {
    const field = await fieldService.createField(req.body);
    res.status(201).json(field);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// GET /fields/:formId
const getFields = async (req, res) => {
  try {
    const fields = await fieldService.getFieldsByForm(req.params.formId);
    res.json(fields);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createField,
  getFields,
};