const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      enum: ['customer', 'merchant', 'system'],
      required: true
    },
    text: {
      type: String,
      required: true,
      trim: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const conversationSchema = new mongoose.Schema(
  {
    merchant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Merchant',
      required: true,
      index: true
    },
    customer: {
      name: { type: String, trim: true },
      phone: { type: String, trim: true }
    },
    channel: {
      type: String,
      enum: ['whatsapp', 'messenger', 'instagram', 'telegram', 'manual'],
      required: true,
      index: true
    },
    messages: [messageSchema],
    status: {
      type: String,
      enum: ['active', 'closed'],
      default: 'active',
      index: true
    }
  },
  { timestamps: true }
);

conversationSchema.index({ merchant: 1, createdAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);
