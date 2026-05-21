import { useState, useEffect } from 'react';
import Login from './components/Login';
import StreamSelection from './components/StreamSelection';
import Exam from './components/Exam';
import Results from './components/Results';
import Profile from './components/Profile';
import LandingPage from './components/LandingPage';
import Admin from './components/Admin';
import CommunityForum from './components/CommunityForum';
import TeacherDashboard from './components/TeacherDashboard';
import { streams } from './questions';

function App() {
  const [user, setUser] = useState(null);
  const [stream, setStream] = useState(null);
  const [examResult, setExamResult] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showTeacher, setShowTeacher] = useState(false);
  const [showCommunity, setShowCommunity] = useState(false);
  const [started, setStarted] = useState(false);
  const [streamsList, setStreamsList] = useState(streams);
  const [joinNotification, setJoinNotification] = useState(null);

  // Auto-dismiss join notifications after 6 seconds
  useEffect(() => {
    if (joinNotification) {
      const timer = setTimeout(() => {
        setJoinNotification(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [joinNotification]);

  const processJoinBatch = async (batchId, currentUser) => {
    if (!currentUser) return;
    
    // Only student users (prefixed with 'STU_') can join student batches
    if (currentUser.isTeacher || currentUser.isAdmin || currentUser.id.startsWith('TCH_') || currentUser.id.startsWith('ADM_')) {
      setJoinNotification({
        type: 'error',
        message: 'Only student accounts can join batches via share links.'
      });
      return;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/_/backend/api' : 'http://localhost:5000/api');
      
      // Fetch batch details first to get the batch name
      const detailRes = await fetch(`${apiUrl}/teacher/batches/${batchId}`);
      const detailData = await detailRes.json();
      
      if (!detailData.success) {
        setJoinNotification({
          type: 'error',
          message: `Failed to retrieve batch details: ${detailData.error || 'Batch not found'}`
        });
        return;
      }
      
      const batchName = detailData.batch.name;
      
      // Call join endpoint
      const joinRes = await fetch(`${apiUrl}/teacher/batches/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchId, studentId: currentUser.id })
      });
      const joinData = await joinRes.json();
      
      if (joinData.success) {
        if (joinData.alreadyJoined) {
          setJoinNotification({
            type: 'info',
            message: `You are already a member of "${batchName}".`
          });
        } else {
          setJoinNotification({
            type: 'success',
            message: `Successfully joined batch: "${batchName}"!`
          });
        }
      } else {
        setJoinNotification({
          type: 'error',
          message: `Could not join batch: ${joinData.error}`
        });
      }
    } catch (err) {
      console.error('Error joining batch:', err);
      setJoinNotification({
        type: 'error',
        message: 'Error connecting to the server to join the batch.'
      });
    } finally {
      // Clear URL parameter so refreshing won't trigger this again
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  // Restore session & Fetch dynamic streams list
  useEffect(() => {
    let currentUser = null;
    const savedSession = localStorage.getItem('exam_session');
    if (savedSession) {
      const data = JSON.parse(savedSession);
      setUser(data.user);
      currentUser = data.user;
      if (data.user?.isTeacher) {
        setShowTeacher(true);
      }
      if (data.stream) setStream(data.stream);
      if (data.examResult) setExamResult(data.examResult);
    }

    const fetchStreams = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/_/backend/api' : 'http://localhost:5000/api');
        const res = await fetch(`${apiUrl}/streams`);
        const data = await res.json();
        if (data.success && data.streams.length > 0) {
          setStreamsList(data.streams);
        }
      } catch (err) {
        console.error('Failed to load dynamic streams:', err);
      }
    };
    fetchStreams();

    // Check for batch join URL param
    const urlParams = new URLSearchParams(window.location.search);
    const batchId = urlParams.get('joinBatch');
    if (batchId) {
      if (currentUser) {
        processJoinBatch(batchId, currentUser);
      } else {
        sessionStorage.setItem('pending_join_batch', batchId);
        setStarted(true);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('exam_session', JSON.stringify({ user: userData }));
    if (userData.isTeacher) {
      setShowTeacher(true);
      setShowProfile(false);
      setShowAdmin(false);
      setShowCommunity(false);
    }

    // Process pending join batch if exists
    const pendingBatchId = sessionStorage.getItem('pending_join_batch');
    if (pendingBatchId) {
      sessionStorage.removeItem('pending_join_batch');
      processJoinBatch(pendingBatchId, userData);
    }
  };

  const handleStreamSelect = (selectedStream) => {
    setStream(selectedStream);
    localStorage.setItem('exam_session', JSON.stringify({ user, stream: selectedStream }));
  };

  const handleExamComplete = (result) => {
    setExamResult(result);
    setStream(null); // Clear active stream
    localStorage.setItem('exam_session', JSON.stringify({ user, examResult: result }));
  };

  const handleBackToDashboard = () => {
    setExamResult(null);
    setStream(null);
    localStorage.setItem('exam_session', JSON.stringify({ user }));
  };

  const handleLogout = () => {
    localStorage.removeItem('exam_session');
    localStorage.removeItem('exam_state'); // Clear active exam
    setUser(null);
    setStream(null);
    setExamResult(null);
    setShowProfile(false);
    setShowAdmin(false);
    setShowCommunity(false);
    setShowTeacher(false);
  };

  return (
    <div className="app-container">
      <header>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 32, height: 32, background: 'var(--primary)', borderRadius: '0.25rem' }}></div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>ProExam</h1>
        </div>
        {!user && started && (
          <button className="btn btn-outline" onClick={() => setStarted(false)}>
            Back to Home
          </button>
        )}
        {user && (
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--text-muted)' }}>{user.name} ({user.id})</span>
            {!stream && !examResult && (
              <>
                {user.isAdmin && (
                  <button className="btn btn-primary" onClick={() => { setShowAdmin(!showAdmin); setShowProfile(false); setShowCommunity(false); setShowTeacher(false); }}>
                    {showAdmin ? 'Home' : 'Admin Panel'}
                  </button>
                )}
                {user.isTeacher && (
                  <button className="btn" style={{ background: 'linear-gradient(135deg, var(--warning) 0%, #d97706 100%)', color: 'white' }} onClick={() => { setShowTeacher(!showTeacher); setShowProfile(false); setShowAdmin(false); setShowCommunity(false); }}>
                    {showTeacher ? 'Home' : 'Teacher Dashboard'}
                  </button>
                )}
                <button className="btn btn-outline" onClick={() => { setShowCommunity(!showCommunity); setShowProfile(false); setShowAdmin(false); setShowTeacher(false); }}>
                  {showCommunity ? 'Home' : 'Community Forum'}
                </button>
                {!user.isTeacher && (
                  <button className="btn btn-outline" onClick={() => { setShowProfile(!showProfile); setShowAdmin(false); setShowCommunity(false); setShowTeacher(false); }}>
                    {showProfile ? 'Home' : 'Stats & Profile'}
                  </button>
                )}
                <button className="btn btn-outline" onClick={handleLogout}>Logout</button>
              </>
            )}
          </div>
        )}
      </header>
      
      <main>
        {!user && !started && <LandingPage onGetStarted={() => setStarted(true)} />}
        {!user && started && <Login onLogin={handleLogin} />}
        {user && showAdmin && <Admin user={user} streams={streamsList} onUpdateStreams={setStreamsList} onBack={() => setShowAdmin(false)} />}
        {user && showTeacher && <TeacherDashboard user={user} streams={streamsList} onBack={() => setShowTeacher(false)} />}
        {user && showProfile && <Profile user={user} streams={streamsList} onBack={() => setShowProfile(false)} />}
        {user && showCommunity && <CommunityForum user={user} />}
        {user && !stream && !examResult && !showProfile && !showAdmin && !showCommunity && !showTeacher && <StreamSelection streams={streamsList} onSelect={handleStreamSelect} user={user} />}
        {user && stream && !examResult && (
          <Exam 
            stream={stream} 
            user={user}
            onComplete={handleExamComplete} 
          />
        )}
        {user && examResult && <Results result={examResult} user={user} onHome={handleBackToDashboard} />}
      </main>

      {/* Floating Toast Notification for Batch Joining */}
      {joinNotification && (
        <div 
          className="fade-in" 
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            backgroundColor: joinNotification.type === 'success' ? '#10b981' : joinNotification.type === 'error' ? '#ef4444' : '#3b82f6',
            color: 'white',
            padding: '1rem 1.5rem',
            borderRadius: '0.5rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            zIndex: 9999,
            maxWidth: '400px',
            borderLeft: '4px solid rgba(0,0,0,0.2)'
          }}
        >
          <div style={{ flex: 1, fontWeight: '500', fontSize: '0.9rem' }}>
            {joinNotification.message}
          </div>
          <button 
            onClick={() => setJoinNotification(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '0.2rem',
              opacity: 0.8,
              fontSize: '1rem'
            }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
