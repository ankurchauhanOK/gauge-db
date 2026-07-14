import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
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
    <div className="min-h-screen flex items-center justify-center bg-surface-950 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-br from-gauge-blue to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-gauge-blue/20">
            <span className="text-white font-bold text-3xl">G</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Gauge DB</h1>
          <p className="text-surface-400 mt-1">Manufacturing Traceability System</p>
          <div className="mt-3 inline-flex items-center gap-2 bg-surface-800 px-3 py-1.5 rounded-full text-xs">
            <span className="w-2 h-2 rounded-full bg-gauge-green animate-pulse" />
            <span className="text-surface-300">{shiftName} Shift</span>
            <span className="text-surface-500">({shiftTime})</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-gauge-red text-sm rounded-lg px-4 py-3 flex items-center gap-2">
              <span>⚠</span>
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="label" htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              className="input text-lg"
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
              className="input text-lg"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="w-5 h-5 rounded border-surface-600 bg-surface-800 text-gauge-blue focus:ring-gauge-blue"
            />
            <span className="text-sm text-surface-400">Remember me</span>
          </label>

          <button
            type="submit"
            className="btn-primary w-full text-lg py-4"
            disabled={submitting}
          >
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-surface-600 text-xs mt-6">
          Gauge DB v1.0 &middot; Local Network &middot; v1.0
        </p>
      </div>
    </div>
  );
}
