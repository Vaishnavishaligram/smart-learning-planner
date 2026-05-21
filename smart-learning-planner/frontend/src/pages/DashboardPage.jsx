import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const StatCard = ({ icon, label, value, sub, color = 'primary' }) => {
  const colors = {
    primary: 'from-primary-500 to-primary-600',
    green: 'from-emerald-500 to-green-600',
    red: 'from-red-500 to-rose-600',
    orange: 'from-orange-500 to-amber-600',
  };
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-12 h-12 bg-gradient-to-br ${colors[color]} rounded-xl flex items-center justify-center text-2xl flex-shrink-0`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/stats')
      .then(res => setStats(res.data.stats))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Good morning, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5">Here's your learning overview</p>
        </div>
        <Link to="/tasks" className="btn-primary text-sm hidden sm:flex items-center gap-2">
          <span>+</span> Add Task
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="📋" label="Total Tasks" value={stats?.totalTasks || 0} color="primary" />
        <StatCard icon="✅" label="Completed" value={stats?.completedTasks || 0} sub={`${stats?.completionRate || 0}% rate`} color="green" />
        <StatCard icon="🔥" label="Due This Week" value={stats?.dueThisWeek || 0} color="orange" />
        <StatCard icon="⚡" label="Overdue" value={stats?.overdueTasks || 0} color="red" />
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Weekly activity */}
        <div className="card p-5">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Weekly Activity</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={stats?.weeklyData || []}>
              <XAxis dataKey="day" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip cursor={{ fill: 'rgba(99,102,241,0.1)' }} />
              <Bar dataKey="completed" radius={[6,6,0,0]} name="Completed">
                {(stats?.weeklyData || []).map((_, i) => (
                  <Cell key={i} fill={i === 6 ? '#6366f1' : '#e0e7ff'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Subject progress */}
        <div className="card p-5">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Subject Progress</h3>
          <div className="space-y-3">
            {stats?.subjectProgress?.length === 0 && (
              <div className="text-center py-6 text-slate-400">
                <p>No subjects yet.</p>
                <Link to="/subjects" className="text-primary-500 text-sm hover:underline mt-1 inline-block">Add subjects</Link>
              </div>
            )}
            {(stats?.subjectProgress || []).slice(0, 5).map(s => (
              <div key={s.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{s.icon} {s.name}</span>
                  <span className="text-xs text-slate-500">{s.percentage}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: `${s.percentage}%`, backgroundColor: s.color }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { to: '/planner', icon: '🗓️', label: 'Weekly Plan' },
          { to: '/tasks', icon: '✅', label: 'All Tasks' },
          { to: '/subjects', icon: '📚', label: 'Subjects' },
          { to: '/calendar', icon: '📅', label: 'Calendar' },
        ].map(item => (
          <Link key={item.to} to={item.to}
            className="card p-4 flex flex-col items-center gap-2 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md transition-all duration-200 text-center">
            <span className="text-2xl">{item.icon}</span>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
