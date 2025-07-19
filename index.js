const express = require("express");
const session = require("express-session");
require("dotenv").config();

const app = express();
app.use(express.static("public"));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

const authRoutes = require("./routes/auth");
app.use("/", authRoutes);


app.listen(3000, () => console.log("Server running on http://localhost:3000"));
