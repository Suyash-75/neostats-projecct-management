const jwt = require('jsonwebtoken');
const prisma = require('./prisma/client');

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

  jwt.verify(token, secret, async (error, claims) => {
    if (error) {
      return res.status(403).json({ error: 'Invalid or expired token.' });
    }
    try {
      const user = await prisma.user.findUnique({
        where: { id: claims.id },
        select: { id: true, email: true, role: true, isActive: true },
      });
      if (!user || !user.isActive) {
        return res.status(401).json({ error: 'Account no longer exists.' });
      }
      req.user = user;
      return next();
    } catch (databaseError) {
      console.error('Loading authenticated user failed:', databaseError);
      return res.status(503).json({ error: 'Unable to verify account permissions right now.' });
    }
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
