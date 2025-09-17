const db = require("../config/db");

const findAllByUserId = (userId) => {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM tasks WHERE user_id = ? ORDER BY id", [userId], (err, rows) => {
      if (err) reject(err);
      resolve(rows);
    });
  });
};

const findAllSubtasksByUserId = (userId) => {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM subtasks WHERE user_id = ? ORDER BY id", [userId], (err, rows) => {
      if (err) reject(err);
      resolve(rows);
    });
  });
};

const findByTitleAndUserId = (title, userId) => {
  return new Promise((resolve, reject) => {
    db.get("SELECT id FROM tasks WHERE title = ? AND user_id = ?", [title, userId], (err, row) => {
      if (err) reject(err);
      resolve(row);
    });
  });
};

const create = ({ title, priority, dueDate, userId }) => {
  return new Promise((resolve, reject) => {
    const sql = "INSERT INTO tasks (title, priority, due_date, user_id) VALUES (?, ?, ?, ?)";
    db.run(sql, [title, priority, dueDate, userId], function (err) {
      if (err) reject(err);
      resolve({ id: this.lastID });
    });
  });
};

const update = (id, userId, fields) => {
  return new Promise((resolve, reject) => {
    const updateEntries = Object.keys(fields).map(key => `${key} = ?`);
    const params = [...Object.values(fields), id, userId];
    const sql = `UPDATE tasks SET ${updateEntries.join(", ")} WHERE id = ? AND user_id = ?`;
    
    db.run(sql, params, function (err) {
      if (err) reject(err);
      resolve({ changes: this.changes });
    });
  });
};

const remove = (id, userId) => {
  return new Promise((resolve, reject) => {
    db.run("DELETE FROM tasks WHERE id = ? AND user_id = ?", [id, userId], function (err) {
      if (err) reject(err);
      resolve({ changes: this.changes });
    });
  });
};

const createSubtask = ({ title, dueDate, taskId, userId }) => {
  return new Promise((resolve, reject) => {
    const sql = "INSERT INTO subtasks (title, due_date, task_id, user_id) VALUES (?, ?, ?, ?)";
    db.run(sql, [title, dueDate, taskId, userId], function (err) {
      if (err) reject(err);
      resolve({ id: this.lastID });
    });
  });
};

const updateSubtask = (id, userId, fields) => {
  return new Promise((resolve, reject) => {
    const updateEntries = Object.keys(fields).map(key => `${key} = ?`);
    const params = [...Object.values(fields), id, userId];
    const sql = `UPDATE subtasks SET ${updateEntries.join(", ")} WHERE id = ? AND user_id = ?`;
    
    db.run(sql, params, function (err) {
      if (err) reject(err);
      resolve({ changes: this.changes });
    });
  });
};

const removeSubtask = (id, userId) => {
  return new Promise((resolve, reject) => {
    db.run("DELETE FROM subtasks WHERE id = ? AND user_id = ?", [id, userId], function (err) {
      if (err) reject(err);
      resolve({ changes: this.changes });
    });
  });
};

module.exports = {
  findAllByUserId,
  findAllSubtasksByUserId,
  findByTitleAndUserId,
  create,
  update,
  remove,
  createSubtask,
  updateSubtask,
  removeSubtask,
};