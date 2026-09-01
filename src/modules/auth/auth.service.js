const bcrypt = require('bcryptjs');
const Admin = require('../admins/admin.model');
const { signToken } = require('../../utils/jwt');

function invalidCredentialsError() {
  const error = new Error('Invalid email or password.');
  error.statusCode = 401;
  return error;
}

async function loginService(email, password) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const submittedPassword = String(password || '');

  if (!normalizedEmail || !submittedPassword) {
    throw invalidCredentialsError();
  }

  const admin = await Admin.findOne({ email: normalizedEmail }).select('+passwordHash');

  if (!admin || !admin.isActive) {
    throw invalidCredentialsError();
  }

  const passwordHash = admin.passwordHash || '';
  const isMatch = await bcrypt.compare(submittedPassword, passwordHash);

  if (!isMatch) {
    throw invalidCredentialsError();
  }

  const token = signToken({
    adminId: admin._id.toString(),
    role: admin.role || 'admin'
  });

  return {
    admin: {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role || 'admin'
    },
    token
  };
}

module.exports = { loginService };
