const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { check, validationResult } = require("express-validator");

const SALT_ROUNDS = 12;

// ======================
// Registration Route
// ======================
router.post("/register",
  [
    check("username").isLength({ min: 3 }).trim().escape(),
    check("email").isEmail().normalizeEmail(),
    check("password").isLength({ min: 6 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: "Invalid input", details: errors.array() });
    }

    const { username, email, password } = req.body;

    try {
      const existingUser = await User.findOne({ $or: [{ username }, { email }] });
      if (existingUser) {
        return res.status(400).json({ error: "Username or Email already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
      const user = new User({ username, email, password: hashedPassword });

      await user.save();

      // Auto-login after registration
      //req.session.userId = user._id;
      //req.session.username = user.username;

      res.status(201).json({ message: "Registration successful" });
    } catch (err) {
      console.error("Registration error:", err);
      res.status(500).json({ error: "Registration failed" });
    }
  }
);

// ======================
// Login Route
// ======================
router.post("/login",
  [
    check("username").exists(),
    check("password").exists()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    try {
      const user = await User.findOne({
        $or: [{ email: username }, { username: username }],
      });
      if (!user) return res.status(401).json({ error: "Invalid credentials" });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

      req.session.userId = user._id;
      req.session.username = user.username;

      res.status(200).json({ message: "Login successful" });
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ error: "Login failed" });
    }
  }
);

// ======================
// Logout Route
// ======================
router.post("/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ error: "Logout failed" });
    }
    res.clearCookie("connect.sid"); 
    res.status(200).json({ message: "Logout successful" });
  });
});

module.exports = router;
