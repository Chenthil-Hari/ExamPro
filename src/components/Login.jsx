import { useState } from 'react';
import { LogIn, UserCircle, GraduationCap, ArrowLeft } from 'lucide-react';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isTeacherMode, setIsTeacherMode] = useState(false);

  const handleStudentLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) return alert('Enter credentials');
    
    const id = `STU_${username}`;
    try {
      const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/_/backend/api' : 'http://localhost:5000/api');
      const res = await fetch(`${apiUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: username, password, isGuest: false })
      });
      const data = await res.json();
      if (data.success) {
        const normalized = {
          ...data.user,
          id: data.user.userId
        };
        onLogin(normalized);
      } else {
        alert('Login failed: ' + data.error);
      }
    } catch (err) {
      alert('Error connecting to server');
    }
  };

  const handleTeacherLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) return alert('Enter credentials');
    
    const id = `TCH_${username}`;
    try {
      const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/_/backend/api' : 'http://localhost:5000/api');
      const res = await fetch(`${apiUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: username, password, isGuest: false })
      });
      const data = await res.json();
      if (data.success) {
        const normalized = {
          ...data.user,
          id: data.user.userId
        };
        onLogin(normalized);
      } else {
        alert('Teacher Login failed: ' + data.error);
      }
    } catch (err) {
      alert('Error connecting to server');
    }
  };

  const handleGuestLogin = () => {
    const randomId = Math.floor(Math.random() * 10000);
    const guestName = prompt('Enter your name for Guest session', `Guest_${randomId}`);
    if (guestName) {
      const guestUser = { id: `GST_${randomId}`, userId: `GST_${randomId}`, name: guestName, isGuest: true, isAdmin: false, isTeacher: false };
      onLogin(guestUser);
    }
  };

  const toggleMode = () => {
    setIsTeacherMode(!isTeacherMode);
    setUsername('');
    setPassword('');
  };

  return (
    <div className="fade-in" style={{ width: '100%', maxWidth: 400, margin: '2rem auto' }}>
      <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Decorative corner indicator for Teacher mode */}
        {isTeacherMode && (
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            background: 'var(--warning)',
            color: 'white',
            padding: '0.25rem 1rem',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            borderBottomLeftRadius: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}>
            <GraduationCap size={14} /> Faculty Portal
          </div>
        )}

        <div style={{ textAlign: 'center', marginBottom: '2rem', marginTop: isTeacherMode ? '1rem' : '0' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
            {isTeacherMode ? 'Faculty Login' : 'Welcome Back'}
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>
            {isTeacherMode ? 'Manage batches, assignments, & proctoring' : 'Login to continue your prep'}
          </p>
        </div>

        {isTeacherMode ? (
          <form onSubmit={handleTeacherLogin}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Faculty Username</label>
              <input 
                type="text" 
                placeholder="Enter teacher username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Password</label>
              <input 
                type="password" 
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="btn" style={{ width: '100%', background: 'linear-gradient(135deg, var(--warning) 0%, #d97706 100%)', color: 'white', boxShadow: '0 2px 4px rgba(217, 119, 6, 0.15)' }}>
              <GraduationCap size={18} /> Faculty Sign In
            </button>
          </form>
        ) : (
          <form onSubmit={handleStudentLogin}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Student Username</label>
              <input 
                type="text" 
                placeholder="Enter student username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Password</label>
              <input 
                type="password" 
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              <LogIn size={18} /> Student Sign In
            </button>
          </form>
        )}

        {!isTeacherMode && (
          <>
            <div style={{ margin: '1.5rem 0', display: 'flex', alignItems: 'center', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }}></div>
              <span style={{ padding: '0 1rem', fontSize: '0.875rem' }}>OR</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }}></div>
            </div>

            <button onClick={handleGuestLogin} className="btn btn-outline" style={{ width: '100%', marginBottom: '1rem' }}>
              <UserCircle size={18} /> Continue as Guest
            </button>
          </>
        )}

        <div style={{ 
          marginTop: '1.5rem', 
          borderTop: '1px solid var(--border)', 
          paddingTop: '1rem',
          textAlign: 'center' 
        }}>
          {isTeacherMode ? (
            <button onClick={toggleMode} className="btn btn-outline" style={{ width: '100%' }}>
              <ArrowLeft size={16} /> Back to Student Login
            </button>
          ) : (
            <button onClick={toggleMode} className="btn btn-outline" style={{ width: '100%', borderColor: 'var(--warning)', color: 'var(--warning)', backgroundColor: 'transparent' }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(245, 158, 11, 0.05)'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>
              <GraduationCap size={18} /> Login as Teacher / Faculty
            </button>
          )}
        </div>
        
        {!isTeacherMode && (
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '1rem' }}>
            *Guest sessions do not save results persistently.
          </p>
        )}
      </div>
    </div>
  );
}
