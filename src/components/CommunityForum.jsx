import { useState, useEffect } from 'react';
import { MessageSquare, ThumbsUp, Plus, ArrowLeft, Trash2, UserCircle, Calendar, Tag, AlertCircle, Loader2 } from 'lucide-react';

export default function CommunityForum({ user }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Views: 'feed', 'ask', 'detail'
  const [view, setView] = useState('feed');
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  
  // Form states
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newSubject, setNewSubject] = useState('General');
  const [newAnswerContent, setNewAnswerContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');

  const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/_/backend/api' : 'http://localhost:5000/api');

  // Fetch all questions
  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiUrl}/community/questions`);
      const data = await res.json();
      if (data.success) {
        setQuestions(data.questions);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch questions');
      }
    } catch (err) {
      setError('Could not connect to community server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  // Post a new question
  const handlePostQuestion = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch(`${apiUrl}/community/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          content: newContent,
          subject: newSubject,
          postedBy: user.id || user.userId,
          authorName: user.name
        })
      });
      const data = await res.json();
      if (data.success) {
        setNewTitle('');
        setNewContent('');
        setNewSubject('General');
        setView('feed');
        fetchQuestions();
      } else {
        alert('Failed to post question: ' + data.error);
      }
    } catch (err) {
      alert('Error connecting to server');
    } finally {
      setSubmitting(false);
    }
  };

  // Post an answer
  const handlePostAnswer = async (e) => {
    e.preventDefault();
    if (!newAnswerContent.trim() || !selectedQuestion) return;

    try {
      setSubmitting(true);
      const res = await fetch(`${apiUrl}/community/questions/${selectedQuestion._id}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newAnswerContent,
          postedBy: user.id || user.userId,
          authorName: user.name
        })
      });
      const data = await res.json();
      if (data.success) {
        setNewAnswerContent('');
        setSelectedQuestion(data.question);
        // Sync inside main questions list too
        setQuestions(prev => prev.map(q => q._id === data.question._id ? data.question : q));
      } else {
        alert('Failed to submit explanation: ' + data.error);
      }
    } catch (err) {
      alert('Error connecting to server');
    } finally {
      setSubmitting(false);
    }
  };

  // Upvote Question
  const handleUpvoteQuestion = async (qId, e) => {
    e?.stopPropagation(); // Prevent detail navigation if clicked on feed list
    if (!user) return alert('Login required to upvote');

    try {
      const res = await fetch(`${apiUrl}/community/questions/${qId}/upvote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id || user.userId })
      });
      const data = await res.json();
      if (data.success) {
        setQuestions(prev => prev.map(q => q._id === qId ? data.question : q));
        if (selectedQuestion && selectedQuestion._id === qId) {
          setSelectedQuestion(data.question);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Upvote Answer
  const handleUpvoteAnswer = async (ansId) => {
    if (!user) return alert('Login required to upvote');

    try {
      const res = await fetch(`${apiUrl}/community/questions/${selectedQuestion._id}/answers/${ansId}/upvote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id || user.userId })
      });
      const data = await res.json();
      if (data.success) {
        setSelectedQuestion(data.question);
        setQuestions(prev => prev.map(q => q._id === data.question._id ? data.question : q));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Question
  const handleDeleteQuestion = async (qId, e) => {
    e?.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this question?')) return;

    try {
      const res = await fetch(`${apiUrl}/community/questions/${qId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setQuestions(prev => prev.filter(q => q._id !== qId));
        if (selectedQuestion && selectedQuestion._id === qId) {
          setSelectedQuestion(null);
          setView('feed');
        }
      } else {
        alert('Delete failed: ' + data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filters
  const subjects = ['All', 'General', 'NEET', 'JEE Main', 'JEE Advanced', 'Physics', 'Chemistry', 'Biology', 'Mathematics'];

  const filteredQuestions = questions.filter(q => {
    const matchesFilter = selectedFilter === 'All' || q.subject.toLowerCase() === selectedFilter.toLowerCase();
    const matchesSearch = q.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          q.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="fade-in" style={{ maxWidth: 900, margin: '0 auto' }}>
      
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MessageSquare size={28} color="var(--primary)" /> Q&A Discussion Hub
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Post challenging questions, discuss answers, and share analytical proofs with other candidates.
          </p>
        </div>
        {view === 'feed' && (
          <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => setView('ask')}>
            <Plus size={16} /> Ask Question
          </button>
        )}
      </div>

      {/* VIEW: ASK QUESTION FORM */}
      {view === 'ask' && (
        <div className="card">
          <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', padding: '0.4rem 0.8rem', fontSize: '0.875rem' }} onClick={() => setView('feed')}>
            <ArrowLeft size={14} /> Back to Feed
          </button>
          
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Post a New Question</h3>
          
          <form onSubmit={handlePostQuestion} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>Question Title / Topic</label>
              <input 
                type="text" 
                required 
                placeholder="e.g. Help with thermodynamics enthalpy calculation" 
                value={newTitle} 
                onChange={(e) => setNewTitle(e.target.value)} 
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>Subject / Stream Category</label>
                <select value={newSubject} onChange={(e) => setNewSubject(e.target.value)} style={{ width: '100%' }}>
                  <option value="General">General Discussion</option>
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Biology">Biology</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="NEET">NEET Prep</option>
                  <option value="JEE Main">JEE Main Prep</option>
                  <option value="JEE Advanced">JEE Advanced Prep</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>Question Details / Text</label>
              <textarea 
                required 
                rows={6}
                placeholder="Type the full text of your question, options (if MCQ), or equations here. Be as descriptive as possible." 
                value={newContent} 
                onChange={(e) => setNewContent(e.target.value)} 
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>

            <button type="submit" disabled={submitting} className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
              {submitting ? 'Posting...' : 'Post Question'}
            </button>
          </form>
        </div>
      )}

      {/* VIEW: QUESTION DETAIL */}
      {view === 'detail' && selectedQuestion && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', alignSelf: 'flex-start', padding: '0.4rem 0.8rem', fontSize: '0.875rem' }} onClick={() => { setView('feed'); setSelectedQuestion(null); }}>
            <ArrowLeft size={14} /> Back to Feed
          </button>

          {/* Main Question Post */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
              <span className="tag" style={{ background: 'rgba(29, 78, 216, 0.1)', color: 'var(--primary)' }}>
                {selectedQuestion.subject}
              </span>
              {(user.isAdmin || selectedQuestion.postedBy === (user.id || user.userId)) && (
                <button 
                  onClick={(e) => handleDeleteQuestion(selectedQuestion._id, e)} 
                  style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.25rem' }}
                  title="Delete post"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>

            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: 'var(--text)' }}>
              {selectedQuestion.title}
            </h3>

            <p style={{ whiteSpace: 'pre-wrap', fontSize: '1.05rem', lineHeight: '1.6', marginBottom: '1.5rem', color: 'var(--text)' }}>
              {selectedQuestion.content}
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                <UserCircle size={16} />
                <span>Posted by <strong>{selectedQuestion.authorName}</strong></span>
                <span>•</span>
                <Calendar size={14} />
                <span>{new Date(selectedQuestion.createdAt).toLocaleDateString()}</span>
              </div>

              <button 
                onClick={(e) => handleUpvoteQuestion(selectedQuestion._id, e)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  background: selectedQuestion.upvotes.includes(user.id || user.userId) ? 'rgba(29, 78, 216, 0.1)' : 'none', 
                  border: '1px solid var(--border)',
                  borderRadius: '0.375rem',
                  padding: '0.4rem 0.8rem',
                  cursor: 'pointer',
                  color: selectedQuestion.upvotes.includes(user.id || user.userId) ? 'var(--primary)' : 'var(--text)',
                  fontWeight: 'bold',
                  fontSize: '0.875rem'
                }}
              >
                <ThumbsUp size={14} /> Upvote ({selectedQuestion.upvotes.length})
              </button>
            </div>
          </div>

          {/* Explanations List */}
          <div>
            <h4 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MessageSquare size={18} color="var(--primary)" /> Solutions & Explanations ({selectedQuestion.answers.length})
            </h4>

            {selectedQuestion.answers.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                <AlertCircle size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                <p>No explanations posted yet. Be the first to explain this question!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {selectedQuestion.answers.map((ans) => {
                  const hasUpvoted = ans.upvotes.includes(user.id || user.userId);
                  return (
                    <div key={ans._id} className="card" style={{ borderLeft: '3px solid var(--primary)' }}>
                      <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5', marginBottom: '1rem' }}>{ans.content}</p>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.825rem', color: 'var(--text-muted)', flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <UserCircle size={14} />
                          <span>Explained by <strong>{ans.authorName}</strong></span>
                          <span>•</span>
                          <span>{new Date(ans.createdAt).toLocaleDateString()}</span>
                        </div>
                        
                        <button 
                          onClick={() => handleUpvoteAnswer(ans._id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            border: '1px solid var(--border)',
                            borderRadius: '0.25rem',
                            padding: '0.25rem 0.5rem',
                            background: hasUpvoted ? 'rgba(29, 78, 216, 0.1)' : 'none',
                            color: hasUpvoted ? 'var(--primary)' : 'var(--text)',
                            cursor: 'pointer',
                            fontWeight: '500'
                          }}
                        >
                          <ThumbsUp size={12} /> Helpfully Solved ({ans.upvotes.length})
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Add Explanation Form */}
          <div className="card">
            <h4 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem' }}>Provide Your Explanation</h4>
            <form onSubmit={handlePostAnswer} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <textarea 
                required 
                rows={4}
                placeholder="Write your explanation or step-by-step mathematical proof here..."
                value={newAnswerContent}
                onChange={(e) => setNewAnswerContent(e.target.value)}
                style={{ width: '100%', resize: 'vertical' }}
              />
              <button type="submit" disabled={submitting} className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
                {submitting ? 'Submitting...' : 'Post Explanation'}
              </button>
            </form>
          </div>

        </div>
      )}

      {/* VIEW: FEED */}
      {view === 'feed' && (
        <div>
          {/* Filters Bar & Search */}
          <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
              <input 
                type="text" 
                placeholder="Search forum questions..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ flex: 1, margin: 0 }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
              {subjects.map(sub => (
                <button 
                  key={sub}
                  onClick={() => setSelectedFilter(sub)}
                  className={`btn ${selectedFilter === sub ? 'btn-primary' : 'btn-outline'}`}
                  style={{ 
                    padding: '0.25rem 0.75rem', 
                    fontSize: '0.75rem', 
                    borderRadius: '1rem',
                    border: '1px solid var(--border)'
                  }}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>

          {/* Questions Feed List */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem', gap: '1rem', color: 'var(--text-muted)' }}>
              <Loader2 className="animate-spin" size={32} color="var(--primary)" />
              <span style={{ fontWeight: '500' }}>Loading forum posts...</span>
            </div>
          ) : error ? (
            <div className="card" style={{ color: 'var(--danger)', textAlign: 'center', padding: '2rem' }}>
              <AlertCircle size={36} style={{ margin: '0 auto 0.5rem' }} />
              <p>{error}</p>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <AlertCircle size={40} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <h4 style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>No questions found</h4>
              <p>Be the first to post a question under this category!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredQuestions.map((q) => {
                const hasUpvoted = q.upvotes.includes(user.id || user.userId);
                return (
                  <div 
                    key={q._id} 
                    className="card forum-card" 
                    onClick={() => { setSelectedQuestion(q); setView('detail'); }}
                    style={{ 
                      cursor: 'pointer', 
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="tag" style={{ background: 'rgba(29, 78, 216, 0.1)', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 'bold' }}>
                        {q.subject}
                      </span>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {new Date(q.createdAt).toLocaleDateString()}
                        </span>
                        {(user.isAdmin || q.postedBy === (user.id || user.userId)) && (
                          <button 
                            onClick={(e) => handleDeleteQuestion(q._id, e)} 
                            style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.15rem' }}
                            title="Delete question"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text)', margin: 0 }}>
                      {q.title}
                    </h4>

                    <p style={{ 
                      color: 'var(--text-muted)', 
                      fontSize: '0.925rem', 
                      margin: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      lineHeight: '1.4'
                    }}>
                      {q.content}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginTop: '0.25rem', fontSize: '0.825rem', color: 'var(--text-muted)', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <span>By <strong>{q.authorName}</strong></span>
                      
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <button 
                          onClick={(e) => handleUpvoteQuestion(q._id, e)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: hasUpvoted ? 'var(--primary)' : 'inherit',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            fontWeight: hasUpvoted ? 'bold' : 'normal'
                          }}
                        >
                          <ThumbsUp size={12} /> {q.upvotes.length}
                        </button>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <MessageSquare size={12} /> {q.answers.length} answers
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
