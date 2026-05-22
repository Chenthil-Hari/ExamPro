import { Shield, BarChart3, Clock, ArrowRight, BookOpen, Lock, Sparkles, BrainCircuit } from 'lucide-react';

export default function LandingPage({ onStudentLogin, onFacultyLogin }) {
  return (
    <div style={{ position: 'relative', overflow: 'hidden', minHeight: '100vh', width: '100%', margin: '-2rem' }}>
      
      {/* Dynamic Background Animations */}
      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        @keyframes floatReverse {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(20px) rotate(-5deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        .hero-bg {
          position: absolute;
          top: 0; left: 0; right: 0; height: 100%;
          background: radial-gradient(circle at top left, rgba(59,130,246,0.15) 0%, transparent 40%),
                      radial-gradient(circle at bottom right, rgba(16,185,129,0.1) 0%, transparent 40%);
          z-index: 0;
        }
        .bento-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 1.5rem;
          padding: 2rem;
          transition: all 0.3s ease;
          box-shadow: 0 10px 30px -10px rgba(0,0,0,0.05);
          position: relative;
          overflow: hidden;
        }
        .bento-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px -10px rgba(59,130,246,0.15);
          border-color: rgba(59,130,246,0.3);
        }
        .text-gradient {
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `}</style>

      <div className="hero-bg"></div>

      {/* Floating Decorative Elements */}
      <div style={{ position: 'absolute', top: '15%', left: '10%', animation: 'float 6s ease-in-out infinite', opacity: 0.6, zIndex: 1 }}>
        <div style={{ background: 'var(--card)', padding: '1rem', borderRadius: '1rem', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock size={20} color="#f59e0b" /> <span style={{ fontWeight: 'bold' }}>01:45</span>
        </div>
      </div>
      <div style={{ position: 'absolute', top: '30%', right: '10%', animation: 'floatReverse 8s ease-in-out infinite', opacity: 0.6, zIndex: 1 }}>
        <div style={{ background: 'var(--card)', padding: '1rem', borderRadius: '1rem', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BarChart3 size={20} color="#10b981" /> <span style={{ fontWeight: 'bold' }}>98th %ile</span>
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 10, maxWidth: 1200, margin: '0 auto', padding: '4rem 2rem' }}>
        
        {/* HERO SECTION */}
        <section style={{ textAlign: 'center', padding: '6rem 0 8rem 0' }} className="fade-in">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '0.5rem 1rem', borderRadius: '2rem', fontSize: '0.875rem', fontWeight: '600', marginBottom: '2rem', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
            <Sparkles size={16} /> Welcome to the Future of Learning
          </div>
          
          <h1 style={{ fontSize: 'clamp(3rem, 6vw, 4.5rem)', fontWeight: '800', lineHeight: '1.1', letterSpacing: '-0.03em', marginBottom: '1.5rem', color: 'var(--text)' }}>
            Dominate Your Exams with <br /> <span className="text-gradient">ProExam Mastery</span>
          </h1>
          
          <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', maxWidth: '700px', margin: '0 auto 3rem', lineHeight: '1.6' }}>
            The elite testing platform for ambitious students. Experience real-world exam simulators with advanced anti-cheat technology, real-time pacing analytics, and personalized insights.
          </p>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button 
              onClick={onStudentLogin}
              style={{ 
                padding: '1rem 2.5rem', 
                fontSize: '1.125rem', 
                fontWeight: '600', 
                borderRadius: '0.75rem', 
                background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)', 
                color: 'white',
                border: 'none',
                boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.4)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 15px 30px -5px rgba(37, 99, 235, 0.5)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(37, 99, 235, 0.4)'; }}
            >
              Student Login <ArrowRight size={20} />
            </button>
            <button 
              onClick={onFacultyLogin}
              style={{ 
                padding: '1rem 2.5rem', 
                fontSize: '1.125rem', 
                fontWeight: '600', 
                borderRadius: '0.75rem', 
                background: 'var(--card)', 
                color: 'var(--text)',
                border: '1px solid var(--border)',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'var(--card)'}
            >
              Faculty Login
            </button>
          </div>
        </section>

        {/* BENTO BOX FEATURE GRID */}
        <section style={{ marginBottom: '6rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', autoRows: 'minmax(250px, auto)' }}>
            
            {/* Large Card 1 */}
            <div className="bento-card" style={{ gridColumn: '1 / -1', background: 'linear-gradient(135deg, rgba(59,130,246,0.05) 0%, rgba(139,92,246,0.05) 100%)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '600px' }}>
                <div style={{ display: 'inline-flex', padding: '1rem', borderRadius: '1rem', background: '#3b82f6', color: 'white', width: 'fit-content' }}>
                  <Shield size={32} />
                </div>
                <h3 style={{ fontSize: '2rem', fontWeight: '800', margin: 0 }}>Military-Grade Exam Integrity</h3>
                <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                  Our advanced proctoring engine locks the browser, disables tab-switching, right-clicks, and copy-pasting. Faculty are instantly alerted of any suspicious behavior, ensuring a 100% fair testing environment.
                </p>
              </div>
            </div>

            {/* Small Card 1 */}
            <div className="bento-card">
              <div style={{ display: 'inline-flex', padding: '1rem', borderRadius: '1rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', marginBottom: '1.5rem' }}>
                <BarChart3 size={28} />
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Deep Analytics</h3>
              <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
                Instant percentile rankings, accuracy tracking, and historical performance graphs. Know exactly where you stand against the competition.
              </p>
            </div>

            {/* Small Card 2 */}
            <div className="bento-card">
              <div style={{ display: 'inline-flex', padding: '1rem', borderRadius: '1rem', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', marginBottom: '1.5rem' }}>
                <Clock size={28} />
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Pacing Intelligence</h3>
              <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
                We track the exact seconds spent on every single question. Identify your time-sinks and optimize your speed for the real exam day.
              </p>
            </div>

          </div>
        </section>

        {/* BOTTOM CTA SECTION */}
        <section style={{ 
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', 
          borderRadius: '2rem', 
          padding: '4rem 2rem', 
          textAlign: 'center',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}>
          {/* Decorative globe/glow inside CTA */}
          <div style={{ position: 'absolute', top: '-50%', left: '50%', transform: 'translateX(-50%)', width: '100%', height: '100%', background: 'radial-gradient(circle, rgba(56,189,248,0.15) 0%, transparent 60%)', zIndex: 0 }}></div>
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <BrainCircuit size={48} color="#38bdf8" style={{ margin: '0 auto 1.5rem' }} />
            <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '1rem' }}>Ready to Elevate Your Score?</h2>
            <p style={{ fontSize: '1.125rem', color: '#94a3b8', maxWidth: '600px', margin: '0 auto 2.5rem', lineHeight: '1.6' }}>
              Join thousands of students and faculty members who trust ProExam to deliver the most accurate testing experience available.
            </p>
            <button 
              onClick={onStudentLogin}
              style={{ 
                padding: '1rem 3rem', 
                fontSize: '1.125rem', 
                fontWeight: 'bold', 
                borderRadius: '2rem', 
                background: 'white', 
                color: '#0f172a',
                border: 'none',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                boxShadow: '0 10px 25px rgba(255,255,255,0.2)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              Get Started Now
            </button>
          </div>
        </section>

      </div>
    </div>
  );
}
