require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const User = require('./models/User');
const Result = require('./models/Result');
const Question = require('./models/Question');
const Stream = require('./models/Stream');

const defaultStreams = [
  { id: 'neet', name: 'NEET', subjectCount: 3, totalQuestions: 5, duration: 10, difficulty: 'Medium', marking: { correct: 4, wrong: -1 } },
  { id: 'jee_main', name: 'JEE Main', subjectCount: 3, totalQuestions: 5, duration: 10, difficulty: 'Hard', marking: { correct: 4, wrong: -1 } },
  { id: 'jee_advanced', name: 'JEE Advanced', subjectCount: 3, totalQuestions: 5, duration: 10, difficulty: 'Expert', marking: { correct: 4, wrong: -1 } },
  { id: 'iaat', name: 'IAAT', subjectCount: 2, totalQuestions: 5, duration: 10, difficulty: 'Medium', marking: { correct: 3, wrong: -1 } },
  { id: 'cuet', name: 'CUET', subjectCount: 3, totalQuestions: 5, duration: 10, difficulty: 'Easy', marking: { correct: 5, wrong: -1 } },
  { id: 'bitsat', name: 'BITSAT', subjectCount: 4, totalQuestions: 5, duration: 10, difficulty: 'Medium', marking: { correct: 3, wrong: -1 } }
];

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/examDB')
.then(() => console.log('✅ Connected to MongoDB Atlas'))
.catch(err => console.error('❌ MongoDB Connection Error:', err));

// --- ROUTES ---

// 0. Get Stream list (seeds database if empty)
app.get('/api/streams', async (req, res) => {
  try {
    let streamsList = await Stream.find({});
    if (streamsList.length === 0) {
      await Stream.insertMany(defaultStreams);
      streamsList = await Stream.find({});
    }
    res.json({ success: true, streams: streamsList });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 1. User Login (Upsert User)
app.post('/api/login', async (req, res) => {
  try {
    const { id, name, password, isGuest } = req.body;
    
    // Validate Admin credentials
    if (id === 'STU_hari@gmail.com' || name === 'hari@gmail.com') {
      if (password !== 'hari123') {
        return res.status(401).json({ success: false, error: 'Incorrect password for Admin account' });
      }
    }

    let user = await User.findOne({ userId: id });
    if (!user) {
      const isAdmin = id === 'STU_hari@gmail.com' || id.toLowerCase().includes('admin');
      user = new User({ userId: id, name, isGuest, isAdmin });
      await user.save();
    } else {
      // Ensure admin flag is active on existing record
      if (id === 'STU_hari@gmail.com' && !user.isAdmin) {
        user.isAdmin = true;
        await user.save();
      }
    }
    
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Save Result
app.post('/api/results', async (req, res) => {
  try {
    const { userId, streamId, score, totalPossible, percentile, timeSpent } = req.body;
    
    // Do not save results for guest users if desired, but we will save them here
    // since the frontend can handle the business logic of tracking.
    const result = new Result({
      userId,
      streamId,
      score,
      totalPossible,
      percentile,
      timeSpent
    });
    
    await result.save();
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Get User Profile & Past Results
app.get('/api/users/:userId/results', async (req, res) => {
  try {
    const results = await Result.find({ userId: req.params.userId }).sort({ completedAt: -1 });
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. Get Randomized Questions for a Stream
app.get('/api/questions/:streamId', async (req, res) => {
  try {
    const { streamId } = req.params;
    const limit = parseInt(req.query.limit, 10) || 5;
    const questions = await Question.find({ streamId });
    
    // Shuffle and pick requested limit of questions
    const shuffled = questions.sort(() => Math.random() - 0.5);
    const subset = shuffled.slice(0, limit);
    
    res.json({ success: true, questions: subset });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. Bookmark toggling
app.post('/api/users/:userId/bookmarks', async (req, res) => {
  try {
    const { userId } = req.params;
    const { questionId } = req.body;
    
    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    const index = user.bookmarks.indexOf(questionId);
    if (index > -1) {
      user.bookmarks.splice(index, 1); // remove
    } else {
      user.bookmarks.push(questionId); // add
    }
    await user.save();
    res.json({ success: true, bookmarks: user.bookmarks });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 6. Get user bookmarks
app.get('/api/users/:userId/bookmarks', async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.params.userId }).populate('bookmarks');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, bookmarks: user.bookmarks });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- ADMIN ROUTES ---

// 7. Get all users
app.get('/api/admin/users', async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 8. Get all results
app.get('/api/admin/results', async (req, res) => {
  try {
    const results = await Result.find({}).sort({ completedAt: -1 });
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 9. Get all questions
app.get('/api/admin/questions', async (req, res) => {
  try {
    const questions = await Question.find({}).sort({ streamId: 1, subject: 1 });
    res.json({ success: true, questions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 10. Add a question
app.post('/api/admin/questions', async (req, res) => {
  try {
    const q = new Question(req.body);
    await q.save();
    res.json({ success: true, question: q });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 10b. Bulk insert questions
app.post('/api/admin/questions/bulk', async (req, res) => {
  try {
    const { questions } = req.body;
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ success: false, error: 'Invalid or empty questions array.' });
    }
    const inserted = await Question.insertMany(questions);
    res.json({ success: true, count: inserted.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 11. Edit a question
app.put('/api/admin/questions/:id', async (req, res) => {
  try {
    const q = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, question: q });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 13. Update exam stream settings
app.put('/api/admin/streams/:id', async (req, res) => {
  try {
    const { totalQuestions, duration, difficulty, marking } = req.body;
    const stream = await Stream.findOneAndUpdate(
      { id: req.params.id },
      { totalQuestions, duration, difficulty, marking },
      { new: true }
    );
    if (!stream) return res.status(404).json({ success: false, error: 'Stream not found' });
    res.json({ success: true, stream });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
