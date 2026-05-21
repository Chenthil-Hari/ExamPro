const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  streamId: { type: String, required: true },
  score: { type: Number, required: true },
  totalPossible: { type: Number, required: true },
  percentile: { type: Number },
  timeSpent: { type: Object, default: {} },
  completedAt: { type: Date, default: Date.now },
  assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', default: null },
  ipAddress: { type: String },
  deviceInfo: { type: String },
  warningsCount: { type: Number, default: 0 },
  questionOrder: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  correctQuestionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }]
});

module.exports = mongoose.model('Result', resultSchema);

