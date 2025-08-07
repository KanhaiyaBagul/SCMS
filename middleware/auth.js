// middleware/auth.js

module.exports = (req, res, next) => {
  if (req.session && req.session.userId) {
    next();
  } else {
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      // For API requests (like fetch)
      return res.status(401).json({ error: "Unauthorized. Please log in." });
    } else {
      // For browser-based navigation
      return res.redirect("/login.html");
    }
  }
};
