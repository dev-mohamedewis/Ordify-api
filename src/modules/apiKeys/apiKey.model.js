const mongoose = require('mongoose');

const apiKeySchema = new mongoose.Schema(
  {
    merchantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Merchant',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    keyPrefix: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    keyHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
      select: false
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    lastUsedAt: {
      type: Date,
      default: null
    },
    expiresAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ApiKey', apiKeySchema);
