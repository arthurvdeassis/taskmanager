const request = require("supertest");
const app = require("../src/index");
const db = require("../src/db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const JWT_SECRET = "tptestesoftware";

const run = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this); // this.lastID, this.changes
    });
  });

const get = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
  });

const all = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });

let userToken;
let testTaskId;
let testSubtaskId;

beforeAll(async () => {
  await run("DELETE FROM tasks");
  await run("DELETE FROM subtasks");
  await run("DELETE FROM users");

  const hashedPassword = await bcrypt.hash('testpass', 10);
  await run("INSERT INTO users (username, password) VALUES (?, ?)", ['testuser', hashedPassword]);
  const user = await get("SELECT * FROM users WHERE username = ?", ['testuser']);
  userToken = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: "1h" });
});

afterAll((done) => {
  db.close(done);
});

beforeEach(async () => {
  await run("DELETE FROM tasks");
  await run("DELETE FROM subtasks");

  const taskInsert = await run("INSERT INTO tasks (title) VALUES (?)", ["Tarefa de Teste"]);
  testTaskId = taskInsert.lastID;
  const subtaskInsert = await run("INSERT INTO subtasks (title, task_id) VALUES (?, ?)", ["Subtarefa de Teste", testTaskId]);
  testSubtaskId = subtaskInsert.lastID;
});


describe("Testes de Autenticação", () => {
  test("POST /api/register -> registra um novo usuário com sucesso", async () => {
    const res = await request(app).post("/api/register").send({ username: "newuser", password: "newpass" });
    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe("Usuário registrado com sucesso!");
    const user = await get("SELECT * FROM users WHERE username = ?", ['newuser']);
    expect(user).toBeDefined();
  });

  test("POST /api/register -> falha com 400 se a senha for vazia", async () => {
    const res = await request(app).post("/api/register").send({ username: "user_sem_senha" });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Nome de usuário e senha são obrigatórios.");
  });

  test("POST /api/register -> falha com 400 se o username for vazio", async () => {
    const res = await request(app).post("/api/register").send({ password: "pass_sem_user" });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Nome de usuário e senha são obrigatórios.");
  });

  test("POST /api/register -> falha se o nome de usuário já existe", async () => {
    const res = await request(app).post("/api/register").send({ username: "testuser", password: "somepass" });
    expect(res.statusCode).toBe(409);
    expect(res.body.error).toBe("Nome de usuário já existe.");
  });

  test("POST /api/login -> login bem-sucedido e retorna token", async () => {
    const res = await request(app).post("/api/login").send({ username: "testuser", password: "testpass" });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("token");
  });

  test("POST /api/login -> falha com 400 se a senha for vazia", async () => {
    const res = await request(app).post("/api/login").send({ username: "testuser" });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Nome de usuário e senha são obrigatórios.");
  });

  test("POST /api/login -> falha com 400 se o username for vazio", async () => {
    const res = await request(app).post("/api/login").send({ password: "testpass" });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Nome de usuário e senha são obrigatórios.");
  });
  
  test("POST /api/login -> falha com 401 se o usuário não existe", async () => {
    const res = await request(app).post("/api/login").send({ username: "nonexistent", password: "somepass" });
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe("Credenciais inválidas.");
  });

  test("POST /api/login -> falha com 401 se a senha está errada", async () => {
    const res = await request(app).post("/api/login").send({ username: "testuser", password: "wrongpass" });
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe("Credenciais inválidas.");
  });
});

describe("API de Tarefas (Rotas Protegidas)", () => {
  test("GET /api/tasks -> retorna tarefas para um usuário autenticado", async () => {
    const res = await request(app).get("/api/tasks").set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([{
      "completed": 0,
      "due_date": null,
      "id": testTaskId,
      "priority": "Normal",
      "subtasks": [
        {
          "completed": 0,
          "due_date": null,
          "id": testSubtaskId,
          "task_id": testTaskId,
          "title": "Subtarefa de Teste"
        }
      ],
      "title": "Tarefa de Teste"
    }]);
  });

  test("POST /api/tasks -> cria uma nova tarefa com sucesso", async () => {
    const res = await request(app).post("/api/tasks").set('Authorization', `Bearer ${userToken}`).send({ title: "Nova Tarefa", priority: "Alta" });
    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe("Nova Tarefa");
    expect(res.body.priority).toBe("Alta");
  });

  test("POST /api/tasks -> 400 se o título estiver vazio", async () => {
    const res = await request(app).post("/api/tasks").set('Authorization', `Bearer ${userToken}`).send({ title: "" });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Título obrigatório");
  });

  test("POST /api/tasks -> 409 se a tarefa já existe", async () => {
    await request(app).post("/api/tasks").set('Authorization', `Bearer ${userToken}`).send({ title: "Tarefa Duplicada" });
    const res = await request(app).post("/api/tasks").set('Authorization', `Bearer ${userToken}`).send({ title: "Tarefa Duplicada" });
    expect(res.statusCode).toBe(409);
    expect(res.body.error).toBe("Já existe uma tarefa com este nome.");
  });

  test("PUT /api/tasks/:id -> atualiza uma tarefa existente", async () => {
    const res = await request(app).put(`/api/tasks/${testTaskId}`).set('Authorization', `Bearer ${userToken}`).send({ title: "Tarefa atualizada", completed: 1 });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Tarefa atualizada com sucesso");
  });
  
  test("PUT /api/tasks/:id -> 404 se a tarefa não existe", async () => {
    const res = await request(app).put("/api/tasks/99999").set('Authorization', `Bearer ${userToken}`).send({ title: "Inexistente" });
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe("Tarefa não encontrada");
  });

  test("PUT /api/tasks/:id -> 400 se não houver campos para atualizar", async () => {
    const res = await request(app).put(`/api/tasks/${testTaskId}`).set('Authorization', `Bearer ${userToken}`).send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Nenhum campo para atualizar fornecido.");
  });

  test("DELETE /api/tasks/:id -> deleta uma tarefa existente", async () => {
    const res = await request(app).delete(`/api/tasks/${testTaskId}`).set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toBe(204);
    const deletedTask = await get("SELECT * FROM tasks WHERE id = ?", [testTaskId]);
    expect(deletedTask).toBeUndefined();
  });
  
  test("DELETE /api/tasks/:id -> 404 se a tarefa não existe", async () => {
    const res = await request(app).delete("/api/tasks/99999").set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe("Tarefa não encontrada");
  });
});

