const mongoose = require('mongoose');

const ResourceSchema = new mongoose.Schema({
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
  title: { type: String, required: true },
  type: { type: String, enum: ['file', 'link'], required: true },
  url: { type: String, required: true },       // Cloudinary CDN URL or external link
  uploadedBy: { type: String, required: true }, // teacherId
  fileName: { type: String, default: null },    // original file name
  mimeType: { type: String, default: null },    // e.g. 'application/pdf'
  cloudinaryId: { type: String, default: null } // Cloudinary public_id (for future deletion)
}, { timestamps: true });

module.exports = mongoose.model('Resource', ResourceSchema);
