import { useState, useEffect, useRef } from 'react';
import { API_URL } from '../config';
import {
  BookOpen, Link as LinkIcon, Upload, Trash2, FileText,
  ExternalLink, Loader2, Pencil, X, Check, AlertTriangle
} from 'lucide-react';

export default function ResourceManager({ user }) {
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingResources, setLoadingResources] = useState(false);

  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');

  // Edit modal state
  const [editingRes, setEditingRes] = useState(null); // resource being edited
  const [editTitle, setEditTitle] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Delete confirmation state
  const [deletingId, setDeletingId] = useState(null); // resource id pending delete confirm
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const apiUrl = API_URL;

  // Auto-dismiss success messages
  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(''), 3500);
      return () => clearTimeout(t);
    }
  }, [success]);

  // Fetch batches on mount
  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const res = await fetch(`${apiUrl}/teacher/batches?teacherId=${user.userId || user.id}`);
        const data = await res.json();
        if (data.success) {
          setBatches(data.batches);
          if (data.batches.length > 0) setSelectedBatch(data.batches[0]._id);
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
        if (data.success) setResources(data.resources);
      } catch (err) {
        console.error('Failed to fetch resources:', err);
      } finally {
        setLoadingResources(false);
      }
    };
    fetchResources();
  }, [selectedBatch, apiUrl]);

  // ─── Share Link ─────────────────────────────────────────────────────────────
  const handleShareLink = async () => {
    if (!url || !title || !selectedBatch) {
      setError('Please provide a title, a URL, and choose a batch.');
      return;
    }
    try {
      setLoading(true); setError(''); setSuccess('');
      const res = await fetch(`${apiUrl}/teacher/resources/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchId: selectedBatch, title, url, uploadedBy: user.userId || user.id })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Link shared successfully!');
        setResources([data.resource, ...resources]);
        setTitle(''); setUrl('');
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
    handleShareLink();
  };

  // ─── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    try {
      setDeleteLoading(true);
      const res = await fetch(`${apiUrl}/resources/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setResources(resources.filter(r => r._id !== id));
        setSuccess('Resource deleted successfully.');
      } else {
        setError(data.error || 'Delete failed');
      }
    } catch (err) {
      setError('Failed to delete resource. ' + err.message);
    } finally {
      setDeleteLoading(false);
      setDeletingId(null);
    }
  };

  // ─── Edit ────────────────────────────────────────────────────────────────────
  const openEdit = (res) => {
    setEditingRes(res);
    setEditTitle(res.title);
    setEditUrl(res.url);
  };

  const handleEditSave = async () => {
    if (!editTitle.trim()) { setError('Title cannot be empty.'); return; }
    try {
      setEditLoading(true);
      const body = { title: editTitle };
      if (editingRes.type === 'link') body.url = editUrl;
      const res = await fetch(`${apiUrl}/resources/${editingRes._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        setResources(resources.map(r => r._id === editingRes._id ? data.resource : r));
        setSuccess('Resource updated successfully.');
        setEditingRes(null);
      } else {
        setError(data.error || 'Update failed');
      }
    } catch (err) {
      setError('Failed to update resource. ' + err.message);
    } finally {
      setEditLoading(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="card" style={{ padding: '2rem', position: 'relative' }}>

      {/* Edit Modal */}
      {editingRes && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: 'var(--card)', borderRadius: '1rem', padding: '2rem',
            width: '100%', maxWidth: '480px', boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
            border: '1px solid var(--border)', animation: 'fadeSlideUp 0.2s ease'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Pencil size={20} color="var(--primary)" /> Edit Resource
              </h3>
              <button onClick={() => setEditingRes(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>TITLE</label>
                <input
                  className="input"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  placeholder="Resource title"
                  autoFocus
                />
              </div>

              {editingRes.type === 'link' && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>URL</label>
                  <input
                    className="input"
                    type="url"
                    value={editUrl}
                    onChange={e => setEditUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              )}

              {editingRes.type === 'file' && (
                <div style={{ padding: '0.75rem', background: 'var(--bg)', borderRadius: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={16} />
                  {editingRes.fileName || 'Uploaded file'} — <em>file cannot be replaced, only title can be changed</em>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  onClick={handleEditSave}
                  disabled={editLoading}
                  className="btn btn-primary"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  {editLoading ? <Loader2 size={16} className="spin" /> : <Check size={16} />}
                  Save Changes
                </button>
                <button
                  onClick={() => setEditingRes(null)}
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: 'var(--card)', borderRadius: '1rem', padding: '2rem',
            width: '100%', maxWidth: '400px', boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
            border: '1px solid #ef444433', textAlign: 'center', animation: 'fadeSlideUp 0.2s ease'
          }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <AlertTriangle size={28} color="#ef4444" />
            </div>
            <h3 style={{ margin: '0 0 0.5rem' }}>Delete Resource?</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0 0 1.5rem' }}>
              This will permanently remove the resource. If it's a file, it will also be deleted from Cloudinary.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => handleDelete(deletingId)}
                disabled={deleteLoading}
                style={{ flex: 1, padding: '0.65rem', borderRadius: '0.5rem', background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                {deleteLoading ? <Loader2 size={16} className="spin" /> : <Trash2 size={16} />}
                Yes, Delete
              </button>
              <button
                onClick={() => setDeletingId(null)}
                className="btn btn-outline"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
        <BookOpen size={28} color="var(--primary)" />
        <h2 style={{ margin: 0 }}>Study Materials &amp; Resources</h2>
      </div>

      {error && (
        <div style={{ color: '#ef4444', fontSize: '0.9rem', background: '#fef2f2', padding: '0.6rem 1rem', borderRadius: '0.5rem', marginBottom: '1rem', border: '1px solid #fecaca' }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ color: '#10b981', fontSize: '0.9rem', background: '#ecfdf5', padding: '0.6rem 1rem', borderRadius: '0.5rem', marginBottom: '1rem', border: '1px solid #a7f3d0' }}>
          {success}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>

        {/* Left: Upload Form */}
        <div>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg)', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>Add New Resource</h3>

            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>TARGET BATCH</label>
              <select className="input" value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)} required>
                {batches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
              </select>
            </div>



            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>TITLE / DESCRIPTION</label>
              <input type="text" className="input" placeholder="e.g. Chapter 4 Thermodynamics Notes" value={title} onChange={e => setTitle(e.target.value)} required />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>EXTERNAL URL</label>
              <input type="url" className="input" placeholder="https://..." value={url} onChange={e => setUrl(e.target.value)} required />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
              {loading ? <Loader2 className="spin" size={18} /> : <LinkIcon size={18} />}
              {loading ? 'Sharing…' : 'Share Link'}
            </button>
          </form>
        </div>

        {/* Right: Resource List */}
        <div>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: '700' }}>
            Shared with <span style={{ color: 'var(--primary)' }}>{batches.find(b => b._id === selectedBatch)?.name || 'Batch'}</span>
            <span style={{ marginLeft: '0.5rem', fontSize: '0.85rem', fontWeight: '400', color: 'var(--text-muted)' }}>({resources.length} item{resources.length !== 1 ? 's' : ''})</span>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {resources.map(res => (
                <div
                  key={res._id}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '0.9rem 1rem', background: 'var(--card)',
                    border: '1px solid var(--border)', borderRadius: '0.6rem',
                    transition: 'box-shadow 0.2s'
                  }}
                >
                  {/* Icon + Info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0 }}>
                    <div style={{ padding: '0.6rem', background: res.type === 'link' ? 'rgba(99,102,241,0.1)' : 'rgba(16,185,129,0.1)', borderRadius: '0.45rem', flexShrink: 0, color: res.type === 'link' ? '#6366f1' : '#10b981' }}>
                      {res.type === 'link' ? <LinkIcon size={18} /> : <FileText size={18} />}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: '600', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {res.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        {new Date(res.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        &nbsp;•&nbsp;
                        <span style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>{res.type}</span>
                        {res.fileName && <>&nbsp;•&nbsp;{res.fileName}</>}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0, marginLeft: '0.75rem' }}>
                    {/* View / Open */}
                    <a
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.75rem', fontSize: '0.82rem' }}
                    >
                      {res.type === 'link' ? <ExternalLink size={14} /> : <BookOpen size={14} />}
                      {res.type === 'link' ? 'Open' : 'View'}
                    </a>

                    {/* Edit */}
                    <button
                      onClick={() => openEdit(res)}
                      title="Edit"
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: '34px', height: '34px', borderRadius: '0.45rem',
                        background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
                        color: '#6366f1', cursor: 'pointer', transition: 'all 0.15s'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.18)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; }}
                    >
                      <Pencil size={15} />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => setDeletingId(res._id)}
                      title="Delete"
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: '34px', height: '34px', borderRadius: '0.45rem',
                        background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                        color: '#ef4444', cursor: 'pointer', transition: 'all 0.15s'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.18)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
