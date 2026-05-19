import { useState, useEffect } from 'react';
import Login from './components/Login';
import StreamSelection from './components/StreamSelection';
import Exam from './components/Exam';
import Results from './components/Results';
import Profile from './components/Profile';
import LandingPage from './components/LandingPage';
import { streams, questionBank } from './questions';

function App() {
  const [user, setUser] = useState(null);
  const [stream, setStream] = useState(null);
  const [examResult, setExamResult] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [started, setStarted] = useState(false);

  // Restore session
  useEffect(() => {
    const savedSession = localStorage.getItem('exam_session');
    if (savedSession) {
      const data = JSON.parse(savedSession);
      setUser(data.user);
      if (data.stream) setStream(data.stream);
      if (data.examResult) setExamResult(data.examResult);
    }
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

  const handleLogout = () => {
    localStorage.removeItem('exam_session');
    localStorage.removeItem('exam_state'); // Clear active exam
    setUser(null);
    setStream(null);
    setExamResult(null);
    setShowProfile(false);
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
                <button className="btn btn-outline" onClick={() => setShowProfile(!showProfile)}>
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
        {user && showProfile && <Profile user={user} onBack={() => setShowProfile(false)} />}
        {user && !stream && !examResult && !showProfile && <StreamSelection streams={streams} onSelect={handleStreamSelect} />}
        {user && stream && !examResult && (
          <Exam 
            stream={stream} 
            onComplete={handleExamComplete} 
          />
        )}
        {user && examResult && <Results result={examResult} user={user} onHome={handleLogout} />}
      </main>
    </div>
  );
}

export default App;
