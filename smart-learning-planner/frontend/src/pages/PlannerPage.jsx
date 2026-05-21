import React, { useState, useEffect } from 'react';
import { format, startOfWeek, addDays } from 'date-fns';
import api from '../utils/api';
import toast from 'react-hot-toast';

const PRIORITY_DOT = { urgent: 'bg-red-500', high: 'bg-orange-500', medium: 'bg-yellow-500', low: 'bg-green-500' };

export default function PlannerPage() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [plan, setPlan] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchPlan = async () => {
    setLoading(true);
    try {
      const res = await api.get('/planner/weekly', { params: { startDate: weekStart.toISOString() } });
      setPlan(res.data.weeklyPlan || {});
    } catch { toast.error('Failed to load plan'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPlan(); }, [weekStart]);

  const days = Array.from({length: 7}, (_, i) => addDays(weekStart, i));
  const today = format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Weekly Planner</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekStart(d => addDays(d, -7))} className="btn-secondary px-3 py-2">← Prev</button>
          <button onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))} className="btn-secondary px-3 py-2 text-sm">Today</button>
          <button onClick={() => setWeekStart(d => addDays(d, 7))} className="btn-secondary px-3 py-2">Next →</button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
          {days.map(day => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayData = plan[dateKey] || { tasks: [], totalHours: 0, goalHours: 4 };
            const isToday = dateKey === today;
            const pct = dayData.goalHours > 0 ? Math.min(100, Math.round((dayData.totalHours / dayData.goalHours) * 100)) : 0;

            return (
              <div key={dateKey} className={`card p-3 flex flex-col gap-2 transition-all ${isToday ? 'ring-2 ring-primary-500 shadow-md' : ''}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-wider ${isToday ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400'}`}>
                      {format(day, 'EEE')}
                    </p>
                    <p className={`text-lg font-bold ${isToday ? 'text-primary-600 dark:text-primary-400' : 'text-slate-800 dark:text-white'}`}>
                      {format(day, 'd')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">{dayData.totalHours.toFixed(1)}h</p>
                    <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-1">
                      <div className="h-full rounded-full bg-primary-500 transition-all" style={{width: `${pct}%`}}></div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 space-y-1.5 min-h-[60px]">
                  {dayData.tasks.length === 0 ? (
                    <p className="text-xs text-slate-300 dark:text-slate-600 text-center py-2">Free</p>
                  ) : (
                    dayData.tasks.map((task, i) => (
                      <div key={i} className="rounded-lg p-2 text-xs" style={{backgroundColor: (task.subject?.color || '#6366f1') + '15', borderLeft: `3px solid ${task.subject?.color || '#6366f1'}`}}>
                        <div className="flex items-start gap-1">
                          <span className={`w-1.5 h-1.5 rounded-full mt-0.5 flex-shrink-0 ${PRIORITY_DOT[task.priority]}`}></span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-800 dark:text-slate-200 truncate leading-tight">{task.title}</p>
                            <p className="text-slate-500 dark:text-slate-400">{task.hours}h</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="card p-4 flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
        <span className="font-medium text-slate-700 dark:text-slate-300">Priority:</span>
        {Object.entries(PRIORITY_DOT).map(([p, cls]) => (
          <span key={p} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${cls}`}></span>
            <span className="capitalize">{p}</span>
          </span>
        ))}
        <span className="ml-auto">Daily bar = % of goal hours filled</span>
      </div>
    </div>
  );
}
