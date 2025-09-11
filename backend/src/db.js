const sqlite3 = require("sqlite3").verbose();

const DB_SOURCE = "./db/tasks.db";

const db = new sqlite3.Database(DB_SOURCE, (err) => {
  if (err) {
    console.error(err.message);
    throw err;
  }
  console.log("Conectado ao banco de dados SQLite.");
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    completed INTEGER DEFAULT 0,
    priority TEXT DEFAULT 'Normal',
    due_date TEXT,
    user_id INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  )`, (err) => {
    if (err) console.error("Erro ao criar tabela 'tasks':", err.message);
  });

  db.run(`CREATE TABLE IF NOT EXISTS subtasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    completed INTEGER DEFAULT 0,
    due_date TEXT, 
    task_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  )`, (err) => {
    if (err) {
      console.error("Erro ao criar tabela 'subtasks':", err.message);
    } else {
      console.log("Tabelas 'tasks' e 'subtasks' garantidas.");
    }
  });

  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  )`, (err) => {
    if (err) {
      console.error("Erro ao criar tabela 'users':", err.message);
    } else {
      console.log("Tabela 'users' garantida.");
    }
  });
});

module.exports = db;