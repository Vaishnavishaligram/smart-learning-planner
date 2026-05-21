import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const PRIORITY_STYLES = {
  urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

const STATUS_STYLES = {
  pending: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  'in-progress': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  overdue: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

function TaskModal({ task, subjects, onSave, onClose }) {
  const [form, setForm] = useState(task || {
    title: '', description: '', subject: '', deadline: '', estimatedHours: 2,
    priority: 'medium', status: 'pending', tags: '', notes: ''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { ...form, tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [] };
      if (task?._id) {
        await api.put(`/tasks/${task._id}`, data);
        toast.success('Task updated!');
      } else {
        await api.post('/tasks', data);
        toast.success('Task created! 📚 Auto-scheduled for you.');
      }
      onSave();
    } catch (err) {
      toast.error(err.message || 'Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 animate-slide-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">{task ? 'Edit Task' : 'New Task'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Title *</label>
            <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required className="input" placeholder="e.g. Study Chapter 5 - Data Structures" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Subject *</label>
              <select value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} required className="input">
                <option value="">Select subject</option>
                {subjects.map(s => <option key={s._id} value={s._id}>{s.icon} {s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Priority</label>
              <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} className="input">
                {['low','medium','high','urgent'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Deadline *</label>
              <input type="date" value={form.deadline ? form.deadline.split('T')[0] : ''} onChange={e => setForm({...form, deadline: e.target.value})} required className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Est. Hours *</label>
              <input type="number" min="0.5" step="0.5" value={form.estimatedHours} onChange={e => setForm({...form, estimatedHours: parseFloat(e.target.value)})} required className="input" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} className="input resize-none" placeholder="Optional details..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Tags (comma separated)</label>
            <input value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} className="input" placeholder="exam, important, revision" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
              {saving ? 'Saving...' : 'Save Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [filters, setFilters] = useState({ status: '', priority: '', subject: '', sort: 'smartPriority' });

  const fetchData = useCallback(async () => {
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([,v]) => v));
      const [tasksRes, subjectsRes] = await Promise.all([
        api.get('/tasks', { params }),
        api.get('/subjects')
      ]);
      setTasks(tasksRes.data.tasks);
      setSubjects(subjectsRes.data.subjects);
    } catch (err) {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${id}`);
      toast.success('Task deleted');
      fetchData();
    } catch { toast.error('Failed to delete'); }
  };

  const handleProgress = async (task, newStatus) => {
    try {
      await api.patch(`/tasks/${task._id}/progress`, { status: newStatus });
      fetchData();
    } catch { toast.error('Failed to update'); }
  };

  const progress = (t) => t.estimatedHours > 0 ? Math.round((t.completedHours / t.estimatedHours) * 100) : 0;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tasks</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{tasks.length} tasks found</p>
        </div>
        <button onClick={() => { setEditTask(null); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <span>+</span> New Task
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})} className="input w-auto text-sm">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="overdue">Overdue</option>
        </select>
        <select value={filters.priority} onChange={e => setFilters({...filters, priority: e.target.value})} className="input w-auto text-sm">
          <option value="">All Priority</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select value={filters.subject} onChange={e => setFilters({...filters, subject: e.target.value})} className="input w-auto text-sm">
          <option value="">All Subjects</option>
          {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
        <select value={filters.sort} onChange={e => setFilters({...filters, sort: e.target.value})} className="input w-auto text-sm">
          <option value="smartPriority">Smart Priority</option>
          <option value="deadline">Deadline</option>
          <option value="created">Recently Added</option>
        </select>
      </div>

      {/* Tasks list */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>
      ) : tasks.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-3">📋</div>
          <h3 className="font-semibold text-slate-900 dark:text-white mb-1">No tasks found</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">Create your first task to get started</p>
          <button onClick={() => setShowModal(true)} className="btn-primary">Add Task</button>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map(task => (
            <div key={task._id} className="card p-4 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-start gap-3">
                <button onClick={() => handleProgress(task, task.status === 'completed' ? 'pending' : 'completed')}
                  className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${task.status === 'completed' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 dark:border-slate-600 hover:border-primary-400'}`}>
                  {task.status === 'completed' && <span className="text-xs">✓</span>}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className={`font-semibold text-slate-900 dark:text-white ${task.status === 'completed' ? 'line-through opacity-60' : ''}`}>{task.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_STYLES[task.priority]}`}>{task.priority}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[task.status]}`}>{task.status}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    {task.subject && (
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full" style={{backgroundColor: task.subject.color}}></span>
                        {task.subject.icon} {task.subject.name}
                      </span>
                    )}
                    <span>📅 {format(new Date(task.deadline), 'MMM d, yyyy')}</span>
                    <span>⏱ {task.completedHours}h / {task.estimatedHours}h</span>
                    <span className="flex items-center gap-1">🧠 Score: <strong className="text-primary-600 dark:text-primary-400">{task.smartPriority}</strong></span>
                  </div>
                  {task.estimatedHours > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="progress-bar flex-1">
                        <div className="progress-bar-fill bg-primary-500" style={{width: `${progress(task)}%`}}></div>
                      </div>
                      <span className="text-xs text-slate-500">{progress(task)}%</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => { setEditTask(task); setShowModal(true); }}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-primary-600 transition-colors">✏️</button>
                  <button onClick={() => handleDelete(task._id)}
                    className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-slate-400 hover:text-red-500 transition-colors">🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <TaskModal
          task={editTask}
          subjects={subjects}
          onSave={() => { setShowModal(false); fetchData(); }}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
