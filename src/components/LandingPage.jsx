import { Shield, BarChart3, Clock, ArrowRight, BookOpen, Lock } from 'lucide-react';

export default function LandingPage({ onGetStarted }) {
  return (
    <div className="fade-in" style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem 1rem' }}>
      {/* Hero Section */}
      <section style={{ 
        textAlign: 'center', 
        padding: '4rem 1rem', 
        background: 'linear-gradient(135deg, rgba(29, 78, 216, 0.05) 0%, rgba(30, 64, 175, 0.02) 100%)', 
        borderRadius: '1rem',
        border: '1px solid var(--border)',
        marginBottom: '4rem'
      }}>
        <span className="badge" style={{ background: 'rgba(29, 78, 216, 0.1)', color: 'var(--primary)', marginBottom: '1rem', fontSize: '0.875rem' }}>
          🔒 Anti-Cheat & Real-Time Analytics Enabled
        </span>
        <h1 style={{ 
          fontSize: '3rem', 
          fontWeight: '800', 
          lineHeight: '1.2', 
          letterSpacing: '-0.025em',
          marginBottom: '1.5rem',
          color: 'var(--text)'
        }}>
          Master Your Competitive Exams with <span style={{ color: 'var(--primary)' }}>ProExam</span>
        </h1>
        <p style={{ 
          fontSize: '1.25rem', 
          color: 'var(--text-muted)', 
          maxWidth: '600px', 
          margin: '0 auto 2.5rem',
          lineHeight: '1.6'
        }}>
          Simulate real-world exam conditions for NEET, JEE, BITSAT, and CUET. Build confidence, track time per question, and prevent exam tampering.
        </p>
        <button 
          className="btn btn-primary" 
          onClick={onGetStarted}
          style={{ padding: '0.875rem 2rem', fontSize: '1.125rem', borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgba(29, 78, 216, 0.3)' }}
        >
          Start Mock Exam <ArrowRight size={20} />
        </button>
      </section>

      {/* Feature Grid */}
      <section style={{ marginBottom: '4rem' }}>
        <h2 style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 'bold', marginBottom: '3rem' }}>
          Why Students Choose ProExam
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
          
          <div className="card" style={{ padding: '2rem' }}>
            <div style={{ color: 'var(--primary)', marginBottom: '1rem' }}>
              <Shield size={36} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Anti-Cheating Protection</h3>
            <p style={{ color: 'var(--text-muted)' }}>
              Tab-switching locks, right-click disabling, copy-paste prevention, and mandatory fullscreen mode ensure a fair environment.
            </p>
          </div>

          <div className="card" style={{ padding: '2rem' }}>
            <div style={{ color: 'var(--primary)', marginBottom: '1rem' }}>
              <BarChart3 size={36} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Detailed Statistics</h3>
            <p style={{ color: 'var(--text-muted)' }}>
              Get immediate rank calculations, percentile feedback, accuracy analytics, and historical progress reports in your profile.
            </p>
          </div>

          <div className="card" style={{ padding: '2rem' }}>
            <div style={{ color: 'var(--primary)', marginBottom: '1rem' }}>
              <Clock size={36} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Time Calibration</h3>
            <p style={{ color: 'var(--text-muted)' }}>
              Tracks your speed per question. Helps you identify exactly where you are losing valuable time during critical exam sections.
            </p>
          </div>

        </div>
      </section>

      {/* Database/Tech Highlight */}
      <section className="card" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '2.5rem', 
        background: '#0f172a', 
        color: 'white',
        borderRadius: '1rem',
        flexWrap: 'wrap',
        gap: '2rem'
      }}>
        <div style={{ flex: '1 1 500px' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Lock size={20} color="#38bdf8" /> Powered by MongoDB Atlas
          </h3>
          <p style={{ color: '#94a3b8' }}>
            Your exam performance history is securely saved in the cloud. Login from any device to continue your preparation and review your growth.
          </p>
        </div>
        <button 
          className="btn btn-outline" 
          onClick={onGetStarted}
          style={{ 
            borderColor: '#38bdf8', 
            color: '#38bdf8', 
            padding: '0.75rem 1.5rem',
            background: 'transparent'
          }}
          onMouseEnter={(e) => e.target.style.background = 'rgba(56, 189, 248, 0.1)'}
          onMouseLeave={(e) => e.target.style.background = 'transparent'}
        >
          Create Free Account
        </button>
      </section>
    </div>
  );
}
