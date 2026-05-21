import { API_URL } from '../config';
import { useState, useEffect } from 'react';
import { BookOpen, Clock, BarChart, Calendar, AlertCircle, FileText, CheckCircle, ArrowRight } from 'lucide-react';

export default function StreamSelection({ streams, onSelect, user }) {
  const [assignments, setAssignments] = useState([]);
  const [completedAssignmentIds, setCompletedAssignmentIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(new Date());

  const apiUrl = API_URL;

  useEffect(() => {
    // Update current time every 5 seconds to keep timing buttons accurate
    const timer = setInterval(() => setNow(new Date()), 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user || user.isGuest) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch assignments
        const assignmentsRes = await fetch(`${apiUrl}/teacher/assignments?studentId=${user.id}`);
        const assignmentsData = await assignmentsRes.json();
        
        // Fetch student results to check completed assignments
        const resultsRes = await fetch(`${apiUrl}/users/${user.id}/results`);
        const resultsData = await resultsRes.json();

        if (assignmentsData.success) {
          setAssignments(assignmentsData.assignments);
        }

        if (resultsData.success) {
          const completedIds = new Set(
            resultsData.results
              .filter(r => r.assignmentId)
              .map(r => r.assignmentId.toString())
          );
          setCompletedAssignmentIds(completedIds);
        }
      } catch (err) {
        console.error('Error fetching assignments/results:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, apiUrl]);

  const formatDateTime = (dateStr) => {
    return new Date(dateStr).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleStartAssignment = (assignment) => {
    const baseStream = streams.find(s => s.id === assignment.streamId);
    if (!baseStream) {
      alert('The stream associated with this assignment was not found.');
      return;
    }

    // Build the custom stream session object
    const streamForExam = {
      ...baseStream,
      id: assignment.streamId,
      name: assignment.title,
      assignmentId: assignment._id,
      customQuestions: assignment.customQuestions,
      // If the assignment lists specific questions, let's use its count, otherwise fall back to base stream total
      totalQuestions: assignment.customQuestions?.length > 0 ? assignment.customQuestions.length : baseStream.totalQuestions,
      instructions: assignment.instructions || baseStream.instructions
    };
    onSelect(streamForExam);
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Assigned Exams / Assignments Section */}
      {user && !user.isGuest && assignments.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
            <Calendar size={20} color="var(--warning)" />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>Assigned Exams</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
            {assignments.map(assignment => {
              const start = new Date(assignment.startTime);
              const end = new Date(assignment.endTime);
              const isStarted = now >= start;
              const isEnded = now > end;
              const isCompleted = completedAssignmentIds.has(assignment._id.toString());
              
              let statusText = '';
              let statusColor = 'var(--text-muted)';
              let buttonText = 'Start Exam';
              let buttonClass = 'btn-primary';
              let isButtonDisabled = false;

              if (isCompleted) {
                statusText = 'Completed / Submitted';
                statusColor = '#10b981'; // green
                buttonText = 'Submitted';
                buttonClass = 'btn-outline';
                isButtonDisabled = true;
              } else if (isEnded) {
                statusText = 'Expired / Ended';
                statusColor = '#ef4444'; // red
                buttonText = 'Ended';
                buttonClass = 'btn-outline';
                isButtonDisabled = true;
              } else if (!isStarted) {
                statusText = `Scheduled to start at ${formatDateTime(assignment.startTime)}`;
                statusColor = 'var(--warning)'; // orange
                buttonText = 'Upcoming';
                buttonClass = 'btn-outline';
                isButtonDisabled = true;
              } else {
                statusText = `Available until ${formatDateTime(assignment.endTime)}`;
                statusColor = '#10b981'; // green
                buttonText = 'Start Assignment';
                buttonClass = 'btn-primary';
                isButtonDisabled = false;
              }

              return (
                <div 
                  key={assignment._id} 
                  className="card" 
                  style={{ 
                    border: isButtonDisabled ? '1px solid var(--border)' : '1px solid var(--warning)',
                    background: 'var(--card)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    padding: '1.25rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: 0 }}>{assignment.title}</h4>
                        <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', borderColor: 'var(--warning)' }}>
                          {assignment.streamId.toUpperCase()}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Batch: <strong style={{ color: 'var(--text)' }}>{assignment.batchId?.name || 'Class Roster'}</strong>
                      </span>
                    </div>

                    <div style={{ fontSize: '0.85rem', fontWeight: '600', color: statusColor, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      {isCompleted && <CheckCircle size={14} />}
                      {!isCompleted && !isButtonDisabled && <Clock size={14} />}
                      {statusText}
                    </div>
                  </div>

                  {assignment.instructions && (
                    <div style={{ 
                      background: 'var(--bg)', 
                      padding: '0.75rem', 
                      borderRadius: '0.375rem', 
                      fontSize: '0.85rem', 
                      color: 'var(--text-muted)',
                      borderLeft: '3px solid var(--border)' 
                    }}>
                      <div style={{ fontWeight: '600', color: 'var(--text)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <FileText size={12} /> Instructions:
                      </div>
                      {assignment.instructions}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Questions: <strong>{assignment.customQuestions?.length || 'Stream Default'}</strong> | Duration: <strong>{streams.find(s => s.id === assignment.streamId)?.duration || 180} mins</strong>
                    </div>

                    <button 
                      className={`btn ${buttonClass}`}
                      disabled={isButtonDisabled}
                      onClick={() => handleStartAssignment(assignment)}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.25rem',
                        background: !isButtonDisabled ? 'var(--warning)' : undefined,
                        borderColor: !isButtonDisabled ? 'var(--warning)' : undefined,
                        color: !isButtonDisabled ? 'white' : undefined,
                      }}
                    >
                      {buttonText} <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main General Stream Selection */}
      <div>
        <div style={{ marginBottom: '2.0rem' }}>
          <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>Select Your Exam Stream</h2>
          <p style={{ color: 'var(--text-muted)' }}>Choose the competitive exam you want to practice for.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
          {streams.map(stream => (
            <div 
              key={stream.id} 
              className="card stream-card"
              onClick={() => onSelect(stream)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary)' }}>{stream.name}</h3>
                <span className="badge" style={{
                  background: stream.difficulty === 'Easy' ? '#dcfce7' : stream.difficulty === 'Medium' ? '#fef08a' : '#fee2e2',
                  color: stream.difficulty === 'Easy' ? '#166534' : stream.difficulty === 'Medium' ? '#854d0e' : '#991b1b'
                }}>{stream.difficulty}</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <BookOpen size={16} /> <span>{stream.subjectCount} Subjects • {stream.totalQuestions} Questions</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock size={16} /> <span>{stream.duration} Minutes</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <BarChart size={16} /> <span>Marking: +{stream.marking.correct} / {stream.marking.wrong}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
