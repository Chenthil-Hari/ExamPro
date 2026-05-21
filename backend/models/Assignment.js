const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
  streamId: { type: String, required: true }, // e.g. neet, jee_main
  customQuestions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }], // Optional specific questions
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  instructions: { type: String, default: '' },
  createdBy: { type: String, required: true }, // References User ID starting with 'TCH_'
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Assignment', assignmentSchema);
