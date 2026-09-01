const bcrypt = require('bcryptjs');

async function hashValue(value) {
  const saltRounds = 10;
  return bcrypt.hash(value, saltRounds);
}

async function compareHash(value, hash) {
  return bcrypt.compare(value, hash);
}

module.exports = { hashValue, compareHash };
