const pool = require("../db/pool");
const bcrypt = require("bcrypt");

exports.register = async (req, res) => {
  const { username, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  try {
    await pool.query("INSERT INTO users (username, password) VALUES ($1, $2)", [username, hash]);
    res.send("User registered");
  } catch (err) {
    res.status(400).send("User may already exist");
  }
};

exports.login = async (req, res) => {
  const { username, password } = req.body;
  const result = await pool.query("SELECT * FROM users WHERE username = $1", [username]);

  if (result.rows.length === 0) return res.status(400).send("User not found");

  const user = result.rows[0];
  const match = await bcrypt.compare(password, user.password);

  if (match) {
    req.session.user = { id: user.id, username: user.username };
    res.send("Logged in");
  } else {
    res.status(401).send("Incorrect password");
  }
};

exports.logout = (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).send("Logout failed");
    res.send("Logged out");
  });
};

exports.profile = (req, res) => {
  res.send(`Welcome ${req.session.user.username}`);
};
