import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getQueueItemById, startQueueItem, recordQueueResult, getComponentDetail } from '../data/service';
import type { QueueItem, ComponentDetail, Measurement, FailAction } from '../../../shared/types';
import { motion, AnimatePresence } from 'framer-motion';

type Step = 'loading' | 'measuring' | 'result';

export default function InspectComponent() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const itemId = Number(searchParams.get('itemId'));

  const [step, setStep] = useState<Step>('loading');
  const [queueItem, setQueueItem] = useState<QueueItem | null>(null);
  const [detail, setDetail] = useState<ComponentDetail | null>(null);
  const [operationMeasurements, setOperationMeasurements] = useState<Measurement[]>([]);
  const [currentParamIdx, setCurrentParamIdx] = useState(0);
  const [value, setValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [autoAdvancing, setAutoAdvancing] = useState(false);
  const [lastResult, setLastResult] = useState<'PASS' | 'FAIL' | null>(null);
  const [allResults, setAllResults] = useState<{ name: string; value: number; result: 'PASS' | 'FAIL'; unit: string; nominal: number; min: number; max: number }[]>([]);
  const [failDialog, setFailDialog] = useState(false);
  const [finalStatus, setFinalStatus] = useState<'accepted' | 'rejected' | null>(null);
  const [nextItem, setNextItem] = useState<QueueItem | null>(null);
  const [processing, setProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!itemId) { navigate('/operator/dashboard'); return; }
    getQueueItemById(itemId).then(item => {
      if (!item) { navigate('/operator/dashboard'); return; }
      setQueueItem(item);
      getComponentDetail(item.component_id).then(d => {
        if (!d) return;
        setDetail(d);
        const op = d.flow_steps.flatMap(s => s.operations).find(o => o.id === item.operation_id);
        const m = op ? d.measurements.filter(m => op.measurement_ids.includes(m.id)) : [];
        setOperationMeasurements(m);
        setStep('measuring');
        startQueueItem(item.id);
      });
    });
  }, [itemId, navigate]);

  useEffect(() => {
    if (step === 'measuring' && inputRef.current) inputRef.current.focus();
  }, [step, currentParamIdx]);

  const currentParam = operationMeasurements[currentParamIdx] || null;

  function handleValueChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    if (/^-?\d*\.?\d*$/.test(v)) setValue(v);
  }

  async function handleSubmit() {
    if (!currentParam || submitting || autoAdvancing) return;
    const measuredValue = parseFloat(value);
    if (isNaN(measuredValue)) return;

    const passed = measuredValue >= currentParam.min_limit && measuredValue <= currentParam.max_limit;
    setLastResult(passed ? 'PASS' : 'FAIL');
    setAllResults(prev => [...prev, {
      name: currentParam.name,
      value: measuredValue,
      result: passed ? 'PASS' : 'FAIL',
      unit: currentParam.unit,
      nominal: currentParam.nominal,
      min: currentParam.min_limit,
      max: currentParam.max_limit,
    }]);
    setAutoAdvancing(true);
    setSubmitting(true);
    setValue('');

    await new Promise(r => setTimeout(r, 1500));

    if (currentParamIdx + 1 < operationMeasurements.length) {
      setCurrentParamIdx(prev => prev + 1);
      setLastResult(null);
      setAutoAdvancing(false);
      setSubmitting(false);
    } else {
      setAutoAdvancing(false);
      setSubmitting(false);
      await handleComplete();
    }
  }

  async function handleComplete() {
    const hasFailed = allResults.some(r => r.result === 'FAIL') || (lastResult === 'FAIL');
    if (hasFailed) { setFailDialog(true); return; }
    await saveAndAdvance();
  }

  async function saveAndAdvance(action?: FailAction) {
    setProcessing(true);
    try {
      const recordedValues = allResults.map(r => {
        const m = operationMeasurements.find(m => m.name === r.name);
        return { measurement_id: m?.id || 0, value: r.value };
      });
      const result = await recordQueueResult(queueItem!.id, recordedValues, action);
      setNextItem(result.nextItem);
      setFinalStatus(action === 'scrap' ? 'rejected' : 'accepted');
      setStep('result');
    } finally { setProcessing(false); }
  }

  function handleContinue() {
    if (nextItem) {
      navigate(`/operator/inspect?itemId=${nextItem.id}`);
    } else {
      navigate(`/operator/dashboard?result=${finalStatus}&serial=${queueItem?.component_serial}`);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !autoAdvancing) handleSubmit();
  }

  function tolerancePosition(min: number, max: number, val: number): number {
    const pct = ((val - min) / (max - min)) * 100;
    return Math.max(2, Math.min(98, pct));
  }

  if (step === 'loading') {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-text-primary/20 border-t-text-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (step === 'result') {
    const isAccepted = finalStatus === 'accepted';
    return (
      <div className="h-full flex items-center justify-center p-8">
        <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-2xl">
          <div className="bg-surface rounded-3xl p-12 border border-border-light text-center space-y-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className={`w-28 h-28 rounded-[2rem] flex items-center justify-center mx-auto ${isAccepted ? 'bg-status-pass/10' : 'bg-status-fail/10'}`}
            >
              {isAccepted ? (
                <svg className="w-14 h-14 text-status-pass" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <polyline points="20,6 9,17 4,12" />
                </svg>
              ) : (
                <svg className="w-14 h-14 text-status-fail" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              )}
            </motion.div>

            <div>
              <p className={`font-heading font-bold text-[2rem] ${isAccepted ? 'text-status-pass' : 'text-status-fail'}`}>
                {isAccepted ? 'Component Accepted' : 'Component Rejected'}
              </p>
              <p className="font-body text-body text-text-secondary mt-2">
                {isAccepted && nextItem ? 'Advancing to next operation...' : isAccepted ? 'All operations complete' : 'Component has been marked as failed'}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
              {[
                { label: 'Serial', value: queueItem?.component_serial },
                { label: 'Part', value: queueItem?.component_part_code },
                { label: 'Operation', value: queueItem?.operation_name },
              ].map(s => (
                <div key={s.label} className="bg-neutral-50 rounded-2xl px-4 py-3">
                  <p className="font-body text-tiny text-text-secondary">{s.label}</p>
                  <p className="font-body text-small font-semibold text-text-primary font-mono mt-0.5">{s.value}</p>
                </div>
              ))}
            </div>

            <div className="space-y-3 max-h-48 overflow-y-auto">
              {allResults.map((r, i) => (
                <div key={i} className={`flex items-center justify-between px-5 py-3 rounded-2xl ${r.result === 'PASS' ? 'bg-status-pass/5' : 'bg-status-fail/5'}`}>
                  <span className="font-body text-body text-text-primary">{r.name}</span>
                  <div className="flex items-center gap-4">
                    <span className="font-body text-body text-text-secondary font-mono">{r.value.toFixed(3)} {r.unit}</span>
                    <span className={`font-body text-small font-bold px-3 py-1 rounded-full ${r.result === 'PASS' ? 'text-status-pass bg-status-pass/10' : 'text-status-fail bg-status-fail/10'}`}>
                      {r.result}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={handleContinue} className="btn-primary w-full py-4 text-body">
              {nextItem ? 'Continue to Next Component →' : 'Back to Workstation'}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (step === 'measuring' && currentParam && queueItem) {
    const progress = ((currentParamIdx + 1) / operationMeasurements.length) * 100;
    const val = value ? parseFloat(value) : null;
    const pos = val !== null && !isNaN(val) ? tolerancePosition(currentParam.min_limit, currentParam.max_limit, val) : null;
    const valInRange = val !== null && !isNaN(val) && val >= currentParam.min_limit && val <= currentParam.max_limit;

    return (
      <div className="h-full flex flex-col">
        {/* Top Bar */}
        <div className="bg-surface border-b border-border-light px-10 py-4">
          <div className="flex items-center justify-between max-w-5xl mx-auto">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <span className="font-heading font-semibold text-body text-text-primary">{queueItem.component_part_code}</span>
                <span className="w-1 h-1 rounded-full bg-text-secondary" />
                <span className="font-body text-body font-mono text-text-secondary">{queueItem.component_serial}</span>
                <span className="w-1 h-1 rounded-full bg-text-secondary" />
                <span className="font-body text-body text-text-secondary">{queueItem.operation_name}</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-body text-small text-text-secondary">
                Parameter {currentParamIdx + 1} of {operationMeasurements.length}
              </span>
              <div className="flex gap-1">
                {operationMeasurements.map((_, i) => (
                  <div key={i} className={`w-2.5 h-2.5 rounded-full transition-colors ${i < currentParamIdx ? 'bg-status-pass' : i === currentParamIdx ? 'bg-text-primary' : 'bg-neutral-200'}`} />
                ))}
              </div>
            </div>
          </div>
          <div className="w-full bg-neutral-100 rounded-full h-1 mt-3 max-w-5xl mx-auto overflow-hidden">
            <motion.div className="h-full bg-text-primary rounded-full" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.4, ease: 'easeOut' }} />
          </div>
        </div>

        {/* Main Measurement Area */}
        <div className="flex-1 flex items-center justify-center px-10 py-8">
          <div className="w-full max-w-2xl space-y-10">
            {/* Parameter Header */}
            <div className="text-center">
              <p className="font-body text-small text-text-secondary mb-1">Current Measurement</p>
              <h1 className="font-heading font-bold text-[2rem] text-text-primary">{currentParam.name}</h1>
            </div>

            {/* Tolerance Gauge */}
            <div className="relative pt-6 pb-4">
              <div className="h-2 bg-neutral-100 rounded-full relative mx-8">
                <motion.div
                  className="absolute top-0 h-full bg-status-pass rounded-full"
                  style={{ left: '0%', right: '0%' }}
                  initial={false}
                />
                <div className="absolute top-0 h-full w-px bg-text-primary/40" style={{ left: '50%' }} />
              </div>
              <div className="flex justify-between mt-2 text-tiny font-body mx-8">
                <span className="text-text-secondary">{currentParam.min_limit.toFixed(3)}</span>
                <span className="text-text-primary font-medium">{currentParam.nominal.toFixed(3)}</span>
                <span className="text-text-secondary">{currentParam.max_limit.toFixed(3)}</span>
              </div>
              {/* Measured value marker */}
              {pos !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute -bottom-1"
                  style={{ left: `calc(${pos}% + 1.5rem)` }}
                >
                  <div className="flex flex-col items-center -translate-x-1/2">
                    <div className={`w-3 h-3 rounded-full border-2 ${valInRange ? 'bg-status-pass border-status-pass' : 'bg-status-fail border-status-fail'}`} />
                    <span className={`font-heading font-bold text-lg mt-1 ${valInRange ? 'text-status-pass' : 'text-status-fail'}`}>
                      {val?.toFixed(3)}
                    </span>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Value Input */}
            <div className="flex flex-col items-center gap-8">
              <div className="relative w-full">
                <input
                  ref={inputRef}
                  type="text"
                  inputMode="decimal"
                  value={value}
                  onChange={handleValueChange}
                  onKeyDown={handleKeyDown}
                  disabled={autoAdvancing}
                  placeholder="0.000"
                  className="w-full text-center font-heading font-bold text-[4rem] leading-none tracking-tight text-text-primary bg-transparent border-none focus:outline-none placeholder:text-neutral-200 py-0"
                  style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)' }}
                />
                <span className="absolute right-0 top-1/2 -translate-y-1/2 font-body text-section text-text-secondary">
                  {currentParam.unit}
                </span>
              </div>

              {/* Limits recap */}
              <div className="flex items-center gap-6 font-body text-small text-text-secondary">
                <span>Min: <strong className="text-text-primary">{currentParam.min_limit.toFixed(3)}</strong></span>
                <span>Nom: <strong className="text-text-primary">{currentParam.nominal.toFixed(3)}</strong></span>
                <span>Max: <strong className="text-text-primary">{currentParam.max_limit.toFixed(3)}</strong></span>
              </div>
            </div>

            {/* Action area */}
            <AnimatePresence mode="wait">
              {lastResult ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`rounded-3xl py-8 text-center ${lastResult === 'PASS' ? 'bg-status-pass/10' : 'bg-status-fail/10'}`}
                >
                  <span className={`font-heading font-black text-[3.5rem] tracking-tight ${lastResult === 'PASS' ? 'text-status-pass' : 'text-status-fail'}`}>
                    {lastResult}
                  </span>
                  {autoAdvancing && (
                    <p className="font-body text-body text-text-secondary mt-2">
                      {currentParamIdx + 1 < operationMeasurements.length ? 'Next parameter...' : 'Finalizing...'}
                    </p>
                  )}
                </motion.div>
              ) : (
                <motion.div key="button" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || value === ''}
                    className="w-full py-5 rounded-2xl font-heading font-bold text-body transition-all bg-text-primary text-white hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center gap-3">
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Recording...
                      </span>
                    ) : 'Record Measurement'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Fail Dialog */}
        <AnimatePresence>
          {failDialog && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
              onClick={() => setFailDialog(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-surface rounded-3xl p-10 max-w-md w-full mx-4 shadow-elevated"
                onClick={e => e.stopPropagation()}
              >
                <div className="w-14 h-14 rounded-2xl bg-status-fail/10 flex items-center justify-center mb-5 mx-auto">
                  <svg className="w-7 h-7 text-status-fail" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <h3 className="font-heading font-semibold text-section text-text-primary text-center mb-2">Measurement Out of Tolerance</h3>
                <p className="font-body text-body text-text-secondary text-center mb-8">What should happen to this component?</p>
                {processing ? (
                  <div className="flex justify-center py-4">
                    <div className="w-6 h-6 border-2 border-text-primary/20 border-t-text-primary rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <button onClick={() => saveAndAdvance('rework')} className="w-full py-3.5 rounded-xl font-heading font-medium text-body bg-neutral-100 text-text-primary hover:bg-neutral-200 transition-colors">
                      Send to Rework
                    </button>
                    <button onClick={() => saveAndAdvance('scrap')} className="w-full py-3.5 rounded-xl font-heading font-medium text-body border-2 border-status-fail/20 text-status-fail hover:bg-status-fail/5 transition-colors">
                      Scrap Component
                    </button>
                    <button onClick={() => saveAndAdvance('skip')} className="w-full py-3.5 rounded-xl font-heading font-medium text-body border-2 border-status-info/20 text-status-info hover:bg-status-info/5 transition-colors">
                      Skip to Next Operation
                    </button>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="h-full flex items-center justify-center">
      <p className="font-body text-body text-text-secondary">No inspection item found.</p>
    </div>
  );
}
