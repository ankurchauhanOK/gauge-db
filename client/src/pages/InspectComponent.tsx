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

    if (hasFailed) {
      setFailDialog(true);
      return;
    }

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
    } finally {
      setProcessing(false);
    }
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

  if (step === 'loading') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-text-primary/20 border-t-text-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (step === 'result') {
    const isAccepted = finalStatus === 'accepted';
    return (
      <div className="flex items-center justify-center h-full">
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="max-w-lg w-full">
          <div className="bg-surface rounded-3xl p-10 shadow-card text-center space-y-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto ${isAccepted ? 'bg-status-pass/10' : 'bg-status-fail/10'}`}
            >
              {isAccepted ? (
                <svg className="w-10 h-10 text-status-pass" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <polyline points="20,6 9,17 4,12" />
                </svg>
              ) : (
                <svg className="w-10 h-10 text-status-fail" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              )}
            </motion.div>
            <div>
              <p className="font-heading font-semibold text-title text-text-primary">
                {isAccepted ? 'Operation Complete' : 'Component Failed'}
              </p>
              <p className="font-body text-body text-text-secondary mt-1">
                {isAccepted && nextItem ? 'Advancing to next operation' : isAccepted ? 'All operations complete' : 'Component has been marked as failed'}
              </p>
            </div>
            <div className="bg-neutral-50 rounded-2xl p-5 space-y-2 text-left">
              <div className="flex justify-between">
                <span className="font-body text-small text-text-secondary">Serial Number</span>
                <span className="font-body text-small font-semibold text-text-primary font-mono">{queueItem?.component_serial}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-body text-small text-text-secondary">Part Code</span>
                <span className="font-body text-small font-medium text-text-primary">{queueItem?.component_part_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-body text-small text-text-secondary">Operation</span>
                <span className="font-body text-small font-medium text-text-primary">{queueItem?.operation_name}</span>
              </div>
            </div>
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {allResults.map((r, i) => (
                <div key={i} className={`flex items-center justify-between px-4 py-2.5 rounded-2xl ${r.result === 'PASS' ? 'bg-status-pass/5' : 'bg-status-fail/5'}`}>
                  <span className="font-body text-small text-text-primary">{r.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-body text-small text-text-secondary font-mono">{r.value.toFixed(3)} {r.unit}</span>
                    <span className={`font-body text-tiny font-semibold px-2 py-0.5 rounded-full ${r.result === 'PASS' ? 'text-status-pass bg-status-pass/10' : 'text-status-fail bg-status-fail/10'}`}>{r.result}</span>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={handleContinue} className="btn-primary w-full">
              {nextItem ? 'Next Component →' : 'Back to Dashboard'}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (step === 'measuring' && currentParam && queueItem) {
    const progress = ((currentParamIdx + 1) / operationMeasurements.length) * 100;
    return (
      <div className="max-w-lg mx-auto pt-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="font-body text-tiny font-medium text-text-secondary tracking-wide uppercase">
                Parameter {currentParamIdx + 1} of {operationMeasurements.length}
              </span>
              <p className="font-body text-tiny text-text-secondary">{queueItem.operation_name}</p>
            </div>
            <span className="font-body text-tiny font-medium text-text-secondary font-mono">{queueItem.component_serial}</span>
          </div>
          <div className="w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden">
            <motion.div className="h-full bg-text-primary rounded-full" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.4, ease: 'easeOut' }} />
          </div>
        </div>

        <div className="bg-surface rounded-3xl p-8 shadow-card space-y-8">
          <div>
            <p className="font-body text-small text-text-secondary mb-1">{queueItem.component_part_code}</p>
            <h2 className="font-heading font-semibold text-section text-text-primary">{currentParam.name}</h2>
          </div>

          <div className="bg-neutral-50 rounded-2xl p-5 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="font-body text-tiny text-text-secondary">Nominal</p>
              <p className="font-heading font-semibold text-body text-text-primary">{currentParam.nominal.toFixed(3)}</p>
            </div>
            <div>
              <p className="font-body text-tiny text-text-secondary">Min</p>
              <p className="font-heading font-semibold text-body text-text-primary">{currentParam.min_limit.toFixed(3)}</p>
            </div>
            <div>
              <p className="font-body text-tiny text-text-secondary">Max</p>
              <p className="font-heading font-semibold text-body text-text-primary">{currentParam.max_limit.toFixed(3)}</p>
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
            {lastResult && (
              <motion.div
                key={currentParamIdx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className={`rounded-2xl p-4 text-center ${lastResult === 'PASS' ? 'bg-status-pass/10' : 'bg-status-fail/10'}`}
              >
                <span className={`font-heading font-bold text-display ${lastResult === 'PASS' ? 'text-status-pass' : 'text-status-fail'}`}>{lastResult}</span>
                {autoAdvancing && (
                  <p className="font-body text-tiny text-text-secondary mt-1">
                    {currentParamIdx + 1 < operationMeasurements.length ? 'Next parameter...' : 'Finalizing...'}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {!autoAdvancing && (
            <button onClick={handleSubmit} className="btn-primary w-full" disabled={submitting || value === ''}>
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Recording...
                </span>
              ) : 'Record Measurement'}
            </button>
          )}
        </div>

        <AnimatePresence>
          {failDialog && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
              onClick={() => setFailDialog(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-surface rounded-3xl p-8 max-w-sm w-full mx-4 shadow-elevated"
                onClick={e => e.stopPropagation()}
              >
                <h3 className="font-heading font-semibold text-section text-text-primary mb-2">Measurement Failed</h3>
                <p className="font-body text-body text-text-secondary mb-6">One or more measurements are out of tolerance. What should happen to this component?</p>
                {processing ? (
                  <div className="flex justify-center py-4">
                    <div className="w-6 h-6 border-2 border-text-primary/20 border-t-text-primary rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button onClick={() => saveAndAdvance('rework')} className="w-full btn-secondary">Send to Rework</button>
                    <button onClick={() => saveAndAdvance('scrap')} className="w-full btn-secondary border-status-fail/30 text-status-fail hover:bg-status-fail/5">
                      Scrap Component
                    </button>
                    <button onClick={() => saveAndAdvance('skip')} className="w-full btn-secondary border-status-info/30 text-status-info hover:bg-status-info/5">
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
    <div className="flex items-center justify-center h-64">
      <p className="font-body text-body text-text-secondary">No inspection item found.</p>
    </div>
  );
}
