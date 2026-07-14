import { useNavigate } from 'react-router-dom';

export default function OperatorDashboard() {
  const navigate = useNavigate();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Operator Dashboard</h1>
        <span className="text-sm text-surface-400">
          {new Date().toLocaleDateString('en-GB', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="card">
          <p className="stat-label">Today's Production</p>
          <p className="stat-value text-white">0</p>
        </div>
        <div className="card">
          <p className="stat-label">Accepted</p>
          <p className="stat-value status-pass">0</p>
        </div>
        <div className="card">
          <p className="stat-label">Rejected</p>
          <p className="stat-value status-fail">0</p>
        </div>
        <div className="card">
          <p className="stat-label">Machine Status</p>
          <p className="stat-value text-gauge-amber text-2xl">Idle</p>
        </div>
      </div>

      <div className="card flex flex-col items-center justify-center py-16">
        <button
          onClick={() => navigate('/operator/start')}
          className="btn-primary text-2xl px-16 py-6 rounded-xl"
        >
          Start Process
        </button>
        <p className="text-surface-500 text-sm mt-4">
          Begin inspection for a new component
        </p>
      </div>
    </div>
  );
}
