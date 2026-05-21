const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  streamId: { type: String, required: true }, // neet, jee_main, jee_advanced, etc.
  type: { type: String, required: true }, // MCQ, MSQ, Integer
  subject: { type: String, required: true },
  text: { type: String, required: true },
  options: { type: [String], default: undefined }, // Only for MCQ/MSQ
  correct: { type: [Number], required: true }, // Option index or Integer value
  noNegative: { type: Boolean, default: false },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  tags: { type: [String], default: [] },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
  createdBy: { type: String, default: 'admin' },
  version: { type: Number, default: 1 }
});

module.exports = mongoose.model('Question', questionSchema);

