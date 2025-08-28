require('dotenv').config(); // Load environment variables

const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const complaintRoutes = require("./routes/complaintRoutes");
const authMiddleware = require("./middleware/auth");

const app = express();
const PORT = process.env.PORT || 3000;

// ======================
// Middleware
// ======================

// Body parsers: allow JSON and form data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session config
app.use(session({
  secret: process.env.SESSION_SECRET || "yourSecretKey",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));

// ======================
// Database Connection
// ======================
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/scms", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  tls:true
})
.then(() => console.log("✅ MongoDB connected successfully."))
.catch(err => console.error("❌ MongoDB connection error:", err));

// ======================
// Routes
// ======================

// API Routes
app.use("/auth", authRoutes);
app.use("/complaints", complaintRoutes);

// If already logged in, prevent access to login/register pages
app.get(['/login.html', '/register.html'], (req, res, next) => {
  if (req.session.userId) {
    return res.redirect('/index.html');
  }
  next();
});

// Protected Home Route
app.get("/index.html", authMiddleware, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Default Route
app.get("/", (req, res) => res.redirect("/login.html"));

// ======================
// Static Files
// ======================
app.use(express.static(path.join(__dirname, "public"), {
  extensions: ['html'],
  index: false
}));

// ======================
// Error Handling
// ======================

// 404 Page
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "public", "404.html"));
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).sendFile(path.join(__dirname, "public", "500.html"));
});

// ======================
// Start Server
// ======================
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`🔑 Login page: http://localhost:${PORT}/login.html`);
});
