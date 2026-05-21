const mongoose = require('mongoose');

const activeExamSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  userName: { type: String, required: true },
  streamId: { type: String, required: true },
  assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', default: null },
  startedAt: { type: Date, default: Date.now },
  forceSubmit: { type: Boolean, default: false },
  warnings: { type: Number, default: 0 },
  deviceInfo: { type: String },
  ipAddress: { type: String }
});

module.exports = mongoose.model('ActiveExam', activeExamSchema);
