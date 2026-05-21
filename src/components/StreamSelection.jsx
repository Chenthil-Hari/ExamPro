import { API_URL } from '../config';
import { useState, useEffect, useRef } from 'react';
import { BookOpen, Clock, BarChart, Calendar, AlertCircle, FileText, CheckCircle, ArrowRight, Users, Megaphone, MessageSquare, Send, X, Loader2 } from 'lucide-react';

export default function StreamSelection({ streams, onSelect, user }) {
  const [assignments, setAssignments] = useState([]);
  const [completedAssignmentIds, setCompletedAssignmentIds] = useState(new Set());
  const [batches, setBatches] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(new Date());

  // Notification tracking refs
  const prevAssignmentsRef = useRef(null);
  const prevAnnouncementsRef = useRef(null);

  // DM states for student
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [dmMessages, setDmMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [loadingDms, setLoadingDms] = useState(false);
  const chatEndRef = useRef(null);

  const apiUrl = API_URL;

  useEffect(() => {
    // Update current time every 5 seconds to keep timing buttons accurate
    const timer = setInterval(() => setNow(new Date()), 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!user || user.isGuest) return;

    let isFirst = true;

    const fetchData = async () => {
      try {
        if (isFirst) {
          setLoading(true);
        }
        // Fetch assignments
        const assignmentsRes = await fetch(`${apiUrl}/teacher/assignments?studentId=${user.id}`);
        const assignmentsData = await assignmentsRes.json();
        
        // Fetch student results to check completed assignments
        const resultsRes = await fetch(`${apiUrl}/users/${user.id}/results`);
        const resultsData = await resultsRes.json();

        // Fetch student batches
        const batchesRes = await fetch(`${apiUrl}/student/batches?studentId=${user.id}`);
        const batchesData = await batchesRes.json();

        // Fetch announcements
        const announcementsRes = await fetch(`${apiUrl}/announcements?studentId=${user.id}`);
        const announcementsData = await announcementsRes.json();

        if (assignmentsData.success) {
          setAssignments(assignmentsData.assignments);
          
          if (prevAssignmentsRef.current !== null) {
            const newAssignments = assignmentsData.assignments.filter(a => !prevAssignmentsRef.current.has(a._id));
            if (newAssignments.length > 0 && 'Notification' in window && Notification.permission === 'granted') {
              newAssignments.forEach(a => {
                new Notification('New Exam/Assignment Scheduled', {
                  body: `"${a.title}" has been scheduled.`,
                  icon: '/favicon.ico'
                });
              });
            }
          }
          prevAssignmentsRef.current = new Set(assignmentsData.assignments.map(a => a._id));
        }

        if (resultsData.success) {
          const completedIds = new Set(
            resultsData.results
              .filter(r => r.assignmentId)
              .map(r => r.assignmentId.toString())
          );
          setCompletedAssignmentIds(completedIds);
        }

        if (batchesData.success) {
          setBatches(batchesData.batches);
        }

        if (announcementsData.success) {
          setAnnouncements(announcementsData.announcements);

          if (prevAnnouncementsRef.current !== null) {
            const newAnns = announcementsData.announcements.filter(a => !prevAnnouncementsRef.current.has(a._id));
            if (newAnns.length > 0 && 'Notification' in window && Notification.permission === 'granted') {
              newAnns.forEach(a => {
                new Notification('New Announcement', {
                  body: a.title || a.message || 'You have a new notice.',
                  icon: '/favicon.ico'
                });
              });
            }
          }
          prevAnnouncementsRef.current = new Set(announcementsData.announcements.map(a => a._id));
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        if (isFirst) {
          setLoading(false);
          isFirst = false;
        }
      }
    };

    fetchData();

    // Background polling every 5 seconds for batches, assignments, and announcements
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [user, apiUrl]);

  // Fetch and poll messages
  const fetchDMs = async () => {
    if (!selectedTeacher || !user) return;
    try {
      const res = await fetch(`${apiUrl}/messages?userId=${user.id}`);
      const data = await res.json();
      if (data.success) {
        // Filter messages between user.id and selectedTeacher.id
        const chatLog = data.messages.filter(m => 
          (m.senderId === user.id && m.receiverId === selectedTeacher.id) ||
          (m.senderId === selectedTeacher.id && m.receiverId === user.id)
        );
        setDmMessages(chatLog);
      }
    } catch (err) {
      console.error('Error fetching DMs:', err);
    }
  };

  useEffect(() => {
    if (!selectedTeacher) {
      setDmMessages([]);
      return;
    }
    
    // Fetch initially with loading spinner
    const initialFetch = async () => {
      setLoadingDms(true);
      await fetchDMs();
      setLoadingDms(false);
    };
    initialFetch();

    // Poll every 3 seconds
    const interval = setInterval(fetchDMs, 3000);
    return () => clearInterval(interval);
  }, [selectedTeacher, user]);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [dmMessages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedTeacher || !user) return;

    const payload = {
      senderId: user.id,
      receiverId: selectedTeacher.id,
      content: chatInput.trim()
    };

    // Optimistic UI update
    const tempMsg = {
      _id: Date.now().toString(),
      senderId: user.id,
      receiverId: selectedTeacher.id,
      content: chatInput.trim(),
      createdAt: new Date().toISOString()
    };
    setDmMessages(prev => [...prev, tempMsg]);
    setChatInput('');

    try {
      const res = await fetch(`${apiUrl}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!data.success) {
        alert('Failed to send message');
      } else {
        // Fetch to sync with database ID
        fetchDMs();
      }
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Error sending message');
    }
  };

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

  const renderMainContent = () => (
    <>
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
    </>
  );

  if (user && !user.isGuest) {
    // Derive unique teachers from batches
    const uniqueTeachers = [];
    const seenTeacherIds = new Set();
    batches.forEach(batch => {
      if (batch.teacherId && !seenTeacherIds.has(batch.teacherId)) {
        seenTeacherIds.add(batch.teacherId);
        uniqueTeachers.push({
          id: batch.teacherId,
          name: batch.teacherName || 'Unknown Faculty'
        });
      }
    });

    return (
      <div className="student-dashboard-layout fade-in" style={{ position: 'relative' }}>
        {/* Left Column: Exams & Streams */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {renderMainContent()}
        </div>

        {/* Right Column: Sidebar (Batches, DMs & Notices) */}
        <div className="sidebar-container">
          {/* My Batches Card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <Users size={20} color="var(--primary)" />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: 0 }}>My Batches</h3>
            </div>
            
            {batches.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', margin: '1rem 0' }}>
                You have not joined any batches yet.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {batches.map(batch => (
                  <div 
                    key={batch._id} 
                    style={{ 
                      padding: '0.75rem 1rem', 
                      background: 'var(--bg)', 
                      border: '1px solid var(--border)', 
                      borderRadius: '0.375rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '0.95rem', color: 'var(--text)' }}>
                        {batch.name}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Teacher: {batch.teacherName}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.75rem', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                      Active
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Direct Messages Card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <MessageSquare size={20} color="var(--primary)" />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: 0 }}>Direct Messages</h3>
            </div>
            
            {uniqueTeachers.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', margin: '1rem 0' }}>
                Join a batch to message your faculty.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {uniqueTeachers.map(teacher => (
                  <button 
                    key={teacher.id} 
                    onClick={() => setSelectedTeacher(teacher)}
                    style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem', 
                      background: selectedTeacher?.id === teacher.id ? 'rgba(29, 78, 216, 0.08)' : 'var(--bg)', 
                      border: selectedTeacher?.id === teacher.id ? '1px solid var(--primary)' : '1px solid var(--border)', 
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                      color: 'var(--text)',
                      transition: 'all 0.2s',
                      outline: 'none'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>
                        {teacher.name}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {teacher.id}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <MessageSquare size={14} /> Chat
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notice Board Card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <Megaphone size={20} color="var(--warning)" />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: 0 }}>Notice Board</h3>
            </div>
            
            {announcements.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', margin: '1rem 0' }}>
                No announcements or notices.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                {announcements.map(ann => {
                  const isGeneral = !ann.batchId;
                  return (
                    <div key={ann._id} className="notice-item" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold', margin: 0, color: 'var(--text)' }}>
                          {ann.title}
                        </h4>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {new Date(ann.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ 
                          fontSize: '0.7rem', 
                          padding: '0.1rem 0.35rem', 
                          borderRadius: '3px', 
                          fontWeight: '600',
                          background: isGeneral ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', 
                          color: isGeneral ? '#10b981' : 'var(--warning)',
                          border: isGeneral ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(245, 158, 11, 0.2)'
                        }}>
                          {isGeneral ? 'General Notice' : ann.batchId?.name || 'Batch Notice'}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          by {ann.createdBy || 'Faculty'}
                        </span>
                      </div>

                      <p style={{ 
                        fontSize: '0.85rem', 
                        color: 'var(--text-muted)', 
                        margin: '0.25rem 0 0 0', 
                        whiteSpace: 'pre-wrap', 
                        lineHeight: '1.4' 
                      }}>
                        {ann.content}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Floating Chat Overlay */}
        {selectedTeacher && (
          <div 
            className="fade-in"
            style={{
              position: 'fixed',
              bottom: '2rem',
              right: '2rem',
              width: '360px',
              height: '460px',
              backgroundColor: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(16px)',
              webkitBackdropFilter: 'blur(16px)',
              border: '1px solid var(--border)',
              borderRadius: '1rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 9999,
              overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div style={{
              padding: '1rem 1.25rem',
              background: 'linear-gradient(135deg, var(--primary) 0%, #1e40af 100%)',
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e' }}></div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 'bold' }}>{selectedTeacher.name}</h4>
                  <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>Faculty Portal</span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedTeacher(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0.25rem',
                  borderRadius: '50%',
                  opacity: 0.8,
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.opacity = '1'}
                onMouseLeave={(e) => e.target.style.opacity = '0.8'}
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages Body */}
            <div style={{
              flex: 1,
              padding: '1.25rem',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              background: 'rgba(248, 250, 252, 0.5)'
            }}>
              {loadingDms ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <Loader2 className="animate-spin" size={24} color="var(--primary)" />
                </div>
              ) : dmMessages.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)', gap: '0.5rem', textAlign: 'center', padding: '1rem' }}>
                  <MessageSquare size={32} style={{ opacity: 0.5 }} />
                  <p style={{ fontSize: '0.85rem' }}>No messages yet. Send a message to start the conversation!</p>
                </div>
              ) : (
                dmMessages.map(msg => {
                  const isMe = msg.senderId === user.id;
                  return (
                    <div 
                      key={msg._id}
                      style={{
                        alignSelf: isMe ? 'flex-end' : 'flex-start',
                        maxWidth: '75%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isMe ? 'flex-end' : 'flex-start',
                        gap: '0.25rem'
                      }}
                    >
                      <div style={{
                        padding: '0.6rem 0.85rem',
                        borderRadius: isMe ? '0.75rem 0.75rem 0 0.75rem' : '0.75rem 0.75rem 0.75rem 0',
                        backgroundColor: isMe ? 'var(--primary)' : 'white',
                        color: isMe ? 'white' : 'var(--text)',
                        fontSize: '0.875rem',
                        lineHeight: '1.4',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                        border: isMe ? 'none' : '1px solid var(--border)',
                        wordBreak: 'break-word'
                      }}>
                        {msg.content}
                      </div>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Footer Input */}
            <form 
              onSubmit={handleSendMessage}
              style={{
                padding: '0.75rem 1rem',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'center',
                backgroundColor: 'white'
              }}
            >
              <input 
                type="text"
                placeholder="Type your message..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                style={{
                  flex: 1,
                  padding: '0.5rem 0.75rem',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  outline: 'none',
                  margin: 0
                }}
              />
              <button 
                type="submit"
                disabled={!chatInput.trim()}
                className="btn btn-primary"
                style={{
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '36px',
                  height: '36px',
                  minWidth: 'auto',
                  background: chatInput.trim() ? 'var(--primary)' : 'var(--border)',
                  borderColor: chatInput.trim() ? 'var(--primary)' : 'var(--border)',
                  color: chatInput.trim() ? 'white' : 'var(--text-muted)',
                  cursor: chatInput.trim() ? 'pointer' : 'default'
                }}
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {renderMainContent()}
    </div>
  );
}
