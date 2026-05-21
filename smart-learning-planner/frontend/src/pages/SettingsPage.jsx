import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user, updatePreferences } = useAuth();
  const { dark, toggleDark } = useTheme();
  const [prefs, setPrefs] = useState(user?.preferences || {
    dailyGoalHours: 4, reminderEnabled: true, reminderTime: '08:00'
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updatePreferences(prefs);
      toast.success('Settings saved!');
    } catch { toast.error('Failed to save settings'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6 max-w-2xl animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Manage your learning preferences</p>
      </div>

      {/* Profile */}
      <div className="card p-6">
        <h2 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">👤 Profile</h2>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-primary-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">{user?.name}</p>
            <p className="text-slate-400 text-sm">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="card p-6">
        <h2 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">🎨 Appearance</h2>
        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
          <div>
            <p className="font-medium text-slate-800 dark:text-white">Dark Mode</p>
            <p className="text-sm text-slate-400">Switch between light and dark theme</p>
          </div>
          <button onClick={toggleDark}
            className={`relative w-12 h-6 rounded-full transition-colors ${dark ? 'bg-primary-600' : 'bg-slate-300'}`}>
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow ${dark ? 'translate-x-6' : ''}`}></span>
          </button>
        </div>
      </div>

      {/* Learning preferences */}
      <div className="card p-6 space-y-4">
        <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">🎯 Learning Goals</h2>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Daily Study Goal (hours)
          </label>
          <input type="number" min="1" max="16" value={prefs.dailyGoalHours}
            onChange={e => setPrefs({...prefs, dailyGoalHours: parseInt(e.target.value)})}
            className="input max-w-xs" />
          <p className="text-xs text-slate-400 mt-1">Used for weekly planner scheduling</p>
        </div>
      </div>

      {/* Reminders */}
      <div className="card p-6 space-y-4">
        <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">🔔 Reminders</h2>
        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
          <div>
            <p className="font-medium text-slate-800 dark:text-white">Daily Reminders</p>
            <p className="text-sm text-slate-400">Get notified about upcoming tasks</p>
          </div>
          <button onClick={() => setPrefs({...prefs, reminderEnabled: !prefs.reminderEnabled})}
            className={`relative w-12 h-6 rounded-full transition-colors ${prefs.reminderEnabled ? 'bg-primary-600' : 'bg-slate-300'}`}>
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow ${prefs.reminderEnabled ? 'translate-x-6' : ''}`}></span>
          </button>
        </div>
        {prefs.reminderEnabled && (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Reminder Time</label>
            <input type="time" value={prefs.reminderTime}
              onChange={e => setPrefs({...prefs, reminderTime: e.target.value})}
              className="input max-w-xs" />
          </div>
        )}
      </div>

      {/* Smart features info */}
      <div className="card p-6 bg-gradient-to-br from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20 border-primary-200 dark:border-primary-800">
        <h2 className="font-bold text-primary-800 dark:text-primary-300 mb-3 flex items-center gap-2">🧠 Smart Features</h2>
        <div className="space-y-2 text-sm text-primary-700 dark:text-primary-400">
          <p>✓ <strong>Auto-scheduling</strong> — Tasks are automatically spread across available days</p>
          <p>✓ <strong>Smart Priority Score</strong> — Deadline proximity, manual priority & progress combined into a 0-100 score</p>
          <p>✓ <strong>Weekly Plan Generation</strong> — Respects your daily goal and task deadlines</p>
          <p className="text-xs text-primary-500 mt-2">💡 Upgrade tip: Connect OpenAI API in backend to generate AI-powered study plans</p>
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
        {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
        {saving ? 'Saving...' : '💾 Save Settings'}
      </button>
    </div>
  );
}
