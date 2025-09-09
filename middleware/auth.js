const jwt = require('jsonwebtoken');

// =================================================================
// JWT Verification Middleware:
// This middleware is responsible for protecting routes that require
// authentication. It checks for a valid JSON Web Token (JWT) in the
// 'Authorization' header of incoming requests.
//
// How it works:
// 1. It extracts the token from the 'Authorization' header, which
//    is expected to be in the format: "Bearer <token>".
// 2. If no token is found, it returns a 401 Unauthorized error,
//    as this indicates the user is not logged in.
// 3. If a token is present, it verifies the token using the secret
//    key. This ensures the token was issued by this server and has
//    not been tampered with.
// 4. If the token is valid, it decodes the payload (which contains
//    the user's information) and attaches it to the `req` object
//    as `req.user`. This makes the user's data available to any
//    downstream route handlers.
// 5. If the token is invalid (e.g., expired or malformed), it
//    returns a 401 Unauthorized error.
// =================================================================
module.exports = function(req, res, next) {
  // Get token from header
  const authHeader = req.header('Authorization');

  // Check if token exists
  if (!authHeader) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Check if token is in the correct format "Bearer <token>"
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ msg: 'Token format is invalid, authorization denied' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret");

    // Add user from payload to request object
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
