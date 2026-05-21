import { API_URL } from '../config';
import { useState, useEffect } from 'react';
import { LogIn, UserCircle, GraduationCap, ArrowLeft, UserPlus, User } from 'lucide-react';

export default function Login({ onLogin, isTeacherMode, setIsTeacherMode }) {
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  useEffect(() => {
    setUsername('');
    setPassword('');
    setFullName('');
  }, [isTeacherMode]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) return alert('Enter credentials');
    
    // Normalize username by stripping trailing spaces/lowercasing (unless it is email)
    const normalizedUsername = username.trim();
    const prefix = isTeacherMode ? 'TCH_' : 'STU_';
    const id = `${prefix}${normalizedUsername}`;

    try {
      const apiUrl = API_URL;
      const res = await fetch(`${apiUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, password })
      });
      const data = await res.json();
      if (data.success) {
        const normalized = {
          ...data.user,
          id: data.user.userId
        };
        onLogin(normalized);
      } else {
        alert(data.error || 'Login failed');
      }
    } catch (err) {
      alert('Error connecting to server');
    }
  };

  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password || !fullName) return alert('Please fill in all fields');

    const normalizedUsername = username.trim();
    
    // Validate username characters
    const usernameRegex = /^[a-zA-Z0-9_.-@]+$/;
    if (!usernameRegex.test(normalizedUsername)) {
      return alert('Username can only contain alphanumeric characters, underscores, hyphens, dots, or @.');
    }

    const prefix = isTeacherMode ? 'TCH_' : 'STU_';
    const id = `${prefix}${normalizedUsername}`;

    try {
      const apiUrl = API_URL;
      const res = await fetch(`${apiUrl}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: fullName.trim(), password, isTeacher: isTeacherMode })
      });
      const data = await res.json();
      if (data.success) {
        const normalized = {
          ...data.user,
          id: data.user.userId
        };
        alert('Account created successfully!');
        onLogin(normalized);
      } else {
        alert(data.error || 'Sign Up failed');
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

  const toggleTeacherMode = () => {
    setIsTeacherMode(!isTeacherMode);
  };

  const switchAuthMode = (mode) => {
    setAuthMode(mode);
    setUsername('');
    setPassword('');
    setFullName('');
  };

  return (
    <div className="fade-in" style={{ width: '100%', maxWidth: 400, margin: '2rem auto' }}>
      <div className="card" style={{ position: 'relative', overflow: 'hidden', border: '1px solid var(--border)' }}>
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

        <div style={{ textAlign: 'center', marginBottom: '1.5rem', marginTop: isTeacherMode ? '1rem' : '0' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
            {isTeacherMode 
              ? (authMode === 'login' ? 'Faculty Sign In' : 'Faculty Sign Up')
              : (authMode === 'login' ? 'Welcome Back' : 'Create Account')
            }
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            {isTeacherMode 
              ? 'Manage batches, assignments, & proctoring' 
              : (authMode === 'login' ? 'Login to continue your prep' : 'Sign up to start preparing')
            }
          </p>
        </div>

        {/* Segmented Auth Mode Switcher */}
        <div style={{ display: 'flex', background: 'var(--bg)', padding: '0.25rem', borderRadius: '0.5rem', marginBottom: '1.5rem', border: '1px solid var(--border)' }}>
          <button
            onClick={() => switchAuthMode('login')}
            style={{
              flex: 1,
              padding: '0.5rem',
              borderRadius: '0.375rem',
              border: 'none',
              background: authMode === 'login' ? 'var(--card)' : 'transparent',
              color: authMode === 'login' ? 'var(--text)' : 'var(--text-muted)',
              fontWeight: '600',
              fontSize: '0.875rem',
              cursor: 'pointer',
              boxShadow: authMode === 'login' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            Sign In
          </button>
          <button
            onClick={() => switchAuthMode('signup')}
            style={{
              flex: 1,
              padding: '0.5rem',
              borderRadius: '0.375rem',
              border: 'none',
              background: authMode === 'signup' ? 'var(--card)' : 'transparent',
              color: authMode === 'signup' ? 'var(--text)' : 'var(--text-muted)',
              fontWeight: '600',
              fontSize: '0.875rem',
              cursor: 'pointer',
              boxShadow: authMode === 'signup' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            Sign Up
          </button>
        </div>

        {/* AUTH FORMS */}
        <form onSubmit={authMode === 'login' ? handleLoginSubmit : handleSignUpSubmit}>
          {authMode === 'signup' && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.9rem' }}>Full Name</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  placeholder="Enter full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{ marginBottom: 0 }}
                  required
                />
              </div>
            </div>
          )}

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.9rem' }}>
              {isTeacherMode ? 'Faculty Username' : 'Student Username'}
            </label>
            <input 
              type="text" 
              placeholder={isTeacherMode ? "Enter teacher username" : "Enter student username"}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ marginBottom: 0 }}
              required
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.9rem' }}>Password</label>
            <input 
              type="password" 
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ marginBottom: 0 }}
              required
            />
          </div>

          {authMode === 'login' ? (
            <button 
              type="submit" 
              className="btn" 
              style={{ 
                width: '100%', 
                background: isTeacherMode ? 'linear-gradient(135deg, var(--warning) 0%, #d97706 100%)' : 'var(--primary)', 
                color: 'white' 
              }}
            >
              {isTeacherMode ? <GraduationCap size={18} /> : <LogIn size={18} />} 
              {isTeacherMode ? 'Faculty Sign In' : 'Student Sign In'}
            </button>
          ) : (
            <button 
              type="submit" 
              className="btn" 
              style={{ 
                width: '100%', 
                background: isTeacherMode ? 'linear-gradient(135deg, var(--warning) 0%, #d97706 100%)' : 'var(--primary)', 
                color: 'white' 
              }}
            >
              {isTeacherMode ? <GraduationCap size={18} /> : <UserPlus size={18} />} 
              {isTeacherMode ? 'Register Faculty Account' : 'Register Student Account'}
            </button>
          )}
        </form>

        {/* GUEST MODE FOR STUDENTS ONLY */}
        {!isTeacherMode && authMode === 'login' && (
          <>
            <div style={{ margin: '1.25rem 0', display: 'flex', alignItems: 'center', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }}></div>
              <span style={{ padding: '0 1rem', fontSize: '0.8rem', fontWeight: 500 }}>OR</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }}></div>
            </div>

            <button onClick={handleGuestLogin} className="btn btn-outline" style={{ width: '100%', marginBottom: '0.5rem' }}>
              <UserCircle size={18} /> Continue as Guest
            </button>
          </>
        )}

        {/* TEACHER MODE TOGGLE BUTTON */}
        <div style={{ 
          marginTop: '1.5rem', 
          borderTop: '1px solid var(--border)', 
          paddingTop: '1rem',
          textAlign: 'center' 
        }}>
          {isTeacherMode ? (
            <button onClick={toggleTeacherMode} className="btn btn-outline" style={{ width: '100%' }}>
              <ArrowLeft size={16} /> Back to Student Portal
            </button>
          ) : (
            <button onClick={toggleTeacherMode} className="btn btn-outline" style={{ width: '100%', borderColor: 'var(--warning)', color: 'var(--warning)', backgroundColor: 'transparent' }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(245, 158, 11, 0.05)'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>
              <GraduationCap size={18} /> Go to Faculty Portal
            </button>
          )}
        </div>
        
        {!isTeacherMode && (
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '1rem' }}>
            {authMode === 'login' 
              ? '*Guest sessions do not save results persistently.' 
              : 'By signing up, you agree to access class batches and assignments.'
            }
          </p>
        )}
      </div>
    </div>
  );
}
