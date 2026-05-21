import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import api from '../utils/api';
import toast from 'react-hot-toast';

const STATUS_BG = {
  completed: 'bg-emerald-500',
  overdue: 'bg-red-500',
  'in-progress': 'bg-blue-500',
  pending: 'bg-primary-500',
};

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const res = await api.get('/planner/calendar', {
          params: { year: currentMonth.getFullYear(), month: currentMonth.getMonth() + 1 }
        });
        setEvents(res.data.events || []);
      } catch { toast.error('Failed to load calendar'); }
      finally { setLoading(false); }
    };
    fetchEvents();
  }, [currentMonth]);

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  const firstDayOfWeek = startOfMonth(currentMonth).getDay();
  const today = new Date();

  const getEventsForDay = (day) => events.filter(e => isSameDay(new Date(e.date), day));

  const selectedDayEvents = selectedDay ? getEventsForDay(selectedDay) : [];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Calendar</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Task deadlines overview</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentMonth(m => subMonths(m, 1))} className="btn-secondary px-3 py-2">←</button>
          <span className="text-sm font-bold text-slate-800 dark:text-white w-32 text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <button onClick={() => setCurrentMonth(m => addMonths(m, 1))} className="btn-secondary px-3 py-2">→</button>
        </div>
      </div>

      <div className="card overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
            <div key={d} className="p-3 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{d}</div>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>
        ) : (
          <div className="grid grid-cols-7">
            {/* Empty cells before month start */}
            {Array.from({length: firstDayOfWeek}).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[80px] p-2 bg-slate-50/50 dark:bg-slate-800/50 border-b border-r border-slate-100 dark:border-slate-700/50"></div>
            ))}
            {days.map(day => {
              const dayEvents = getEventsForDay(day);
              const isToday = isSameDay(day, today);
              const isSelected = selectedDay && isSameDay(day, selectedDay);
              return (
                <div key={day.toString()}
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                  className={`min-h-[80px] p-2 border-b border-r border-slate-100 dark:border-slate-700/50 cursor-pointer transition-colors
                    ${isToday ? 'bg-primary-50 dark:bg-primary-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'}
                    ${isSelected ? 'ring-2 ring-inset ring-primary-400' : ''}
                  `}>
                  <div className={`text-sm font-bold mb-1 w-7 h-7 flex items-center justify-center rounded-full
                    ${isToday ? 'bg-primary-600 text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 2).map(e => (
                      <div key={e.id} className={`text-xs px-1.5 py-0.5 rounded text-white truncate ${STATUS_BG[e.status] || 'bg-primary-500'}`}>
                        {e.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-slate-400 pl-1">+{dayEvents.length - 2} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected day panel */}
      {selectedDay && (
        <div className="card p-5 animate-slide-in">
          <h3 className="font-bold text-slate-900 dark:text-white mb-3">
            📅 {format(selectedDay, 'EEEE, MMMM d, yyyy')}
          </h3>
          {selectedDayEvents.length === 0 ? (
            <p className="text-slate-400 text-sm">No tasks due on this day.</p>
          ) : (
            <div className="space-y-2">
              {selectedDayEvents.map(e => (
                <div key={e.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${STATUS_BG[e.status]}`}></div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 dark:text-white text-sm">{e.title}</p>
                    <p className="text-xs text-slate-400">{e.subject} • {e.status}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium priority-${e.priority}`}>{e.priority}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
        {Object.entries(STATUS_BG).map(([s, cls]) => (
          <span key={s} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded ${cls}`}></span>
            <span className="capitalize">{s}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
