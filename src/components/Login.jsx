import { useState } from 'react';
import { LogIn, UserCircle } from 'lucide-react';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

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
        onLogin(data.user);
      } else {
        alert('Login failed: ' + data.error);
      }
    } catch (err) {
      alert('Error connecting to server');
    }
  };

  const handleGuestLogin = async () => {
    const randomId = Math.floor(Math.random() * 10000);
    const guestName = prompt('Enter your name for Guest session', `Guest_${randomId}`);
    if (guestName) {
      try {
        const id = `GST_${randomId}`;
        const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/_/backend/api' : 'http://localhost:5000/api');
        const res = await fetch(`${apiUrl}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, name: guestName, isGuest: true })
        });
        const data = await res.json();
        if (data.success) {
          onLogin(data.user);
        } else {
          alert('Login failed: ' + data.error);
        }
      } catch (err) {
        alert('Error connecting to server');
      }
    }
  };

  return (
    <div className="fade-in" style={{ width: '100%', maxWidth: 400, margin: '2rem auto' }}>
      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Welcome Back</h2>
          <p style={{ color: 'var(--text-muted)' }}>Login to continue your prep</p>
        </div>

        <form onSubmit={handleStudentLogin}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Username</label>
            <input 
              type="text" 
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Password</label>
            <input 
              type="password" 
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            <LogIn size={18} /> Student Login
          </button>
        </form>

        <div style={{ margin: '1.5rem 0', display: 'flex', alignItems: 'center', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }}></div>
          <span style={{ padding: '0 1rem', fontSize: '0.875rem' }}>OR</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }}></div>
        </div>

        <button onClick={handleGuestLogin} className="btn btn-outline" style={{ width: '100%' }}>
          <UserCircle size={18} /> Continue as Guest
        </button>
        
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '1rem' }}>
          *Guest sessions do not save results persistently.
        </p>
      </div>
    </div>
  );
}
