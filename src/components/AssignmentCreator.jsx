import { useState, useEffect } from 'react';
import { Calendar, Plus, Trash2, Loader2, BookOpen, Clock, AlertCircle } from 'lucide-react';

export default function AssignmentCreator({ user, streams }) {
  const [batches, setBatches] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form Fields
  const [title, setTitle] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [selectedStreamId, setSelectedStreamId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [instructions, setInstructions] = useState('');
  const [useCustomQuestions, setUseCustomQuestions] = useState(false);
  
  // Custom Question Selector
  const [streamQuestions, setStreamQuestions] = useState([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);
  const [qSearch, setQSearch] = useState('');
  const [qSubject, setQSubject] = useState('');
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/_/backend/api' : 'http://localhost:5000/api');

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch batches
      const resBatches = await fetch(`${apiUrl}/teacher/batches?teacherId=${user.id}`);
      const dataBatches = await resBatches.json();
      if (dataBatches.success) {
        setBatches(dataBatches.batches);
        if (dataBatches.batches.length > 0) setSelectedBatchId(dataBatches.batches[0]._id);
      }

      // Fetch assignments
      const resAssignments = await fetch(`${apiUrl}/teacher/assignments?teacherId=${user.id}`);
      const dataAssignments = await resAssignments.json();
      if (dataAssignments.success) {
        setAssignments(dataAssignments.assignments);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    if (streams.length > 0) setSelectedStreamId(streams[0].id);
  }, [user.id, streams]);

  // Fetch questions when stream or customs toggle changes
  useEffect(() => {
    if (!useCustomQuestions || !selectedStreamId) {
      setStreamQuestions([]);
      return;
    }

    const fetchQuestions = async () => {
      try {
        setLoadingQuestions(true);
        // Let's get ALL questions for this stream (using admin route or custom filter route)
        // Admin questions has all. Let's filter client side
        const res = await fetch(`${apiUrl}/admin/questions`);
        const data = await res.json();
        if (data.success) {
          // Filter by selected stream and approved status
          const filtered = data.questions.filter(q => q.streamId === selectedStreamId && q.status === 'approved');
          setStreamQuestions(filtered);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingQuestions(false);
      }
    };

    fetchQuestions();
    setSelectedQuestionIds([]);
  }, [useCustomQuestions, selectedStreamId]);

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!title.trim()) return alert('Please enter assignment title');
    if (!selectedBatchId) return alert('Please select a target batch');
    if (!selectedStreamId) return alert('Please select a stream');
    if (!startTime || !endTime) return alert('Please specify exam window');

    const start = new Date(startTime);
    const end = new Date(endTime);
    if (start >= end) return alert('End time must be after start time');

    const payload = {
      title,
      batchId: selectedBatchId,
      streamId: selectedStreamId,
      customQuestions: useCustomQuestions ? selectedQuestionIds : [],
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      instructions,
      createdBy: user.id
    };

    try {
      const res = await fetch(`${apiUrl}/teacher/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        // Reload list
        fetchData();
        // Reset form
        setTitle('');
        setInstructions('');
        setSelectedQuestionIds([]);
        setUseCustomQuestions(false);
        alert('Assignment scheduled successfully!');
      } else {
        alert('Failed to schedule: ' + data.error);
      }
    } catch (err) {
      alert('Error creating assignment');
    }
  };

  const handleDeleteAssignment = async (id) => {
    if (!confirm('Are you sure you want to cancel this scheduled exam?')) return;

    try {
      const res = await fetch(`${apiUrl}/teacher/assignments/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setAssignments(assignments.filter(a => a._id !== id));
      } else {
        alert('Failed to cancel assignment');
      }
    } catch (err) {
      alert('Error deleting assignment');
    }
  };

  const handleToggleQuestionSelection = (qId) => {
    if (selectedQuestionIds.includes(qId)) {
      setSelectedQuestionIds(selectedQuestionIds.filter(id => id !== qId));
    } else {
      setSelectedQuestionIds([...selectedQuestionIds, qId]);
    }
  };

  // Filtered stream questions
  const filteredQuestions = streamQuestions.filter(q => {
    const textMatch = q.text.toLowerCase().includes(qSearch.toLowerCase());
    const subjectMatch = qSubject === '' || q.subject.toLowerCase() === qSubject.toLowerCase();
    return textMatch && subjectMatch;
  });

  const subjects = [...new Set(streamQuestions.map(q => q.subject))];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '30vh' }}>
        <Loader2 className="animate-spin" size={24} color="var(--warning)" />
      </div>
    );
  }

  return (
    <div>
      <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={20} color="var(--warning)" /> Assignment Creator
        </h3>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', alignItems: 'start' }}>
        {/* Creation Form */}
        <div className="card" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
          <h4 style={{ fontWeight: 'bold', marginBottom: '1.25rem' }}>Schedule New Exam</h4>
          
          <form onSubmit={handleCreateAssignment}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: '500', fontSize: '0.9rem' }}>Assignment Title</label>
              <input
                type="text"
                placeholder="e.g. Mid-term Algebra Assessment"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: '500', fontSize: '0.9rem' }}>Target Batch</label>
                <select
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid var(--border)', background: 'var(--card)' }}
                >
                  {batches.map(b => (
                    <option key={b._id} value={b._id}>{b.name}</option>
                  ))}
                  {batches.length === 0 && <option value="">Create a batch first</option>}
                </select>
              </div>

              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: '500', fontSize: '0.9rem' }}>Exam Stream</label>
                <select
                  value={selectedStreamId}
                  onChange={(e) => setSelectedStreamId(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid var(--border)', background: 'var(--card)' }}
                >
                  {streams.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: '500', fontSize: '0.9rem' }}>Start Time</label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>

              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: '500', fontSize: '0.9rem' }}>End Time</label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: '500', fontSize: '0.9rem' }}>Special Instructions</label>
              <textarea
                rows={3}
                placeholder="Instructions displayed to students before starting... (e.g. Strict 10-min limit, tab changes monitored)"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid var(--border)', background: 'var(--card)', resize: 'vertical' }}
              />
            </div>

            {/* Custom Question Bank selector toggle */}
            <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                id="customQuestionsCheckbox"
                checked={useCustomQuestions}
                onChange={(e) => setUseCustomQuestions(e.target.checked)}
                style={{ width: 16, height: 16 }}
              />
              <label htmlFor="customQuestionsCheckbox" style={{ fontWeight: '500', fontSize: '0.9rem', cursor: 'pointer' }}>
                Build Custom Test Set (Select specific approved questions)
              </label>
            </div>

            {useCustomQuestions && (
              <div className="card" style={{ background: 'var(--card)', marginBottom: '1.5rem', border: '1px solid var(--border)' }}>
                <h5 style={{ fontWeight: 'bold', fontSize: '0.95rem', marginBottom: '1rem' }}>
                  Select Questions ({selectedQuestionIds.length} chosen)
                </h5>

                {/* Filters */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  <input
                    type="text"
                    placeholder="Search questions..."
                    value={qSearch}
                    onChange={(e) => setQSearch(e.target.value)}
                    style={{ marginBottom: 0, padding: '0.5rem', fontSize: '0.85rem' }}
                  />
                  <select
                    value={qSubject}
                    onChange={(e) => setQSubject(e.target.value)}
                    style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                  >
                    <option value="">All Subjects</option>
                    {subjects.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>

                {loadingQuestions ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
                    <Loader2 className="animate-spin" size={20} color="var(--warning)" />
                  </div>
                ) : filteredQuestions.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
                    No approved questions found for this stream matching filters.
                  </p>
                ) : (
                  <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {filteredQuestions.map((q) => (
                      <label
                        key={q._id}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.5rem',
                          padding: '0.5rem',
                          borderRadius: '0.25rem',
                          background: 'var(--bg)',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          border: selectedQuestionIds.includes(q._id) ? '1px solid var(--warning)' : '1px solid transparent'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedQuestionIds.includes(q._id)}
                          onChange={() => handleToggleQuestionSelection(q._id)}
                          style={{ marginTop: 2 }}
                        />
                        <div>
                          <span style={{ fontWeight: 'bold', color: 'var(--warning)' }}>[{q.subject} - {q.difficulty}]</span>{' '}
                          {q.text.length > 80 ? q.text.substring(0, 80) + '...' : q.text}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button type="submit" className="btn" style={{ width: '100%', background: 'var(--warning)', color: 'white' }}>
              <Plus size={16} /> Schedule Exam
            </button>
          </form>
        </div>

        {/* Scheduled List */}
        <div>
          <h4 style={{ fontWeight: 'bold', marginBottom: '1.25rem' }}>Scheduled Assignments</h4>
          {assignments.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem', border: '1px dashed var(--border)', borderRadius: '0.5rem' }}>
              No scheduled exams found. Create one using the scheduler.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {assignments.map((ass) => {
                const now = new Date();
                const start = new Date(ass.startTime);
                const end = new Date(ass.endTime);
                let badgeText = 'Scheduled';
                let badgeColor = 'var(--text-muted)';
                
                if (now >= start && now <= end) {
                  badgeText = 'Ongoing';
                  badgeColor = 'var(--status-answered)';
                } else if (now > end) {
                  badgeText = 'Completed';
                  badgeColor = 'var(--text-muted)';
                }

                return (
                  <div key={ass._id} className="card" style={{ border: '1px solid var(--border)', padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div>
                        <h5 style={{ fontWeight: 'bold', fontSize: '1rem' }}>{ass.title}</h5>
                        <span style={{ fontSize: '0.75rem', padding: '0.1rem 0.5rem', borderRadius: '999px', background: 'rgba(0,0,0,0.05)', color: badgeColor, border: `1px solid ${badgeColor}`, fontWeight: '600' }}>
                          {badgeText}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteAssignment(ass._id)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.5rem' }}>
                      <div><strong>Batch:</strong> {ass.batchId?.name || 'Deleted Batch'}</div>
                      <div><strong>Stream:</strong> {ass.streamId.toUpperCase()}</div>
                      <div>
                        <strong>Window:</strong> {start.toLocaleString()} - {end.toLocaleString()}
                      </div>
                      <div>
                        <strong>Mode:</strong> {ass.customQuestions?.length > 0 ? `${ass.customQuestions.length} Custom Questions` : 'General Shuffled Set'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
