require('dotenv').config(); // Load environment variables

const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const complaintRoutes = require("./routes/complaintRoutes");
const authMiddleware = require("./middleware/auth");

const app = express();
const PORT = process.env.PORT || 3000;

// ======================
// Middleware
// ======================
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || "yourSecretKey",
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    client: mongoose.connection.getClient(),
    ttl: 24 * 60 * 60, // Session TTL in seconds (1 day)
    autoRemove: 'native' // Let MongoDB handle expired sessions
  }),
  cookie: {
    secure: process.env.NODE_ENV === "production", // Use secure cookies in production
    httpOnly: true, // Prevent client-side JS from accessing the cookie
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));

// ======================
// Database Connection
// ======================
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/scms", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      tls: true
    });
    console.log("✅ MongoDB connected successfully.");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1); // Exit process with failure
  }
};

// Connect to the database before starting the server
connectDB().then(() => {
  // ======================
  // API Routes
// ======================
app.use("/auth", authRoutes);
app.use("/complaints", complaintRoutes);

// ======================
// Page Routes
// ======================

// Redirect logged-in users away from login/register
app.get(['/index.html', '/register.html'], (req, res, next) => {
  if (req.session.userId) return res.redirect('/home.html');
  next();
});

// Serve login page
app.get("/index.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Serve register page
app.get("/register.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "register.html"));
});

// Protected home page
app.get("/home.html", authMiddleware, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "home.html"));
});

// Default root route redirects to login
app.get("/", (req, res) => res.redirect("/index.html"));

// ======================
// Static Files
// ======================
app.use(express.static(path.join(__dirname, "public"), {
  extensions: ['html']
}));

// ======================
// Error Handling
// ======================
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "public", "404.html"));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).sendFile(path.join(__dirname, "public", "500.html"));
});

  // ======================
  // Start Server
  // ======================
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`🔑 Login page: http://localhost:${PORT}/index.html`);
  });
});
