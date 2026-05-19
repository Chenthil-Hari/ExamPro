import { useState, useEffect } from 'react';
import { ChevronLeft, Plus, Edit2, Trash2, Check, X, ShieldAlert, Award, Calendar } from 'lucide-react';
import { streams } from '../questions';

export default function Admin({ user, onBack }) {
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'logs', 'questions'
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form State for Add/Edit Question
  const [editingQuestion, setEditingQuestion] = useState(null); // null, 'add', or { questionObject }
  const [formStream, setFormStream] = useState('neet');
  const [formType, setFormType] = useState('MCQ');
  const [formSubject, setFormSubject] = useState('');
  const [formText, setFormText] = useState('');
  const [formOptions, setFormOptions] = useState(['', '', '', '']);
  const [formCorrect, setFormCorrect] = useState(''); // comma-separated indices or integer number

  const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/_/backend/api' : 'http://localhost:5000/api');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'users') {
        const res = await fetch(`${apiUrl}/admin/users`);
        const data = await res.json();
        if (data.success) setUsers(data.users);
      } else if (activeTab === 'logs') {
        const res = await fetch(`${apiUrl}/admin/results`);
        const data = await res.json();
        if (data.success) setLogs(data.results || data.results || data.results || data.results || data.results || data.results || data.results || data.results); // backend sent { success, results } or { success, logs } - let's check
        // Wait, in server.js we did: `res.json({ success: true, results });` on GET /api/admin/results.
        if (data.success) setLogs(data.results);
      } else if (activeTab === 'questions') {
        const res = await fetch(`${apiUrl}/admin/questions`);
        const data = await res.json();
        if (data.success) setQuestions(data.questions);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch data from server.');
    } finally {
      setLoading(false);
    }
  };

  const getStreamName = (streamId) => {
    return streams.find(s => s.id === streamId)?.name || streamId.toUpperCase();
  };

  // Open Add Question Form
  const openAdd = () => {
    setEditingQuestion('add');
    setFormStream('neet');
    setFormType('MCQ');
    setFormSubject('');
    setFormText('');
    setFormOptions(['', '', '', '']);
    setFormCorrect('');
  };

  // Open Edit Question Form
  const openEdit = (q) => {
    setEditingQuestion(q);
    setFormStream(q.streamId);
    setFormType(q.type);
    setFormSubject(q.subject);
    setFormText(q.text);
    setFormOptions(q.options || ['', '', '', '']);
    setFormCorrect(q.correct.join(', '));
  };

  // Submit Question Add/Edit
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    // Parse correct values
    let parsedCorrect = [];
    if (formType === 'Integer') {
      parsedCorrect = [parseInt(formCorrect, 10)];
      if (isNaN(parsedCorrect[0])) {
        alert('Please enter a valid integer for the correct answer.');
        return;
      }
    } else {
      parsedCorrect = formCorrect.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
      if (parsedCorrect.length === 0) {
        alert('Please enter correct options indices (e.g. 0 for first option, 0,2 for multi-correct).');
        return;
      }
    }

    const payload = {
      streamId: formStream,
      type: formType,
      subject: formSubject,
      text: formText,
      options: formType === 'Integer' ? undefined : formOptions.filter(o => o.trim() !== ''),
      correct: parsedCorrect
    };

    try {
      let url = `${apiUrl}/admin/questions`;
      let method = 'POST';
      
      if (editingQuestion !== 'add') {
        url = `${apiUrl}/admin/questions/${editingQuestion._id}`;
        method = 'PUT';
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (data.success) {
        setEditingQuestion(null);
        fetchData();
      } else {
        alert('Failed to save question: ' + data.error);
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to server.');
    }
  };

  // Delete Question
  const handleDelete = async (qId) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      const res = await fetch(`${apiUrl}/admin/questions/${qId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        alert('Delete failed.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOptionChange = (idx, val) => {
    const updated = [...formOptions];
    updated[idx] = val;
    setFormOptions(updated);
  };

  const addOptionField = () => {
    setFormOptions([...formOptions, '']);
  };

  const removeOptionField = (idx) => {
    setFormOptions(formOptions.filter((_, i) => i !== idx));
  };

  return (
    <div className="fade-in" style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn btn-outline" onClick={onBack} style={{ padding: '0.5rem' }}>
            <ChevronLeft size={20} />
          </button>
          <div>
            <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldAlert size={28} color="var(--primary)" /> Admin Command Center
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Monitor logs and manage question banks securely.</p>
          </div>
        </div>

        {activeTab === 'questions' && !editingQuestion && (
          <button className="btn btn-primary" onClick={openAdd}>
            <Plus size={18} /> Add Question
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '2rem', gap: '1.5rem' }}>
        {['users', 'logs', 'questions'].map((tab) => (
          <button 
            key={tab}
            style={{ 
              background: 'none', 
              border: 'none', 
              borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === tab ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: 'bold',
              padding: '0.75rem 0.5rem',
              cursor: 'pointer',
              textTransform: 'capitalize'
            }}
            onClick={() => { setActiveTab(tab); setEditingQuestion(null); }}
          >
            {tab === 'logs' ? 'Exam Attempts' : tab}
          </button>
        ))}
      </div>

      {/* Main Panel */}
      {editingQuestion ? (
        /* Add/Edit Question Form */
        <div className="card">
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
            {editingQuestion === 'add' ? 'Create New Question' : 'Edit Question Details'}
          </h3>
          <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>Exam Stream</label>
                <select value={formStream} onChange={(e) => setFormStream(e.target.value)} style={{ width: '100%' }}>
                  {streams.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>Question Type</label>
                <select value={formType} onChange={(e) => { setFormType(e.target.value); setFormCorrect(''); }} style={{ width: '100%' }}>
                  <option value="MCQ">MCQ (Single Correct)</option>
                  <option value="MSQ">MSQ (Multi Correct)</option>
                  <option value="Integer">Integer Type</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>Subject (e.g. Physics)</label>
                <input type="text" required value={formSubject} onChange={(e) => setFormSubject(e.target.value)} placeholder="Physics, Biology..." style={{ width: '100%' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>Question Text</label>
              <textarea rows={4} required value={formText} onChange={(e) => setFormText(e.target.value)} placeholder="Enter full question content..." style={{ width: '100%' }}></textarea>
            </div>

            {/* Answer Options for MCQ/MSQ */}
            {formType !== 'Integer' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ fontWeight: '500' }}>Answer Options</label>
                  <button type="button" className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={addOptionField}>
                    + Add Option
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {formOptions.map((opt, i) => (
                    <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', width: '20px' }}>{i}.</span>
                      <input 
                        type="text" 
                        required 
                        value={opt} 
                        onChange={(e) => handleOptionChange(i, e.target.value)} 
                        placeholder={`Option ${i + 1}`} 
                        style={{ flex: 1 }} 
                      />
                      {formOptions.length > 2 && (
                        <button type="button" onClick={() => removeOptionField(i)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>
                          <X size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.25rem' }}>
                Correct Answer(s)
              </label>
              <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                {formType === 'Integer' 
                  ? 'Enter numerical answer (e.g. 42).' 
                  : 'Enter index of correct options, separated by comma. Starts at 0 (e.g. "1" for Option B, "0, 2" for Option A and C).'}
              </span>
              <input 
                type="text" 
                required 
                placeholder={formType === 'Integer' ? '42' : '0'} 
                value={formCorrect} 
                onChange={(e) => setFormCorrect(e.target.value)} 
                style={{ width: '100%' }} 
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="submit" className="btn btn-primary">Save Question</button>
              <button type="button" className="btn btn-outline" onClick={() => setEditingQuestion(null)}>Cancel</button>
            </div>
          </form>
        </div>
      ) : loading ? (
        <div>Loading records...</div>
      ) : error ? (
        <div style={{ color: 'var(--danger)' }}>{error}</div>
      ) : activeTab === 'users' ? (
        /* Users List */
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--border)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '1rem' }}>Name</th>
                <th style={{ padding: '1rem' }}>User ID</th>
                <th style={{ padding: '1rem' }}>Role</th>
                <th style={{ padding: '1rem' }}>Registered On</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem', fontWeight: 'bold' }}>{u.name}</td>
                  <td style={{ padding: '1rem' }}>{u.userId}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '0.25rem', 
                      fontSize: '0.75rem', 
                      fontWeight: 'bold',
                      background: u.isAdmin ? 'rgba(29, 78, 216, 0.1)' : u.isGuest ? 'rgba(245, 158, 11, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                      color: u.isAdmin ? 'var(--primary)' : u.isGuest ? '#d97706' : 'var(--status-answered)'
                    }}>
                      {u.isAdmin ? 'Admin' : u.isGuest ? 'Guest' : 'Student'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : activeTab === 'logs' ? (
        /* Exam Attempt Logs */
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--border)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '1rem' }}>Student ID</th>
                <th style={{ padding: '1rem' }}>Exam Stream</th>
                <th style={{ padding: '1rem' }}>Score</th>
                <th style={{ padding: '1rem' }}>Est. Percentile</th>
                <th style={{ padding: '1rem' }}>Duration</th>
                <th style={{ padding: '1rem' }}>Attempted At</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(l => (
                <tr key={l._id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem', fontWeight: '500' }}>{l.userId}</td>
                  <td style={{ padding: '1rem' }}>{getStreamName(l.streamId)}</td>
                  <td style={{ padding: '1rem', fontWeight: 'bold' }}>{l.score} / {l.totalPossible}</td>
                  <td style={{ padding: '1rem', color: 'var(--primary)', fontWeight: '500' }}>{l.percentile?.toFixed(1)}%</td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                    {Math.floor(l.timeSpent / 60)}m {l.timeSpent % 60}s
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                    {new Date(l.completedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Questions Management List */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {questions.map((q) => (
            <div key={q._id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1.5rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                  <span style={{ padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: 'bold', background: 'rgba(29, 78, 216, 0.1)', color: 'var(--primary)' }}>
                    {getStreamName(q.streamId)}
                  </span>
                  <span style={{ padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: 'bold', background: 'rgba(107, 114, 128, 0.1)', color: 'var(--text-muted)' }}>
                    {q.subject}
                  </span>
                  <span style={{ padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: 'bold', background: 'rgba(168, 85, 247, 0.1)', color: 'var(--status-marked)' }}>
                    {q.type}
                  </span>
                </div>

                <p style={{ fontSize: '1.125rem', fontWeight: '500', marginBottom: '1rem' }}>{q.text}</p>

                {q.type !== 'Integer' && q.options && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.875rem' }}>
                    {q.options.map((opt, i) => {
                      const isCorrect = q.correct.includes(i);
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: isCorrect ? 'var(--status-answered)' : 'var(--text-muted)' }}>
                          {isCorrect ? <Check size={14} /> : <div style={{ width: 14 }}></div>}
                          <span>{opt}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
                {q.type === 'Integer' && (
                  <div style={{ fontSize: '0.875rem', color: 'var(--status-answered)', fontWeight: 'bold' }}>
                    Correct Answer: {q.correct[0]}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-outline" style={{ padding: '0.5rem' }} onClick={() => openEdit(q)}>
                  <Edit2 size={16} />
                </button>
                <button className="btn btn-outline" style={{ padding: '0.5rem', borderColor: 'var(--danger)', color: 'var(--danger)' }} onClick={() => handleDelete(q._id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
