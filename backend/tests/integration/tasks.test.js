const request = require("supertest");
const app = require("../../src/index");
const db = require("../../src/config/db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const JWT_SECRET = "tptestesoftware";

const run = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });

const get = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
  });

describe("Testes de Integração da API de Tarefas e Subtarefas", () => {
  
  let userToken;
  let testUserId;

  beforeAll(async () => {
    await run("DELETE FROM subtasks");
    await run("DELETE FROM tasks");
    await run("DELETE FROM users");

    const hashedPassword = await bcrypt.hash('testpass', 10);
    const userInsert = await run("INSERT INTO users (username, password) VALUES (?, ?)", ['testuser', hashedPassword]);
    testUserId = userInsert.lastID;
    userToken = jwt.sign({ id: testUserId, username: 'testuser' }, JWT_SECRET, { expiresIn: "1h" });
  });

  afterAll((done) => {
    db.close(done);
  });

  describe('Operações CRUD em Tarefas', () => {
    let testTaskId;

    beforeEach(async () => {
      await run("DELETE FROM subtasks");
      await run("DELETE FROM tasks WHERE user_id = ?", [testUserId]);
  
      const taskInsert = await run("INSERT INTO tasks (title, user_id) VALUES (?, ?)", ["Tarefa de Teste Padrão", testUserId]);
      testTaskId = taskInsert.lastID;
    });

    // Teste 1: Criação de uma nova tarefa.
    test("Teste 1: POST /api/tasks -> Deve criar uma nova tarefa com sucesso", async () => {
      const newTaskData = { title: "Nova Tarefa via Teste" };

      const res = await request(app)
        .post("/api/tasks")
        .set('Authorization', `Bearer ${userToken}`)
        .send(newTaskData);

      expect(res.statusCode).toBe(201);
      expect(res.body.title).toBe(newTaskData.title);
      const taskInDb = await get("SELECT * FROM tasks WHERE title = ?", [newTaskData.title]);
      expect(taskInDb).toBeDefined();
    });
  
    // Teste 2: Listagem de tarefas.
    test("Teste 2: GET /api/tasks -> Deve retornar a lista de tarefas do usuário", async () => {
      const res = await request(app)
        .get("/api/tasks")
        .set('Authorization', `Bearer ${userToken}`);
  
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0].title).toBe("Tarefa de Teste Padrão");
    });
    
    // Teste 3: Atualização de uma tarefa existente.
    test("Teste 3: PUT /api/tasks/:id -> Deve atualizar uma tarefa existente", async () => {
      const updatedTaskData = { title: "Tarefa Atualizada", completed: 1 };

      const res = await request(app)
        .put(`/api/tasks/${testTaskId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updatedTaskData);
  
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe("Tarefa atualizada com sucesso");
      const taskInDb = await get("SELECT * FROM tasks WHERE id = ?", [testTaskId]);
      expect(taskInDb.title).toBe("Tarefa Atualizada");
      expect(taskInDb.completed).toBe(1);
    });
    
    // Teste 4: Deleção de uma tarefa existente.
    test("Teste 4: DELETE /api/tasks/:id -> Deve deletar uma tarefa existente", async () => {
      const res = await request(app)
        .delete(`/api/tasks/${testTaskId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(204);
      const taskInDb = await get("SELECT * FROM tasks WHERE id = ?", [testTaskId]);
      expect(taskInDb).toBeUndefined();
    });
  });

  describe('Operações CRUD em Subtarefas', () => {
    let parentTaskId;

    beforeEach(async () => {
        await run("DELETE FROM subtasks");
        await run("DELETE FROM tasks WHERE user_id = ?", [testUserId]);
        const taskInsert = await run("INSERT INTO tasks (title, user_id) VALUES (?, ?)", ["Tarefa Pai", testUserId]);
        parentTaskId = taskInsert.lastID;
    });

    // Teste 5: Criação de uma nova subtarefa.
    test('Teste 5: POST /api/tasks/:taskId/subtasks -> Deve criar uma subtarefa associada a uma tarefa', async () => {
        const newSubtaskData = { title: "Nova Subtarefa de Integração" };

        const res = await request(app)
          .post(`/api/tasks/${parentTaskId}/subtasks`)
          .set('Authorization', `Bearer ${userToken}`)
          .send(newSubtaskData);

        expect(res.statusCode).toBe(201);
        expect(res.body.title).toBe(newSubtaskData.title);
        const subtaskInDb = await get("SELECT * FROM subtasks WHERE title = ?", [newSubtaskData.title]);
        expect(subtaskInDb).toBeDefined();
        expect(subtaskInDb.task_id).toBe(parentTaskId);
      });

    // Teste 6: Atualização de uma subtarefa existente.
    test('Teste 6: PUT /api/tasks/subtasks/:id -> Deve atualizar uma subtarefa existente', async () => {
        const subtaskInsert = await run("INSERT INTO subtasks (title, task_id, user_id) VALUES (?, ?, ?)", ["Subtarefa para atualizar", parentTaskId, testUserId]);
        const subtaskId = subtaskInsert.lastID;

        const res = await request(app)
          .put(`/api/tasks/subtasks/${subtaskId}`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({ completed: 1, title: "Subtarefa foi atualizada" });

        expect(res.statusCode).toBe(200);
        const subtaskInDb = await get("SELECT * FROM subtasks WHERE id = ?", [subtaskId]);
        expect(subtaskInDb.completed).toBe(1);
        expect(subtaskInDb.title).toBe("Subtarefa foi atualizada");
    });

    // Teste 7: Deleção de uma subtarefa existente.
    test('Teste 7: DELETE /api/tasks/subtasks/:id -> Deve deletar uma subtarefa existente', async () => {
        const subtaskInsert = await run("INSERT INTO subtasks (title, task_id, user_id) VALUES (?, ?, ?)", ["Subtarefa para deletar", parentTaskId, testUserId]);
        const subtaskId = subtaskInsert.lastID;

        const res = await request(app)
          .delete(`/api/tasks/subtasks/${subtaskId}`)
          .set('Authorization', `Bearer ${userToken}`);

        expect(res.statusCode).toBe(204);
        const subtaskInDb = await get("SELECT * FROM subtasks WHERE id = ?", [subtaskId]);
        expect(subtaskInDb).toBeUndefined();
    });
  });
});