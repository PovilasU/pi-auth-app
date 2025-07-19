const express = require("express");
const session = require("express-session");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
require("dotenv").config();

const app = express();

// Trust proxy (Cloudflare, NGINX, etc.)
app.set("trust proxy", 1);

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Middleware
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session setup
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    // In production, cookies only sent over HTTPS
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax"
  }
}));

// Home page with forms and frontend JS
app.get("/", (req, res) => {
  res.send(`
  <!DOCTYPE html>
  <html lang="en">
  <head><meta charset="UTF-8" /><title>Register & Login</title></head>
  <body>
    <h1>Register</h1>
    <form id="registerForm">
      <input type="text" id="registerUsername" placeholder="Username" required />
      <input type="password" id="registerPassword" placeholder="Password" required />
      <button type="submit">Register</button>
    </form>

    <h1>Login</h1>
    <form id="loginForm">
      <input type="text" id="loginUsername" placeholder="Username" required />
      <input type="password" id="loginPassword" placeholder="Password" required />
      <button type="submit">Login</button>
    </form>

    <h2 id="welcomeMessage" style="display:none;"></h2>
    <button id="logoutBtn" style="display:none;">Logout</button>

    <p id="message"></p>

    <script>
      const registerForm = document.getElementById("registerForm");
      const loginForm = document.getElementById("loginForm");
      const message = document.getElementById("message");
      const welcomeMessage = document.getElementById("welcomeMessage");
      const logoutBtn = document.getElementById("logoutBtn");

      registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const username = document.getElementById("registerUsername").value;
        const password = document.getElementById("registerPassword").value;
        const res = await fetch("/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });
        const text = await res.text();
        message.textContent = text;
      });

      loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const username = document.getElementById("loginUsername").value;
        const password = document.getElementById("loginPassword").value;
        const res = await fetch("/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });

        if (res.ok) {
          const data = await res.json();
          welcomeMessage.textContent = \`Welcome, \${data.username}!\`;
          welcomeMessage.style.display = "block";
          logoutBtn.style.display = "inline-block";
          registerForm.style.display = "none";
          loginForm.style.display = "none";
          message.textContent = "";
        } else {
          const errorText = await res.text();
          message.textContent = errorText;
        }
      });

      logoutBtn.addEventListener("click", async () => {
        const res = await fetch("/logout", { method: "POST" });
        if (res.ok) {
          welcomeMessage.style.display = "none";
          logoutBtn.style.display = "none";
          registerForm.style.display = "block";
          loginForm.style.display = "block";
          message.textContent = "Logged out successfully.";
        } else {
          message.textContent = "Logout failed.";
        }
      });

      // Auto check if user already logged in
      async function checkSession() {
        const res = await fetch("/profile");
        if (res.ok) {
          const data = await res.json();
          welcomeMessage.textContent = \`Welcome back, \${data.username}!\`;
          welcomeMessage.style.display = "block";
          logoutBtn.style.display = "inline-block";
          registerForm.style.display = "none";
          loginForm.style.display = "none";
        }
      }
      checkSession();
    </script>
  </body>
  </html>
  `);
});

// Register route
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).send("Username and password required");

  try {
    const hashed = await bcrypt.hash(password, 10);
    await pool.query("INSERT INTO users (username, password) VALUES ($1, $2)", [username, hashed]);
    res.send("Registration successful!");
  } catch (err) {
    console.error("Register error:", err);
    if (err.code === "23505") {
      // Unique violation (username exists)
      return res.status(400).send("Username already exists");
    }
    res.status(400).send("User may already exist or DB error");
  }
});

// Login route
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).send("Username and password required");

  try {
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
    if (result.rows.length === 0) return res.status(400).send("User not found");

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) return res.status(401).send("Incorrect password");

    // Save user info in session
    req.session.user = { id: user.id, username: user.username };
    res.json({ username: user.username });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).send("Server error");
  }
});

// Logout route
app.post("/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).send("Logout failed");
    res.send("Logged out");
  });
});

// Profile route to check session
app.get("/profile", (req, res) => {
  if (!req.session.user) return res.status(401).send("Not logged in");
  res.json({ username: req.session.user.username });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
