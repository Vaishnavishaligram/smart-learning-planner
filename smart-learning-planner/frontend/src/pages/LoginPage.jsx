import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back! 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-primary-50 to-purple-50 dark:from-slate-900 dark:to-slate-800">
      {/* Left panel */}
      <div className="hidden lg:flex flex-1 flex-col justify-center items-center p-12 bg-gradient-to-br from-primary-600 to-purple-700 text-white">
        <div className="max-w-md">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl mb-6">🧠</div>
          <h1 className="text-4xl font-bold mb-4">Smart Learning Planner</h1>
          <p className="text-xl text-white/80 mb-8">AI-powered study scheduling that adapts to your deadlines and learning goals.</p>
          <div className="grid grid-cols-2 gap-4">
            {['Auto-schedule tasks', 'Priority scoring', 'Progress tracking', 'Calendar view'].map(f => (
              <div key={f} className="flex items-center gap-2 text-white/90">
                <span className="text-green-300">✓</span> {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="card p-8">
            <div className="text-center mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-2xl mx-auto mb-4">🧠</div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome back</h2>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Sign in to continue learning</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email</label>
                <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                  placeholder="you@example.com" required className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
                <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})}
                  placeholder="••••••••" required className="input" />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
                {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : null}
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            <p className="text-center mt-6 text-sm text-slate-500 dark:text-slate-400">
              Don't have an account? {' '}
              <Link to="/register" className="text-primary-600 dark:text-primary-400 font-medium hover:underline">Create one</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
