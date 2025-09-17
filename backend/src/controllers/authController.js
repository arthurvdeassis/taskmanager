const authService = require('../services/authService');

const register = async (req, res) => {
  try {
    await authService.registerUser(req.body);
    res.status(201).json({ message: "Usuário registrado com sucesso!" });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { token } = await authService.loginUser(req.body);
    res.status(200).json({ token, message: "Login bem-sucedido!" });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

module.exports = {
  register,
  login,
};