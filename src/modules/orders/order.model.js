const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true
    },
    productName: {
      type: String,
      required: true,
      trim: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0
    },
    variant: {
      color: { type: String, trim: true, default: null },
      size: { type: String, trim: true, default: null },
      other: { type: String, trim: true, default: null }
    }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    merchant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Merchant',
      required: true,
      index: true
    },
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true
    },
    customer: {
      name: { type: String, trim: true, default: null },
      phone: { type: String, trim: true, default: null }
    },
    items: [orderItemSchema],
    subtotal: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    total: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
      index: true
    },
    notes: {
      type: String,
      trim: true,
      default: null
    }
  },
  { timestamps: true }
);

orderSchema.index({ merchant: 1, createdAt: -1 });
orderSchema.index({ conversation: 1, status: 1 });

module.exports = mongoose.model('Order', orderSchema);
