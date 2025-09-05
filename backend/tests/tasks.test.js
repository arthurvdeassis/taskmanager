const request = require("supertest");
const app = require("../src/index");
const db = require("../src/db");

// Helpers para usar sqlite3 com async/await
const run = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this); // this.lastID, this.changes
    });
  });

const all = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });

beforeAll(async () => {
  await run("DELETE FROM tasks");
});

afterAll((done) => {
  db.close(done);
});

beforeEach(async () => {
  await run("DELETE FROM tasks");
});

describe("API de Tarefas", () => {
  test("GET /api/tasks -> lista vazia inicialmente", async () => {
    const res = await request(app).get("/api/tasks");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([]);
  });

  test("POST /api/tasks -> cria tarefa", async () => {
    const res = await request(app).post("/api/tasks").send({ title: "Estudar Jest" });
    expect(res.statusCode).toBe(201);
    expect(res.body).toMatchObject({ title: "Estudar Jest", completed: 0 });
    const rows = await all("SELECT * FROM tasks");
    expect(rows).toHaveLength(1);
  });

  test("POST /api/tasks -> 400 sem título", async () => {
    const res = await request(app).post("/api/tasks").send({});
    expect(res.statusCode).toBe(400);
  });

  test("PUT /api/tasks/:id -> atualiza (completed=true)", async () => {
    const insert = await run("INSERT INTO tasks (title, completed) VALUES (?,?)", ["Tarefa A", 0]);
    const id = insert.lastID;

    const res = await request(app).put(`/api/tasks/${id}`).send({ completed: true });
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ id: String(id), completed: true });

    const rows = await all("SELECT * FROM tasks WHERE id = ?", [id]);
    expect(rows[0].completed).toBe(1);
  });

  test("PUT /api/tasks/:id -> 404 inexistente", async () => {
    const res = await request(app).put("/api/tasks/99999").send({ completed: true });
    expect(res.statusCode).toBe(404);
  });

  test("DELETE /api/tasks/:id -> remove tarefa", async () => {
    const insert = await run("INSERT INTO tasks (title, completed) VALUES (?,?)", ["Apagar", 0]);
    const id = insert.lastID;

    const res = await request(app).delete(`/api/tasks/${id}`);
    expect(res.statusCode).toBe(204);

    const rows = await all("SELECT * FROM tasks WHERE id = ?", [id]);
    expect(rows).toHaveLength(0);
  });

  test("DELETE /api/tasks/:id -> 404 inexistente", async () => {
    const res = await request(app).delete("/api/tasks/123456");
    expect(res.statusCode).toBe(404);
  });
});
