const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const merchantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password: { type: String, required: true, trim: true, select: false },
    storeName: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    status: { type: String, enum: ['active', 'suspended'], default: 'active' }
  },
  { timestamps: true }
);

merchantSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

merchantSchema.methods.toJSON = function toJSON() {
  const merchant = this.toObject();
  delete merchant.password;
  return merchant;
};

module.exports = mongoose.model('Merchant', merchantSchema);
