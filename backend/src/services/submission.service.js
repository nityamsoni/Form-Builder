const prisma = require("../prisma/client");

const getSubmissionVersion = async (formId, versionId) => {
  if (versionId) {
    const explicit = await prisma.formVersion.findFirst({
      where: {
        id: Number(versionId),
        formId: Number(formId),
      },
    });

    if (explicit) {
      return explicit;
    }
  }

  const published = await prisma.formVersion.findFirst({
    where: {
      formId: Number(formId),
      status: "published",
    },
    orderBy: { versionNo: "desc" },
  });

  if (published) {
    return published;
  }

  return prisma.formVersion.findFirst({
    where: {
      formId: Number(formId),
      status: "draft",
    },
    orderBy: { versionNo: "desc" },
  });
};

const createSubmission = async ({ formId, payload, versionId, meta }) => {
  const form = await prisma.form.findUnique({ where: { id: Number(formId) } });
  if (!form) {
    throw new Error("Form not found");
  }

  const version = await getSubmissionVersion(formId, versionId);
  if (!version) {
    throw new Error("No form version available for submission");
  }

  const nodes = await prisma.formNode.findMany({
    where: {
      versionId: version.id,
      nodeType: "field",
    },
    select: {
      id: true,
      name: true,
      fieldType: true,
    },
  });

  const nodeByName = new Map(nodes.map((node) => [node.name, node]));

  const data = payload && typeof payload === "object" ? payload : {};
  const values = Object.entries(data).map(([fieldName, value]) => {
    const node = nodeByName.get(fieldName) || null;
    return {
      nodeId: node?.id || null,
      fieldName,
      value: value == null ? null : value,
    };
  });

  return prisma.submission.create({
    data: {
      formId: Number(formId),
      versionId: version.id,
      meta: meta || null,
      values: {
        create: values,
      },
    },
    include: {
      values: true,
    },
  });
};

const listSubmissions = async (formId, limit = 50) => {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 50, 200));
  return prisma.submission.findMany({
    where: { formId: Number(formId) },
    include: {
      values: true,
      version: {
        select: {
          id: true,
          versionNo: true,
          status: true,
        },
      },
    },
    orderBy: { submittedAt: "desc" },
    take: safeLimit,
  });
};

module.exports = {
  createSubmission,
  listSubmissions,
};