const mongoose = require('mongoose');

const communityQuestionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  subject: { type: String, default: 'General' },
  postedBy: { type: String, required: true }, // userId of the student (e.g. STU_hari@gmail.com)
  authorName: { type: String, required: true },
  upvotes: [{ type: String }], // Array of userIds who upvoted the question
  answers: [{
    content: { type: String, required: true },
    postedBy: { type: String, required: true },
    authorName: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    upvotes: [{ type: String }]
  }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CommunityQuestion', communityQuestionSchema);
