require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const User = require('./models/User');
const Result = require('./models/Result');
const Question = require('./models/Question');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/examDB')
.then(() => console.log('✅ Connected to MongoDB Atlas'))
.catch(err => console.error('❌ MongoDB Connection Error:', err));

// --- ROUTES ---

// 1. User Login (Upsert User)
app.post('/api/login', async (req, res) => {
  try {
    const { id, name, isGuest } = req.body;
    
    let user = await User.findOne({ userId: id });
    if (!user) {
      const isAdmin = id.toLowerCase().includes('admin');
      user = new User({ userId: id, name, isGuest, isAdmin });
      await user.save();
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
    const questions = await Question.find({ streamId });
    
    // Shuffle and pick 5 random questions
    const shuffled = questions.sort(() => Math.random() - 0.5);
    const subset = shuffled.slice(0, 5);
    
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

// 11. Edit a question
app.put('/api/admin/questions/:id', async (req, res) => {
  try {
    const q = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, question: q });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 12. Delete a question
app.delete('/api/admin/questions/:id', async (req, res) => {
  try {
    await Question.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
