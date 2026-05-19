import { useState, useEffect } from 'react';
import { ChevronLeft, Plus, Edit2, Trash2, Check, X, ShieldAlert, FileText, CheckCircle, AlertTriangle, HelpCircle, Upload, Loader2 } from 'lucide-react';

const recommendedSubjects = {
  neet: ['Biology', 'Physics', 'Chemistry'],
  jee_main: ['Physics', 'Chemistry', 'Math'],
  jee_advanced: ['Physics', 'Chemistry', 'Math'],
  bitsat: ['Physics', 'Chemistry', 'Math', 'English', 'Logical Reasoning'],
  iaat: ['Aptitude', 'Math', 'Logic'],
  cuet: ['General Test', 'English', 'History', 'Science', 'Math']
};

// Lazy loaders for heavy parsing scripts from CDNs
const loadPdfJs = () => {
  return new Promise((resolve, reject) => {
    if (window.pdfjsLib) return resolve(window.pdfjsLib);
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
      resolve(window.pdfjsLib);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

const loadTesseract = () => {
  return new Promise((resolve, reject) => {
    if (window.Tesseract) return resolve(window.Tesseract);
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/tesseract.js@v5.0.3/dist/tesseract.min.js';
    script.onload = () => resolve(window.Tesseract);
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

export default function Admin({ user, streams, onUpdateStreams, onBack }) {
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'logs', 'questions', 'settings'
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form State for Add/Edit Question
  const [editingQuestion, setEditingQuestion] = useState(null); // null, 'add', or { questionObject }
  const [importMode, setImportMode] = useState('single'); // 'single', 'bulk'
  
  // Stream Settings Config State
  const [editingStreamConfig, setEditingStreamConfig] = useState(null);
  const [streamFormTotalQ, setStreamFormTotalQ] = useState(5);
  const [streamFormDuration, setStreamFormDuration] = useState(10);
  const [streamFormCorrect, setStreamFormCorrect] = useState(4);
  const [streamFormWrong, setStreamFormWrong] = useState(-1);
  const [streamFormDifficulty, setStreamFormDifficulty] = useState('Medium');

  // Single Question Form State
  const [formStream, setFormStream] = useState('neet');
  const [formType, setFormType] = useState('MCQ');
  const [formSubject, setFormSubject] = useState('Biology');
  const [customSubjectActive, setCustomSubjectActive] = useState(false);
  const [formCustomSubject, setFormCustomSubject] = useState('');
  const [formText, setFormText] = useState('');
  const [formOptions, setFormOptions] = useState(['', '', '', '']);
  const [formCorrect, setFormCorrect] = useState('');
  const [formNoNegative, setFormNoNegative] = useState(false);

  // Bulk Paste Form State
  const [bulkText, setBulkText] = useState('');
  const [parsedQuestions, setParsedQuestions] = useState([]);
  const [bulkStream, setBulkStream] = useState('neet');
  const [bulkSubject, setBulkSubject] = useState('Physics');
  const [bulkCustomSubjectActive, setBulkCustomSubjectActive] = useState(false);
  const [bulkCustomSubject, setBulkCustomSubject] = useState('');

  // OCR/File Loading State
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState('');

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
        if (data.success) setLogs(data.results);
      } else if (activeTab === 'questions') {
        const res = await fetch(`${apiUrl}/admin/questions`);
        const data = await res.json();
        if (data.success) setQuestions(data.questions);
      } else if (activeTab === 'settings') {
        // dynamic streams loading
        const res = await fetch(`${apiUrl}/streams`);
        const data = await res.json();
        if (data.success) onUpdateStreams(data.streams);
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
    setImportMode('single');
    setFormStream('neet');
    setFormType('MCQ');
    setFormSubject('Biology');
    setCustomSubjectActive(false);
    setFormCustomSubject('');
    setFormText('');
    setFormOptions(['', '', '', '']);
    setFormCorrect('');
    setFormNoNegative(false);

    // reset bulk state
    setBulkText('');
    setParsedQuestions([]);
    setBulkStream('neet');
    setBulkSubject('Physics');
    setBulkCustomSubjectActive(false);
    setBulkCustomSubject('');
    setOcrProgress('');
  };

  // Open Edit Question Form
  const openEdit = (q) => {
    setEditingQuestion(q);
    setImportMode('single');
    setFormStream(q.streamId);
    setFormType(q.type);
    
    const recs = recommendedSubjects[q.streamId] || [];
    if (recs.includes(q.subject)) {
      setFormSubject(q.subject);
      setCustomSubjectActive(false);
    } else {
      setFormSubject('custom');
      setCustomSubjectActive(true);
      setFormCustomSubject(q.subject);
    }
    
    setFormText(q.text);
    setFormOptions(q.options || ['', '', '', '']);
    setFormCorrect(q.correct.join(', '));
    setFormNoNegative(!!q.noNegative);
  };

  const openEditStream = (s) => {
    setEditingStreamConfig(s);
    setStreamFormTotalQ(s.totalQuestions);
    setStreamFormDuration(s.duration);
    setStreamFormCorrect(s.marking?.correct ?? 4);
    setStreamFormWrong(s.marking?.wrong ?? -1);
    setStreamFormDifficulty(s.difficulty ?? 'Medium');
  };

  const handleStreamChange = (streamId) => {
    setFormStream(streamId);
    const recs = recommendedSubjects[streamId] || [];
    setFormSubject(recs[0] || 'custom');
    if (!recs.length) {
      setCustomSubjectActive(true);
    } else {
      setCustomSubjectActive(false);
    }
  };

  const handleTypeChange = (type) => {
    setFormType(type);
    setFormCorrect('');
    if (type === 'Integer') {
      setFormNoNegative(true);
    } else {
      setFormNoNegative(false);
    }
  };

  const handleSubjectDropdownChange = (val) => {
    if (val === 'custom') {
      setFormSubject('custom');
      setCustomSubjectActive(true);
    } else {
      setFormSubject(val);
      setCustomSubjectActive(false);
    }
  };

  // Parsing Bulk Input
  const handleParseBulk = () => {
    if (!bulkText.trim()) return alert('Please paste some text to parse.');

    const finalDefaultSubject = bulkCustomSubjectActive ? bulkCustomSubject.trim() : bulkSubject;
    const blocks = bulkText.split(/\n\s*\n/);
    const results = [];

    for (let block of blocks) {
      block = block.trim();
      if (!block) continue;

      const lines = block.split('\n').map(l => l.trim()).filter(l => l);
      if (lines.length === 0) continue;

      let questionText = '';
      let options = [];
      let correct = [];
      let type = 'MCQ';
      let noNegative = false;
      let answerLine = '';
      let subject = finalDefaultSubject;
      let streamId = bulkStream;

      for (let line of lines) {
        const optMatch = line.match(/^([A-Za-z])[\)\.\-]\s*(.*)/);
        const ansMatch = line.match(/^(Answer|Ans|Correct)\s*:\s*(.*)/i);
        const subjMatch = line.match(/^(Subject)\s*:\s*(.*)/i);
        const streamMatch = line.match(/^(Stream|Exam)\s*:\s*(.*)/i);

        if (optMatch) {
          options.push(optMatch[2].trim());
        } else if (ansMatch) {
          answerLine = ansMatch[2].trim();
        } else if (subjMatch) {
          subject = subjMatch[2].trim();
        } else if (streamMatch) {
          const streamStr = streamMatch[2].trim().toLowerCase();
          const foundStream = streams.find(s => s.id === streamStr || s.name.toLowerCase() === streamStr);
          if (foundStream) streamId = foundStream.id;
        } else {
          // Remove numbering at the start of question e.g. "1.", "Q1."
          const cleanLine = line.replace(/^(Q?\d+[\.\:\s\-]+)/i, '');
          if (cleanLine.trim()) {
            questionText += (questionText ? ' ' : '') + cleanLine.trim();
          }
        }
      }

      if (!questionText) continue;

      // Determine answers
      if (options.length > 0) {
        const parts = answerLine.split(/[\s,]+/);
        for (const p of parts) {
          const letter = p.trim().toUpperCase();
          if (letter.length === 1 && letter >= 'A' && letter <= 'Z') {
            const idx = letter.charCodeAt(0) - 65;
            if (idx >= 0 && idx < options.length) {
              correct.push(idx);
            }
          }
        }
        type = correct.length > 1 ? 'MSQ' : 'MCQ';
      } else {
        const val = parseInt(answerLine, 10);
        if (!isNaN(val)) {
          correct.push(val);
        }
        type = 'Integer';
        noNegative = true;
      }

      // Check validation warnings
      const warnings = [];
      if (type !== 'Integer' && options.length === 0) warnings.push('No options detected.');
      if (correct.length === 0) warnings.push('Could not parse correct answer.');
      if (type !== 'Integer' && correct.some(c => c >= options.length)) warnings.push('Correct index out of bounds.');

      results.push({
        streamId,
        subject,
        type,
        text: questionText,
        options: options.length > 0 ? options : undefined,
        correct,
        noNegative,
        warnings,
        isValid: warnings.length === 0
      });
    }

    setParsedQuestions(results);
  };

  // Handle file uploading (PDF directly or scans with OCR)
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setOcrLoading(true);
    setOcrProgress('Loading AI & parsing libraries...');

    try {
      let extractedText = '';

      if (file.type === 'application/pdf') {
        setOcrProgress('Analyzing PDF text layers...');
        const pdfjs = await loadPdfJs();
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        
        let directText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map(item => item.str).join(' ');
          directText += pageText + '\n\n';
        }

        if (directText.trim().length > 100) {
          extractedText = directText;
          setOcrProgress('Extracted text directly from PDF layer!');
        } else {
          // Scanned PDF - rendering pages onto canvas and run OCR
          setOcrProgress('Scanned PDF detected. Initiating page-by-page OCR scan...');
          const Tesseract = await loadTesseract();
          const scanLimit = Math.min(pdf.numPages, 5); // protect browser memory

          for (let i = 1; i <= scanLimit; i++) {
            setOcrProgress(`Scanning Page ${i} of ${scanLimit} with OCR...`);
            const page = await pdf.getPage(i);
            
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            const viewport = page.getViewport({ scale: 1.5 });
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            await page.render({ canvasContext: context, viewport }).promise;
            const dataUrl = canvas.toDataURL('image/png');
            
            const ocrResult = await Tesseract.recognize(dataUrl, 'eng');
            extractedText += ocrResult.data.text + '\n\n';
          }
        }
      } else if (file.type.startsWith('image/')) {
        setOcrProgress('Initializing OCR engine...');
        const Tesseract = await loadTesseract();
        
        const ocrResult = await Tesseract.recognize(file, 'eng', {
          logger: m => {
            if (m.status === 'recognizing') {
              setOcrProgress(`Analyzing image pixels: ${Math.round(m.progress * 100)}%`);
            }
          }
        });
        extractedText = ocrResult.data.text;
      } else {
        alert('Unsupported file format. Please upload a PDF file or an Image (PNG/JPEG).');
        setOcrLoading(false);
        return;
      }

      setBulkText(prev => prev + (prev ? '\n\n' : '') + extractedText);
      setOcrProgress('Success! Text appended to raw input box.');
    } catch (err) {
      console.error(err);
      alert('Error during document scanning: ' + err.message);
    } finally {
      setOcrLoading(false);
    }
  };

  const handleBulkSubmit = async () => {
    const validQuestions = parsedQuestions.filter(q => q.isValid);
    if (validQuestions.length === 0) {
      alert('No valid questions to import. Please check warnings.');
      return;
    }

    // Clean objects for server
    const cleanPayload = validQuestions.map(q => ({
      streamId: q.streamId,
      subject: q.subject,
      type: q.type,
      text: q.text,
      options: q.options,
      correct: q.correct,
      noNegative: q.noNegative
    }));

    try {
      const res = await fetch(`${apiUrl}/admin/questions/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: cleanPayload })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Successfully imported ${data.count} questions!`);
        setEditingQuestion(null);
        fetchData();
      } else {
        alert('Bulk import failed: ' + data.error);
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to server.');
    }
  };

  const removeParsedQuestion = (index) => {
    setParsedQuestions(parsedQuestions.filter((_, i) => i !== index));
  };

  // Submit Single Question Add/Edit
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    // Determine subject name
    const finalSubject = customSubjectActive ? formCustomSubject.trim() : formSubject;
    if (!finalSubject) {
      alert('Please specify a subject for the question.');
      return;
    }

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
      subject: finalSubject,
      text: formText,
      options: formType === 'Integer' ? undefined : formOptions.filter(o => o.trim() !== ''),
      correct: parsedCorrect,
      noNegative: formNoNegative
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

  // Update Stream settings config submit
  const handleStreamConfigSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiUrl}/admin/streams/${editingStreamConfig.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalQuestions: parseInt(streamFormTotalQ, 10),
          duration: parseInt(streamFormDuration, 10),
          difficulty: streamFormDifficulty,
          marking: {
            correct: parseInt(streamFormCorrect, 10),
            wrong: parseInt(streamFormWrong, 10)
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        // Refetch streams list to update parent App.jsx state
        const resStreams = await fetch(`${apiUrl}/streams`);
        const dataStreams = await resStreams.json();
        if (dataStreams.success) {
          onUpdateStreams(dataStreams.streams);
        }
        setEditingStreamConfig(null);
      } else {
        alert('Failed to update stream configuration: ' + data.error);
      }
    } catch (err) {
      console.error(err);
      alert('Error updating stream configuration.');
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
        {['users', 'logs', 'questions', 'settings'].map((tab) => (
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
            onClick={() => { setActiveTab(tab); setEditingQuestion(null); setEditingStreamConfig(null); }}
          >
            {tab === 'logs' ? 'Exam Attempts' : tab === 'settings' ? 'Exam Settings' : tab}
          </button>
        ))}
      </div>

      {/* Main Panel */}
      {editingQuestion ? (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
              {editingQuestion === 'add' ? 'Create New Question' : 'Edit Question Details'}
            </h3>
            
            {editingQuestion === 'add' && (
              <div style={{ display: 'flex', background: 'var(--bg)', padding: '0.25rem', borderRadius: '0.375rem', border: '1px solid var(--border)' }}>
                <button 
                  type="button" 
                  onClick={() => setImportMode('single')}
                  style={{ 
                    padding: '0.35rem 0.75rem', 
                    fontSize: '0.875rem', 
                    borderRadius: '0.25rem', 
                    border: 'none',
                    cursor: 'pointer',
                    background: importMode === 'single' ? 'var(--primary)' : 'transparent',
                    color: importMode === 'single' ? '#fff' : 'var(--text-muted)',
                    fontWeight: 500
                  }}
                >
                  Single Form
                </button>
                <button 
                  type="button" 
                  onClick={() => setImportMode('bulk')}
                  style={{ 
                    padding: '0.35rem 0.75rem', 
                    fontSize: '0.875rem', 
                    borderRadius: '0.25rem', 
                    border: 'none',
                    cursor: 'pointer',
                    background: importMode === 'bulk' ? 'var(--primary)' : 'transparent',
                    color: importMode === 'bulk' ? '#fff' : 'var(--text-muted)',
                    fontWeight: 500
                  }}
                >
                  Bulk Paste
                </button>
              </div>
            )}
          </div>

          {importMode === 'single' ? (
            /* Single Question Form Mode */
            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>Exam Stream</label>
                  <select value={formStream} onChange={(e) => handleStreamChange(e.target.value)} style={{ width: '100%' }}>
                    {streams.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>Question Type</label>
                  <select value={formType} onChange={(e) => handleTypeChange(e.target.value)} style={{ width: '100%' }}>
                    <option value="MCQ">MCQ (Single Correct)</option>
                    <option value="MSQ">MSQ (Multi Correct)</option>
                    <option value="Integer">Integer Type</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>Section / Subject</label>
                  <select 
                    value={customSubjectActive ? 'custom' : formSubject} 
                    onChange={(e) => handleSubjectDropdownChange(e.target.value)} 
                    style={{ width: '100%', marginBottom: customSubjectActive ? '0.5rem' : '0' }}
                  >
                    {(recommendedSubjects[formStream] || []).map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                    <option value="custom">Other (Create Custom Section)</option>
                  </select>
                  {customSubjectActive && (
                    <input 
                      type="text" 
                      required 
                      value={formCustomSubject} 
                      onChange={(e) => setFormCustomSubject(e.target.value)} 
                      placeholder="Enter custom section/subject name" 
                      style={{ width: '100%' }} 
                    />
                  )}
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
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

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', userSelect: 'none' }}>
                    <input 
                      type="checkbox" 
                      checked={formNoNegative} 
                      onChange={(e) => setFormNoNegative(e.target.checked)} 
                      style={{ width: 'auto', margin: 0 }}
                    />
                    <span style={{ fontWeight: '500' }}>Enable "No Negative Marking" for this question</span>
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary">Save Question</button>
                <button type="button" className="btn btn-outline" onClick={() => setEditingQuestion(null)}>Cancel</button>
              </div>
            </form>
          ) : (
            /* Bulk Importer Mode */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* File Upload Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontWeight: '500' }}>AI Scan (Upload PDF or Image Exam Sheet)</label>
                <div style={{
                  border: '2px dashed var(--border)',
                  borderRadius: '0.5rem',
                  padding: '1.5rem',
                  textAlign: 'center',
                  background: 'var(--bg)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                  position: 'relative'
                }}>
                  {ocrLoading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                      <Loader2 className="animate-spin" size={32} color="var(--primary)" />
                      <p style={{ fontWeight: '500', fontSize: '0.9rem' }}>{ocrProgress}</p>
                    </div>
                  ) : (
                    <>
                      <Upload size={32} color="var(--primary)" />
                      <div>
                        <p style={{ fontWeight: '500', fontSize: '0.95rem' }}>Drag & Drop or Click to Select File</p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                          Supports text PDFs, scanned PDFs (first 5 pages), and JPEG/PNG screenshots.
                        </p>
                      </div>
                      <input 
                        type="file" 
                        accept="application/pdf,image/*" 
                        onChange={handleFileUpload} 
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          opacity: 0,
                          cursor: 'pointer'
                        }}
                      />
                    </>
                  )}
                </div>
                {ocrProgress && !ocrLoading && (
                  <p style={{ fontSize: '0.825rem', color: 'var(--status-answered)', fontWeight: 'bold' }}>
                    {ocrProgress}
                  </p>
                )}
              </div>

              {/* Instructions Accordion */}
              <div style={{ background: 'var(--bg)', border: '1px dashed var(--border)', borderRadius: '0.375rem', padding: '1rem' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', fontSize: '0.95rem', marginBottom: '0.5rem', color: 'var(--primary)' }}>
                  <HelpCircle size={18} /> Paste Format Template Instructions
                </h4>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  Pasted text or extracted text will be parsed by separating each question block with a <strong>blank line</strong>. 
                  You can specify overrides for <strong>Subject</strong> and <strong>Stream</strong> directly inside any block!
                </p>
                <pre style={{ fontSize: '0.75rem', background: 'var(--border)', padding: '0.5rem', borderRadius: '0.25rem', overflowX: 'auto', lineHeight: '1.4' }}>
{`1. What is the SI unit of electric current?
A) Volt
B) Ampere
C) Ohm
D) Tesla
Answer: B

Subject: Chemistry
2. Identify the oxidation state of Cr in K2Cr2O7.
Answer: 6

Stream: bitsat
3. Which of these are prime? (Multi-correct)
a. 11
b. 12
c. 13
d. 14
Answer: a, c`}
                </pre>
              </div>

              {/* Set defaults */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', background: 'var(--bg)', padding: '1rem', borderRadius: '0.375rem', border: '1px solid var(--border)' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: '500', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Default Stream</label>
                  <select value={bulkStream} onChange={(e) => { setBulkStream(e.target.value); const recs = recommendedSubjects[e.target.value] || []; setBulkSubject(recs[0] || 'custom'); }} style={{ width: '100%', padding: '0.375rem' }}>
                    {streams.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '500', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Default Section / Subject</label>
                  <select 
                    value={bulkCustomSubjectActive ? 'custom' : bulkSubject} 
                    onChange={(e) => { if (e.target.value === 'custom') { setBulkCustomSubjectActive(true); } else { setBulkCustomSubjectActive(false); setBulkSubject(e.target.value); } }} 
                    style={{ width: '100%', padding: '0.375rem', marginBottom: bulkCustomSubjectActive ? '0.5rem' : '0' }}
                  >
                    {(recommendedSubjects[bulkStream] || []).map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                    <option value="custom">Other (Create Custom Section)</option>
                  </select>
                  {bulkCustomSubjectActive && (
                    <input 
                      type="text" 
                      required 
                      value={bulkCustomSubject} 
                      onChange={(e) => setBulkCustomSubject(e.target.value)} 
                      placeholder="Enter custom section/subject name" 
                      style={{ width: '100%', padding: '0.375rem' }} 
                    />
                  )}
                </div>
              </div>

              {/* Paste Area */}
              <div>
                <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>Raw Text Content</label>
                <textarea 
                  rows={10} 
                  required
                  value={bulkText} 
                  onChange={(e) => setBulkText(e.target.value)} 
                  placeholder="Extracted file text or pasted paragraphs will appear here..." 
                  style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.875rem', lineHeight: '1.5', padding: '0.75rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" className="btn btn-primary" onClick={handleParseBulk} disabled={ocrLoading}>
                  <FileText size={18} /> Parse & Preview Questions
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setEditingQuestion(null)} disabled={ocrLoading}>Cancel</button>
              </div>

              {/* Preview List */}
              {parsedQuestions.length > 0 && (
                <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <h4 style={{ fontWeight: 'bold', fontSize: '1.125rem' }}>
                      Parsed Preview ({parsedQuestions.length} Questions Found)
                    </h4>
                    
                    <button 
                      type="button" 
                      className="btn btn-primary" 
                      onClick={handleBulkSubmit}
                      disabled={parsedQuestions.filter(q => q.isValid).length === 0}
                    >
                      <CheckCircle size={18} /> Import All Valid ({parsedQuestions.filter(q => q.isValid).length}) Questions
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {parsedQuestions.map((q, idx) => (
                      <div 
                        key={idx} 
                        className="card" 
                        style={{ 
                          borderLeft: `4px solid ${q.isValid ? 'var(--status-answered)' : 'var(--danger)'}`,
                          background: q.isValid ? 'transparent' : 'rgba(239, 68, 68, 0.02)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span style={{ padding: '0.2/rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: 'bold', background: 'rgba(29, 78, 216, 0.1)', color: 'var(--primary)' }}>
                              {getStreamName(q.streamId)}
                            </span>
                            <span style={{ padding: '0.2/rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: 'bold', background: 'rgba(107, 114, 128, 0.1)', color: 'var(--text-muted)' }}>
                              {q.subject}
                            </span>
                            <span style={{ padding: '0.2/rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: 'bold', background: 'rgba(168, 85, 247, 0.1)', color: 'var(--status-marked)' }}>
                              {q.type}
                            </span>
                            {q.noNegative && (
                              <span style={{ padding: '0.2/rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: 'bold', background: 'rgba(245, 158, 11, 0.1)', color: '#d97706' }}>
                                No Negative Marking
                              </span>
                            )}
                          </div>
                          <button 
                            type="button" 
                            onClick={() => removeParsedQuestion(idx)} 
                            style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 'bold' }}
                          >
                            <Trash2 size={14} /> Remove
                          </button>
                        </div>

                        {q.warnings.length > 0 && (
                          <div style={{ background: 'rgba(239, 68, 68, 0.08)', color: 'var(--danger)', padding: '0.5rem 0.75rem', borderRadius: '0.25rem', marginBottom: '0.75rem', fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <AlertTriangle size={16} />
                            <span><strong>Parse Warnings:</strong> {q.warnings.join(' | ')}</span>
                          </div>
                        )}

                        <p style={{ fontWeight: '500', marginBottom: '0.75rem' }}>Q{idx + 1}. {q.text}</p>

                        {q.options && q.options.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                            {q.options.map((opt, oIdx) => {
                              const isCorrect = q.correct.includes(oIdx);
                              return (
                                <div key={oIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: isCorrect ? 'var(--status-answered)' : 'inherit' }}>
                                  {isCorrect ? <Check size={14} /> : <div style={{ width: 14 }}></div>}
                                  <span>{String.fromCharCode(65 + oIdx)}. {opt}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {q.type === 'Integer' && (
                          <div style={{ fontSize: '0.825rem', color: 'var(--status-answered)', fontWeight: 'bold' }}>
                            Parsed Value: {q.correct[0] !== undefined ? q.correct[0] : 'None'}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
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
      ) : activeTab === 'questions' ? (
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
                  {q.noNegative && (
                    <span style={{ padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: 'bold', background: 'rgba(245, 158, 11, 0.1)', color: '#d97706' }}>
                      No Negative Marking
                    </span>
                  )}
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
      ) : (
        /* Exam settings configurations tab */
        editingStreamConfig ? (
          <div className="card">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
              Edit Exam Settings: {editingStreamConfig.name}
            </h3>

            <form onSubmit={handleStreamConfigSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>Number of Questions (Exam Length)</label>
                  <input 
                    type="number" 
                    min="1"
                    required 
                    value={streamFormTotalQ} 
                    onChange={(e) => setStreamFormTotalQ(e.target.value)} 
                    style={{ width: '100%' }} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>Exam Duration (Minutes)</label>
                  <input 
                    type="number" 
                    min="1"
                    required 
                    value={streamFormDuration} 
                    onChange={(e) => setStreamFormDuration(e.target.value)} 
                    style={{ width: '100%' }} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>Difficulty Level</label>
                  <select value={streamFormDifficulty} onChange={(e) => setStreamFormDifficulty(e.target.value)} style={{ width: '100%' }}>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                    <option value="Expert">Expert</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>Marks for Correct Answer</label>
                  <input 
                    type="number" 
                    required 
                    value={streamFormCorrect} 
                    onChange={(e) => setStreamFormCorrect(e.target.value)} 
                    style={{ width: '100%' }} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>Marks for Incorrect Answer (e.g. -1)</label>
                  <input 
                    type="number" 
                    required 
                    value={streamFormWrong} 
                    onChange={(e) => setStreamFormWrong(e.target.value)} 
                    style={{ width: '100%' }} 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary">Save Settings</button>
                <button type="button" className="btn btn-outline" onClick={() => setEditingStreamConfig(null)}>Cancel</button>
              </div>
            </form>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {streams.map((s) => (
              <div key={s.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                <div>
                  <h4 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '0.25rem' }}>{s.name}</h4>
                  <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-muted)', fontSize: '0.875rem', flexWrap: 'wrap' }}>
                    <span>Questions: <strong>{s.totalQuestions} items</strong></span>
                    <span>Duration: <strong>{s.duration} mins</strong></span>
                    <span>Difficulty: <strong>{s.difficulty}</strong></span>
                    <span>Marking: <strong>+{s.marking?.correct ?? 4} / {s.marking?.wrong ?? -1}</strong></span>
                  </div>
                </div>
                <button className="btn btn-outline" onClick={() => openEditStream(s)}>
                  <Edit2 size={16} style={{ marginRight: '0.25rem' }} /> Edit Settings
                </button>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
