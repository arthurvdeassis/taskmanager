const express = require("express");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("./db");

const app = express();
app.use(express.json());

const JWT_SECRET = "tptestesoftware";

const clientDist = path.join(__dirname, "../../frontend/dist");
app.use(express.static(clientDist));

app.post("/api/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Nome de usuário e senha são obrigatórios." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = "INSERT INTO users (username, password) VALUES (?, ?)";
    db.run(sql, [username, hashedPassword], function (err) {
      if (err) {
        if (err.message.includes("UNIQUE constraint failed")) {
          return res.status(409).json({ error: "Nome de usuário já existe." });
        }
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ message: "Usuário registrado com sucesso!" });
    });
  } catch (err) {
    res.status(500).json({ error: "Erro ao criptografar a senha." });
  }
});

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Nome de usuário e senha são obrigatórios." });
  }

  const sql = "SELECT * FROM users WHERE username = ?";
  db.get(sql, [username], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!user) {
      return res.status(401).json({ error: "Credenciais inválidas." });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Credenciais inválidas." });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: "1h" });
    res.json({ token, message: "Login bem-sucedido!" });
  });
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

app.get("/api/tasks", (req, res) => {
  const sqlTasks = "SELECT * FROM tasks ORDER BY id";
  const sqlSubtasks = "SELECT * FROM subtasks ORDER BY id";

  db.all(sqlTasks, [], (err, tasks) => {
    if (err) return res.status(500).json({ error: err.message });
    
    db.all(sqlSubtasks, [], (err, subtasks) => {
      if (err) return res.status(500).json({ error: err.message });
      
      const tasksMap = tasks.reduce((acc, task) => {
        task.subtasks = [];
        acc[task.id] = task;
        return acc;
      }, {});

      subtasks.forEach(subtask => {
        if (tasksMap[subtask.task_id]) {
          tasksMap[subtask.task_id].subtasks.push(subtask);
        }
      });

      res.json(Object.values(tasksMap));
    });
  });
});

app.post("/api/tasks/:taskId/subtasks", (req, res) => {
  const { title, due_date } = req.body;
  const taskId = req.params.taskId;

  if (!title) {
    return res.status(400).json({ error: "Título da sub-tarefa é obrigatório." });
  }

  const subtaskDueDate = (!due_date || due_date.trim() === '') ? 'Sem vencimento' : due_date;
  const sql = "INSERT INTO subtasks (title, due_date, task_id) VALUES (?, ?, ?)";

  db.run(sql, [title, subtaskDueDate, taskId], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ 
      id: this.lastID, 
      title, 
      completed: 0, 
      due_date: subtaskDueDate,
      task_id: Number(taskId) 
    });
  });
});

app.put("/api/subtasks/:id", (req, res) => {
  const { title, due_date, completed } = req.body;
  const id = req.params.id;

  let updateFields = [];
  let params = [];

  if (title !== undefined) {
    updateFields.push("title = ?");
    params.push(title);
  }
  if (due_date !== undefined) {
    const updatedDueDate = (due_date === '') ? 'Sem vencimento' : due_date;
    updateFields.push("due_date = ?");
    params.push(updatedDueDate);
  }
  if (completed !== undefined) {
    updateFields.push("completed = ?");
    params.push(completed ? 1 : 0);
  }

  if (updateFields.length === 0) {
    return res.status(400).json({ error: "Nenhum campo para atualizar." });
  }

  params.push(id);
  const sql = `UPDATE subtasks SET ${updateFields.join(", ")} WHERE id = ?`;

  db.run(sql, params, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: "Sub-tarefa não encontrada." });
    res.json({ message: "Sub-tarefa atualizada com sucesso." });
  });
});

app.delete("/api/subtasks/:id", (req, res) => {
  const id = req.params.id;
  const sql = "DELETE FROM subtasks WHERE id = ?";
  db.run(sql, [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: "Sub-tarefa não encontrada." });
    res.status(204).send();
  });
});

app.post("/api/tasks", (req, res) => {
  const { title, priority, due_date } = req.body;
  if (!title) return res.status(400).json({ error: "Título obrigatório" });

  const sqlCheck = "SELECT id FROM tasks WHERE title = ?";
  db.get(sqlCheck, [title], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (row) return res.status(409).json({ error: "Já existe uma tarefa com este nome." });
    
    const taskPriority = priority || "Normal";
    const taskDueDate = (!due_date || due_date.trim() === '') ? 'Sem vencimento' : due_date;
    const sqlInsert = "INSERT INTO tasks (title, priority, due_date) VALUES (?, ?, ?)";
    db.run(sqlInsert, [title, taskPriority, taskDueDate], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({
        id: this.lastID,
        title,
        completed: 0,
        priority: taskPriority,
        due_date: taskDueDate,
      });
    });
  });
});

app.put("/api/tasks/:id", (req, res) => {
  const id = req.params.id;
  const { title, priority, due_date, completed } = req.body;
  let updateFields = [], params = [];

  if (title !== undefined) { updateFields.push("title = ?"); params.push(title); }
  if (priority !== undefined) { updateFields.push("priority = ?"); params.push(priority); }
  if (due_date !== undefined) {
    const updatedDueDate = (due_date === '') ? 'Sem vencimento' : due_date;
    updateFields.push("due_date = ?");
    params.push(updatedDueDate);
}
  if (completed !== undefined) { updateFields.push("completed = ?"); params.push(completed ? 1 : 0); }

  if (updateFields.length === 0) return res.status(400).json({ error: "Nenhum campo para atualizar fornecido." });

  params.push(id);
  const sql = `UPDATE tasks SET ${updateFields.join(", ")} WHERE id = ?`;

  db.run(sql, params, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: "Tarefa não encontrada" });
    res.json({ message: "Tarefa atualizada com sucesso" });
  });
});

app.delete("/api/tasks/:id", (req, res) => {
  const id = req.params.id;
  db.run("DELETE FROM tasks WHERE id=?", [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: "Tarefa não encontrada" });
    res.status(204).send();
  });
});

app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(clientDist, "index.html"));
});

if (require.main === module) {
  app.listen(3000, () => console.log("Backend rodando na porta 3000"));
}

module.exports = app;