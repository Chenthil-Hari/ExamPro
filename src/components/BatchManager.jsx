import { useState, useEffect } from 'react';
import { Users, Plus, Trash2, UserPlus, Loader2, BookOpen, Link } from 'lucide-react';

export default function BatchManager({ user }) {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newBatchName, setNewBatchName] = useState('');
  const [studentInputs, setStudentInputs] = useState({}); // { batchId: studentIdString }
  const [copiedId, setCopiedId] = useState(null);

  const handleCopyLink = (batchId) => {
    const link = `${window.location.origin}/?joinBatch=${batchId}`;
    navigator.clipboard.writeText(link)
      .then(() => {
        setCopiedId(batchId);
        setTimeout(() => setCopiedId(null), 2000);
      })
      .catch(err => console.error('Failed to copy link:', err));
  };

  const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/_/backend/api' : 'http://localhost:5000/api');

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiUrl}/teacher/batches?teacherId=${user.id}`);
      const data = await res.json();
      if (data.success) {
        setBatches(data.batches);
      }
    } catch (err) {
      console.error('Failed to load batches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, [user.id]);

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    if (!newBatchName.trim()) return alert('Please enter batch name');

    try {
      const res = await fetch(`${apiUrl}/teacher/batches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newBatchName, teacherId: user.id })
      });
      const data = await res.json();
      if (data.success) {
        setBatches([data.batch, ...batches]);
        setNewBatchName('');
      } else {
        alert('Failed to create batch: ' + data.error);
      }
    } catch (err) {
      alert('Error connecting to server');
    }
  };

  const handleDeleteBatch = async (batchId) => {
    if (!confirm('Are you sure you want to delete this batch? All scheduled assignments will also be deleted.')) return;

    try {
      const res = await fetch(`${apiUrl}/teacher/batches/${batchId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setBatches(batches.filter(b => b._id !== batchId));
      } else {
        alert('Failed to delete batch');
      }
    } catch (err) {
      alert('Error deleting batch');
    }
  };

  const handleAddStudent = async (batchId) => {
    const studentId = studentInputs[batchId]?.trim();
    if (!studentId) return alert('Enter student ID');

    // To prevent duplicate additions
    const batch = batches.find(b => b._id === batchId);
    if (batch.students.includes(studentId)) {
      return alert('Student is already in this batch');
    }

    const updatedStudents = [...batch.students, studentId];

    try {
      // Check if student exists or simply upsert student
      const res = await fetch(`${apiUrl}/teacher/batches/${batchId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: batch.name,
          teacherId: user.id,
          students: updatedStudents
        })
      });
      const data = await res.json();
      if (data.success) {
        setBatches(batches.map(b => b._id === batchId ? data.batch : b));
        setStudentInputs(prev => ({ ...prev, [batchId]: '' }));
      } else {
        alert('Failed to add student');
      }
    } catch (err) {
      alert('Error adding student');
    }
  };

  const handleRemoveStudent = async (batchId, studentId) => {
    if (!confirm(`Remove student ${studentId}?`)) return;

    const batch = batches.find(b => b._id === batchId);
    const updatedStudents = batch.students.filter(s => s !== studentId);

    try {
      const res = await fetch(`${apiUrl}/teacher/batches/${batchId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: batch.name,
          teacherId: user.id,
          students: updatedStudents
        })
      });
      const data = await res.json();
      if (data.success) {
        setBatches(batches.map(b => b._id === batchId ? data.batch : b));
      } else {
        alert('Failed to remove student');
      }
    } catch (err) {
      alert('Error removing student');
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={20} color="var(--warning)" /> Manage Batches
        </h3>
      </div>

      {/* Create Batch Form */}
      <form onSubmit={handleCreateBatch} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 250 }}>
          <input
            type="text"
            placeholder="Enter batch/class name (e.g. JEE Batch A)"
            value={newBatchName}
            onChange={(e) => setNewBatchName(e.target.value)}
            style={{ marginBottom: 0 }}
          />
        </div>
        <button type="submit" className="btn" style={{ background: 'var(--warning)', color: 'white' }}>
          <Plus size={16} /> Create Batch
        </button>
      </form>

      {/* Batches List */}
      {batches.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
          No batches found. Create your first class batch above.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {batches.map((batch) => (
            <div key={batch._id} className="card" style={{ border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                <div>
                  <h4 style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{batch.name}</h4>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    ID: {batch._id} | {batch.students.length} students enrolled
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="btn btn-outline"
                    onClick={() => handleCopyLink(batch._id)}
                    style={{ color: 'var(--warning)', borderColor: 'var(--warning)', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <Link size={14} /> {copiedId === batch._id ? 'Copied!' : 'Share Join Link'}
                  </button>
                  <button
                    className="btn btn-outline"
                    onClick={() => handleDeleteBatch(batch._id)}
                    style={{ color: 'var(--danger)', borderColor: 'var(--border)', padding: '0.4rem 0.8rem' }}
                  >
                    <Trash2 size={16} /> Delete Batch
                  </button>
                </div>
              </div>

              {/* Roster & Add Student */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', flexWrap: 'wrap' }}>
                {/* Students Enrolled */}
                <div>
                  <h5 style={{ fontWeight: '600', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Enrolled Students</h5>
                  {batch.students.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No students enrolled yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxH: '180px', overflowY: 'auto' }}>
                      {batch.students.map((studentId) => (
                        <div
                          key={studentId}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: 'var(--bg)',
                            padding: '0.4rem 0.75rem',
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem',
                            border: '1px solid var(--border)'
                          }}
                        >
                          <span>{studentId}</span>
                          <button
                            onClick={() => handleRemoveStudent(batch._id, studentId)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add Student Input */}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <h5 style={{ fontWeight: '600', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Add Student to Batch</h5>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      placeholder="Enter Student ID (e.g. STU_hari)"
                      value={studentInputs[batch._id] || ''}
                      onChange={(e) => setStudentInputs({ ...studentInputs, [batch._id]: e.target.value })}
                      style={{ marginBottom: 0, padding: '0.5rem' }}
                    />
                    <button
                      className="btn btn-outline"
                      onClick={() => handleAddStudent(batch._id)}
                      style={{ padding: '0.5rem 1rem' }}
                    >
                      <UserPlus size={16} /> Add
                    </button>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    Note: Student IDs are case-sensitive and prefixed with 'STU_'.
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
