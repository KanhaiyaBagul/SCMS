require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

const authRoutes = require("./routes/authRoutes");
const complaintRoutes = require("./routes/complaintRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

// ======================
// Middleware
// ======================
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser()); // Use cookie-parser to read cookies

// ======================
// API Routes
// ======================
const adminComplaintRoutes = require("./routes/admin/complaintRoutes");
const adminUserRoutes = require("./routes/admin/userRoutes");
const adminCategoryRoutes = require("./routes/admin/categoryRoutes");
const adminDepartmentRoutes = require("./routes/admin/departmentRoutes");

app.use("/auth", authRoutes);
app.use("/complaints", complaintRoutes);
app.use("/admin/complaints", adminComplaintRoutes);
app.use("/admin/users", adminUserRoutes);
app.use("/admin/categories", adminCategoryRoutes);
app.use("/admin/departments", adminDepartmentRoutes);
const adminLogRoutes = require("./routes/admin/logRoutes");
app.use("/admin/logs", adminLogRoutes);
const adminActivityRoutes = require("./routes/admin/activityRoutes");
app.use("/admin/activities", adminActivityRoutes);

// =================================================================
// Static File Protection Middleware:
// This middleware protects static HTML files from being accessed
// directly without authentication.
//
// How it works:
// 1. It defines a list of pages that require authentication.
// 2. When a request is made for one of these protected pages, it
//    checks for a JWT stored in a cookie named 'token'.
// 3. If the cookie/token is missing or invalid, it redirects the
//    user to the login page (`/index.html`).
// 4. If the token is valid, it allows the request to proceed,
//    letting `express.static` serve the file.
// 5. It also prevents logged-in users from accessing the login
//    and register pages by redirecting them to the home page.
// =================================================================
const protectedPages = ['/home.html', '/dashboard.html', '/complaint-list.html'];

app.use((req, res, next) => {
  const token = req.cookies.token;

  // If accessing a protected page
  if (protectedPages.includes(req.path)) {
    if (!token) {
      return res.redirect('/index.html'); // Not logged in
    }
    try {
      jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret");
      next(); // Token is valid, proceed
    } catch (err) {
      return res.redirect('/index.html'); // Token invalid
    }
  }
  // If accessing login/register page
  else if (['/index.html', '/register.html'].includes(req.path)) {
    if (token) {
      try {
        jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret");
        return res.redirect('/home.html'); // Already logged in
      } catch (err) {
        // Invalid token, allow access to login/register
      }
    }
    next();
  }
  // For all other requests
  else {
    next();
  }
});

// ======================
// Static Files
// ======================
app.use(express.static(path.join(__dirname, "public")));

// ======================
// Root Redirect
// ======================
app.get("/", (req, res) => res.redirect("/index.html"));

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
const start = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/scms", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      tls: true
    });
    console.log("✅ MongoDB connected successfully.");
    app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

start();