describe("API de Sub-tarefas (Rotas Protegidas)", () => {
  test("POST /api/tasks/:taskId/subtasks -> adiciona uma sub-tarefa a uma tarefa existente", async () => {
    const res = await request(app).post(`/api/tasks/${testTaskId}/subtasks`).set('Authorization', `Bearer ${userToken}`).send({ title: "Subtarefa 1", due_date: "2025-09-10" });
    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe("Subtarefa 1");
    expect(res.body.due_date).toBe("2025-09-10");
  });

  test("POST /api/tasks/:taskId/subtasks -> 400 se o título da sub-tarefa estiver vazio", async () => {
    const res = await request(app).post(`/api/tasks/${testTaskId}/subtasks`).set('Authorization', `Bearer ${userToken}`).send({ title: "" });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Título da sub-tarefa é obrigatório.");
  });

  test("PUT /api/subtasks/:id -> atualiza uma sub-tarefa existente", async () => {
    const res = await request(app).put(`/api/subtasks/${testSubtaskId}`).set('Authorization', `Bearer ${userToken}`).send({ completed: 1 });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Sub-tarefa atualizada com sucesso.");
  });
  
  test("PUT /api/subtasks/:id -> 404 se a sub-tarefa não existe", async () => {
    const res = await request(app).put("/api/subtasks/99999").set('Authorization', `Bearer ${userToken}`).send({ completed: 1 });
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe("Sub-tarefa não encontrada.");
  });

  test("PUT /api/subtasks/:id -> 400 se não houver campos para atualizar", async () => {
    const res = await request(app).put(`/api/subtasks/${testSubtaskId}`).set('Authorization', `Bearer ${userToken}`).send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Nenhum campo para atualizar.");
  });
  
  test("DELETE /api/subtasks/:id -> deleta uma sub-tarefa existente", async () => {
    const res = await request(app).delete(`/api/subtasks/${testSubtaskId}`).set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toBe(204);
    const deletedSubtask = await get("SELECT * FROM subtasks WHERE id = ?", [testSubtaskId]);
    expect(deletedSubtask).toBeUndefined();
  });

  test("DELETE /api/subtasks/:id -> 404 se a sub-tarefa não existe", async () => {
    const res = await request(app).delete("/api/subtasks/99999").set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe("Sub-tarefa não encontrada.");
  });
});

describe("Testes de Autenticação (Rotas Protegidas)", () => {
  const invalidToken = "invalid-token";

  test("GET /api/tasks -> 401 sem token", async () => {
    const res = await request(app).get("/api/tasks");
    expect(res.statusCode).toBe(401);
  });

  test("GET /api/tasks -> 403 com token inválido", async () => {
    const res = await request(app).get("/api/tasks").set('Authorization', `Bearer ${invalidToken}`);
    expect(res.statusCode).toBe(403);
  });

  test("POST /api/tasks -> 401 sem token", async () => {
    const res = await request(app).post("/api/tasks").send({ title: "Teste" });
    expect(res.statusCode).toBe(401);
  });
  
  test("PUT /api/tasks/:id -> 401 sem token", async () => {
    const res = await request(app).put(`/api/tasks/${testTaskId}`).send({ completed: 1 });
    expect(res.statusCode).toBe(401);
  });
  
  test("DELETE /api/tasks/:id -> 401 sem token", async () => {
    const res = await request(app).delete(`/api/tasks/${testTaskId}`);
    expect(res.statusCode).toBe(401);
  });
  
  test("POST /api/tasks/:id/subtasks -> 401 sem token", async () => {
    const res = await request(app).post(`/api/tasks/${testTaskId}/subtasks`).send({ title: "Teste" });
    expect(res.statusCode).toBe(401);
  });
  
  test("PUT /api/subtasks/:id -> 401 sem token", async () => {
    const res = await request(app).put(`/api/subtasks/${testSubtaskId}`).send({ completed: 1 });
    expect(res.statusCode).toBe(401);
  });
  
  test("DELETE /api/subtasks/:id -> 401 sem token", async () => {
    const res = await request(app).delete(`/api/subtasks/${testSubtaskId}`);
    expect(res.statusCode).toBe(401);
  });
});