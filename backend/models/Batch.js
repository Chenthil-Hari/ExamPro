const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  name: { type: String, required: true },
  teacherId: { type: String, required: true }, // References User ID starting with 'TCH_'
  students: [{ type: String }], // Array of student User IDs starting with 'STU_'
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Batch', batchSchema);
