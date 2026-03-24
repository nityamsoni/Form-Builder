const prisma = require("../prisma/client");

const STRUCTURAL_TYPES = ["thead", "tbody", "tr", "th", "td"];

const canParentContain = (parentType, childType) => {
  if (!parentType) {
    if (childType === "page") {
      return true;
    }
    return !STRUCTURAL_TYPES.includes(childType);
  }

  if (childType === "page") {
    return false;
  }

  if (parentType === "table") {
    return childType === "thead" || childType === "tbody";
  }

  if (parentType === "thead" || parentType === "tbody") {
    return childType === "tr";
  }

  if (parentType === "tr") {
    return childType === "th" || childType === "td";
  }

  if (parentType === "th" || parentType === "td") {
    return !STRUCTURAL_TYPES.includes(childType);
  }

  return true;
};

const getParentNode = async (versionId, parentId) => {
  if (parentId == null) {
    return null;
  }

  const parent = await prisma.formNode.findFirst({
    where: {
      id: Number(parentId),
      versionId: Number(versionId),
    },
    select: {
      id: true,
      parentId: true,
      nodeType: true,
    },
  });

  if (!parent) {
    throw new Error("Parent node not found in this version");
  }

  return parent;
};

const assertNoCycle = async (versionId, nodeId, nextParentId) => {
  if (!nodeId || nextParentId == null) {
    return;
  }

  if (Number(nodeId) === Number(nextParentId)) {
    throw new Error("A node cannot be parent of itself");
  }

  let cursorId = Number(nextParentId);
  const guard = new Set();

  while (cursorId != null) {
    if (guard.has(cursorId)) {
      throw new Error("Invalid hierarchy detected");
    }
    guard.add(cursorId);

    if (cursorId === Number(nodeId)) {
      throw new Error("Circular parent relation is not allowed");
    }

    const parent = await prisma.formNode.findFirst({
      where: {
        id: Number(cursorId),
        versionId: Number(versionId),
      },
      select: {
        parentId: true,
      },
    });

    if (!parent) {
      break;
    }

    cursorId = parent.parentId;
  }
};

const validatePlacement = async ({ versionId, nodeType, parentId, nodeId }) => {
  if (!nodeType) {
    throw new Error("nodeType is required");
  }

  await assertNoCycle(versionId, nodeId, parentId);

  const parent = await getParentNode(versionId, parentId);
  const parentType = parent ? parent.nodeType : null;

  if (!canParentContain(parentType, nodeType)) {
    throw new Error(`Cannot place '${nodeType}' under '${parentType || "root"}'`);
  }
};

const assertFormVersionOwnership = async (formId, versionId) => {
  const version = await prisma.formVersion.findFirst({
    where: {
      id: Number(versionId),
      formId: Number(formId),
    },
  });

  if (!version) {
    throw new Error("Form version not found");
  }

  return version;
};

const nextVersionNumber = async (formId) => {
  const last = await prisma.formVersion.findFirst({
    where: { formId: Number(formId) },
    orderBy: { versionNo: "desc" },
    select: { versionNo: true },
  });

  return (last?.versionNo || 0) + 1;
};

const createVersion = async ({ formId, title, sourceVersionId }) => {
  const form = await prisma.form.findUnique({ where: { id: Number(formId) } });
  if (!form) {
    throw new Error("Form not found");
  }

  const versionNo = await nextVersionNumber(formId);

  const created = await prisma.formVersion.create({
    data: {
      formId: Number(formId),
      versionNo,
      title: title || `v${versionNo}`,
      status: "draft",
    },
  });

  if (sourceVersionId) {
    const source = await prisma.formVersion.findFirst({
      where: {
        id: Number(sourceVersionId),
        formId: Number(formId),
      },
    });

    if (source) {
      const sourceNodes = await prisma.formNode.findMany({
        where: { versionId: Number(sourceVersionId) },
        orderBy: [{ id: "asc" }],
      });

      const idMap = new Map();
      for (const node of sourceNodes) {
        const createdNode = await prisma.formNode.create({
          data: {
            versionId: created.id,
            parentId: null,
            nodeType: node.nodeType,
            name: node.name,
            label: node.label,
            key: node.key,
            fieldType: node.fieldType,
            required: node.required,
            position: node.position,
            column: node.column,
            placeholder: node.placeholder,
            helperText: node.helperText,
            options: node.options,
            validationRules: node.validationRules,
            dependencyRules: node.dependencyRules,
            designConfig: node.designConfig,
            meta: node.meta,
          },
        });
        idMap.set(node.id, createdNode.id);
      }

      for (const node of sourceNodes) {
        if (!node.parentId) continue;
        await prisma.formNode.update({
          where: { id: idMap.get(node.id) },
          data: { parentId: idMap.get(node.parentId) || null },
        });
      }
    }
  }

  return created;
};

const listVersions = async (formId) => {
  return prisma.formVersion.findMany({
    where: { formId: Number(formId) },
    orderBy: [{ versionNo: "desc" }],
  });
};

const getVersionSchema = async ({ formId, versionId }) => {
  let version = null;

  if (versionId) {
    version = await assertFormVersionOwnership(formId, versionId);
  } else {
    version = await prisma.formVersion.findFirst({
      where: { formId: Number(formId), status: "draft" },
      orderBy: [{ versionNo: "desc" }],
    });

    if (!version) {
      version = await prisma.formVersion.findFirst({
        where: { formId: Number(formId), status: "published" },
        orderBy: [{ versionNo: "desc" }],
      });
    }
  }

  if (!version) {
    throw new Error("Form version not found");
  }

  const nodes = await prisma.formNode.findMany({
    where: { versionId: version.id },
    orderBy: [{ position: "asc" }, { id: "asc" }],
  });

  return { version, nodes };
};

