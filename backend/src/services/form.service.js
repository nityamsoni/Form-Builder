const prisma = require("../prisma/client");

// Create Form
const createForm = async (data) => {
  const form = await prisma.form.create({
    data: {
      name: data.name,
    },
  });

  await prisma.formVersion.create({
    data: {
      formId: form.id,
      versionNo: 1,
      status: "draft",
      title: "Working Draft",
    },
  });

  return form;
};

// List all forms
const listForms = async () => {
  return prisma.form.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      _count: {
        select: {
          versions: true,
          submissions: true,
        },
      },
    },
  });
};

// Get Form by ID
const getFormById = async (id) => {
  return prisma.form.findUnique({
    where: { id: Number(id) },
    include: {
      fields: true,
      versions: {
        orderBy: {
          versionNo: "desc",
        },
      },
      submissions: {
        orderBy: {
          submittedAt: "desc",
        },
        take: 20,
      },
      _count: {
        select: {
          versions: true,
          submissions: true,
          fields: true,
        },
      },
    },
  });
};

// Update Form
const updateForm = async (id, data) => {
  return prisma.form.update({
    where: { id: Number(id) },
    data: {
      name: data.name,
    },
  });
};

// Delete Form
const deleteForm = async (id) => {
  const formId = Number(id);

  // Legacy flat fields table may still reference this form without cascade.
  await prisma.field.deleteMany({
    where: { formId },
  });

  return prisma.form.delete({
    where: { id: formId },
  });
};

module.exports = {
  createForm,
  listForms,
  getFormById,
  updateForm,
  deleteForm,
};