const prisma = require("../prisma/client");

const assertCanAccessForm = async (formId) => {
  const where = { id: Number(formId) };

  const form = await prisma.form.findFirst({
    where,
    select: { id: true },
  });

  if (!form) {
    throw new Error("Form not found");
  }

  return form;
};

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

const createSubmission = async ({ formId, payload, versionId, meta, userId }) => {
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

  const submission = await prisma.submission.create({
    data: {
      formId: Number(formId),
      versionId: version.id,
      userId: userId != null ? Number(userId) : null,
      meta: meta || null,
      values: {
        create: values,
      },
    },
    include: {
      values: true,
    },
  });

  if (!submission.userId) {
    return submission;
  }

  const user = await prisma.user.findUnique({
    where: { id: submission.userId },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  return {
    ...submission,
    user,
  };
};

const listSubmissions = async (formId, limit = 50, session) => {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 50, 200));
  await assertCanAccessForm(formId);

  const submissions = await prisma.submission.findMany({
    where: { formId: Number(formId) },
    select: {
      id: true,
      formId: true,
      versionId: true,
      userId: true,
      submittedAt: true,
      meta: true,
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

  const userIds = [...new Set(submissions.map((item) => item.userId).filter(Boolean))];
  const users = userIds.length
    ? await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true,
          name: true,
          email: true,
        },
      })
    : [];

  const userMap = new Map(users.map((user) => [user.id, user]));

  return submissions.map((submission) => ({
    ...submission,
    user: submission.userId ? userMap.get(submission.userId) || null : null,
  }));
};

module.exports = {
  createSubmission,
  listSubmissions,
};