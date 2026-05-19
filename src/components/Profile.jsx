import { useState, useEffect } from 'react';
import { Award, BookOpen, Clock, ChevronLeft, Calendar, Trash2, CheckCircle, HelpCircle } from 'lucide-react';
import { streams } from '../questions';

export default function Profile({ user, onBack }) {
  const [results, setResults] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [activeTab, setActiveTab] = useState('history'); // 'history' or 'vault'
  const [loading, setLoading] = useState(true);
  const [revealedSolutions, setRevealedSolutions] = useState({}); // questionId -> boolean

  useEffect(() => {
    const fetchProfileData = async () => {
      if (user.isGuest) {
        const localResults = JSON.parse(localStorage.getItem('guest_results') || '[]');
        setResults(localResults);
        const localBookmarks = JSON.parse(localStorage.getItem('guest_bookmarks') || '[]');
        setBookmarks(localBookmarks);
        setLoading(false);
        return;
      }
      try {
        const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/_/backend/api' : 'http://localhost:5000/api');
        
        // Fetch results
        const resResults = await fetch(`${apiUrl}/users/${user.id}/results`);
        const dataResults = await resResults.json();
        if (dataResults.success) setResults(dataResults.results);

        // Fetch bookmarks
        const resBookmarks = await fetch(`${apiUrl}/users/${user.id}/bookmarks`);
        const dataBookmarks = await resBookmarks.json();
        if (dataBookmarks.success) setBookmarks(dataBookmarks.bookmarks);

      } catch (err) {
        console.error('Failed to fetch profile data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, [user.id, user.isGuest]);

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

  const removeBookmark = async (questionId) => {
    if (user.isGuest) {
      let localBookmarks = JSON.parse(localStorage.getItem('guest_bookmarks') || '[]');
      localBookmarks = localBookmarks.filter(b => b._id !== questionId);
      localStorage.setItem('guest_bookmarks', JSON.stringify(localBookmarks));
      setBookmarks(localBookmarks);
      return;
    }
    try {
      const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/_/backend/api' : 'http://localhost:5000/api');
      const res = await fetch(`${apiUrl}/users/${user.id}/bookmarks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId })
      });
      const data = await res.json();
      if (data.success) {
        setBookmarks(prev => prev.filter(b => b._id !== questionId));
      }
    } catch (err) {
      console.error('Failed to remove bookmark:', err);
    }
  };

  const toggleSolution = (qId) => {
    setRevealedSolutions(prev => ({ ...prev, [qId]: !prev[qId] }));
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

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem', gap: '1.5rem' }}>
        <button 
          style={{ 
            background: 'none', 
            border: 'none', 
            borderBottom: activeTab === 'history' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'history' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: 'bold',
            padding: '0.75rem 0.5rem',
            cursor: 'pointer'
          }}
          onClick={() => setActiveTab('history')}
        >
          Attempt History ({results.length})
        </button>
        <button 
          style={{ 
            background: 'none', 
            border: 'none', 
            borderBottom: activeTab === 'vault' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'vault' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: 'bold',
            padding: '0.75rem 0.5rem',
            cursor: 'pointer'
          }}
          onClick={() => setActiveTab('vault')}
        >
          Revision Vault ({bookmarks.length})
        </button>
      </div>

      {loading ? (
        <div>Loading your profile data...</div>
      ) : activeTab === 'history' ? (
        /* History Log */
        results.length === 0 ? (
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
        )
      ) : (
        /* Revision Vault */
        bookmarks.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            Your Revision Vault is empty. Star hard questions during an exam to save them here!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {bookmarks.map((q) => (
              <div key={q._id} className="card" style={{ position: 'relative' }}>
                <button 
                  onClick={() => removeBookmark(q._id)}
                  style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                  title="Remove from vault"
                >
                  <Trash2 size={18} />
                </button>

                <span style={{ display: 'inline-block', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: 'bold', background: 'rgba(29, 78, 216, 0.1)', color: 'var(--primary)', marginBottom: '1rem' }}>
                  {getStreamName(q.streamId)} | {q.subject}
                </span>

                <p style={{ fontSize: '1.125rem', fontWeight: '500', marginBottom: '1rem', paddingRight: '2rem' }}>{q.text}</p>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button className="btn btn-outline" onClick={() => toggleSolution(q._id)}>
                    {revealedSolutions[q._id] ? 'Hide Solution' : 'Reveal Solution'}
                  </button>
                </div>

                {revealedSolutions[q._id] && (
                  <div style={{ marginTop: '1.5rem', padding: '1rem', borderTop: '1px solid var(--border)', background: 'rgba(29, 78, 216, 0.02)', borderRadius: '0.5rem' }}>
                    <h5 style={{ fontWeight: 'bold', marginBottom: '0.75rem', fontSize: '0.875rem' }}>Correct Answer(s):</h5>
                    {q.type === 'Integer' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--status-answered)', fontWeight: 'bold' }}>
                        <CheckCircle size={18} /> Numerical Value: {q.correct[0]}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {q.options.map((opt, i) => {
                          const isCorrect = q.correct.includes(i);
                          return (
                            <div 
                              key={i} 
                              style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '0.5rem', 
                                color: isCorrect ? 'var(--status-answered)' : 'var(--text-muted)',
                                fontWeight: isCorrect ? 'bold' : 'normal'
                              }}
                            >
                              {isCorrect ? <CheckCircle size={16} /> : <HelpCircle size={16} />}
                              {opt} {isCorrect && '(Correct)'}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
