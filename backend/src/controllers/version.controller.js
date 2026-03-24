const versionService = require("../services/version.service");

const createVersion = async (req, res) => {
  try {
    const version = await versionService.createVersion({
      formId: req.params.formId,
      title: req.body?.title,
      sourceVersionId: req.body?.sourceVersionId,
    });

    res.status(201).json(version);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const listVersions = async (req, res) => {
  try {
    const versions = await versionService.listVersions(req.params.formId);
    res.json(versions);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getSchema = async (req, res) => {
  try {
    const schema = await versionService.getVersionSchema({
      formId: req.params.formId,
      versionId: req.params.versionId || req.query.versionId,
    });

    res.json(schema);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

const createNode = async (req, res) => {
  try {
    const node = await versionService.createNode({
      formId: req.params.formId,
      versionId: req.params.versionId,
      node: req.body,
    });

    res.status(201).json(node);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const bulkUpsertNodes = async (req, res) => {
  try {
    const nodes = await versionService.bulkUpsertNodes({
      formId: req.params.formId,
      versionId: req.params.versionId,
      nodes: req.body?.nodes || [],
      replaceMissing: Boolean(req.body?.replaceMissing),
    });

    res.json(nodes);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const updateNode = async (req, res) => {
  try {
    const node = await versionService.updateNode({
      formId: req.params.formId,
      versionId: req.params.versionId,
      nodeId: req.params.nodeId,
      node: req.body,
    });

    res.json(node);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const deleteNode = async (req, res) => {
  try {
    const result = await versionService.deleteNode({
      formId: req.params.formId,
      versionId: req.params.versionId,
      nodeId: req.params.nodeId,
    });

    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const publishVersion = async (req, res) => {
  try {
    const version = await versionService.publishVersion({
      formId: req.params.formId,
      versionId: req.params.versionId,
    });

    res.json(version);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  createVersion,
  listVersions,
  getSchema,
  createNode,
  bulkUpsertNodes,
  updateNode,
  deleteNode,
  publishVersion,
};