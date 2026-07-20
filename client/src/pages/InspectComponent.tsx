import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  getAvailableComponents,
  getMachines,
  startInspection,
  recordMeasurement,
} from '../data/service';
import type { FlatParameter, FlatMeasurement, InspectionRecord } from '../data/service';
import type { Component, Machine } from '../../../shared/types';
import { motion, AnimatePresence } from 'framer-motion';

type Step = 'selecting' | 'measuring' | 'result';

export default function InspectComponent() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [components, setComponents] = useState<Component[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [selectedComponentId, setSelectedComponentId] = useState<number>(1);
  const [selectedMachineId, setSelectedMachineId] = useState<number>(1);
  const [step, setStep] = useState<Step>('selecting');
  const [record, setRecord] = useState<InspectionRecord | null>(null);
  const [currentParamIdx, setCurrentParamIdx] = useState(0);
  const [value, setValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lastMeasurement, setLastMeasurement] = useState<FlatMeasurement | null>(null);
  const [autoAdvancing, setAutoAdvancing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setComponents(getAvailableComponents());
    getMachines().then(setMachines);
  }, []);

  useEffect(() => {
    if (step === 'measuring' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [step, currentParamIdx]);

  async function handleStart() {
    const rec = await startInspection(
      selectedComponentId,
      selectedMachineId,
      user?.name || 'Operator',
    );
    setRecord(rec);
    setCurrentParamIdx(0);
    setValue('');
    setLastMeasurement(null);
    setStep('measuring');
  }

  const currentParam: FlatParameter | null =
    record && currentParamIdx < record.parameters.length
      ? record.parameters[currentParamIdx]
      : null;

  function handleValueChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    if (/^-?\d*\.?\d*$/.test(v)) setValue(v);
  }

  async function handleSubmit() {
    if (!record || !currentParam || submitting) return;
    const measuredValue = parseFloat(value);
    if (isNaN(measuredValue)) return;

    setSubmitting(true);
    try {
      const result = await recordMeasurement(record.id, currentParam, measuredValue);
      setLastMeasurement(result.measurement);

      if (result.isComplete) {
        setRecord(result.record);
        setAutoAdvancing(true);
        setTimeout(() => {
          setStep('result');
        }, 1500);
      } else {
        setRecord(result.record);
        setAutoAdvancing(true);
        setTimeout(() => {
          setCurrentParamIdx(prev => prev + 1);
          setValue('');
          setLastMeasurement(null);
          setAutoAdvancing(false);
          setSubmitting(false);
        }, 1500);
      }
    } catch {
      setSubmitting(false);
    }
  }

  async function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !autoAdvancing) {
      await handleSubmit();
    }
  }

  if (step === 'result' && record) {
    const isAccepted = record.status === 'accepted';
    const failCount = record.measurements.filter(m => m.result === 'FAIL').length;
    return (
      <div className="flex items-center justify-center h-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg w-full"
        >
          <div className="bg-surface rounded-3xl p-10 shadow-card text-center space-y-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto ${
                isAccepted ? 'bg-status-pass/10' : 'bg-status-fail/10'
              }`}
            >
              {isAccepted ? (
                <svg className="w-10 h-10 text-status-pass" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <polyline points="20,6 9,17 4,12" />
                </svg>
              ) : (
                <svg className="w-10 h-10 text-status-fail" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              )}
            </motion.div>

            <div>
              <p className="font-heading font-semibold text-title text-text-primary">
                {isAccepted ? 'Component Accepted' : 'Component Rejected'}
              </p>
              <p className="font-body text-body text-text-secondary mt-1">
                {isAccepted
                  ? 'All measurements passed'
                  : `${failCount} measurement${failCount > 1 ? 's' : ''} out of tolerance`}
              </p>
            </div>

            <div className="bg-neutral-50 rounded-2xl p-5 space-y-2 text-left">
              <div className="flex justify-between">
                <span className="font-body text-small text-text-secondary">Serial Number</span>
                <span className="font-body text-small font-semibold text-text-primary font-mono">{record.serial_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-body text-small text-text-secondary">Part Code</span>
                <span className="font-body text-small font-medium text-text-primary">{record.part_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-body text-small text-text-secondary">Parameters</span>
                <span className="font-body text-small font-medium text-text-primary">
                  {record.measurements.filter(m => m.result === 'PASS').length}/{record.parameters.length} passed
                </span>
              </div>
            </div>

            <div className="space-y-3 max-h-48 overflow-y-auto">
              {record.measurements.map((m, i) => (
                <div key={i} className={`flex items-center justify-between px-4 py-2.5 rounded-2xl ${
                  m.result === 'PASS' ? 'bg-status-pass/5' : 'bg-status-fail/5'
                }`}>
                  <span className="font-body text-small text-text-primary">{m.parameter_name}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-body text-small text-text-secondary font-mono">
                      {m.measured_value.toFixed(3)} {m.unit}
                    </span>
                    <span className={`font-body text-tiny font-semibold px-2 py-0.5 rounded-full ${
                      m.result === 'PASS' ? 'text-status-pass bg-status-pass/10' : 'text-status-fail bg-status-fail/10'
                    }`}>
                      {m.result}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => navigate('/operator/dashboard')}
              className="btn-primary w-full"
            >
              Back to Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (step === 'measuring' && record && currentParam) {
    const progress = ((currentParamIdx + 1) / record.parameters.length) * 100;
    return (
      <div className="max-w-lg mx-auto pt-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="font-body text-tiny font-medium text-text-secondary tracking-wide uppercase">
              Parameter {currentParamIdx + 1} of {record.parameters.length}
            </span>
            <span className="font-body text-tiny font-medium text-text-secondary">{record.serial_number}</span>
          </div>
          <div className="w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden">
            <motion.div
              className="h-full bg-text-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
        </div>

        <div className="bg-surface rounded-3xl p-8 shadow-card space-y-8">
          <div>
            <p className="font-body text-small text-text-secondary mb-1">{record.part_code}</p>
            <h2 className="font-heading font-semibold text-section text-text-primary">
              {currentParam.name}
            </h2>
          </div>

          <div className="bg-neutral-50 rounded-2xl p-5 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="font-body text-tiny text-text-secondary">Nominal</p>
              <p className="font-heading font-semibold text-body text-text-primary">
                {currentParam.nominal.toFixed(3)}
              </p>
            </div>
            <div>
              <p className="font-body text-tiny text-text-secondary">Min</p>
              <p className="font-heading font-semibold text-body text-text-primary">
                {currentParam.min_limit.toFixed(3)}
              </p>
            </div>
            <div>
              <p className="font-body text-tiny text-text-secondary">Max</p>
              <p className="font-heading font-semibold text-body text-text-primary">
                {currentParam.max_limit.toFixed(3)}
              </p>
            </div>
          </div>

          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="label">Measured Value ({currentParam.unit})</label>
              <input
                ref={inputRef}
                type="text"
                inputMode="decimal"
                className="input text-2xl font-heading font-semibold text-center py-4"
                value={value}
                onChange={handleValueChange}
                onKeyDown={handleKeyDown}
                disabled={autoAdvancing}
                placeholder="0.000"
              />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {lastMeasurement && (
              <motion.div
                key={currentParamIdx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className={`rounded-2xl p-4 text-center ${
                  lastMeasurement.result === 'PASS' ? 'bg-status-pass/10' : 'bg-status-fail/10'
                }`}
              >
                <span className={`font-heading font-bold text-display ${
                  lastMeasurement.result === 'PASS' ? 'text-status-pass' : 'text-status-fail'
                }`}>
                  {lastMeasurement.result}
                </span>
                {autoAdvancing && (
                  <p className="font-body text-tiny text-text-secondary mt-1">
                    {currentParamIdx + 1 < record.parameters.length
                      ? 'Next parameter...'
                      : 'Finalizing...'}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {!autoAdvancing && (
            <button
              onClick={handleSubmit}
              className="btn-primary w-full"
              disabled={submitting || value === ''}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Recording...
                </span>
              ) : (
                'Record Measurement'
              )}
            </button>
          )}
        </div>
      </div>
    );
  }

  const selectedComp = components.find(c => c.id === selectedComponentId);
  const inspectionMachines = machines.filter(m => m.machine_type === 'inspection');

  return (
    <div className="max-w-lg mx-auto pt-8">
      <div className="mb-10">
        <h1 className="font-heading font-semibold text-title text-text-primary">Inspect Component</h1>
        <p className="font-body text-body text-text-secondary mt-1">Select a component and start measuring</p>
      </div>

      <div className="bg-surface rounded-3xl p-8 shadow-card space-y-6">
        <div>
          <label className="label">Component</label>
          <select
            className="input"
            value={selectedComponentId}
            onChange={(e) => setSelectedComponentId(Number(e.target.value))}
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
          <select
            className="input"
            value={selectedMachineId}
            onChange={(e) => setSelectedMachineId(Number(e.target.value))}
          >
            {inspectionMachines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.machine_code})
              </option>
            ))}
          </select>
        </div>

        {selectedComp && (
          <div className="bg-neutral-50 rounded-2xl p-5 space-y-1">
            <p className="font-body text-tiny text-text-secondary">Inspection Plan</p>
            <p className="font-body text-body font-medium text-text-primary">
              {selectedComp.part_code} — {selectedComp.description}
            </p>
          </div>
        )}

        <button
          onClick={handleStart}
          className="btn-primary w-full"
        >
          Generate Serial & Start Inspection
        </button>
      </div>

      <button onClick={() => navigate('/operator/dashboard')} className="btn-ghost w-full mt-4">
        Back to Dashboard
      </button>
    </div>
  );
}
