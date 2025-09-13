const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { check, validationResult } = require("express-validator");
const validator = require("validator");

const SALT_ROUNDS = 12;

// ======================
// Registration Route
// ======================
router.post("/register",
  [
    check("username").isLength({ min: 3 }).trim(),
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
    check("username").exists().trim(),
    check("password").exists(),
    check("role").isIn(['user', 'admin'])
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password, role } = req.body;

    try {
      // If the identifier is an email, normalize it for the email query.
      // The original `username` is kept for the username query.
      const identifierAsEmail = validator.isEmail(username)
        ? validator.normalizeEmail(username)
        : username;

      const user = await User.findOne({
        $or: [
          { email: identifierAsEmail },
          { username: username }
        ],
      }).read('primary');
      if (!user) return res.status(401).json({ error: "Invalid credentials" });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

      // Check if the selected role matches the user's actual role
      if (user.role !== role) {
        // For security, don't reveal which part was wrong.
        // The error message is generic but the frontend can interpret it.
        return res.status(403).json({ error: "Access denied for the selected role. Please try again." });
      }

      // =================================================================
      // JWT Generation:
      // Instead of creating a session, we generate a JSON Web Token (JWT).
      // The token contains the user's ID and username in its payload.
      // It's signed with a secret key from environment variables for security.
      // The token is sent to the client to be stored and used for future
      // authenticated requests.
      // =================================================================
      const payload = {
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: "1h" }, // Token expires in 1 hour
        (err, token) => {
          if (err) throw err;
          res.json({ token }); // Send the token to the client
        }
      );
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ error: "Login failed" });
    }
  }
);

// =================================================================
// Note on Logout:
// The /logout route has been removed. Logout is now handled on the
// client-side by deleting the stored JWT. This is a stateless
// approach, meaning the server doesn't need to keep track of logged-in
// users.
// =================================================================

module.exports = router;
