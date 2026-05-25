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

module.exports = {
  login,
  overview,
};