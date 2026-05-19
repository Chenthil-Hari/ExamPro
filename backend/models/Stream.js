const mongoose = require('mongoose');

const StreamSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  subjectCount: { type: Number, default: 3 },
  totalQuestions: { type: Number, default: 5 },
  duration: { type: Number, default: 10 }, // in minutes
  difficulty: { type: String, default: 'Medium' },
  marking: {
    correct: { type: Number, default: 4 },
    wrong: { type: Number, default: -1 }
  }
});

module.exports = mongoose.model('Stream', StreamSchema);
