require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const User = require('./models/User');
const Result = require('./models/Result');
const Question = require('./models/Question');
const Stream = require('./models/Stream');
const CommunityQuestion = require('./models/CommunityQuestion');
const Batch = require('./models/Batch');
const Attendance = require('./models/Attendance');
const Resource = require('./models/Resource');
const Assignment = require('./models/Assignment');
const Announcement = require('./models/Announcement');
const Message = require('./models/Message');
const ActiveExam = require('./models/ActiveExam');

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
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const path = require('path');

// Cloudinary setup
const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://chenthilhari_db_user:Yx6QhpxRt1LT5ONu@cluster0.f4v8akm.mongodb.net/examDB?appName=Cluster0')
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

// 1. User Sign Up (Register User)
app.post('/api/signup', async (req, res) => {
  try {
    const { id, name, password, isTeacher } = req.body;
    if (!id || !name || !password) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const existingUser = await User.findOne({ userId: id });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'User already exists. Please login.' });
    }

    const isTeacherRole = id.startsWith('TCH_') || isTeacher;
    const isAdmin = id === 'STU_hari@gmail.com' || id.toLowerCase().includes('admin');

    const user = new User({
      userId: id,
      name,
      password,
      isGuest: false,
      isAdmin,
      isTeacher: isTeacherRole
    });

    await user.save();
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. User Login
app.post('/api/login', async (req, res) => {
  try {
    const { id, password } = req.body;
    if (!id || !password) {
      return res.status(400).json({ success: false, error: 'User ID and password are required' });
    }

    // Validate Admin credentials override
    if (id === 'STU_hari@gmail.com' && password !== 'hari123') {
      return res.status(401).json({ success: false, error: 'Incorrect password for Admin account' });
    }

    let user = await User.findOne({ userId: id });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User does not exist. Please sign up first.' });
    }

    // Validate password
    if (user.password && user.password !== password) {
      return res.status(401).json({ success: false, error: 'Incorrect password' });
    }

    // Auto-save password if not set in DB
    if (!user.password) {
      user.password = password;
      await user.save();
    }

    // Ensure admin flag is active on existing record
    if (id === 'STU_hari@gmail.com' && !user.isAdmin) {
      user.isAdmin = true;
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
    const { userId, streamId, score, totalPossible, percentile, timeSpent, assignmentId, ipAddress, deviceInfo, warningsCount, questionOrder, correctQuestionIds } = req.body;
    
    const result = new Result({
      userId,
      streamId,
      score,
      totalPossible,
      percentile,
      timeSpent,
      assignmentId: assignmentId || null,
      ipAddress,
      deviceInfo,
      warningsCount: warningsCount || 0,
      questionOrder: questionOrder || [],
      correctQuestionIds: correctQuestionIds || []
    });
    
    await result.save();
    
    // Clean up active exam session on submission
    await ActiveExam.findOneAndDelete({ userId });
    
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
    const questions = await Question.find({ streamId, status: 'approved' });
    
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

// --- COMMUNITY Q&A FORUM ROUTES ---

// 1. Get all community questions
app.get('/api/community/questions', async (req, res) => {
  try {
    const questions = await CommunityQuestion.find({}).sort({ createdAt: -1 });
    res.json({ success: true, questions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 1b. Single file upload endpoint (Cloudinary)
app.post('/api/upload', async (req, res) => {
  try {
    const { fileBase64, fileName } = req.body;
    if (!fileBase64) {
      return res.status(400).json({ success: false, error: 'No file data provided' });
    }
    const ext = fileName ? path.extname(fileName).replace('.', '') : 'bin';
    const uploadResult = await cloudinary.uploader.upload(fileBase64, {
      folder: 'exampro/uploads',
      resource_type: 'raw',
      format: ext
    });
    res.json({ success: true, url: uploadResult.secure_url });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Post a new community question
app.post('/api/community/questions', async (req, res) => {
  try {
    const { title, content, subject, postedBy, authorName, attachment } = req.body;
    if (!title || !content || !postedBy || !authorName) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    const q = new CommunityQuestion({ title, content, subject, postedBy, authorName, attachment, upvotes: [], answers: [] });
    await q.save();
    res.json({ success: true, question: q });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Toggle upvote for a question
app.post('/api/community/questions/:questionId/upvote', async (req, res) => {
  try {
    const { questionId } = req.params;
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ success: false, error: 'Missing userId' });

    const q = await CommunityQuestion.findById(questionId);
    if (!q) return res.status(404).json({ success: false, error: 'Question not found' });

    const idx = q.upvotes.indexOf(userId);
    if (idx > -1) {
      q.upvotes.splice(idx, 1); // remove upvote
    } else {
      q.upvotes.push(userId); // add upvote
    }
    await q.save();
    res.json({ success: true, question: q });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. Add an answer to a question
app.post('/api/community/questions/:questionId/answers', async (req, res) => {
  try {
    const { questionId } = req.params;
    const { content, postedBy, authorName, attachment } = req.body;
    if (!content || !postedBy || !authorName) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const q = await CommunityQuestion.findById(questionId);
    if (!q) return res.status(404).json({ success: false, error: 'Question not found' });

    q.answers.push({ content, postedBy, authorName, attachment, upvotes: [], createdAt: new Date() });
    await q.save();
    res.json({ success: true, question: q });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. Toggle upvote for an answer
app.post('/api/community/questions/:questionId/answers/:answerId/upvote', async (req, res) => {
  try {
    const { questionId, answerId } = req.params;
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ success: false, error: 'Missing userId' });

    const q = await CommunityQuestion.findById(questionId);
    if (!q) return res.status(404).json({ success: false, error: 'Question not found' });

    const answer = q.answers.id(answerId);
    if (!answer) return res.status(404).json({ success: false, error: 'Answer not found' });

    const idx = answer.upvotes.indexOf(userId);
    if (idx > -1) {
      answer.upvotes.splice(idx, 1);
    } else {
      answer.upvotes.push(userId);
    }
    await q.save();
    res.json({ success: true, question: q });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 6. Delete a question
app.delete('/api/community/questions/:questionId', async (req, res) => {
  try {
    const { questionId } = req.params;
    const q = await CommunityQuestion.findByIdAndDelete(questionId);
    if (!q) return res.status(404).json({ success: false, error: 'Question not found' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- FACULTY / TEACHER PORTAL ROUTES ---

// 1. Batches Management
app.get('/api/teacher/batches', async (req, res) => {
  try {
    const { teacherId } = req.query;
    if (!teacherId) return res.status(400).json({ success: false, error: 'teacherId is required' });
    const batches = await Batch.find({ teacherId }).sort({ createdAt: -1 });
    res.json({ success: true, batches });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/teacher/batches', async (req, res) => {
  try {
    const { name, teacherId, students } = req.body;
    if (!name || !teacherId) return res.status(400).json({ success: false, error: 'name and teacherId are required' });
    const batch = new Batch({ name, teacherId, students: students || [] });
    await batch.save();
    res.json({ success: true, batch });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/teacher/batches/:id', async (req, res) => {
  try {
    const batch = await Batch.findByIdAndDelete(req.params.id);
    if (!batch) return res.status(404).json({ success: false, error: 'Batch not found' });
    await Assignment.deleteMany({ batchId: req.params.id });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/teacher/batches/:id', async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);
    if (!batch) return res.status(404).json({ success: false, error: 'Batch not found' });
    res.json({ success: true, batch });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/teacher/batches/:id', async (req, res) => {
  try {
    const { name, teacherId, students } = req.body;
    const batch = await Batch.findById(req.params.id);
    if (!batch) return res.status(404).json({ success: false, error: 'Batch not found' });
    if (name !== undefined) batch.name = name;
    if (teacherId !== undefined) batch.teacherId = teacherId;
    if (students !== undefined) batch.students = students;
    await batch.save();
    res.json({ success: true, batch });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/teacher/batches/join', async (req, res) => {
  try {
    const { batchId, studentId } = req.body;
    if (!batchId || !studentId) {
      return res.status(400).json({ success: false, error: 'Missing batchId or studentId' });
    }
    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(404).json({ success: false, error: 'Batch not found' });
    }
    if (batch.students.includes(studentId)) {
      return res.json({ success: true, alreadyJoined: true, batch });
    }
    batch.students.push(studentId);
    await batch.save();
    res.json({ success: true, alreadyJoined: false, batch });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/teacher/batches/:batchId/students', async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.batchId);
    if (!batch) return res.status(404).json({ success: false, error: 'Batch not found' });
    
    const students = await User.find({ userId: { $in: batch.students } }, 'userId name');
    res.json({ success: true, students });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 1b. Get Batches joined by a student (includes teacher names)
app.get('/api/student/batches', async (req, res) => {
  try {
    const { studentId } = req.query;
    if (!studentId) return res.status(400).json({ success: false, error: 'studentId is required' });
    const batches = await Batch.find({ students: studentId }).sort({ createdAt: -1 });
    
    // Fetch teachers' names for each batch
    const batchesWithTeacherNames = await Promise.all(
      batches.map(async (batch) => {
        const teacher = await User.findOne({ userId: batch.teacherId });
        return {
          ...batch.toObject(),
          teacherName: teacher ? teacher.name : 'Unknown Faculty'
        };
      })
    );
    
    res.json({ success: true, batches: batchesWithTeacherNames });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
// 1c. Attendance Management
app.get('/api/teacher/attendance/:batchId', async (req, res) => {
  try {
    const { date } = req.query; // optional filter by date
    let query = { batchId: req.params.batchId };
    if (date) query.date = date;
    const records = await Attendance.find(query).sort({ date: -1 });
    res.json({ success: true, records });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/teacher/attendance', async (req, res) => {
  try {
    const { batchId, date, records, recordedBy } = req.body;
    if (!batchId || !date || !records || !recordedBy) {
      return res.status(400).json({ success: false, error: 'Missing fields' });
    }
    // Upsert attendance
    const attendance = await Attendance.findOneAndUpdate(
      { batchId, date },
      { records, recordedBy },
      { new: true, upsert: true }
    );
    res.json({ success: true, attendance });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/student/attendance', async (req, res) => {
  try {
    const { studentId } = req.query;
    if (!studentId) return res.status(400).json({ success: false, error: 'studentId is required' });
    
    const studentBatches = await Batch.find({ students: studentId });
    const batchIds = studentBatches.map(b => b._id);
    
    const attendances = await Attendance.find({ batchId: { $in: batchIds } }).populate('batchId').sort({ date: -1 });
    
    const studentRecords = [];
    let presentCount = 0;
    let totalCount = 0;

    attendances.forEach(att => {
      const record = att.records.find(r => r.studentId === studentId);
      if (record) {
        totalCount++;
        if (record.status === 'Present') presentCount++;
        
        studentRecords.push({
          date: att.date,
          batchName: att.batchId ? att.batchId.name : 'Unknown Batch',
          status: record.status,
          recordedBy: att.recordedBy
        });
      }
    });

    const attendancePercentage = totalCount > 0 ? ((presentCount / totalCount) * 100).toFixed(1) : 100;
    
    res.json({ success: true, records: studentRecords, summary: { presentCount, totalCount, attendancePercentage } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 1d. Study Material & Resources (legacy multipart — redirected to Cloudinary base64 flow)
app.post('/api/teacher/resources/upload', async (req, res) => {
  // This route kept for backward compatibility; frontend uses /upload-base64 instead
  res.status(400).json({ success: false, error: 'Use /api/teacher/resources/upload-base64 for file uploads.' });
});


// Upload endpoint — uploads file to Cloudinary, stores only CDN URL in MongoDB
app.post('/api/teacher/resources/upload-base64', async (req, res) => {
  try {
    const { batchId, title, uploadedBy, fileBase64, fileName } = req.body;
    if (!batchId || !title || !uploadedBy || !fileBase64 || !fileName) {
      return res.status(400).json({ success: false, error: 'Missing fields or file data' });
    }

    // Extract base64 data reliably without regex which can fail on huge strings or newlines
    const base64Data = fileBase64.includes('base64,') ? fileBase64.split('base64,')[1] : fileBase64;
    
    // Attempt to parse mime type just for the database record
    const mimeMatch = fileBase64.match(/^data:([a-zA-Z0-9-+\/]+);/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
    
    const ext = path.extname(fileName).replace('.', '') || 'pdf';
    const baseName = path.parse(fileName).name.replace(/[^a-zA-Z0-9]/g, '_');

    // Upload to Cloudinary using upload_stream (required for raw base64 data to avoid corruption)
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'exampro/resources',
          resource_type: 'raw',
          public_id: `${Date.now()}-${baseName}`,
          format: ext
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      // Convert base64 string back to binary buffer and send to stream
      uploadStream.end(Buffer.from(base64Data, 'base64'));
    });

    const resource = new Resource({
      batchId,
      title,
      type: 'file',
      url: uploadResult.secure_url,   // Cloudinary CDN URL
      uploadedBy,
      fileName,
      mimeType,
      cloudinaryId: uploadResult.public_id
    });
    await resource.save();

    res.json({ success: true, resource });
  } catch (error) {
    console.error('Cloudinary Upload Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/teacher/resources/link', async (req, res) => {
  try {
    const { batchId, title, url, uploadedBy } = req.body;
    if (!batchId || !title || !url || !uploadedBy) {
      return res.status(400).json({ success: false, error: 'Missing fields' });
    }
    const resource = new Resource({
      batchId,
      title,
      type: 'link',
      url,
      uploadedBy
    });
    await resource.save();
    res.json({ success: true, resource });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/resources/:batchId', async (req, res) => {
  try {
    const resources = await Resource.find({ batchId: req.params.batchId }).sort({ createdAt: -1 });
    res.json({ success: true, resources });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete a resource (also removes from Cloudinary if it's a file)
app.delete('/api/resources/:id', async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ success: false, error: 'Resource not found' });

    // If it was uploaded to Cloudinary, delete it there too
    if (resource.cloudinaryId) {
      try {
        await cloudinary.uploader.destroy(resource.cloudinaryId, { resource_type: 'raw' });
      } catch (cloudErr) {
        console.warn('Cloudinary delete warning:', cloudErr.message);
      }
    }

    await Resource.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Edit a resource title (and URL for links)
app.put('/api/resources/:id', async (req, res) => {
  try {
    const { title, url } = req.body;
    if (!title) return res.status(400).json({ success: false, error: 'Title is required' });

    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ success: false, error: 'Resource not found' });

    resource.title = title;
    if (resource.type === 'link' && url) resource.url = url;
    await resource.save();

    res.json({ success: true, resource });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Assignments Management
app.get('/api/teacher/assignments', async (req, res) => {
  try {
    const { teacherId, studentId } = req.query;
    let query = {};
    if (teacherId) {
      query.createdBy = teacherId;
    } else if (studentId) {
      const studentBatches = await Batch.find({ students: studentId });
      const batchIds = studentBatches.map(b => b._id);
      query.batchId = { $in: batchIds };
    }
    const assignments = await Assignment.find(query).populate('batchId').populate('customQuestions').sort({ startTime: 1 });
    res.json({ success: true, assignments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/teacher/assignments', async (req, res) => {
  try {
    const { title, batchId, streamId, customQuestions, startTime, endTime, instructions, createdBy } = req.body;
    if (!title || !batchId || !streamId || !startTime || !endTime || !createdBy) {
      return res.status(400).json({ success: false, error: 'Missing required assignment fields' });
    }
    const assignment = new Assignment({
      title, batchId, streamId, customQuestions: customQuestions || [],
      startTime: new Date(startTime), endTime: new Date(endTime), instructions, createdBy
    });
    await assignment.save();
    res.json({ success: true, assignment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/teacher/assignments/:id', async (req, res) => {
  try {
    const assignment = await Assignment.findByIdAndDelete(req.params.id);
    if (!assignment) return res.status(404).json({ success: false, error: 'Assignment not found' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Analytics & Performance Tracker
app.get('/api/teacher/analytics/batch/:batchId', async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.batchId);
    if (!batch) return res.status(404).json({ success: false, error: 'Batch not found' });

    const assignments = await Assignment.find({ batchId: batch._id });
    const assignmentIds = assignments.map(a => a._id);

    const results = await Result.find({
      $or: [
        { assignmentId: { $in: assignmentIds } },
        { userId: { $in: batch.students }, assignmentId: null }
      ]
    }).sort({ completedAt: -1 });

    const studentPerformance = {};
    batch.students.forEach(s => {
      studentPerformance[s] = { userId: s, attempts: 0, totalScore: 0, maxScore: 0, warningsCount: 0, resultsList: [] };
    });

    results.forEach(r => {
      if (studentPerformance[r.userId]) {
        const perf = studentPerformance[r.userId];
        perf.attempts += 1;
        perf.totalScore += r.score;
        perf.warningsCount += (r.warningsCount || 0);
        if (r.score > perf.maxScore) perf.maxScore = r.score;
        perf.resultsList.push(r);
      }
    });

    res.json({
      success: true,
      batchName: batch.name,
      studentsCount: batch.students.length,
      studentPerformance: Object.values(studentPerformance),
      assignmentsCount: assignments.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/teacher/analytics/heatmap/:batchId', async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.batchId);
    if (!batch) return res.status(404).json({ success: false, error: 'Batch not found' });

    const results = await Result.find({ userId: { $in: batch.students } });
    const questionStats = {};

    results.forEach(r => {
      const qOrder = r.questionOrder || [];
      const correctQ = r.correctQuestionIds || [];
      
      qOrder.forEach(qId => {
        const qStr = qId.toString();
        if (!questionStats[qStr]) {
          questionStats[qStr] = { questionId: qStr, attempts: 0, correct: 0 };
        }
        questionStats[qStr].attempts += 1;
        if (correctQ.some(cId => cId.toString() === qStr)) {
          questionStats[qStr].correct += 1;
        }
      });
    });

    const questionIds = Object.keys(questionStats);
    const questions = await Question.find({ _id: { $in: questionIds } });

    const heatmapData = questions.map(q => {
      const stats = questionStats[q._id.toString()] || { attempts: 0, correct: 0 };
      const successRate = stats.attempts > 0 ? Math.round((stats.correct / stats.attempts) * 100) : 0;
      return {
        _id: q._id,
        text: q.text,
        subject: q.subject,
        difficulty: q.difficulty || 'Medium',
        tags: q.tags || [],
        attempts: stats.attempts,
        correct: stats.correct,
        successRate
      };
    });

    res.json({ success: true, heatmap: heatmapData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/teacher/analytics/student/:studentId', async (req, res) => {
  try {
    const results = await Result.find({ userId: req.params.studentId }).sort({ completedAt: -1 });
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. Communication (Notice Board & DMs)
app.get('/api/announcements', async (req, res) => {
  try {
    const { studentId } = req.query;
    let query = {};
    if (studentId) {
      const studentBatches = await Batch.find({ students: studentId });
      const batchIds = studentBatches.map(b => b._id);
      query = { $or: [{ batchId: null }, { batchId: { $in: batchIds } }] };
    }
    const announcements = await Announcement.find(query).populate('batchId').sort({ createdAt: -1 });
    res.json({ success: true, announcements });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/announcements', async (req, res) => {
  try {
    const { title, content, batchId, createdBy } = req.body;
    if (!title || !content || !createdBy) {
      return res.status(400).json({ success: false, error: 'Missing title, content, or createdBy' });
    }
    const ann = new Announcement({ title, content, batchId: batchId || null, createdBy });
    await ann.save();
    res.json({ success: true, announcement: ann });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/messages', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ success: false, error: 'userId is required' });
    const messages = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }]
    }).sort({ createdAt: 1 });
    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/messages', async (req, res) => {
  try {
    const { senderId, receiverId, content } = req.body;
    if (!senderId || !receiverId || !content) {
      return res.status(400).json({ success: false, error: 'senderId, receiverId, and content are required' });
    }
    const msg = new Message({ senderId, receiverId, content });
    await msg.save();
    res.json({ success: true, message: msg });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. Proctoring (Active Exams Monitor & Force Submit)
app.post('/api/exams/active', async (req, res) => {
  try {
    const { userId, userName, streamId, assignmentId, deviceInfo, ipAddress } = req.body;
    if (!userId || !userName || !streamId) {
      return res.status(400).json({ success: false, error: 'Missing required parameters' });
    }
    const active = await ActiveExam.findOneAndUpdate(
      { userId },
      { 
        userName, 
        streamId, 
        assignmentId: assignmentId || null, 
        startedAt: new Date(), 
        forceSubmit: false,
        deviceInfo: deviceInfo || 'Unknown',
        ipAddress: ipAddress || 'Unknown',
        warnings: 0
      },
      { upsert: true, new: true }
    );
    res.json({ success: true, active });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/exams/active/warning', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'Missing userId' });
    }
    const active = await ActiveExam.findOneAndUpdate(
      { userId },
      { $inc: { warnings: 1 } },
      { new: true }
    );
    if (!active) {
      return res.status(404).json({ success: false, error: 'Active exam session not found' });
    }
    res.json({ success: true, warnings: active.warnings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/exams/active/:userId', async (req, res) => {
  try {
    const active = await ActiveExam.findOneAndDelete({ userId: req.params.userId });
    res.json({ success: true, found: !!active });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/teacher/active-exams', async (req, res) => {
  try {
    const active = await ActiveExam.find({}).sort({ startedAt: -1 });
    res.json({ success: true, active });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/teacher/active-exams/force-submit/:userId', async (req, res) => {
  try {
    const active = await ActiveExam.findOneAndUpdate(
      { userId: req.params.userId },
      { forceSubmit: true },
      { new: true }
    );
    if (!active) return res.status(404).json({ success: false, error: 'Active exam session not found' });
    res.json({ success: true, active });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/exams/active/status/:userId', async (req, res) => {
  try {
    const active = await ActiveExam.findOne({ userId: req.params.userId });
    if (!active) {
      return res.json({ success: true, forceSubmit: false, active: false });
    }
    res.json({ success: true, forceSubmit: active.forceSubmit, active: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 6. Question Bank Approval Workflow & Proposal
app.get('/api/teacher/questions/pending', async (req, res) => {
  try {
    const questions = await Question.find({ status: 'pending' }).sort({ streamId: 1, subject: 1 });
    res.json({ success: true, questions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/questions/propose', async (req, res) => {
  try {
    const { streamId, type, subject, text, options, correct, noNegative, difficulty, tags, createdBy } = req.body;
    const isTeacherRole = createdBy && createdBy.startsWith('TCH_');
    const q = new Question({
      streamId, type, subject, text, options, correct, noNegative,
      difficulty: difficulty || 'Medium', tags: tags || [],
      status: isTeacherRole ? 'approved' : 'pending',
      createdBy: createdBy || 'student',
      version: 1
    });
    await q.save();
    res.json({ success: true, question: q });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/teacher/questions/approve/:id', async (req, res) => {
  try {
    const { action, difficulty, tags } = req.body;
    const status = action === 'approve' ? 'approved' : 'rejected';
    
    let updateFields = { status };
    if (difficulty) updateFields.difficulty = difficulty;
    if (tags) updateFields.tags = tags;
    
    const q = await Question.findByIdAndUpdate(req.params.id, updateFields, { new: true });
    if (!q) return res.status(404).json({ success: false, error: 'Question not found' });
    res.json({ success: true, question: q });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

module.exports = app;