const createNode = async ({ formId, versionId, node }) => {
  await assertFormVersionOwnership(formId, versionId);

  await validatePlacement({
    versionId,
    nodeType: node.nodeType,
    parentId: node.parentId ? Number(node.parentId) : null,
  });

  if (node.nodeType === "field" && !node.fieldType) {
    throw new Error("fieldType is required for field nodes");
  }

  return prisma.formNode.create({
    data: {
      versionId: Number(versionId),
      parentId: node.parentId ? Number(node.parentId) : null,
      nodeType: node.nodeType,
      name: node.name || null,
      label: node.label || null,
      key: node.key || null,
      fieldType: node.fieldType || null,
      required: Boolean(node.required),
      position: Number(node.position || 0),
      column: node.column != null ? Number(node.column) : null,
      placeholder: node.placeholder || null,
      helperText: node.helperText || null,
      options: node.options || null,
      validationRules: node.validationRules || null,
      dependencyRules: node.dependencyRules || null,
      designConfig: node.designConfig || null,
      meta: node.meta || null,
    },
  });
};

const bulkUpsertNodes = async ({ formId, versionId, nodes, replaceMissing }) => {
  await assertFormVersionOwnership(formId, versionId);

  if (!Array.isArray(nodes)) {
    throw new Error("nodes must be an array");
  }

  const touchedIds = [];

  for (const node of nodes) {
    if (!node || !node.nodeType) {
      continue;
    }

    const payload = {
      parentId: node.parentId ? Number(node.parentId) : null,
      nodeType: node.nodeType,
      name: node.name || null,
      label: node.label || null,
      key: node.key || null,
      fieldType: node.fieldType || null,
      required: Boolean(node.required),
      position: Number(node.position || 0),
      column: node.column != null ? Number(node.column) : null,
      placeholder: node.placeholder || null,
      helperText: node.helperText || null,
      options: node.options || null,
      validationRules: node.validationRules || null,
      dependencyRules: node.dependencyRules || null,
      designConfig: node.designConfig || null,
      meta: node.meta || null,
    };

    await validatePlacement({
      versionId,
      nodeType: payload.nodeType,
      parentId: payload.parentId,
      nodeId: node.id ? Number(node.id) : null,
    });

    if (node.id) {
      const updated = await prisma.formNode.updateMany({
        where: {
          id: Number(node.id),
          versionId: Number(versionId),
        },
        data: payload,
      });

      if (updated.count > 0) {
        touchedIds.push(Number(node.id));
      }
    } else {
      const created = await prisma.formNode.create({
        data: {
          versionId: Number(versionId),
          ...payload,
        },
      });
      touchedIds.push(created.id);
    }
  }

  if (replaceMissing) {
    await prisma.formNode.deleteMany({
      where: {
        versionId: Number(versionId),
        id: { notIn: touchedIds.length ? touchedIds : [-1] },
      },
    });
  }

  return prisma.formNode.findMany({
    where: { versionId: Number(versionId) },
    orderBy: [{ position: "asc" }, { id: "asc" }],
  });
};

const updateNode = async ({ formId, versionId, nodeId, node }) => {
  await assertFormVersionOwnership(formId, versionId);

  const existingNode = await prisma.formNode.findFirst({
    where: {
      id: Number(nodeId),
      versionId: Number(versionId),
    },
    select: {
      id: true,
      nodeType: true,
      parentId: true,
    },
  });

  if (!existingNode) {
    throw new Error("Node not found");
  }

  const nextNodeType = node.nodeType || existingNode.nodeType;
  const nextParentId =
    node.parentId === undefined
      ? existingNode.parentId
      : node.parentId != null
      ? Number(node.parentId)
      : null;

  await validatePlacement({
    versionId,
    nodeType: nextNodeType,
    parentId: nextParentId,
    nodeId: Number(nodeId),
  });

  const updated = await prisma.formNode.updateMany({
    where: {
      id: Number(nodeId),
      versionId: Number(versionId),
    },
    data: {
      nodeType: node.nodeType,
      parentId: node.parentId != null ? Number(node.parentId) : undefined,
      name: node.name,
      label: node.label,
      key: node.key,
      fieldType: node.fieldType,
      required: node.required != null ? Boolean(node.required) : undefined,
      position: node.position != null ? Number(node.position) : undefined,
      column: node.column != null ? Number(node.column) : undefined,
      placeholder: node.placeholder,
      helperText: node.helperText,
      options: node.options,
      validationRules: node.validationRules,
      dependencyRules: node.dependencyRules,
      designConfig: node.designConfig,
      meta: node.meta,
    },
  });

  if (!updated.count) {
    throw new Error("Node not found");
  }

  return prisma.formNode.findUnique({ where: { id: Number(nodeId) } });
};

const deleteNode = async ({ formId, versionId, nodeId }) => {
  await assertFormVersionOwnership(formId, versionId);

  const deleted = await prisma.formNode.deleteMany({
    where: {
      id: Number(nodeId),
      versionId: Number(versionId),
    },
  });

  if (!deleted.count) {
    throw new Error("Node not found");
  }

  return { success: true };
};

const publishVersion = async ({ formId, versionId }) => {
  await assertFormVersionOwnership(formId, versionId);
  await prisma.formVersion.updateMany({
    where: {
      formId: Number(formId),
      status: "published",
    },
    data: { status: "archived" },
  });

  return prisma.formVersion.update({
    where: { id: Number(versionId) },
    data: {
      status: "published",
      publishedAt: new Date(),
    },
  });
};

module.exports = {
  createVersion,
  listVersions,
  getVersionSchema,
  createNode,
  bulkUpsertNodes,
  updateNode,
  deleteNode,
  publishVersion,
};