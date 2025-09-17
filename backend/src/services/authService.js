const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userRepository = require("../repositories/userRepository");

const JWT_SECRET = "tptestesoftware";

const registerUser = async ({ username, password }) => {
  if (!username || !password || username.trim() === '' || password.trim() === '') {
    const error = new Error("Nome de usuário e senha são obrigatórios.");
    error.statusCode = 400;
    throw error;
  }

  const existingUser = await userRepository.findByUsername(username);
  if (existingUser) {
    const error = new Error("Nome de usuário já existe.");
    error.statusCode = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = await userRepository.create({ username, hashedPassword });
  return newUser;
};

const loginUser = async ({ username, password }) => {
  if (!username || !password || username.trim() === '' || password.trim() === '') {
    const error = new Error("Nome de usuário e senha são obrigatórios.");
    error.statusCode = 400;
    throw error;
  }

  const user = await userRepository.findByUsername(username);
  if (!user) {
    const error = new Error("Credenciais inválidas.");
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const error = new Error("Credenciais inválidas.");
    error.statusCode = 401;
    throw error;
  }

  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: "1h" });
  return { token };
};

module.exports = {
  registerUser,
  loginUser,
};