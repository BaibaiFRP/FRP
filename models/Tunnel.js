const mongoose = require('mongoose');

const tunnelSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  protocol: {
    type: String,
    enum: ['TCP', 'UDP', 'HTTP', 'HTTPS'],
    required: true
  },
  localPort: {
    type: Number,
    required: true
  },
  remotePort: {
    type: Number,
    required: true
  },
  description: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Tunnel', tunnelSchema);