const jwt = require('jsonwebtoken');
const { getEnv } = require('../config/env');
const { getUserById } = require('../services/authService');

const JWT_SECRET = getEnv('JWT_SECRET', 'supersecretkey');

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication token required' });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const user = await getUserById(decoded.id);
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized profile access' });
  }
}

module.exports = authMiddleware;
