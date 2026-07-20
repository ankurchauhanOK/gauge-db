import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { startProcess, getAvailableComponents } from '../data/service';
import type { Component } from '../../../shared/types';
import { motion, AnimatePresence } from 'framer-motion';

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
      <div className="flex items-center justify-center h-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg w-full"
        >
          <div className="bg-surface rounded-3xl p-10 shadow-card text-center space-y-6">
            <div className="w-16 h-16 bg-neutral-100 rounded-3xl flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>

            <div>
              <p className="font-body text-small text-text-secondary tracking-wide">Serial Number Generated</p>
              <p className="font-heading font-bold text-display text-text-primary tracking-wider mt-2">
                {serial}
              </p>
            </div>

            <div className="bg-neutral-50 rounded-2xl p-5 space-y-2 text-left">
              <div className="flex justify-between">
                <span className="font-body text-small text-text-secondary">Component</span>
                <span className="font-body text-small font-medium text-text-primary">{selected?.part_code} — {selected?.description}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-body text-small text-text-secondary">Machine</span>
                <span className="font-body text-small font-medium text-text-primary">Inspection Station 1</span>
              </div>
              <div className="flex justify-between">
                <span className="font-body text-small text-text-secondary">Operator</span>
                <span className="font-body text-small font-medium text-text-primary">{user?.name || '-'}</span>
              </div>
            </div>

            <div>
              <p className="font-body text-small text-text-secondary">Starting inspection in</p>
              <p className="font-heading font-bold text-display text-text-primary">{countdown}s</p>
              <div className="w-full bg-neutral-100 rounded-full h-1 mt-3 overflow-hidden">
                <motion.div
                  className="h-full bg-text-primary rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: `${((3 - countdown) / 3) * 100}%` }}
                  transition={{ duration: 1, ease: 'linear' }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto pt-8">
      <div className="mb-10">
        <h1 className="font-heading font-semibold text-title text-text-primary">Start New Process</h1>
        <p className="font-body text-body text-text-secondary mt-1">Select a component to begin inspection</p>
      </div>

      <div className="bg-surface rounded-3xl p-8 shadow-card space-y-6">
        <div>
          <label className="label">Component</label>
          <select
            className="input"
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
          <select className="input" defaultValue={1}>
            <option value={1}>Inspection Station 1</option>
            <option value={2}>Inspection Station 2</option>
          </select>
        </div>

        <div className="bg-neutral-50 rounded-2xl p-5 space-y-1">
          <p className="font-body text-tiny text-text-secondary">Inspection Plan</p>
          <p className="font-body text-body font-medium text-text-primary">
            {selected?.part_code} — {selected?.description}
          </p>
          <p className="font-body text-tiny text-text-secondary">3 operations · 3 dimensions</p>
        </div>

        <button
          onClick={handleStart}
          className="btn-primary w-full"
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

      <button onClick={() => navigate('/operator/dashboard')} className="btn-ghost w-full mt-4">
        Back to Dashboard
      </button>
    </div>
  );
}
