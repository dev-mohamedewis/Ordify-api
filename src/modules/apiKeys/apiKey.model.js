const mongoose = require('mongoose');

const apiKeySchema = new mongoose.Schema(
  {
    merchantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant', required: true },
    key: { type: String, required: true, unique: true, trim: true },
    name: { type: String, trim: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ApiKey', apiKeySchema);
