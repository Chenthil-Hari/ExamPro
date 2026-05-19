import { useState, useEffect } from 'react';
import Login from './components/Login';
import StreamSelection from './components/StreamSelection';
import Exam from './components/Exam';
import Results from './components/Results';
import Profile from './components/Profile';
import LandingPage from './components/LandingPage';
import Admin from './components/Admin';
import { streams, questionBank } from './questions';

function App() {
  const [user, setUser] = useState(null);
  const [stream, setStream] = useState(null);
  const [examResult, setExamResult] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [started, setStarted] = useState(false);
  const [streamsList, setStreamsList] = useState(streams);

  // Restore session & Fetch dynamic streams list
  useEffect(() => {
    const savedSession = localStorage.getItem('exam_session');
    if (savedSession) {
      const data = JSON.parse(savedSession);
      setUser(data.user);
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
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('exam_session', JSON.stringify({ user: userData }));
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
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)' }}>{user.name} ({user.id})</span>
            {!stream && !examResult && (
              <>
                {user.isAdmin && (
                  <button className="btn btn-primary" onClick={() => { setShowAdmin(!showAdmin); setShowProfile(false); }}>
                    {showAdmin ? 'Home' : 'Admin Panel'}
                  </button>
                )}
                <button className="btn btn-outline" onClick={() => { setShowProfile(!showProfile); setShowAdmin(false); }}>
                  {showProfile ? 'Home' : 'Stats & Profile'}
                </button>
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
        {user && showProfile && <Profile user={user} streams={streamsList} onBack={() => setShowProfile(false)} />}
        {user && !stream && !examResult && !showProfile && !showAdmin && <StreamSelection streams={streamsList} onSelect={handleStreamSelect} />}
        {user && stream && !examResult && (
          <Exam 
            stream={stream} 
            user={user}
            onComplete={handleExamComplete} 
          />
        )}
        {user && examResult && <Results result={examResult} user={user} onHome={handleBackToDashboard} />}
      </main>
    </div>
  );
}

export default App;
