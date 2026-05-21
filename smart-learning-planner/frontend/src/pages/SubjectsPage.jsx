import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const COLORS = ['#6366f1','#8b5cf6','#ec4899','#ef4444','#f97316','#eab308','#22c55e','#06b6d4','#3b82f6','#84cc16'];
const ICONS = ['📚','🔬','🧮','📝','💻','🎨','🏛️','🌍','⚗️','📐','🎵','🏃','📖','🧠','🔭'];

function SubjectModal({ subject, onSave, onClose }) {
  const [form, setForm] = useState(subject || { name: '', color: '#6366f1', icon: '📚', targetHours: 10, description: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (subject?._id) {
        await api.put(`/subjects/${subject._id}`, form);
        toast.success('Subject updated!');
      } else {
        await api.post('/subjects', form);
        toast.success('Subject created!');
      }
      onSave();
    } catch (err) {
      toast.error(err.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="card w-full max-w-md p-6 animate-slide-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">{subject ? 'Edit Subject' : 'New Subject'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Subject Name *</label>
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="input" placeholder="e.g. Mathematics" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Icon</label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map(icon => (
                <button type="button" key={icon} onClick={() => setForm({...form, icon})}
                  className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${form.icon === icon ? 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/30' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                  {icon}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Color</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map(color => (
                <button type="button" key={color} onClick={() => setForm({...form, color})}
                  className={`w-8 h-8 rounded-full transition-all ${form.color === color ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'hover:scale-105'}`}
                  style={{backgroundColor: color}} />
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Target Hours</label>
            <input type="number" min="1" value={form.targetHours} onChange={e => setForm({...form, targetHours: parseInt(e.target.value)})} className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} className="input resize-none" placeholder="Optional..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editSubject, setEditSubject] = useState(null);

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/subjects');
      setSubjects(res.data.subjects);
    } catch { toast.error('Failed to load subjects'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSubjects(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this subject and all its tasks?')) return;
    try {
      await api.delete(`/subjects/${id}`);
      toast.success('Subject deleted');
      fetchSubjects();
    } catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Subjects</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{subjects.length} subjects</p>
        </div>
        <button onClick={() => { setEditSubject(null); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <span>+</span> Add Subject
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>
      ) : subjects.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-3">📚</div>
          <h3 className="font-semibold text-slate-900 dark:text-white mb-1">No subjects yet</h3>
          <p className="text-slate-500 text-sm mb-4">Add your subjects to start organizing tasks</p>
          <button onClick={() => setShowModal(true)} className="btn-primary">Add Subject</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map(s => {
            const pct = s.targetHours > 0 ? Math.min(100, Math.round((s.completedHours / s.targetHours) * 100)) : 0;
            return (
              <div key={s._id} className="card p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl" style={{backgroundColor: s.color + '20'}}>
                      {s.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">{s.name}</h3>
                      {s.description && <p className="text-xs text-slate-400 mt-0.5">{s.description}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditSubject(s); setShowModal(true); }}
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-primary-600 transition-colors text-sm">✏️</button>
                    <button onClick={() => handleDelete(s._id)}
                      className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-slate-400 hover:text-red-500 transition-colors text-sm">🗑️</button>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Progress</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{s.completedHours}h / {s.targetHours}h</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-bar-fill transition-all duration-700" style={{width: `${pct}%`, backgroundColor: s.color}}></div>
                  </div>
                  <p className="text-xs text-right font-medium" style={{color: s.color}}>{pct}% complete</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <SubjectModal
          subject={editSubject}
          onSave={() => { setShowModal(false); fetchSubjects(); }}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
