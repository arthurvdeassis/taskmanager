const request = require("supertest");
const app = require("../../src/index");
const db = require("../../src/config/db");

const run = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });

describe("API de Autenticação - Testes de Integração", () => {
  
  beforeEach(async () => {
    await run("DELETE FROM users");
  });

  // Teste 1: Caminho do registro de novo usuário.
  test("Teste 1: Deve registrar um novo usuário com sucesso", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ username: "integ_user", password: "password123" });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe("Usuário registrado com sucesso!");
  });

  // Teste 2: Erro - Registro de usuário já existente.
  test("Teste 2: Deve falhar ao registrar um usuário duplicado e cobrir o erro do repositório", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ username: "duplicate_user", password: "password123" });

    const res = await request(app)
      .post("/api/auth/register")
      .send({ username: "duplicate_user", password: "password123" });

    expect(res.statusCode).toBe(409);
    expect(res.body.error).toBe("Nome de usuário já existe.");
  });

  // Teste 3: Caminho do login de usuário existente.
  test("Teste 3: Deve autenticar um usuário existente e retornar um token", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ username: "login_user", password: "password123" });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "login_user", password: "password123" });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("token");
  });
});