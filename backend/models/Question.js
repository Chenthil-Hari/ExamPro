const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  streamId: { type: String, required: true }, // neet, jee_main, jee_advanced, etc.
  type: { type: String, required: true }, // MCQ, MSQ, Integer
  subject: { type: String, required: true },
  text: { type: String, required: true },
  options: { type: [String], default: undefined }, // Only for MCQ/MSQ
  correct: { type: [Number], required: true }, // Option index or Integer value
  noNegative: { type: Boolean, default: false }
});

module.exports = mongoose.model('Question', questionSchema);
