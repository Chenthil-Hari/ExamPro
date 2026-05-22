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

  // Premium Split-Screen Redesign
  return (
    <div className="fade-in" style={{ 
      display: 'flex', 
      minHeight: 'calc(100vh - 64px)', 
      width: '100%', 
      margin: '-1rem -1rem', // Negate App container padding
      background: 'var(--bg)' 
    }}>
      
      {/* LEFT PANEL: Branding & Graphic */}
      <div style={{
        flex: 1,
        display: 'none', // Hidden on mobile, shown on desktop via media query below
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '4rem',
        background: isTeacherMode 
          ? 'linear-gradient(135deg, #78350f 0%, #d97706 100%)' 
          : 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }} className="desktop-only-panel">
        
        {/* Abstract Background Shapes */}
        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '50%', height: '50%', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', filter: 'blur(80px)' }}></div>
        <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '50%', height: '50%', background: 'rgba(0,0,0,0.2)', borderRadius: '50%', filter: 'blur(80px)' }}></div>

        <div style={{ zIndex: 1, maxWidth: '500px' }}>
          <h1 style={{ fontSize: '3.5rem', fontWeight: '800', lineHeight: 1.1, marginBottom: '1.5rem', textShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
            {isTeacherMode ? 'Empower Your Teaching' : 'Master Your Exams'}
          </h1>
          <p style={{ fontSize: '1.25rem', color: 'rgba(255,255,255,0.9)', lineHeight: 1.6, marginBottom: '2rem' }}>
            {isTeacherMode 
              ? 'Create powerful assessments, track student analytics in real-time, and manage your batches seamlessly from a unified dashboard.' 
              : 'Join the elite platform for competitive exam prep. Access assignments, track your speed, and conquer your goals.'}
          </p>
          
          {/* Feature highlights */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1rem', background: 'rgba(255,255,255,0.1)', padding: '0.75rem 1rem', borderRadius: '0.5rem', backdropFilter: 'blur(10px)' }}>
              <div style={{ background: 'white', color: isTeacherMode ? '#d97706' : '#3b82f6', borderRadius: '50%', padding: '0.25rem' }}>
                <Shield size={16} />
              </div>
              <span>Advanced Anti-Cheat Protection</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1rem', background: 'rgba(255,255,255,0.1)', padding: '0.75rem 1rem', borderRadius: '0.5rem', backdropFilter: 'blur(10px)' }}>
              <div style={{ background: 'white', color: isTeacherMode ? '#d97706' : '#3b82f6', borderRadius: '50%', padding: '0.25rem' }}>
                <BarChart3 size={16} />
              </div>
              <span>Real-Time Performance Analytics</span>
            </div>
          </div>
        </div>
      </div>

      {/* Inline style block for the desktop panel media query */}
      <style>{`
        @media (min-width: 900px) {
          .desktop-only-panel { display: flex !important; }
        }
      `}</style>

      {/* RIGHT PANEL: Auth Form */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '2rem',
        position: 'relative'
      }}>
        
        {/* Toggle Mode Button (Top Right) */}
        <div style={{ position: 'absolute', top: '2rem', right: '2rem' }}>
          <button 
            onClick={toggleTeacherMode} 
            className="btn btn-outline" 
            style={{ 
              borderColor: isTeacherMode ? 'var(--primary)' : 'var(--warning)', 
              color: isTeacherMode ? 'var(--primary)' : 'var(--warning)', 
              backgroundColor: 'transparent',
              padding: '0.5rem 1rem',
              borderRadius: '2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.875rem'
            }}
          >
            {isTeacherMode ? <User size={16} /> : <GraduationCap size={16} />} 
            Switch to {isTeacherMode ? 'Student' : 'Faculty'}
          </button>
        </div>

        <div style={{ width: '100%', maxWidth: '420px' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              width: '64px', 
              height: '64px', 
              borderRadius: '1rem', 
              background: isTeacherMode ? 'rgba(245, 158, 11, 0.1)' : 'rgba(59, 130, 246, 0.1)',
              color: isTeacherMode ? 'var(--warning)' : 'var(--primary)',
              marginBottom: '1rem'
            }}>
              {isTeacherMode ? <GraduationCap size={32} /> : <User size={32} />}
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text)' }}>
              {isTeacherMode 
                ? (authMode === 'login' ? 'Faculty Portal' : 'Join Faculty')
                : (authMode === 'login' ? 'Welcome Back' : 'Create Account')
              }
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginTop: '0.5rem' }}>
              {authMode === 'login' ? 'Enter your credentials to access your account' : 'Fill in the details below to get started'}
            </p>
          </div>

          {/* Glassmorphism Card Container */}
          <div style={{
            background: 'var(--card)',
            padding: '2rem',
            borderRadius: '1rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: '1px solid var(--border)'
          }}>

            {/* Segmented Auth Mode Switcher */}
            <div style={{ display: 'flex', background: 'var(--bg)', padding: '0.25rem', borderRadius: '0.5rem', marginBottom: '2rem', border: '1px solid var(--border)' }}>
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
                Register
              </button>
            </div>

            <form onSubmit={authMode === 'login' ? handleLoginSubmit : handleSignUpSubmit}>
              {authMode === 'signup' && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)' }}>Full Name</label>
                  <input 
                    type="text" 
                    placeholder="Enter full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                    required
                  />
                </div>
              )}

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)' }}>
                  {isTeacherMode ? 'Faculty Username' : 'Student Username'}
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. jsmith24"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)' }}>Password</label>
                <input 
                  type="password" 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                  required
                />
              </div>

              <button 
                type="submit" 
                className="btn" 
                style={{ 
                  width: '100%', 
                  padding: '0.875rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: isTeacherMode ? 'linear-gradient(135deg, var(--warning) 0%, #d97706 100%)' : 'linear-gradient(135deg, var(--primary) 0%, #2563eb 100%)', 
                  color: 'white',
                  border: 'none',
                  boxShadow: isTeacherMode ? '0 4px 14px rgba(245, 158, 11, 0.4)' : '0 4px 14px rgba(59, 130, 246, 0.4)',
                  cursor: 'pointer',
                  transition: 'transform 0.1s, box-shadow 0.1s'
                }}
                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                {authMode === 'login' ? <LogIn size={18} /> : <UserPlus size={18} />} 
                {authMode === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            {/* GUEST MODE FOR STUDENTS ONLY */}
            {!isTeacherMode && authMode === 'login' && (
              <>
                <div style={{ margin: '1.5rem 0', display: 'flex', alignItems: 'center', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }}></div>
                  <span style={{ padding: '0 1rem', fontSize: '0.8rem', fontWeight: 600 }}>OR</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }}></div>
                </div>

                <button 
                  onClick={handleGuestLogin} 
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <UserCircle size={18} /> Continue as Guest
                </button>
              </>
            )}

          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '2rem' }}>
            {isTeacherMode 
              ? 'Secure portal for educational faculty.'
              : authMode === 'login' 
                ? '*Guest sessions do not save results persistently.' 
                : 'By signing up, you agree to our Terms of Service.'
            }
          </p>

        </div>
      </div>
    </div>
  );
}
