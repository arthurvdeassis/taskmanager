const db = require("../config/db");

const findByUsername = (username) => {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
      if (err) reject(err);
      resolve(row);
    });
  });
};

const create = ({ username, hashedPassword }) => {
  return new Promise((resolve, reject) => {
    db.run("INSERT INTO users (username, password) VALUES (?, ?)", [username, hashedPassword], function (err) {
      if (err) reject(err);
      resolve({ id: this.lastID });
    });
  });
};

module.exports = {
  findByUsername,
  create,
};