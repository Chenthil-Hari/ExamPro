const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  records: [{
    studentId: { type: String, required: true },
    status: { type: String, enum: ['Present', 'Absent'], required: true }
  }],
  recordedBy: { type: String, required: true } // teacherId
}, { timestamps: true });

// Ensure one record per batch per day
AttendanceSchema.index({ batchId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);
