const express = require("express");
const router = express.Router({ mergeParams: true });
const versionController = require("../controllers/version.controller");

router.post("/", versionController.createVersion);
router.get("/", versionController.listVersions);
router.get("/schema", versionController.getSchema);
router.get("/:versionId/schema", versionController.getSchema);
router.post("/:versionId/nodes", versionController.createNode);
router.patch("/:versionId/nodes/bulk", versionController.bulkUpsertNodes);
router.patch("/:versionId/nodes/:nodeId", versionController.updateNode);
router.delete("/:versionId/nodes/:nodeId", versionController.deleteNode);
router.post("/:versionId/publish", versionController.publishVersion);

module.exports = router;