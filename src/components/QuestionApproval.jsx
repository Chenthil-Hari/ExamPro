import { useState, useEffect } from 'react';
import { ClipboardCheck, Loader2, Eye, Check, X, Tag, Plus, HelpCircle } from 'lucide-react';

export default function QuestionApproval({ user, streams }) {
  const [pendingQuestions, setPendingQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Preview Modal
  const [previewQ, setPreviewQ] = useState(null);

  // Approval Form inputs
  const [editingDiff, setEditingDiff] = useState({}); // { qId: difficultyString }
  const [editingTags, setEditingTags] = useState({}); // { qId: tagsString }

  // New Question Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStreamId, setNewStreamId] = useState(streams[0]?.id || 'neet');
  const [newType, setNewType] = useState('MCQ');
  const [newSubject, setNewSubject] = useState('');
  const [newText, setNewText] = useState('');
  const [newOptionsText, setNewOptionsText] = useState(''); // comma-separated
  const [newCorrectText, setNewCorrectText] = useState(''); // comma-separated indexes/integers
  const [newDifficulty, setNewDifficulty] = useState('Medium');
  const [newTagsText, setNewTagsText] = useState('');

  const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/_/backend/api' : 'http://localhost:5000/api');

  const fetchPending = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiUrl}/teacher/questions/pending`);
      const data = await res.json();
      if (data.success) {
        setPendingQuestions(data.questions);
        
        // Initialize editing fields
        const diffs = {};
        const tags = {};
        data.questions.forEach(q => {
          diffs[q._id] = q.difficulty || 'Medium';
          tags[q._id] = (q.tags || []).join(', ');
        });
        setEditingDiff(diffs);
        setEditingTags(tags);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApproveReject = async (qId, action) => {
    const difficulty = editingDiff[qId];
    // Split tags by comma and trim whitespace
    const tags = editingTags[qId]
      ? editingTags[qId].split(',').map(t => t.trim()).filter(Boolean)
      : [];

    try {
      const res = await fetch(`${apiUrl}/teacher/questions/approve/${qId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, difficulty, tags })
      });
      const data = await res.json();
      if (data.success) {
        setPendingQuestions(pendingQuestions.filter(q => q._id !== qId));
        alert(`Question ${action === 'approve' ? 'approved' : 'rejected'} successfully!`);
      } else {
        alert('Operation failed: ' + data.error);
      }
    } catch (err) {
      alert('Error updating question status');
    }
  };

  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    if (!newSubject.trim() || !newText.trim() || !newCorrectText.trim()) {
      return alert('Subject, Text, and Correct Answer fields are required');
    }

    let parsedOptions = undefined;
    if (newType === 'MCQ' || newType === 'MSQ') {
      if (!newOptionsText.trim()) return alert('Options are required for MCQ/MSQ');
      parsedOptions = newOptionsText.split(',').map(o => o.trim()).filter(Boolean);
      if (parsedOptions.length < 2) return alert('Provide at least 2 comma-separated options');
    }

    const parsedCorrect = newCorrectText.split(',').map(c => parseInt(c.trim(), 10)).filter(c => !isNaN(c));
    if (parsedCorrect.length === 0) return alert('Provide at least 1 valid integer correct answer');

    const payload = {
      streamId: newStreamId,
      type: newType,
      subject: newSubject,
      text: newText,
      options: parsedOptions,
      correct: parsedCorrect,
      difficulty: newDifficulty,
      tags: newTagsText ? newTagsText.split(',').map(t => t.trim()).filter(Boolean) : [],
      createdBy: user.id
    };

    try {
      const res = await fetch(`${apiUrl}/questions/propose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        alert('Question added successfully (pre-approved as teacher)!');
        setShowAddForm(false);
        // Reset form
        setNewSubject('');
        setNewText('');
        setNewOptionsText('');
        setNewCorrectText('');
        setNewTagsText('');
      } else {
        alert('Failed to create question: ' + data.error);
      }
    } catch (err) {
      alert('Error posting question to database');
    }
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ClipboardCheck size={20} color="var(--warning)" /> Question Bank
        </h3>
        
        <button className="btn btn-outline" onClick={() => setShowAddForm(!showAddForm)} style={{ borderColor: 'var(--warning)', color: 'var(--warning)' }}>
          <Plus size={16} /> {showAddForm ? 'View Pending Questions' : 'Create New Question'}
        </button>
      </div>

      {showAddForm ? (
        /* Create New Question wizard */
        <div className="card fade-in" style={{ background: 'var(--bg)', border: '1px solid var(--border)', maxWidth: 650, margin: '0 auto' }}>
          <h4 style={{ fontWeight: 'bold', marginBottom: '1.25rem' }}>Add Approved Question</h4>
          <form onSubmit={handleCreateQuestion}>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: '500', fontSize: '0.85rem' }}>Target Stream</label>
                <select
                  value={newStreamId}
                  onChange={(e) => setNewStreamId(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid var(--border)', background: 'var(--card)' }}
                >
                  {streams.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: '500', fontSize: '0.85rem' }}>Question Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid var(--border)', background: 'var(--card)' }}
                >
                  <option value="MCQ">MCQ (Single Choice)</option>
                  <option value="MSQ">MSQ (Multiple Choice)</option>
                  <option value="Integer">Integer Value</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: '500', fontSize: '0.85rem' }}>Subject (e.g. Physics)</label>
                <input
                  type="text"
                  placeholder="e.g. Mathematics"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  style={{ marginBottom: 0 }}
                />
              </div>

              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: '500', fontSize: '0.85rem' }}>Difficulty</label>
                <select
                  value={newDifficulty}
                  onChange={(e) => setNewDifficulty(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid var(--border)', background: 'var(--card)' }}
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: '500', fontSize: '0.85rem' }}>Question Text</label>
              <textarea
                rows={3}
                placeholder="Type the question content..."
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid var(--border)', background: 'var(--card)', resize: 'vertical' }}
              />
            </div>

            {(newType === 'MCQ' || newType === 'MSQ') && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: '500', fontSize: '0.85rem' }}>Options (Comma-separated list)</label>
                <input
                  type="text"
                  placeholder="Option A, Option B, Option C, Option D"
                  value={newOptionsText}
                  onChange={(e) => setNewOptionsText(e.target.value)}
                  style={{ marginBottom: 0 }}
                />
              </div>
            )}

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: '500', fontSize: '0.85rem' }}>
                {newType === 'Integer' ? 'Correct Integer Value' : 'Correct Option Index (0-based, comma-separated if MSQ)'}
              </label>
              <input
                type="text"
                placeholder={newType === 'Integer' ? "e.g. 42" : "e.g. 0 (for 1st option) or 0, 2 (for 1st and 3rd)"}
                value={newCorrectText}
                onChange={(e) => setNewCorrectText(e.target.value)}
                style={{ marginBottom: 0 }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: '500', fontSize: '0.85rem' }}>Topic Tags (Comma-separated list)</label>
              <input
                type="text"
                placeholder="e.g. Algebra, Matrix, Vectors"
                value={newTagsText}
                onChange={(e) => setNewTagsText(e.target.value)}
                style={{ marginBottom: 0 }}
              />
            </div>

            <button type="submit" className="btn" style={{ width: '100%', background: 'var(--warning)', color: 'white' }}>
              <Plus size={16} /> Create approved question
            </button>
          </form>
        </div>
      ) : (
        /* Pending Questions List view */
        <div>
          {pendingQuestions.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem', border: '1px dashed var(--border)', borderRadius: '0.5rem' }}>
              All submitted questions have been reviewed! No pending approval tasks.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {pendingQuestions.map((q) => (
                <div key={q._id} className="card" style={{ border: '1px solid var(--border)' }}>
                  {/* Title Header metadata */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <span style={{ fontWeight: 'bold', marginRight: '0.5rem' }}>{q.streamId.toUpperCase()}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{q.subject} | Type: {q.type}</span>
                    </div>
                    <button className="btn btn-outline" onClick={() => setPreviewQ(q)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>
                      <Eye size={14} /> Preview
                    </button>
                  </div>

                  <p style={{ fontSize: '0.95rem', marginBottom: '1rem', whiteSpace: 'pre-wrap' }}>{q.text}</p>

                  {/* Options display if MCQ/MSQ */}
                  {q.options && q.options.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1rem', background: 'var(--bg)', padding: '0.75rem', borderRadius: '0.375rem' }}>
                      {q.options.map((opt, i) => (
                        <div key={i} style={{ fontSize: '0.85rem' }}>
                          <span style={{ fontWeight: 'bold', color: q.correct.includes(i) ? 'var(--status-answered)' : 'inherit' }}>
                            {String.fromCharCode(65 + i)}) {opt}
                          </span>
                          {q.correct.includes(i) && ' ✓'}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Correct Answers if Integer */}
                  {q.type === 'Integer' && (
                    <div style={{ fontSize: '0.85rem', marginBottom: '1rem', background: 'var(--bg)', padding: '0.5rem', borderRadius: '0.375rem' }}>
                      <strong>Correct Answer:</strong> {q.correct[0]}
                    </div>
                  )}

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    Suggested by: {q.createdBy}
                  </div>

                  {/* Approval Actions Panel */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      {/* Edit Difficulty */}
                      <div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginRight: '0.25rem' }}>Difficulty:</span>
                        <select
                          value={editingDiff[q._id] || 'Medium'}
                          onChange={(e) => setEditingDiff({ ...editingDiff, [q._id]: e.target.value })}
                          style={{ padding: '0.25rem', borderRadius: '4px', border: '1px solid var(--border)' }}
                        >
                          <option value="Easy">Easy</option>
                          <option value="Medium">Medium</option>
                          <option value="Hard">Hard</option>
                        </select>
                      </div>

                      {/* Edit tags */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Tag size={14} color="var(--text-muted)" />
                        <input
                          type="text"
                          placeholder="algebra, calculus"
                          value={editingTags[q._id] || ''}
                          onChange={(e) => setEditingTags({ ...editingTags, [q._id]: e.target.value })}
                          style={{ marginBottom: 0, padding: '0.25rem', width: 140, fontSize: '0.8rem' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn" onClick={() => handleApproveReject(q._id, 'approve')} style={{ background: 'var(--status-answered)', color: 'white', padding: '0.4rem 0.8rem' }}>
                        <Check size={16} /> Approve
                      </button>
                      <button className="btn btn-outline" onClick={() => handleApproveReject(q._id, 'reject')} style={{ color: 'var(--danger)', borderColor: 'var(--border)', padding: '0.4rem 0.8rem' }}>
                        <X size={16} /> Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Render Student Preview Modal */}
      {previewQ && (
        <div className="fullscreen-overlay" style={{ zIndex: 10000 }}>
          <div className="card" style={{ maxWidth: 500, width: '90%', textAlign: 'left', color: 'var(--text)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              <h4 style={{ fontWeight: 'bold' }}>Question Preview Mode</h4>
              <button onClick={() => setPreviewQ(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}>
                ✕
              </button>
            </div>
            
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Subject: {previewQ.subject} | Difficulty: {editingDiff[previewQ._id]}
            </span>
            <p style={{ fontSize: '1.05rem', margin: '1rem 0' }}>{previewQ.text}</p>
            
            {previewQ.type === 'Integer' ? (
              <input type="number" placeholder="Enter numerical answer" disabled />
            ) : (
              <div className="options-list">
                {previewQ.options?.map((opt, idx) => (
                  <label key={idx} className="option-item">
                    <input type={previewQ.type === 'MCQ' ? 'radio' : 'checkbox'} disabled />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            )}
            
            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={() => setPreviewQ(null)}>
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
