import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { startProcess, getAvailableComponents } from '../data/service';
import type { Component } from '../../../shared/types';

export default function StartProcess() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [components, setComponents] = useState<Component[]>([]);
  const [selectedComponent, setSelectedComponent] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [serial, setSerial] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    setComponents(getAvailableComponents());
  }, []);

  async function handleStart() {
    setLoading(true);
    try {
      const result = await startProcess(selectedComponent, 1, user?.name || 'Operator');
      setSerial(result.record.serial_number);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate(`/operator/inspection/${result.record.serial_number}`);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch {
      setLoading(false);
    }
  }

  const selected = components.find(c => c.id === selectedComponent);

  if (serial) {
    return (
      <div className="p-6">
        <div className="max-w-lg mx-auto pt-16">
          <div className="card text-center space-y-6">
            <div className="w-16 h-16 bg-gauge-blue/10 rounded-full flex items-center justify-center mx-auto">
              <span className="text-gauge-blue text-3xl">⚙</span>
            </div>

            <div>
              <p className="text-surface-400 text-sm uppercase tracking-wider">Serial Number Generated</p>
              <p className="text-gauge-3xl font-mono font-bold tracking-wider text-gauge-blue mt-2">
                {serial}
              </p>
            </div>

            <div className="bg-surface-800 rounded-lg p-4 space-y-2 text-left">
              <Row label="Component" value={`${selected?.part_code} — ${selected?.description}`} />
              <Row label="Machine" value="Inspection Station 1" />
              <Row label="Operator" value={user?.name || '-'} />
            </div>

            <div className="pt-2">
              <p className="text-surface-400 text-sm">Starting inspection in</p>
              <p className="text-gauge-2xl font-bold text-white">{countdown}s</p>
              <div className="w-full bg-surface-700 rounded-full h-2 mt-3">
                <div
                  className="bg-gauge-blue h-2 rounded-full transition-all duration-1000 ease-linear"
                  style={{ width: `${((3 - countdown) / 3) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-lg mx-auto pt-12">
        <h1 className="text-xl font-bold text-white mb-6">Start New Process</h1>

        <div className="card space-y-6">
          <div>
            <label className="label">Component</label>
            <select
              className="input text-lg"
              value={selectedComponent}
              onChange={(e) => setSelectedComponent(Number(e.target.value))}
            >
              {components.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.part_code} — {c.description}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Inspection Station</label>
            <select className="input text-lg" defaultValue={1}>
              <option value={1}>Inspection Station 1</option>
              <option value={2}>Inspection Station 2</option>
            </select>
          </div>

          <div className="bg-surface-800 rounded-lg p-4 space-y-1">
            <p className="text-xs text-surface-500">Inspection Plan</p>
            <p className="text-sm text-surface-200">
              {selected?.part_code} — {selected?.description}
            </p>
            <p className="text-xs text-surface-400">3 operations · 3 dimensions</p>
          </div>

          <button
            onClick={handleStart}
            className="btn-primary w-full text-lg py-4"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating Serial...
              </span>
            ) : (
              'Generate Serial & Start Inspection'
            )}
          </button>
        </div>

        <button
          onClick={() => navigate('/operator/dashboard')}
          className="btn-ghost w-full mt-4"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-xs text-surface-500">{label}</span>
      <span className="text-sm text-surface-200 font-medium">{value}</span>
    </div>
  );
}
