const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const authorization = req.headers.authorization;
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null;
  const secret = process.env.JWT_SECRET;

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }
  if (!secret) {
    return res.status(500).json({ error: 'Authentication is not configured on the server.' });
  }

  jwt.verify(token, secret, (error, user) => {
    if (error) {
      return res.status(403).json({ error: 'Invalid or expired token.' });
    }
    req.user = user;
    return next();
  });
}

function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access forbidden: Insufficient permissions.' });
    }
    return next();
  };
}

module.exports = { authenticateToken, authorizeRoles };
