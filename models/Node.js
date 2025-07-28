const mongoose = require('mongoose');

const nodeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  location: {
    type: String,
    required: true
  },
  sponsor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  sponsoredAt: {
    type: Date
  },
  status: {
    type: String,
    enum: ['available', 'maintenance', 'unavailable'],
    default: 'available'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Node', nodeSchema);