import { useState, useEffect, useRef } from 'react';
import { API_URL } from '../config';
import { BookOpen, Link as LinkIcon, Upload, Trash2, FileText, ExternalLink, Loader2, Save } from 'lucide-react';

export default function ResourceManager({ user }) {
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingResources, setLoadingResources] = useState(false);
  
  const [title, setTitle] = useState('');
  const [type, setType] = useState('link'); // 'link' or 'file'
  const [url, setUrl] = useState('');
  const [file, setFile] = useState(null);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const fileInputRef = useRef(null);
  const apiUrl = API_URL;

  // Fetch batches on mount
  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const res = await fetch(`${apiUrl}/teacher/batches?teacherId=${user.userId || user.id}`);
        const data = await res.json();
        if (data.success) {
          setBatches(data.batches);
          if (data.batches.length > 0) {
            setSelectedBatch(data.batches[0]._id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch batches:', err);
      }
    };
    fetchBatches();
  }, [user, apiUrl]);

  // Fetch resources when batch changes
  useEffect(() => {
    if (!selectedBatch) return;
    
    const fetchResources = async () => {
      try {
        setLoadingResources(true);
        const res = await fetch(`${apiUrl}/resources/${selectedBatch}`);
        const data = await res.json();
        if (data.success) {
          setResources(data.resources);
        }
      } catch (err) {
        console.error('Failed to fetch resources:', err);
      } finally {
        setLoadingResources(false);
      }
    };
    
    fetchResources();
  }, [selectedBatch, apiUrl]);

  const handleUploadFile = async () => {
    if (!file || !title || !selectedBatch) {
      setError('Please provide a title, select a file, and choose a batch.');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      // Read file as Base64 to bypass strict proxy multipart limitations
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const fileBase64 = reader.result;
          
          const res = await fetch(`${apiUrl}/teacher/resources/upload-base64`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              batchId: selectedBatch,
              title,
              uploadedBy: user.userId || user.id,
              fileBase64,
              fileName: file.name
            })
          });
          
          if (!res.ok) {
            let errMsg = res.statusText;
            try {
              const errData = await res.json();
              if (errData.error) errMsg = errData.error;
            } catch (e) {
              throw new Error(`Server returned ${res.status} ${res.statusText}.`);
            }
            throw new Error(errMsg);
          }
          
          const data = await res.json();
          if (data.success) {
            setSuccess('File uploaded successfully!');
            setResources([data.resource, ...resources]);
            setTitle('');
            setFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
          } else {
            setError(data.error || 'Upload failed');
          }
        } catch (err) {
          setError('Failed to upload file. ' + err.message);
        } finally {
          setLoading(false);
        }
      };
      reader.onerror = () => {
        setError('Failed to read the file locally.');
        setLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Failed to process upload request.');
      setLoading(false);
    }
  };

  const handleShareLink = async () => {
    if (!url || !title || !selectedBatch) {
      setError('Please provide a title, a URL, and choose a batch.');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const res = await fetch(`${apiUrl}/teacher/resources/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: selectedBatch,
          title,
          url,
          uploadedBy: user.userId || user.id
        })
      });
      
      const data = await res.json();
      if (data.success) {
        setSuccess('Link shared successfully!');
        setResources([data.resource, ...resources]);
        setTitle('');
        setUrl('');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to share link. ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (type === 'file') {
      handleUploadFile();
    } else {
      handleShareLink();
    }
  };

  return (
    <div className="card" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
        <BookOpen size={28} color="var(--primary)" />
        <h2 style={{ margin: 0 }}>Study Materials & Resources</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        
        {/* Left Column: Upload Form */}
        <div>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg)', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>Add New Resource</h3>
            
            {error && <div style={{ color: '#ef4444', fontSize: '0.9rem', background: '#fef2f2', padding: '0.5rem', borderRadius: '0.375rem' }}>{error}</div>}
            {success && <div style={{ color: '#10b981', fontSize: '0.9rem', background: '#ecfdf5', padding: '0.5rem', borderRadius: '0.375rem' }}>{success}</div>}
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem', fontWeight: 'bold' }}>Target Batch</label>
              <select 
                className="input" 
                value={selectedBatch} 
                onChange={(e) => setSelectedBatch(e.target.value)}
                required
              >
                {batches.map(b => (
                  <option key={b._id} value={b._id}>{b.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem', fontWeight: 'bold' }}>Resource Type</label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                  <input type="radio" checked={type === 'link'} onChange={() => setType('link')} /> Link / URL
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                  <input type="radio" checked={type === 'file'} onChange={() => setType('file')} /> File Upload
                </label>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem', fontWeight: 'bold' }}>Title / Description</label>
              <input 
                type="text" 
                className="input" 
                placeholder="e.g. Chapter 4 Thermodynamics Notes" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {type === 'link' ? (
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem', fontWeight: 'bold' }}>External URL (Zoom, YouTube, etc)</label>
                <input 
                  type="url" 
                  className="input" 
                  placeholder="https://..." 
                  value={url} 
                  onChange={(e) => setUrl(e.target.value)}
                  required
                />
              </div>
            ) : (
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem', fontWeight: 'bold' }}>File (PDF, PPT, DOCX)</label>
                <input 
                  type="file" 
                  className="input" 
                  ref={fileInputRef}
                  onChange={(e) => setFile(e.target.files[0])}
                  required
                />
              </div>
            )}

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
              {loading ? <Loader2 className="spin" size={18} /> : type === 'link' ? <LinkIcon size={18} /> : <Upload size={18} />}
              {type === 'link' ? 'Share Link' : 'Upload File'}
            </button>
          </form>
        </div>

        {/* Right Column: Resource List */}
        <div>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Shared with {batches.find(b => b._id === selectedBatch)?.name || 'Batch'}
          </h3>
          
          {loadingResources ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
              <Loader2 className="spin" size={24} color="var(--primary)" />
            </div>
          ) : resources.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', border: '1px dashed var(--border)', borderRadius: '0.75rem', color: 'var(--text-muted)' }}>
              No resources shared with this batch yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {resources.map(res => (
                <div key={res._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '0.75rem', background: 'var(--bg-hover)', borderRadius: '0.5rem', color: 'var(--primary)' }}>
                      {res.type === 'link' ? <LinkIcon size={20} /> : <FileText size={20} />}
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontWeight: 'bold', fontSize: '1.05rem' }}>{res.title}</h4>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {new Date(res.createdAt).toLocaleDateString()} • {res.type.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  <a 
                    href={res.type === 'link' ? res.url : `${apiUrl.replace('/api', '')}${res.url}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-outline"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                  >
                    {res.type === 'link' ? <ExternalLink size={16} /> : <BookOpen size={16} />}
                    {res.type === 'link' ? 'Open' : 'View File'}
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}
