require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

// Route imports
const authRoutes = require("./routes/authRoutes");
const complaintRoutes = require("./routes/complaintRoutes");
const adminComplaintRoutes = require("./routes/admin/complaintRoutes");
const adminUserRoutes = require("./routes/admin/userRoutes");
const adminCategoryRoutes = require("./routes/admin/categoryRoutes");
const adminDepartmentRoutes = require("./routes/admin/departmentRoutes");
const adminActivityRoutes = require("./routes/admin/activityRoutes");
const adminLogRoutes = require("./routes/admin/logRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// API Routes
app.use("/auth", authRoutes);
app.use("/complaints", complaintRoutes);
app.use("/admin/complaints", adminComplaintRoutes);
app.use("/admin/users", adminUserRoutes);
app.use("/admin/categories", adminCategoryRoutes);
app.use("/admin/departments", adminDepartmentRoutes);
app.use("/admin/activities", adminActivityRoutes);
app.use("/admin/logs", adminLogRoutes);

// Static File Protection Middleware
const protectedPages = ['/home.html', '/dashboard.html', '/complaint-list.html'];
app.use((req, res, next) => {
  const token = req.cookies.token;

  if (protectedPages.includes(req.path) || req.path.startsWith('/admin/')) {
    if (!token) {
      return res.redirect('/index.html');
    }
    try {
      jwt.verify(token, process.env.JWT_SECRET);
      next();
    } catch (err) {
      return res.redirect('/index.html');
    }
  } else if (['/index.html', '/register.html'].includes(req.path)) {
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.user.role === 'admin') {
          return res.redirect('/admin/dashboard.html');
        }
        return res.redirect('/home.html');
      } catch (err) {
        // Invalid token, allow access
      }
    }
    next();
  } else {
    next();
  }
});

// Static Files
app.use(express.static(path.join(__dirname, "public")));

// Root Redirect
app.get("/", (req, res) => res.redirect("/index.html"));

// Error Handling
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "public", "404.html"));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).sendFile(path.join(__dirname, "public", "500.html"));
});

// Start Server
const start = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
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
