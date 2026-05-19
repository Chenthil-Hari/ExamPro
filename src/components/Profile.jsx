import { useState, useEffect } from 'react';
import { Award, BookOpen, Clock, ChevronLeft, Calendar } from 'lucide-react';
import { streams } from '../questions';

export default function Profile({ user, onBack }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/_/backend/api' : 'http://localhost:5000/api');
        const res = await fetch(`${apiUrl}/users/${user.id}/results`);
        const data = await res.json();
        if (data.success) {
          setResults(data.results);
        }
      } catch (err) {
        console.error('Failed to fetch profile results:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [user.id]);

  // Statistics calculation
  const totalExams = results.length;
  const avgScore = totalExams > 0 
    ? (results.reduce((acc, curr) => acc + (curr.score / curr.totalPossible), 0) / totalExams * 100).toFixed(1)
    : 0;
  const maxScore = totalExams > 0 
    ? Math.max(...results.map(r => r.score))
    : 0;

  const getStreamName = (streamId) => {
    return streams.find(s => s.id === streamId)?.name || streamId.toUpperCase();
  };

  return (
    <div className="fade-in" style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button className="btn btn-outline" onClick={onBack} style={{ padding: '0.5rem' }}>
          <ChevronLeft size={20} />
        </button>
        <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>Your Profile & Performance</h2>
      </div>

      {/* User Info & Stats Overview */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{user.name}</h3>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>User ID: {user.id}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', background: 'rgba(29, 78, 216, 0.1)', color: 'var(--primary)', borderRadius: '0.5rem' }}>
              <BookOpen size={24} />
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Exams Attempted</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{totalExams}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', background: 'rgba(34, 197, 94, 0.1)', color: 'var(--status-answered)', borderRadius: '0.5rem' }}>
              <Award size={24} />
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Avg. Accuracy</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{avgScore}%</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', background: 'rgba(168, 85, 247, 0.1)', color: 'var(--status-marked)', borderRadius: '0.5rem' }}>
              <Clock size={24} />
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Highest Score</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{maxScore} pts</div>
            </div>
          </div>
        </div>
      </div>

      {/* History Log */}
      <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Attempt History</h3>
      {loading ? (
        <div>Loading your exam history...</div>
      ) : results.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          You haven't taken any exams yet. Go to home and start your first attempt!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {results.map((res) => (
            <div key={res._id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h4 style={{ fontWeight: 'bold', color: 'var(--primary)', fontSize: '1.125rem' }}>{getStreamName(res.streamId)}</h4>
                <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Calendar size={14} /> {new Date(res.completedAt).toLocaleDateString()}
                  </span>
                  <span>Percentile: {res.percentile?.toFixed(1) || '0.0'}%</span>
                </div>
              </div>
              
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{res.score} / {res.totalPossible}</div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Points</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
