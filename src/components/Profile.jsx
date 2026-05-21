import { API_URL } from '../config';
import { useState, useEffect } from 'react';
import { Award, BookOpen, Clock, ChevronLeft, Calendar, Trash2, CheckCircle, HelpCircle, Check, Loader2 } from 'lucide-react';
import { streams } from '../questions';

export default function Profile({ user, onBack }) {
  const [results, setResults] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [activeTab, setActiveTab] = useState('history'); // 'history' or 'vault'
  const [loading, setLoading] = useState(true);
  
  // Interactive Re-solving State
  const [userAnswers, setUserAnswers] = useState({}); // questionId -> array of selected index or integer
  const [checkedStatus, setCheckedStatus] = useState({}); // questionId -> boolean
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
        const apiUrl = API_URL;
        
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
      const apiUrl = API_URL;
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

  const handleOptionSelect = (qId, optionIdx, isMsq) => {
    if (checkedStatus[qId]) return;
    setUserAnswers(prev => {
      const current = prev[qId] || [];
      if (isMsq) {
        const updated = current.includes(optionIdx)
          ? current.filter(i => i !== optionIdx)
          : [...current, optionIdx];
        return { ...prev, [qId]: updated };
      } else {
        return { ...prev, [qId]: [optionIdx] };
      }
    });
  };

  const handleIntegerChange = (qId, val) => {
    if (checkedStatus[qId]) return;
    setUserAnswers(prev => ({ ...prev, [qId]: [val] }));
  };

  const handleCheckAnswer = (qId) => {
    setCheckedStatus(prev => ({ ...prev, [qId]: true }));
  };

  const handleResetAnswer = (qId) => {
    setCheckedStatus(prev => ({ ...prev, [qId]: false }));
    setUserAnswers(prev => ({ ...prev, [qId]: [] }));
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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', borderRadius: '0.5rem' }}>
              <BookOpen size={24} />
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Exams Attempted</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{totalExams} times</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', background: 'rgba(34, 197, 94, 0.1)', color: 'var(--status-answered)', borderRadius: '0.5rem' }}>
              <Award size={24} />
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Average Accuracy</div>
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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem', gap: '1rem', color: 'var(--text-muted)' }}>
          <Loader2 className="animate-spin" size={32} color="var(--primary)" />
          <span style={{ fontWeight: '500' }}>Loading your profile data...</span>
        </div>
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
            {bookmarks.map((q) => {
              const answers = userAnswers[q._id] || [];
              const isChecked = checkedStatus[q._id];

              return (
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

                  <p style={{ fontSize: '1.125rem', fontWeight: '500', marginBottom: '1.5rem', paddingRight: '2rem' }}>{q.text}</p>

                  {/* Re-solve options */}
                  {q.type !== 'Integer' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
                      {q.options.map((opt, i) => {
                        const isSelected = answers.includes(i);
                        const isCorrect = q.correct.includes(i);
                        
                        let optionStyle = {
                          padding: '0.75rem',
                          borderRadius: '0.375rem',
                          border: '1px solid var(--border)',
                          cursor: isChecked ? 'default' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          background: 'var(--bg)',
                          transition: 'all 0.2s'
                        };

                        if (isSelected && !isChecked) {
                          optionStyle.borderColor = 'var(--primary)';
                          optionStyle.background = 'rgba(29, 78, 216, 0.02)';
                        } else if (isChecked) {
                          if (isCorrect) {
                            optionStyle.borderColor = 'var(--status-answered)';
                            optionStyle.background = 'rgba(34, 197, 94, 0.04)';
                          } else if (isSelected && !isCorrect) {
                            optionStyle.borderColor = 'var(--status-not-answered)';
                            optionStyle.background = 'rgba(239, 68, 68, 0.04)';
                          }
                        }

                        return (
                          <div 
                            key={i} 
                            style={optionStyle} 
                            onClick={() => handleOptionSelect(q._id, i, q.type === 'MSQ')}
                          >
                            <div style={{
                              width: 18,
                              height: 18,
                              borderRadius: q.type === 'MSQ' ? '0.25rem' : '50%',
                              border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--text-muted)'}`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: isSelected ? 'var(--primary)' : 'transparent',
                            }}>
                              {isSelected && <Check size={12} color="#fff" />}
                            </div>
                            <span style={{ fontSize: '0.95rem' }}>{opt}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ marginBottom: '1.25rem' }}>
                      <input 
                        type="number" 
                        disabled={isChecked}
                        value={answers[0] || ''} 
                        onChange={(e) => handleIntegerChange(q._id, e.target.value)} 
                        placeholder="Type numerical answer" 
                        style={{
                          width: '100%',
                          maxWidth: '250px',
                          padding: '0.5rem',
                          fontSize: '0.95rem',
                          border: '1px solid var(--border)',
                          borderColor: isChecked 
                            ? (parseInt(answers[0], 10) === q.correct[0] ? 'var(--status-answered)' : 'var(--status-not-answered)') 
                            : 'var(--border)'
                        }}
                      />
                    </div>
                  )}

                  {/* Actions buttons */}
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {!isChecked ? (
                      <button 
                        className="btn btn-primary" 
                        disabled={answers.length === 0 || answers[0] === ''}
                        onClick={() => handleCheckAnswer(q._id)}
                      >
                        Check Answer
                      </button>
                    ) : (
                      <button className="btn btn-outline" onClick={() => handleResetAnswer(q._id)}>
                        Reset & Try Again
                      </button>
                    )}
                    
                    <button className="btn btn-outline" onClick={() => toggleSolution(q._id)}>
                      {revealedSolutions[q._id] ? 'Hide Answer Details' : 'Reveal Correct Answer'}
                    </button>
                  </div>

                  {/* Checked Evaluator Status Banner */}
                  {isChecked && (() => {
                    let isCorrect = false;
                    if (q.type === 'Integer') {
                      isCorrect = parseInt(answers[0], 10) === q.correct[0];
                    } else {
                      isCorrect = answers.length === q.correct.length && q.correct.every(c => answers.includes(c));
                    }

                    return (
                      <div style={{
                        marginTop: '1.25rem',
                        padding: '0.75rem 1rem',
                        borderRadius: '0.375rem',
                        background: isCorrect ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                        color: isCorrect ? 'var(--status-answered)' : 'var(--status-not-answered)',
                        fontWeight: 'bold',
                        fontSize: '0.875rem'
                      }}>
                        {isCorrect ? '🎉 Correct! Well done.' : '❌ Incorrect. Double-check your options and try again!'}
                      </div>
                    );
                  })()}

                  {/* Revealed Solution Box */}
                  {revealedSolutions[q._id] && (
                    <div style={{ marginTop: '1.5rem', padding: '1rem', borderTop: '1px solid var(--border)', background: 'rgba(29, 78, 216, 0.02)', borderRadius: '0.5rem' }}>
                      <h5 style={{ fontWeight: 'bold', marginBottom: '0.75rem', fontSize: '0.875rem' }}>Correct Answer Details:</h5>
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
                                <span>{String.fromCharCode(65 + i)}. {opt} {isCorrect && '(Correct Option)'}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
