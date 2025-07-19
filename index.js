const express = require("express");
const session = require("express-session");
const cors = require("cors");
require("dotenv").config();

const app = express();

// 1. Trust reverse proxy (e.g., NGINX, Cloudflare)
app.set("trust proxy", 1);

// 2. Serve static files (if applicable)
app.use(express.static("public"));

// 3. JSON and form parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. Enable CORS (optional — only if frontend is on a different origin)
app.use(cors({
  origin: "https://blog.tiksiandien.lt", // your frontend URL
  credentials: true                     // allow cookies/session to be sent
}));

// 5. Configure secure sessions
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,        // only send cookie over HTTPS
    httpOnly: true,      // prevent access from JS
    sameSite: "lax"      // allow some cross-origin but block CSRF
  }
}));

// 6. Routes
const authRoutes = require("./routes/auth");
app.use("/", authRoutes);

// 7. Start server
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
