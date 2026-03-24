const prisma = require("../prisma/client");

// Create Field
const createField = async (data) => {
  return await prisma.field.create({
    data: {
      formId: Number(data.formId),
      type: data.type,
      name: data.name,
      label: data.label,
      order: data.order,
      column: data.column,
      required: data.required || false,
      pattern: data.pattern || null,
      options: data.options || null,
      uiConfig: data.uiConfig || null,
    },
  });
};

// Get fields by form
const getFieldsByForm = async (formId) => {
  return await prisma.field.findMany({
    where: { formId: Number(formId) },
    orderBy: { order: "asc" },
  });
};

module.exports = {
  createField,
  getFieldsByForm,
};