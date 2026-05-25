const prisma = require("../prisma/client");

const buildFormAccessWhere = () => ({});

// Create Form
const createForm = async (data, session) => {
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
const listForms = async (session) => {
  return prisma.form.findMany({
    where: buildFormAccessWhere(session),
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
const getFormById = async (id, session) => {
  const formId = Number(id);

  return prisma.form.findFirst({
    where: {
      id: formId,
      ...buildFormAccessWhere(session),
    },
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
const updateForm = async (id, data, session) => {
  const formId = Number(id);
  const existing = await prisma.form.findFirst({
    where: {
      id: formId,
      ...buildFormAccessWhere(session),
    },
    select: { id: true },
  });

  if (!existing) {
    throw new Error("Form not found");
  }

  return prisma.form.update({
    where: { id: formId },
    data: {
      name: data.name,
    },
  });
};

// Delete Form
const deleteForm = async (id, session) => {
  const formId = Number(id);
  const existing = await prisma.form.findFirst({
    where: {
      id: formId,
      ...buildFormAccessWhere(session),
    },
    select: { id: true },
  });

  if (!existing) {
    throw new Error("Form not found");
  }

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