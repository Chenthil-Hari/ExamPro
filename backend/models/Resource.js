const mongoose = require('mongoose');

const ResourceSchema = new mongoose.Schema({
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
  title: { type: String, required: true },
  type: { type: String, enum: ['file', 'link'], required: true },
  url: { type: String, required: true }, // URL or File path
  uploadedBy: { type: String, required: true } // teacherId
}, { timestamps: true });

module.exports = mongoose.model('Resource', ResourceSchema);
