const authService = require("../services/auth.service");

const register = async (req, res) => {
  try {
    const result = await authService.register({
      name: req.body?.name,
      email: req.body?.email,
      password: req.body?.password,
    });

    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const result = await authService.login({
      email: req.body?.email,
      password: req.body?.password,
    });

    res.json(result);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};

const me = async (req, res) => {
  try {
    const user = await authService.getProfile(req.user.id);
    res.json(user);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};

const logout = async (_req, res) => {
  res.status(204).send();
};

module.exports = {
  register,
  login,
  me,
  logout,
};
