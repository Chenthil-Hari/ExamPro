import { API_URL } from '../config';
import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Plus, Bell, Loader2, Send } from 'lucide-react';

export default function TeacherCommunication({ user }) {
  const [subTab, setSubTab] = useState('announcements'); // 'announcements' or 'dms'
  
  // Announcements State
  const [batches, setBatches] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annBatchTarget, setAnnBatchTarget] = useState(''); // '' means All Batches
  const [loadingAnn, setLoadingAnn] = useState(false);

  // DM State
  const [studentsList, setStudentsList] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [dmMessages, setDmMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [loadingDms, setLoadingDms] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const chatEndRef = useRef(null);
  const apiUrl = API_URL;

  // Load teacher batches & announcements on mount
  useEffect(() => {
    const fetchBatchesAndAnnouncements = async () => {
      try {
        setLoadingAnn(true);
        // Fetch Batches
        const resBatches = await fetch(`${apiUrl}/teacher/batches?teacherId=${user.id}`);
        const dataBatches = await resBatches.json();
        if (dataBatches.success) {
          setBatches(dataBatches.batches);
          
          // Get unique set of all student IDs across these batches
          const students = [];
          dataBatches.batches.forEach(b => {
            b.students.forEach(s => {
              if (!students.includes(s)) students.push(s);
            });
          });
          setStudentsList(students);
        }

        // Fetch announcements (all)
        const resAnn = await fetch(`${apiUrl}/announcements`);
        const dataAnn = await resAnn.json();
        if (dataAnn.success) {
          // Filter announcements created by this teacher
          const teacherAnn = dataAnn.announcements.filter(a => a.createdBy === user.name || a.createdBy === user.id);
          setAnnouncements(teacherAnn);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingAnn(false);
      }
    };

    fetchBatchesAndAnnouncements();
  }, [user.id, user.name]);

  // Load DMs when student is selected or DMs tab is active
  const fetchDMs = async () => {
    if (!selectedStudentId) return;
    try {
      setLoadingDms(true);
      const res = await fetch(`${apiUrl}/messages?userId=${user.id}`);
      const data = await res.json();
      if (data.success) {
        // Filter messages exchanged between teacher (user.id) and selected student
        const chatLog = data.messages.filter(m => 
          (m.senderId === user.id && m.receiverId === selectedStudentId) ||
          (m.senderId === selectedStudentId && m.receiverId === user.id)
        );
        setDmMessages(chatLog);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDms(false);
    }
  };

  useEffect(() => {
    fetchDMs();
  }, [selectedStudentId]);

  // Poll for new DMs every 4 seconds if a student is active
  useEffect(() => {
    if (!selectedStudentId || subTab !== 'dms') return;
    const interval = setInterval(() => {
      fetchDMs();
    }, 4000);
    return () => clearInterval(interval);
  }, [selectedStudentId, subTab]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [dmMessages]);

  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return alert('Please fill in title and description');

    const payload = {
      title: annTitle,
      content: annContent,
      batchId: annBatchTarget || null, // null represents general
      createdBy: user.name
    };

    try {
      const res = await fetch(`${apiUrl}/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setAnnouncements([data.announcement, ...announcements]);
        setAnnTitle('');
        setAnnContent('');
        setAnnBatchTarget('');
        alert('Announcement published successfully!');
      } else {
        alert('Failed to publish');
      }
    } catch (err) {
      alert('Error posting announcement');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedStudentId) return;

    const payload = {
      senderId: user.id,
      receiverId: selectedStudentId,
      content: chatInput
    };

    // Optimistic UI update
    const tempMsg = {
      _id: Date.now().toString(),
      senderId: user.id,
      receiverId: selectedStudentId,
      content: chatInput,
      createdAt: new Date().toISOString()
    };
    setDmMessages([...dmMessages, tempMsg]);
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
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      {/* Sub tabs header */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setSubTab('announcements')}
          className="btn"
          style={{
            background: subTab === 'announcements' ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
            color: subTab === 'announcements' ? 'var(--warning)' : 'var(--text-muted)',
            border: subTab === 'announcements' ? '1px solid var(--warning)' : '1px solid transparent',
            padding: '0.5rem 1rem',
            fontSize: '0.9rem'
          }}
        >
          <Bell size={16} /> Notice Board
        </button>
        <button
          onClick={() => setSubTab('dms')}
          className="btn"
          style={{
            background: subTab === 'dms' ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
            color: subTab === 'dms' ? 'var(--warning)' : 'var(--text-muted)',
            border: subTab === 'dms' ? '1px solid var(--warning)' : '1px solid transparent',
            padding: '0.5rem 1rem',
            fontSize: '0.9rem'
          }}
        >
          <MessageSquare size={16} /> Direct Messages
        </button>
      </div>

      {subTab === 'announcements' ? (
        /* Announcements view */
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', alignItems: 'start' }}>
          {/* Announcement publisher */}
          <div className="card" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
            <h4 style={{ fontWeight: 'bold', marginBottom: '1.25rem', fontSize: '1.05rem' }}>Publish Announcement</h4>
            <form onSubmit={handlePostAnnouncement}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: '500', fontSize: '0.85rem' }}>Title</label>
                <input
                  type="text"
                  placeholder="e.g. Exam Schedule Postponed"
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: '500', fontSize: '0.85rem' }}>Target Batch</label>
                <select
                  value={annBatchTarget}
                  onChange={(e) => setAnnBatchTarget(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid var(--border)', background: 'var(--card)' }}
                >
                  <option value="">General (All Students)</option>
                  {batches.map(b => (
                    <option key={b._id} value={b._id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: '500', fontSize: '0.85rem' }}>Notice Content</label>
                <textarea
                  rows={4}
                  placeholder="Type notice message details..."
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid var(--border)', background: 'var(--card)', resize: 'vertical' }}
                />
              </div>

              <button type="submit" className="btn" style={{ width: '100%', background: 'var(--warning)', color: 'white' }}>
                <Plus size={16} /> Publish Notice
              </button>
            </form>
          </div>

          {/* Announcement Feed */}
          <div>
            <h4 style={{ fontWeight: 'bold', marginBottom: '1.25rem', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Bell size={18} color="var(--primary)" /> Recent Broadcasts
            </h4>
            {loadingAnn ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                <Loader2 className="animate-spin" size={24} color="var(--warning)" />
              </div>
            ) : announcements.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem', border: '1px dashed var(--border)', borderRadius: '0.5rem' }}>
                No notices published yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {announcements.map((ann) => (
                  <div key={ann._id} className="card" style={{ padding: '1.25rem', background: 'var(--card)', border: '1px solid var(--border)', borderLeft: '4px solid var(--warning)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <h5 style={{ fontWeight: 'bold', fontSize: '1.05rem', margin: 0, color: 'var(--text)' }}>{ann.title}</h5>
                      <span style={{ fontSize: '0.75rem', background: 'var(--bg)', padding: '0.2rem 0.5rem', borderRadius: '1rem', color: 'var(--text-muted)' }}>
                        {new Date(ann.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                      {ann.content}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '500' }}>
                      <div style={{ padding: '0.2rem 0.6rem', background: 'rgba(99,102,241,0.1)', borderRadius: '4px' }}>
                        Target: {ann.batchId ? batches.find(b => b._id === ann.batchId)?.name || 'Batch' : 'All Students'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* DMs view */
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '2rem', height: '50vh', border: '1px solid var(--border)', borderRadius: '0.5rem', overflow: 'hidden' }}>
          {/* Student list sidebar */}
          <div style={{ borderRight: '1px solid var(--border)', background: 'var(--bg)', overflowY: 'auto' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-muted)', padding: '1rem', borderBottom: '1px solid var(--border)' }}>
              Students List
            </h4>
            {studentsList.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', padding: '1rem', textAlign: 'center' }}>No students enrolled in your batches.</p>
            ) : (
              studentsList.map(stuId => {
                const isActive = selectedStudentId === stuId;
                return (
                  <button
                    key={stuId}
                    onClick={() => setSelectedStudentId(stuId)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '0.75rem 1rem',
                      background: isActive ? 'var(--warning)' : 'transparent',
                      color: isActive ? 'white' : 'var(--text)',
                      border: 'none',
                      borderBottom: '1px solid var(--border)',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      fontWeight: isActive ? 'bold' : 'normal',
                      transition: 'all 0.1s'
                    }}
                  >
                    {stuId}
                  </button>
                );
              })
            )}
          </div>

          {/* Chat window */}
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--card)' }}>
            {selectedStudentId ? (
              <>
                {/* Chat window Header */}
                <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
                  <h4 style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Chat with {selectedStudentId}</h4>
                </div>

                {/* Messages viewport */}
                <div style={{ flex: 1, padding: '1.25rem', overflowY: 'auto', background: 'var(--bg)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {loadingDms && dmMessages.length === 0 ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                      <Loader2 className="animate-spin" size={24} color="var(--primary)" />
                    </div>
                  ) : dmMessages.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 'auto', marginBottom: 'auto' }}>
                      No messages yet. Send a message to start the conversation!
                    </div>
                  ) : (
                    dmMessages.map((msg) => {
                      const isMe = msg.senderId === user.id;
                      return (
                        <div key={msg._id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                          <div style={{
                            maxWidth: '75%', padding: '0.75rem 1rem', borderRadius: '1rem',
                            background: isMe ? 'var(--primary)' : 'var(--card)',
                            color: isMe ? 'white' : 'var(--text)',
                            border: isMe ? 'none' : '1px solid var(--border)',
                            borderBottomRightRadius: isMe ? 0 : '1rem',
                            borderBottomLeftRadius: isMe ? '1rem' : 0,
                            boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                          }}>
                            <div style={{ fontSize: '0.95rem', lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem', padding: '0 0.25rem' }}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input area */}
                <form onSubmit={handleSendMessage} style={{ padding: '1rem', borderTop: '1px solid var(--border)', background: 'var(--card)', display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    className="input"
                    placeholder="Type a message..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    style={{ flex: 1, borderRadius: '2rem', paddingLeft: '1.25rem' }}
                  />
                  <button type="submit" className="btn btn-primary" disabled={!chatInput.trim()} style={{ borderRadius: '50%', width: '42px', height: '42px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Send size={18} />
                  </button>
                </form>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--text-muted)' }}>
                <MessageSquare size={36} style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
                <span style={{ fontSize: '0.85rem' }}>Select a student from the sidebar to open direct messages chat.</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
