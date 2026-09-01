const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    merchant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Merchant',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    sku: {
      type: String,
      trim: true,
      default: null
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  { timestamps: true }
);

productSchema.index({ merchant: 1, sku: 1 }, { unique: true, sparse: true });
productSchema.index({ merchant: 1, createdAt: -1 });

module.exports = mongoose.model('Product', productSchema);
