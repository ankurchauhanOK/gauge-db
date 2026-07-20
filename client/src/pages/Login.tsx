import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(username, password);
      const stored = localStorage.getItem('user');
      if (stored) {
        const user = JSON.parse(stored);
        if (user.role === 'operator') navigate('/operator/dashboard');
        else if (user.role === 'admin' || user.role === 'quality') navigate('/admin/dashboard');
        else navigate('/supervisor/dashboard');
      }
    } catch {
      setError('Invalid username or password');
    } finally {
      setSubmitting(false);
    }
  }

  const hour = new Date().getHours();
  const shiftName = hour >= 6 && hour < 14 ? 'Morning' : hour >= 14 && hour < 22 ? 'Afternoon' : 'Night';
  const shiftTime = hour >= 6 && hour < 14 ? '06:00 - 14:00' : hour >= 14 && hour < 22 ? '14:00 - 22:00' : '22:00 - 06:00';

  return (
    <div className="min-h-screen bg-ground flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-text-primary rounded-3xl flex items-center justify-center mx-auto mb-6">
            <span className="text-white font-heading font-bold text-2xl">M</span>
          </div>
          <h1 className="font-heading font-semibold text-title text-text-primary">
            Manufacturing
          </h1>
          <h1 className="font-heading font-semibold text-title text-text-primary -mt-1">
            Control Center
          </h1>
          <div className="inline-flex items-center gap-2 bg-surface border border-border-light rounded-full px-4 py-1.5 mt-4">
            <span className="w-2 h-2 rounded-full bg-status-pass" />
            <span className="text-small font-medium text-text-secondary">{shiftName} Shift</span>
            <span className="text-small text-text-secondary/60">({shiftTime})</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface rounded-3xl p-8 shadow-card space-y-5">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-status-fail/8 border border-status-fail/20 text-status-fail text-small rounded-2xl px-4 py-3"
            >
              {error}
            </motion.div>
          )}

          <div>
            <label className="label" htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            className="btn-primary w-full"
            disabled={submitting}
          >
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-text-secondary/40 text-tiny mt-8">
          Manufacturing Control Center v2.0 &middot; Local Network
        </p>
      </motion.div>
    </div>
  );
}
