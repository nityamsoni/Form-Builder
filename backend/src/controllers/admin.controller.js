const adminService = require("../services/admin.service");

const login = async (req, res) => {
  try {
    const result = await adminService.login({
      adminId: req.body?.adminId,
      password: req.body?.password,
    });

    res.json(result);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};

const overview = async (_req, res) => {
  try {
    const summary = await adminService.getOverview();
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const listUsers = async (req, res) => {
  try {
    const users = await adminService.listUsers({
      query: req.query?.q,
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getUser = async (req, res) => {
  try {
    const user = await adminService.getUserDetail(req.params.id);
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const user = await adminService.updateUserRole({
      userId: req.params.id,
      role: req.body?.role,
    });
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const user = await adminService.updateUserStatus({
      userId: req.params.id,
      isActive: req.body?.isActive,
    });
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const resetUserPassword = async (req, res) => {
  try {
    const result = await adminService.resetUserPassword({
      userId: req.params.id,
      password: req.body?.password,
    });
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const result = await adminService.deleteUser({
      userId: req.params.id,
    });
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const auditLogs = async (req, res) => {
  try {
    const logs = await adminService.listAuditLogs({
      limit: req.query?.limit,
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  login,
  overview,
  listUsers,
  getUser,
  updateUserRole,
  updateUserStatus,
  resetUserPassword,
  deleteUser,
  auditLogs,
};