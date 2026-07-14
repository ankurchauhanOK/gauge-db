import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function StartProcess() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [serial, setSerial] = useState<string | null>(null);

  async function handleStart() {
    setLoading(true);
    try {
      const res = await fetch('/api/production/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ component_id: 1, machine_id: 1 }),
      });
      const data = await res.json();
      if (data.success) {
        setSerial(data.data.record.serial_number);
        setTimeout(() => {
          navigate(`/operator/inspection/${data.data.record.serial_number}`);
        }, 1500);
      }
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6">
      <div className="max-w-md mx-auto space-y-6 pt-16">
        <h1 className="text-xl font-bold text-white text-center">Start New Process</h1>

        <div className="card space-y-6">
          {serial ? (
            <div className="text-center space-y-4">
              <p className="text-surface-400">Serial Number Generated</p>
              <p className="text-gauge-3xl font-mono font-bold tracking-wider text-gauge-blue">
                {serial}
              </p>
              <p className="text-surface-500">Redirecting to inspection...</p>
            </div>
          ) : (
            <>
              <p className="text-surface-400 text-center text-sm">
                Create a new manufacturing record and begin inspection.
              </p>
              <button
                onClick={handleStart}
                className="btn-primary w-full text-lg"
                disabled={loading}
              >
                {loading ? 'Generating...' : 'Generate Serial & Start'}
              </button>
            </>
          )}
        </div>

        <button
          onClick={() => navigate('/operator/dashboard')}
          className="btn-ghost w-full"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
