const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    merchantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant', required: true },
    customerName: { type: String, trim: true },
    source: { type: String, default: 'chat' },
    messageText: { type: String, required: true },
    status: { type: String, default: 'received' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Conversation', conversationSchema);
