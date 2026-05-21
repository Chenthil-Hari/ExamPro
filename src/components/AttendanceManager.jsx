import { useState, useEffect } from 'react';
import { API_URL } from '../config';
import { Loader2, Users, Calendar, CheckCircle, XCircle, Save } from 'lucide-react';

export default function AttendanceManager({ user }) {
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const apiUrl = API_URL;

  // Fetch batches on mount
  useEffect(() => {
    const fetchBatches = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${apiUrl}/teacher/batches?teacherId=${user.userId || user.id}`);
        const data = await res.json();
        if (data.success) {
          setBatches(data.batches);
        } else {
          setError(data.error);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchBatches();
  }, [user, apiUrl]);

  // Fetch students and existing attendance when batch or date changes
  useEffect(() => {
    if (!selectedBatch) return;

    const fetchAttendanceData = async () => {
      try {
        setLoading(true);
        setSuccessMsg('');
        // Fetch student details for the batch
        const studentsRes = await fetch(`${apiUrl}/teacher/batches/${selectedBatch}/students`);
        const studentsData = await studentsRes.json();
        
        // Fetch existing attendance records
        const attRes = await fetch(`${apiUrl}/teacher/attendance/${selectedBatch}?date=${date}`);
        const attData = await attRes.json();

        if (studentsData.success) {
          setStudents(studentsData.students);
          
          // Initialize records: default to Present, override with existing data if available
          const initialRecords = {};
          
          // Defaults
          studentsData.students.forEach(s => {
            initialRecords[s.userId] = 'Present';
          });
          
          // Overrides from DB
          if (attData.success && attData.records && attData.records.length > 0) {
            const dbRecords = attData.records[0].records;
            dbRecords.forEach(r => {
              initialRecords[r.studentId] = r.status;
            });
          }
          
          setAttendanceRecords(initialRecords);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceData();
  }, [selectedBatch, date, apiUrl]);

  const toggleAttendance = (studentId) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: prev[studentId] === 'Present' ? 'Absent' : 'Present'
    }));
  };

  const markAll = (status) => {
    const updated = {};
    students.forEach(s => {
      updated[s.userId] = status;
    });
    setAttendanceRecords(updated);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMsg('');
      
      const recordsArray = Object.keys(attendanceRecords).map(studentId => ({
        studentId,
        status: attendanceRecords[studentId]
      }));

      const res = await fetch(`${apiUrl}/teacher/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: selectedBatch,
          date,
          records: recordsArray,
          recordedBy: user.userId || user.id
        })
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg('Attendance saved successfully!');
      } else {
        setError(data.error || 'Failed to save attendance');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading && !selectedBatch) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><Loader2 className="spin" size={32} /></div>;
  }

  return (
    <div className="card" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
        <Calendar size={28} color="var(--primary)" />
        <h2 style={{ margin: 0 }}>Attendance Tracking</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Select Batch</label>
          <select 
            className="input" 
            value={selectedBatch || ''} 
            onChange={(e) => setSelectedBatch(e.target.value)}
          >
            <option value="">-- Choose Batch --</option>
            {batches.map(b => (
              <option key={b._id} value={b._id}>{b.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Date</label>
          <input 
            type="date" 
            className="input" 
            value={date} 
            max={new Date().toISOString().split('T')[0]}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div style={{ background: '#fee2e2', color: '#ef4444', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {successMsg && (
        <div style={{ background: '#d1fae5', color: '#10b981', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
          {successMsg}
        </div>
      )}

      {selectedBatch && (
        <div>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><Loader2 className="spin" /></div>
          ) : students.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No students enrolled in this batch.</p>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0 }}>Student Roster</h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-outline" onClick={() => markAll('Present')} style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}>Mark All Present</button>
                  <button className="btn btn-outline" onClick={() => markAll('Absent')} style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}>Mark All Absent</button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2rem' }}>
                {students.map(s => {
                  const status = attendanceRecords[s.userId];
                  const isPresent = status === 'Present';
                  
                  return (
                    <div 
                      key={s.userId} 
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        padding: '1rem',
                        border: '1px solid var(--border)',
                        borderRadius: '0.5rem',
                        background: 'var(--card)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--primary)' }}>
                          {s.name.charAt(0)}
                        </div>
                        <div>
                          <p style={{ fontWeight: 'bold', margin: 0 }}>{s.name}</p>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.userId}</span>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => toggleAttendance(s.userId)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem 1rem',
                          borderRadius: '2rem',
                          border: `1px solid ${isPresent ? '#10b981' : '#ef4444'}`,
                          background: isPresent ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: isPresent ? '#10b981' : '#ef4444',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        {isPresent ? <CheckCircle size={18} /> : <XCircle size={18} />}
                        {status}
                      </button>
                    </div>
                  );
                })}
              </div>

              <button 
                className="btn btn-primary" 
                onClick={handleSave} 
                disabled={saving}
                style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '1rem' }}
              >
                {saving ? <Loader2 className="spin" size={20} /> : <Save size={20} />}
                Save Attendance for {date}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
