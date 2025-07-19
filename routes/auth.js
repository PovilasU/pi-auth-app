const express = require("express");
const router = express.Router();
const { register, login, logout, profile } = require("../controllers/authController");
const { ensureAuth } = require("../middleware/authMiddleware");

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/profile", ensureAuth, profile);

module.exports = router;
