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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ padding: '0.75rem', background: 'rgba(99,102,241,0.1)', borderRadius: '0.5rem', color: 'var(--primary)' }}>
          <Calendar size={24} />
        </div>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>Attendance Tracking</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>Mark daily roll calls and generate attendance reports</p>
        </div>
      </div>

      <div className="card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', padding: '1.5rem', background: 'var(--card)', border: '1px solid var(--border)' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-muted)' }}>SELECT BATCH</label>
          <select 
            className="input" 
            value={selectedBatch || ''} 
            onChange={(e) => setSelectedBatch(e.target.value)}
            style={{ padding: '0.75rem', borderRadius: '0.5rem' }}
          >
            <option value="">-- Choose Batch --</option>
            {batches.map(b => (
              <option key={b._id} value={b._id}>{b.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-muted)' }}>ATTENDANCE DATE</label>
          <input 
            type="date" 
            className="input" 
            value={date} 
            max={new Date().toISOString().split('T')[0]}
            onChange={(e) => setDate(e.target.value)}
            style={{ padding: '0.75rem', borderRadius: '0.5rem' }}
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h4 style={{ fontWeight: 'bold', fontSize: '1.1rem', margin: 0 }}>Student Roster ({students.length})</h4>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-outline" onClick={() => markAll('Present')} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', color: '#10b981', borderColor: 'rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.05)' }}>Mark All Present</button>
                  <button className="btn btn-outline" onClick={() => markAll('Absent')} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.05)' }}>Mark All Absent</button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
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
                        border: isPresent ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(239,68,68,0.4)',
                        borderRadius: '0.75rem',
                        background: isPresent ? 'rgba(16,185,129,0.03)' : 'rgba(239,68,68,0.03)',
                        transition: 'all 0.2s',
                        cursor: 'pointer'
                      }}
                      onClick={() => toggleAttendance(s.userId)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: isPresent ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: isPresent ? '#10b981' : '#ef4444', fontSize: '1.2rem' }}>
                          {s.name.charAt(0)}
                        </div>
                        <div>
                          <p style={{ fontWeight: 'bold', margin: 0, fontSize: '0.95rem' }}>{s.name}</p>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.userId}</span>
                        </div>
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '32px', height: '32px',
                        borderRadius: '50%',
                        background: isPresent ? '#10b981' : '#ef4444',
                        color: 'white',
                        transition: 'transform 0.15s',
                        transform: isPresent ? 'scale(1)' : 'scale(0.9)'
                      }}>
                        {isPresent ? <CheckCircle size={16} /> : <XCircle size={16} />}
                      </div>
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
