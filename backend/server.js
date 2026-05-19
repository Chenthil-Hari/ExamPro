require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const User = require('./models/User');
const Result = require('./models/Result');

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
      user = new User({ userId: id, name, isGuest });
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

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
