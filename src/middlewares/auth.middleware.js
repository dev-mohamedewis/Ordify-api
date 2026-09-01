const Admin = require('../modules/admins/admin.model');
const { verifyToken } = require('../utils/jwt');

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      const error = new Error('Authentication token is required.');
      error.statusCode = 401;
      throw error;
    }

    const decoded = verifyToken(token);
    const adminId = decoded.adminId || decoded.id;

    if (!decoded || !adminId) {
      const error = new Error('Invalid token payload.');
      error.statusCode = 401;
      throw error;
    }

    const admin = await Admin.findById(adminId).lean();

    if (!admin) {
      const error = new Error('Admin account not found.');
      error.statusCode = 401;
      throw error;
    }

    if (!admin.isActive || admin.role !== 'admin') {
      const error = new Error('Admin access required.');
      error.statusCode = 403;
      throw error;
    }

    req.admin = {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      error.statusCode = 401;
      error.message = 'Invalid or expired token.';
    }

    next(error);
  }
}

module.exports = authMiddleware;
