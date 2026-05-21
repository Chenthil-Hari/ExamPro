import { useState, useEffect, useCallback, useRef } from 'react';
import { AlertCircle, Clock, Maximize, Flag, Star, Loader2, HelpCircle } from 'lucide-react';

export default function Exam({ stream, user, onComplete }) {
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [status, setStatus] = useState({}); // 'not_visited', 'not_answered', 'answered', 'marked'
  const [timeSpent, setTimeSpent] = useState({}); // time per question
  
  const [timeLeft, setTimeLeft] = useState(stream.duration * 60);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [warnings, setWarnings] = useState(0);
  const [error, setError] = useState(null);
  const [bookmarkedIds, setBookmarkedIds] = useState([]);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [activeWarning, setActiveWarning] = useState(null);
  const [ipAddress, setIpAddress] = useState('127.0.0.1');

  const handleSubmitRef = useRef(null);

  // Fetch client IP on mount
  useEffect(() => {
    const fetchIp = async () => {
      try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        if (data.ip) {
          setIpAddress(data.ip);
        }
      } catch (err) {
        console.warn('Could not fetch public IP, using default fallback:', err);
      }
    };
    fetchIp();
  }, []);

  // Initialize active exam session in backend
  useEffect(() => {
    if (questions.length === 0 || !user || user.isGuest) return;

    const initActiveExam = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/_/backend/api' : 'http://localhost:5000/api');
        await fetch(`${apiUrl}/exams/active`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            userName: user.name,
            streamId: stream.id,
            assignmentId: stream.assignmentId || null,
            deviceInfo: navigator.userAgent,
            ipAddress: ipAddress
          })
        });
      } catch (err) {
        console.error('Failed to log active exam session:', err);
      }
    };

    initActiveExam();
  }, [questions.length, user, stream.id, stream.assignmentId, ipAddress]);

  // Poll active exam status (checks for forceSubmit)
  useEffect(() => {
    if (!user || user.isGuest || questions.length === 0) return;

    const pollInterval = setInterval(async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/_/backend/api' : 'http://localhost:5000/api');
        const res = await fetch(`${apiUrl}/exams/active/status/${user.id}`);
        const data = await res.json();
        if (data.success && data.forceSubmit) {
          clearInterval(pollInterval);
          alert('This exam has been force submitted by the administrator/faculty.');
          if (handleSubmitRef.current) {
            handleSubmitRef.current();
          }
        }
      } catch (err) {
        console.error('Error polling active exam status:', err);
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [user, questions.length]);

  // Load bookmarks
  useEffect(() => {
    if (!user) return;
    if (user.isGuest) {
      const localBookmarks = JSON.parse(localStorage.getItem('guest_bookmarks') || '[]');
      setBookmarkedIds(localBookmarks.map(b => b._id || b));
      return;
    }
    const fetchBookmarks = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/_/backend/api' : 'http://localhost:5000/api');
        const res = await fetch(`${apiUrl}/users/${user.id}/bookmarks`);
        const data = await res.json();
        if (data.success) {
          setBookmarkedIds(data.bookmarks.map(b => b._id || b));
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchBookmarks();
  }, [user]);

  // Initialize Exam
  useEffect(() => {
    // Check local storage for active exam
    const saved = localStorage.getItem('exam_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.streamId === stream.id) {
        setQuestions(parsed.questions);
        setAnswers(parsed.answers);
        setStatus(parsed.status);
        setTimeSpent(parsed.timeSpent);
        setCurrentIdx(parsed.currentIdx);
        
        // Calculate remaining time safely based on timestamp
        const elapsed = Math.floor((Date.now() - parsed.startTime) / 1000);
        const remaining = Math.max((stream.duration * 60) - elapsed, 0);
        setTimeLeft(remaining);
        setWarnings(parsed.warnings);
        return;
      }
    }

    const loadQuestions = async () => {
      try {
        let loadedList = [];
        if (stream.customQuestions && stream.customQuestions.length > 0) {
          loadedList = stream.customQuestions;
        } else {
          const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/_/backend/api' : 'http://localhost:5000/api');
          const res = await fetch(`${apiUrl}/questions/${stream.id}?limit=${stream.totalQuestions || 5}`);
          const data = await res.json();
          if (!data.success || !data.questions.length) {
            throw new Error('Failed to fetch questions');
          }
          loadedList = data.questions;
        }

        // Shuffle options & questions (per session)
        const shuffled = [...loadedList].sort(() => Math.random() - 0.5).map(q => {
          const newQ = { ...q };
          if (q.options) {
            const optionsWithCorrect = q.options.map((opt, idx) => ({
              opt,
              isCorrect: q.correct.includes(idx)
            })).sort(() => Math.random() - 0.5);

            newQ.options = optionsWithCorrect.map(o => o.opt);
            newQ.correct = optionsWithCorrect
              .map((o, idx) => (o.isCorrect ? idx : -1))
              .filter(idx => idx !== -1);
          }
          return newQ;
        });

        const initialStatus = {};
        shuffled.forEach((q, i) => { initialStatus[i] = 'not_visited'; });
        initialStatus[0] = 'not_answered';

        setQuestions(shuffled);
        setStatus(initialStatus);
        
        const startTime = Date.now();
        const initialState = {
          streamId: stream.id,
          questions: shuffled,
          answers: {},
          status: initialStatus,
          timeSpent: {},
          currentIdx: 0,
          startTime,
          warnings: 0
        };
        localStorage.setItem('exam_state', JSON.stringify(initialState));
      } catch (err) {
        setError(err.message);
      }
    };

    loadQuestions();
  }, [stream.id, stream.duration]);

  // Sync state to localstorage
  useEffect(() => {
    if (questions.length === 0) return;
    const saved = JSON.parse(localStorage.getItem('exam_state') || '{}');
    localStorage.setItem('exam_state', JSON.stringify({
      ...saved, answers, status, timeSpent, currentIdx, warnings
    }));
  }, [answers, status, timeSpent, currentIdx, warnings, questions.length]);

  // Timer & Time tracking
  useEffect(() => {
    if (questions.length === 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          if (handleSubmitRef.current) handleSubmitRef.current();
          return 0;
        }
        return prev - 1;
      });

      setTimeSpent(prev => ({
        ...prev,
        [currentIdx]: (prev[currentIdx] || 0) + 1
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, [currentIdx, questions.length]);

  // Anti-cheating
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setWarnings(w => {
          const newW = w + 1;
          if (user && !user.isGuest) {
            const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/_/backend/api' : 'http://localhost:5000/api');
            fetch(`${apiUrl}/exams/active/warning`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: user.id })
            }).catch(err => console.error('Failed to report warning:', err));
          }
          setTimeout(() => {
            if (newW >= 3) {
              if (handleSubmitRef.current) handleSubmitRef.current();
            } else {
              setActiveWarning(newW);
            }
          }, 0);
          return newW;
        });
      }
    };

    const handleContextMenu = (e) => e.preventDefault();
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'a'].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
      if (e.key === 'F12') e.preventDefault();
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [user]);

  const enterFullscreen = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Actions
  const handleAnswerChange = (val) => {
    const q = questions[currentIdx];
    let newAns = answers[currentIdx] || [];
    
    if (q.type === 'MCQ') {
      newAns = [val];
    } else if (q.type === 'MSQ') {
      if (newAns.includes(val)) {
        newAns = newAns.filter(v => v !== val);
      } else {
        newAns = [...newAns, val];
      }
    } else if (q.type === 'Integer') {
      newAns = [parseInt(val, 10)];
    }
    
    setAnswers(prev => ({ ...prev, [currentIdx]: newAns }));
  };

  const navigateTo = (idx) => {
    if (status[currentIdx] === 'not_visited' || status[currentIdx] === 'not_answered') {
      setStatus(prev => ({ ...prev, [currentIdx]: answers[currentIdx]?.length ? 'answered' : 'not_answered' }));
    }
    setCurrentIdx(idx);
    setStatus(prev => ({ ...prev, [idx]: prev[idx] === 'not_visited' ? 'not_answered' : prev[idx] }));
  };

  const saveAndNext = () => {
    setStatus(prev => ({ ...prev, [currentIdx]: answers[currentIdx]?.length ? 'answered' : 'not_answered' }));
    if (currentIdx < questions.length - 1) navigateTo(currentIdx + 1);
  };

  const markAndNext = () => {
    setStatus(prev => ({ ...prev, [currentIdx]: 'marked' }));
    if (currentIdx < questions.length - 1) navigateTo(currentIdx + 1);
  };

  const clearResponse = () => {
    setAnswers(prev => {
      const updated = { ...prev };
      delete updated[currentIdx];
      return updated;
    });
    setStatus(prev => ({ ...prev, [currentIdx]: 'not_answered' }));
  };

  const toggleBookmark = async () => {
    if (!user) return;
    const currentQuestion = questions[currentIdx];
    const questionId = currentQuestion._id;
    if (user.isGuest) {
      let localBookmarks = JSON.parse(localStorage.getItem('guest_bookmarks') || '[]');
      const exists = localBookmarks.some(b => b._id === questionId);
      if (exists) {
        localBookmarks = localBookmarks.filter(b => b._id !== questionId);
      } else {
        localBookmarks.push(currentQuestion);
      }
      localStorage.setItem('guest_bookmarks', JSON.stringify(localBookmarks));
      setBookmarkedIds(localBookmarks.map(b => b._id));
      return;
    }
    try {
      const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/_/backend/api' : 'http://localhost:5000/api');
      const res = await fetch(`${apiUrl}/users/${user.id}/bookmarks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId })
      });
      const data = await res.json();
      if (data.success) {
        setBookmarkedIds(data.bookmarks);
      }
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
    }
  };

  const handleSubmit = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(()=>{});
    }
    // Clear exam state local storage
    localStorage.removeItem('exam_state');

    // Calculate correctQuestionIds
    const correctQuestionIds = [];
    questions.forEach((q, idx) => {
      const ans = answers[idx] || [];
      let isCorrect = false;
      if (q.type === 'Integer') {
        isCorrect = ans[0] === q.correct[0];
      } else {
        isCorrect = ans.length === q.correct.length && q.correct.every(c => ans.includes(c));
      }
      if (isCorrect) {
        correctQuestionIds.push(q._id);
      }
    });

    onComplete({
      streamId: stream.id,
      questions,
      answers,
      timeSpent,
      status,
      assignmentId: stream.assignmentId || null,
      ipAddress: ipAddress,
      deviceInfo: navigator.userAgent,
      warningsCount: warnings,
      questionOrder: questions.map(q => q._id),
      correctQuestionIds
    });
  }, [answers, timeSpent, status, questions, stream.id, warnings, ipAddress, onComplete]);

  handleSubmitRef.current = handleSubmit;

  // Loading state
  if (questions.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem', color: 'var(--text-muted)' }}>
        <Loader2 className="animate-spin" size={36} color="var(--primary)" />
        <span style={{ fontWeight: '500', fontSize: '1.1rem' }}>Loading exam details and preparing instructions...</span>
      </div>
    );
  }

  // Fullscreen enforcement
  if (!isFullscreen) {
    return (
      <div className="fullscreen-overlay">
        <div className="card" style={{ color: 'var(--text)', maxWidth: 500 }}>
          <AlertCircle size={48} color="var(--danger)" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ marginBottom: '1rem' }}>Fullscreen Required</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            This exam must be taken in fullscreen mode to prevent cheating. 
            Do not switch tabs or exit fullscreen, or your exam will be automatically submitted.
          </p>
          <button className="btn btn-primary" onClick={enterFullscreen} style={{ width: '100%' }}>
            <Maximize size={18} /> Enter Fullscreen
          </button>
        </div>
      </div>
    );
  }

  const q = questions[currentIdx];
  const formatTime = (secs) => `${Math.floor(secs / 60).toString().padStart(2, '0')}:${(secs % 60).toString().padStart(2, '0')}`;
  const isBookmarked = bookmarkedIds.includes(q._id);

  return (
    <div className="exam-grid fade-in">
      {/* Left Column - Question Area */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Question {currentIdx + 1}</h2>
              <button 
                onClick={toggleBookmark}
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.25rem' }}
                title={isBookmarked ? "Remove Bookmark" : "Bookmark Question"}
              >
                <Star size={18} fill={isBookmarked ? "#f59e0b" : "none"} color={isBookmarked ? "#f59e0b" : "var(--text-muted)"} />
              </button>
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              {q.subject} | Type: {q.type} | Marks: +{q.noNegative ? stream.marking.correct : stream.marking.correct} / {q.noNegative ? '0' : stream.marking.wrong}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)', fontWeight: 'bold' }}>
            <Clock size={20} /> {formatTime(timeLeft)}
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '1.125rem', marginBottom: '1.5rem' }}>{q.text}</p>
          
          {q.type === 'Integer' ? (
            <input 
              type="number" 
              placeholder="Enter numerical value" 
              value={answers[currentIdx]?.[0] ?? ''}
              onChange={(e) => handleAnswerChange(e.target.value)}
            />
          ) : (
            <div className="options-list">
              {q.options.map((opt, i) => (
                <label 
                  key={i} 
                  className={`option-item ${(answers[currentIdx] || []).includes(i) ? 'selected' : ''}`}
                >
                  <input 
                    type={q.type === 'MCQ' ? 'radio' : 'checkbox'} 
                    name={`q-${currentIdx}`} 
                    checked={(answers[currentIdx] || []).includes(i)}
                    onChange={() => handleAnswerChange(i)}
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={saveAndNext}>Save & Next</button>
          <button className="btn btn-outline" style={{ color: 'var(--status-marked)' }} onClick={markAndNext}>
            <Flag size={16} /> Mark for Review
          </button>
          <button className="btn btn-outline" onClick={clearResponse}>Clear Response</button>
        </div>
      </div>

      {/* Right Column - Palette */}
      <div className="card">
        <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem', fontWeight: 'bold' }}>Question Palette</h3>
        <div className="question-palette">
          {questions.map((_, i) => (
            <button 
              key={i} 
              className={`palette-btn status-${status[i] || 'not_visited'}`}
              style={currentIdx === i ? { border: '2px solid var(--text)' } : {}}
              onClick={() => navigateTo(i)}
            >
              {i + 1}
            </button>
          ))}
        </div>
        
        <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 16, height: 16, background: 'var(--status-not-visited)', borderRadius: '50%' }}></div> Not Visited
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 16, height: 16, background: 'var(--status-not-answered)', borderRadius: '50%' }}></div> Not Answered
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 16, height: 16, background: 'var(--status-answered)', borderRadius: '50%' }}></div> Answered
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 16, height: 16, background: 'var(--status-marked)', borderRadius: '50%' }}></div> Marked for Review
          </div>
        </div>

        <button 
          className="btn btn-danger" 
          style={{ width: '100%', marginTop: '2rem' }}
          onClick={() => setShowSubmitModal(true)}
        >
          Submit Exam
        </button>
      </div>

      {/* Tab Switch Warning Modal */}
      {activeWarning !== null && (
        <div className="fullscreen-overlay" style={{ zIndex: 10000 }}>
          <div className="card" style={{ maxWidth: 450, textAlign: 'center', borderColor: 'var(--danger)' }}>
            <AlertCircle size={48} color="var(--danger)" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--danger)', marginBottom: '1rem' }}>
              Warning {activeWarning} / 3: Tab Switching Detected!
            </h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem', lineHeight: '1.5' }}>
              Switching tabs, applications, or exiting the exam layout is strictly prohibited. 
              Exiting the screen <strong>{3 - activeWarning} more time(s)</strong> will result in the immediate automatic submission of your exam!
            </p>
            <button className="btn btn-danger" onClick={() => setActiveWarning(null)} style={{ width: '100%' }}>
              I Understand, Resume Exam
            </button>
          </div>
        </div>
      )}

      {/* Submit Exam Confirmation Modal */}
      {showSubmitModal && (
        <div className="fullscreen-overlay" style={{ zIndex: 10000 }}>
          <div className="card" style={{ maxWidth: 450, textAlign: 'center' }}>
            <HelpCircle size={48} color="var(--primary)" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              Submit Exam?
            </h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem', lineHeight: '1.5' }}>
              You have answered <strong>{Object.keys(answers).length}</strong> out of <strong>{questions.length}</strong> questions. 
              Are you sure you want to finish and view your performance analytics? You cannot change your answers after submission.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                className="btn btn-danger" 
                onClick={() => {
                  setShowSubmitModal(false);
                  handleSubmit();
                }} 
                style={{ flex: 1 }}
              >
                Yes, Submit Exam
              </button>
              <button 
                className="btn btn-outline" 
                onClick={() => setShowSubmitModal(false)} 
                style={{ flex: 1 }}
              >
                No, Keep Solving
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
