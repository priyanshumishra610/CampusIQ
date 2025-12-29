const jwt = require('jsonwebtoken');
const pool = require('../database/connection');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({error: 'Access token required'});
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch user from database to ensure they still exist
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.userId]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({error: 'User not found'});
    }

    req.user = {
      id: result.rows[0].id,
      email: result.rows[0].email,
      role: result.rows[0].role,
      ...result.rows[0],
    };
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({error: 'Invalid token'});
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({error: 'Token expired'});
    }
    return res.status(500).json({error: 'Authentication error'});
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({error: 'Authentication required'});
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({error: 'Insufficient permissions'});
    }
    
    next();
  };
};

module.exports = {authenticateToken, authorizeRoles};

