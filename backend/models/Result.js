const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  streamId: { type: String, required: true },
  score: { type: Number, required: true },
  totalPossible: { type: Number, required: true },
  percentile: { type: Number },
  timeSpent: { type: Object, default: {} },
  completedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Result', resultSchema);
