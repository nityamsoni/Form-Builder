const express = require("express");
const router = express.Router({ mergeParams: true });
const versionController = require("../controllers/version.controller");
const { requireAuth } = require("../middleware/auth.middleware");

router.post("/", requireAuth, versionController.createVersion);
router.get("/", requireAuth, versionController.listVersions);
router.get("/schema", versionController.getSchema);
router.get("/:versionId/schema", versionController.getSchema);
router.post("/:versionId/nodes", requireAuth, versionController.createNode);
router.patch("/:versionId/nodes/bulk", requireAuth, versionController.bulkUpsertNodes);
router.patch("/:versionId/nodes/:nodeId", requireAuth, versionController.updateNode);
router.delete("/:versionId/nodes/:nodeId", requireAuth, versionController.deleteNode);
router.post("/:versionId/publish", requireAuth, versionController.publishVersion);

module.exports = router;