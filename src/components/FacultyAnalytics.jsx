import { API_URL } from '../config';
import { useState, useEffect } from 'react';
import { BarChart2, Loader2, Award, AlertTriangle, HelpCircle, CheckCircle, ArrowLeft } from 'lucide-react';

export default function FacultyAnalytics({ user }) {
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  
  const [analytics, setAnalytics] = useState(null);
  const [heatmap, setHeatmap] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingHeatmap, setLoadingHeatmap] = useState(false);

  // Student details sub-view
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [studentResults, setStudentResults] = useState([]);
  const [loadingStudent, setLoadingStudent] = useState(false);

  const apiUrl = API_URL;

  // Load teacher batches
  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const res = await fetch(`${apiUrl}/teacher/batches?teacherId=${user.id}`);
        const data = await res.json();
        if (data.success && data.batches.length > 0) {
          setBatches(data.batches);
          setSelectedBatchId(data.batches[0]._id);
        }
      } catch (err) {
        console.error('Failed to load batches:', err);
      }
    };
    fetchBatches();
  }, [user.id]);

  // Load batch analytics & heatmap on batch select
  useEffect(() => {
    if (!selectedBatchId) return;

    const fetchBatchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${apiUrl}/teacher/analytics/batch/${selectedBatchId}`);
        const data = await res.json();
        if (data.success) {
          setAnalytics(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const fetchHeatmapData = async () => {
      try {
        setLoadingHeatmap(true);
        const res = await fetch(`${apiUrl}/teacher/analytics/heatmap/${selectedBatchId}`);
        const data = await res.json();
        if (data.success) {
          setHeatmap(data.heatmap);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingHeatmap(false);
      }
    };

    fetchBatchData();
    fetchHeatmapData();
    setSelectedStudentId(null);
  }, [selectedBatchId]);

  // Load student detail results
  useEffect(() => {
    if (!selectedStudentId) {
      setStudentResults([]);
      return;
    }

    const fetchStudentResults = async () => {
      try {
        setLoadingStudent(true);
        const res = await fetch(`${apiUrl}/teacher/analytics/student/${selectedStudentId}`);
        const data = await res.json();
        if (data.success) {
          setStudentResults(data.results);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingStudent(false);
      }
    };

    fetchStudentResults();
  }, [selectedStudentId]);

  // Aggregated calculations
  const calculateClassAverages = () => {
    if (!analytics || !analytics.studentPerformance || analytics.studentPerformance.length === 0) return { avgScore: 0, totalAttempts: 0, totalWarnings: 0 };
    
    let totalScoreSum = 0;
    let attemptsCount = 0;
    let warningsCount = 0;
    let studentWithAttempts = 0;

    analytics.studentPerformance.forEach(p => {
      if (p.attempts > 0) {
        totalScoreSum += (p.totalScore / p.attempts);
        studentWithAttempts += 1;
      }
      attemptsCount += p.attempts;
      warningsCount += p.warningsCount;
    });

    const avgScore = studentWithAttempts > 0 ? Math.round(totalScoreSum / studentWithAttempts) : 0;
    return {
      avgScore,
      totalAttempts: attemptsCount,
      totalWarnings: warningsCount
    };
  };

  const classMetrics = calculateClassAverages();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BarChart2 size={20} color="var(--warning)" /> Faculty Analytics
        </h3>
        
        {batches.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Selected Batch:</span>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--border)', background: 'var(--card)', fontSize: '0.9rem' }}
            >
              {batches.map(b => (
                <option key={b._id} value={b._id}>{b.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {batches.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
          Create a student batch first to view analytics reports.
        </div>
      ) : loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '30vh' }}>
          <Loader2 className="animate-spin" size={24} color="var(--warning)" />
        </div>
      ) : selectedStudentId ? (
        /* Detailed Student Report View */
        <div className="fade-in">
          <button className="btn btn-outline" onClick={() => setSelectedStudentId(null)} style={{ marginBottom: '1.5rem', padding: '0.4rem 0.8rem' }}>
            <ArrowLeft size={16} /> Back to Class Report
          </button>

          <h4 style={{ fontWeight: 'bold', marginBottom: '1rem', fontSize: '1.2rem' }}>
            Performance Tracker: <span style={{ color: 'var(--primary)' }}>{selectedStudentId}</span>
          </h4>

          {loadingStudent ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
              <Loader2 className="animate-spin" size={24} color="var(--warning)" />
            </div>
          ) : studentResults.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No exam attempts registered for this student.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.75rem' }}>Stream / Exam</th>
                    <th style={{ padding: '0.75rem' }}>Score</th>
                    <th style={{ padding: '0.75rem' }}>Percentile</th>
                    <th style={{ padding: '0.75rem' }}>Warnings</th>
                    <th style={{ padding: '0.75rem' }}>IP Address</th>
                    <th style={{ padding: '0.75rem' }}>Completed At</th>
                  </tr>
                </thead>
                <tbody>
                  {studentResults.map((res) => (
                    <tr key={res._id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.75rem', fontWeight: '500' }}>{res.streamId.toUpperCase()}</td>
                      <td style={{ padding: '0.75rem' }}>
                        {res.score} / {res.totalPossible}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        {res.percentile !== undefined ? `${Math.round(res.percentile)}%` : 'N/A'}
                      </td>
                      <td style={{ padding: '0.75rem', color: res.warningsCount > 0 ? 'var(--danger)' : 'inherit', fontWeight: res.warningsCount > 0 ? 'bold' : 'normal' }}>
                        {res.warningsCount || 0}
                      </td>
                      <td style={{ padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{res.ipAddress || 'Unknown'}</td>
                      <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(res.completedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Class Overview Analytics View */
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Top KPI Widgets */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid var(--border)', background: 'var(--bg)' }}>
              <div style={{ color: 'var(--warning)', background: 'rgba(245,158,11,0.1)', padding: '0.75rem', borderRadius: '0.5rem' }}>
                <Award size={28} />
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Class Avg Marks</span>
                <h4 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{classMetrics.avgScore} / 100</h4>
              </div>
            </div>

            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid var(--border)', background: 'var(--bg)' }}>
              <div style={{ color: 'var(--primary)', background: 'rgba(29,78,216,0.1)', padding: '0.75rem', borderRadius: '0.5rem' }}>
                <CheckCircle size={28} />
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Attempts</span>
                <h4 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{classMetrics.totalAttempts}</h4>
              </div>
            </div>

            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid var(--border)', background: 'var(--bg)' }}>
              <div style={{ color: 'var(--danger)', background: 'rgba(239,68,68,0.1)', padding: '0.75rem', borderRadius: '0.5rem' }}>
                <AlertTriangle size={28} />
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Proctor Warnings</span>
                <h4 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: classMetrics.totalWarnings > 0 ? 'var(--danger)' : 'inherit' }}>
                  {classMetrics.totalWarnings}
                </h4>
              </div>
            </div>
          </div>

          {/* Student Roster Table */}
          <div>
            <h4 style={{ fontWeight: 'bold', marginBottom: '1rem', fontSize: '1.1rem' }}>Student Progress Logs</h4>
            {!analytics?.studentPerformance || analytics.studentPerformance.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center' }}>No students enrolled in this batch.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '0.75rem' }}>Student ID</th>
                      <th style={{ padding: '0.75rem' }}>Tests Attempted</th>
                      <th style={{ padding: '0.75rem' }}>Top Score</th>
                      <th style={{ padding: '0.75rem' }}>Proctor Warnings</th>
                      <th style={{ padding: '0.75rem' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics?.studentPerformance?.map((student) => (
                      <tr key={student.userId} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '0.75rem', fontWeight: '600' }}>{student.userId}</td>
                        <td style={{ padding: '0.75rem' }}>{student.attempts}</td>
                        <td style={{ padding: '0.75rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                          {student.attempts > 0 ? `${student.maxScore}` : '-'}
                        </td>
                        <td style={{ padding: '0.75rem', color: student.warningsCount > 0 ? 'var(--danger)' : 'inherit', fontWeight: student.warningsCount > 0 ? 'bold' : 'normal' }}>
                          {student.warningsCount}
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <button
                            className="btn btn-outline"
                            onClick={() => setSelectedStudentId(student.userId)}
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                          >
                            View Report Card
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Difficulty Heatmap Grid */}
          <div>
            <h4 style={{ fontWeight: 'bold', marginBottom: '0.25rem', fontSize: '1.1rem' }}>Question Difficulty Heatmap</h4>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Hover over cards to see question snippets. Cell color indicates average student correctness rates.
            </p>

            {loadingHeatmap ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                <Loader2 className="animate-spin" size={20} color="var(--warning)" />
              </div>
            ) : heatmap.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem', border: '1px dashed var(--border)', borderRadius: '0.5rem' }}>
                No mock exam responses received yet for questions in this batch.
              </div>
            ) : (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
                gap: '1rem' 
              }}>
                {heatmap.map((item) => {
                  let cellBg = 'rgba(100, 116, 139, 0.05)'; // gray for 0 attempts
                  let cellBorder = '1px solid var(--border)';
                  let cellColor = 'var(--text)';
                  
                  if (item.attempts > 0) {
                    if (item.successRate >= 80) {
                      cellBg = 'rgba(34, 197, 94, 0.1)'; // green
                      cellBorder = '1px solid #22c55e';
                      cellColor = '#166534';
                    } else if (item.successRate >= 50) {
                      cellBg = 'rgba(245, 158, 11, 0.1)'; // orange
                      cellBorder = '1px solid #f59e0b';
                      cellColor = '#9a3412';
                    } else {
                      cellBg = 'rgba(239, 68, 68, 0.1)'; // red
                      cellBorder = '1px solid #ef4444';
                      cellColor = '#991b1b';
                    }
                  }

                  return (
                    <div
                      key={item._id}
                      className="card"
                      title={item.text}
                      style={{
                        background: cellBg,
                        border: cellBorder,
                        color: cellColor,
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '0.75rem',
                        transition: 'transform 0.15s',
                        cursor: 'default'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                          <span>{item.subject.toUpperCase()}</span>
                          <span style={{ padding: '0.1rem 0.35rem', borderRadius: '4px', background: 'rgba(0,0,0,0.05)' }}>
                            {item.difficulty}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.8rem', display: '-webkit-box', WebkitLineBreak: 'anywhere', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', opacity: 0.85 }}>
                          {item.text}
                        </p>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '0.5rem', fontWeight: '600' }}>
                        <span>Success Rate:</span>
                        <span style={{ fontSize: '0.9rem' }}>
                          {item.attempts > 0 ? `${item.successRate}%` : '0% (N/A)'}
                        </span>
                      </div>
                      
                      <div style={{ fontSize: '0.7rem', opacity: 0.7, textAlign: 'right' }}>
                        {item.correct} correct / {item.attempts} attempts
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
