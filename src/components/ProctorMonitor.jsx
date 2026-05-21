import { useState, useEffect } from 'react';
import { Eye, AlertTriangle, Monitor, ShieldAlert, Clock, Power, Loader2, RefreshCw, AlertCircle } from 'lucide-react';

export default function ProctorMonitor({ user }) {
  const [activeExams, setActiveExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [forcingId, setForcingId] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/_/backend/api' : 'http://localhost:5000/api');

  const fetchActiveExams = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const res = await fetch(`${apiUrl}/teacher/active-exams`);
      const data = await res.json();
      if (data.success) {
        setActiveExams(data.active);
      }
    } catch (err) {
      console.error('Failed to fetch active exams:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveExams(true);
    // Poll active exams every 4 seconds
    const interval = setInterval(() => {
      fetchActiveExams(false);
    }, 4000);

    // Keep active timer updating
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(clockInterval);
    };
  }, []);

  const handleForceSubmit = async (studentId) => {
    if (!confirm(`Are you sure you want to force submit the exam for student ID ${studentId}?`)) return;
    try {
      setForcingId(studentId);
      const res = await fetch(`${apiUrl}/teacher/active-exams/force-submit/${studentId}`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        setActiveExams(prev =>
          prev.map(exam => (exam.userId === studentId ? { ...exam, forceSubmit: true } : exam))
        );
      } else {
        alert('Failed to force submit: ' + data.error);
      }
    } catch (err) {
      alert('Error connecting to server');
    } finally {
      setForcingId(null);
    }
  };

  const getElapsedTime = (startedAt) => {
    const start = new Date(startedAt);
    const diff = Math.max(0, currentTime - start);
    const totalSecs = Math.floor(diff / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDevice = (deviceString) => {
    if (!deviceString) return 'Unknown';
    if (deviceString.includes('Firefox')) {
      return 'Firefox / ' + (deviceString.includes('Windows') ? 'Windows' : deviceString.includes('Mac') ? 'Mac' : 'Linux');
    }
    if (deviceString.includes('Edg/')) {
      return 'Edge / ' + (deviceString.includes('Windows') ? 'Windows' : 'Mac');
    }
    if (deviceString.includes('Chrome')) {
      return 'Chrome / ' + (deviceString.includes('Windows') ? 'Windows' : deviceString.includes('Mac') ? 'Mac' : 'Linux');
    }
    if (deviceString.includes('Safari')) {
      return 'Safari / Mac';
    }
    return deviceString.substring(0, 30) + '...';
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '30vh' }}>
        <Loader2 className="animate-spin" size={24} color="var(--warning)" />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Eye size={20} color="var(--warning)" /> Live Proctor Monitor
        </h3>
        <button
          className="btn btn-outline"
          onClick={() => fetchActiveExams(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.4rem 0.8rem' }}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
        Currently active exam sessions. Warning counters update in real-time when students tab out or switch browser focus.
      </p>

      {activeExams.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem', border: '1px dashed var(--border)', borderRadius: '0.75rem' }}>
          <AlertCircle size={32} style={{ marginBottom: '0.5rem', color: 'var(--text-muted)' }} />
          <p>No students are currently taking any exam.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
          {activeExams.map((exam) => {
            const warningCount = exam.warnings || 0;
            let warningColor = 'var(--text)';
            let warningBg = 'transparent';
            let warningBorder = 'var(--border)';

            if (warningCount >= 3) {
              warningColor = '#ef4444'; // red
              warningBg = 'rgba(239, 68, 68, 0.08)';
              warningBorder = '#ef4444';
            } else if (warningCount > 0) {
              warningColor = 'var(--warning)'; // orange
              warningBg = 'rgba(245, 158, 11, 0.08)';
              warningBorder = 'var(--warning)';
            } else {
              warningColor = '#10b981'; // green
              warningBg = 'rgba(16, 185, 129, 0.08)';
              warningBorder = '#10b981';
            }

            return (
              <div 
                key={exam._id} 
                className="card animate-fade-in" 
                style={{ 
                  border: `1px solid ${warningCount >= 3 ? '#ef4444' : 'var(--border)'}`,
                  background: 'var(--card)',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h4 style={{ fontWeight: 'bold', fontSize: '1.1rem', margin: 0, color: 'var(--text)' }}>
                      {exam.userName}
                    </h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      ID: <code style={{ color: 'var(--warning)' }}>{exam.userId}</code>
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontSize: '0.85rem',
                      padding: '0.35rem 0.75rem',
                      borderRadius: '0.375rem',
                      background: warningBg,
                      color: warningColor,
                      border: `1px solid ${warningBorder}`,
                      fontWeight: '600'
                    }}>
                      <ShieldAlert size={14} />
                      Warnings: {warningCount}
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontSize: '0.85rem',
                      padding: '0.35rem 0.75rem',
                      borderRadius: '0.375rem',
                      background: 'rgba(255, 255, 255, 0.03)',
                      color: 'var(--text)',
                      border: '1px solid var(--border)'
                    }}>
                      <Clock size={14} color="var(--warning)" />
                      {getElapsedTime(exam.startedAt)}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem', fontSize: '0.85rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Stream / Stream ID:</span>
                    <div style={{ fontWeight: '500', color: 'var(--text)', marginTop: '0.15rem' }}>{exam.streamId}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>IP Address:</span>
                    <div style={{ fontWeight: '500', color: 'var(--text)', marginTop: '0.15rem' }}><code>{exam.ipAddress || 'Unknown'}</code></div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Device / OS:</span>
                    <div 
                      style={{ fontWeight: '500', color: 'var(--text)', marginTop: '0.15rem' }} 
                      title={exam.deviceInfo || 'Unknown'}
                    >
                      <Monitor size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} />
                      {formatDevice(exam.deviceInfo)}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                  {exam.forceSubmit ? (
                    <button
                      className="btn"
                      disabled
                      style={{ background: 'var(--border)', color: 'var(--text-muted)', cursor: 'not-allowed', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                      <Power size={14} /> Force Submitted
                    </button>
                  ) : (
                    <button
                      className="btn"
                      onClick={() => handleForceSubmit(exam.userId)}
                      disabled={forcingId === exam.userId}
                      style={{
                        background: 'var(--danger)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        transition: 'opacity 0.2s'
                      }}
                    >
                      {forcingId === exam.userId ? (
                        <Loader2 className="animate-spin" size={14} />
                      ) : (
                        <Power size={14} />
                      )}
                      Force Submit Exam
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
