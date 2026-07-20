import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getInspectionData, submitMeasurement } from '../data/service';
import { GaugeSimulator } from '../simulation/gauge';
import type { GaugeReading } from '../simulation/gauge';
import type { InspectionPlan, Operation, Component, InspectionResult, Machine } from '../../../shared/types';
import { motion, AnimatePresence } from 'framer-motion';

type ScreenState = 'loading' | 'measuring' | 'captured' | 'transitioning' | 'complete';

export default function InspectionScreen() {
  const { serial } = useParams<{ serial: string }>();
  const navigate = useNavigate();
  const simulatorRef = useRef<GaugeSimulator | null>(null);

  const [screenState, setScreenState] = useState<ScreenState>('loading');
  const [component, setComponent] = useState<Component | null>(null);
  const [machine, setMachine] = useState<Machine | null>(null);
  const [currentOp, setCurrentOp] = useState<Operation | null>(null);
  const [opIndex, setOpIndex] = useState(0);
  const [totalOps, setTotalOps] = useState(0);
  const [completedResults, setCompletedResults] = useState<InspectionResult[]>([]);
  const [dimIndex, setDimIndex] = useState(0);

  const [liveReading, setLiveReading] = useState<GaugeReading | null>(null);
  const [capturedValue, setCapturedValue] = useState<number | null>(null);
  const [capturedResult, setCapturedResult] = useState<'PASS' | 'FAIL' | null>(null);
  const [gaugeConnected, setGaugeConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadInspection = useCallback(async () => {
    if (!serial) return;
    setScreenState('loading');
    try {
      const data = await getInspectionData(serial);
      setComponent(data.component);
      setMachine(data.machine);
      setCurrentOp(data.currentOperation);
      setOpIndex(data.operationIndex);
      setTotalOps(data.totalOperations);
      setCompletedResults(data.completedResults);
      setDimIndex(0);
      setCapturedValue(null);
      setCapturedResult(null);
      setLiveReading(null);
      setError(null);
      setScreenState('measuring');
    } catch {
      setError('Could not load inspection data');
    }
  }, [serial]);

  useEffect(() => {
    loadInspection();
    return () => { simulatorRef.current?.stop(); };
  }, [loadInspection]);

  const startGauge = useCallback(() => {
    if (!component || !currentOp) return;
    const dim = currentOp.dimensions[dimIndex];

    const sim = new GaugeSimulator({
      nominal: dim.nominal,
      minLimit: dim.min_limit,
      maxLimit: dim.max_limit,
      readIntervalMs: 180,
      stabilityWindow: 5,
      stabilityThreshold: 0.002,
    });

    setGaugeConnected(true);
    setLiveReading(null);
    setCapturedValue(null);
    setCapturedResult(null);
    setScreenState('measuring');

    sim.onReading((reading) => setLiveReading(reading));

    sim.onStable(async (reading) => {
      setCapturedValue(reading.value);
      setScreenState('captured');

      const { result, nextOperation, isComplete, finalStatus } = await submitMeasurement(
        dim,
        reading.value,
      );

      const passed = reading.withinTolerance;
      setCapturedResult(passed ? 'PASS' : 'FAIL');
      setCompletedResults((prev) => [...prev, result]);

      setTimeout(() => {
        if (isComplete) {
          setScreenState('complete');
          setTimeout(() => {
            navigate(`/operator/complete/${serial}?status=${finalStatus}`);
          }, 1800);
        } else if (nextOperation) {
          setScreenState('transitioning');
          setTimeout(() => {
            setCurrentOp(nextOperation);
            setOpIndex((prev) => prev + 1);
            setDimIndex(0);
            setCapturedValue(null);
            setCapturedResult(null);
            sim.stop();
            simulatorRef.current = null;
            const nextDim = nextOperation.dimensions[0];
            const nextSim = new GaugeSimulator({
              nominal: nextDim.nominal,
              minLimit: nextDim.min_limit,
              maxLimit: nextDim.max_limit,
              readIntervalMs: 180,
              stabilityWindow: 5,
              stabilityThreshold: 0.002,
            });
            nextSim.onReading((r) => setLiveReading(r));
            nextSim.onStable(async (r) => {
              setCapturedValue(r.value);
              setScreenState('captured');
              const res2 = await submitMeasurement(nextDim, r.value);
              setCapturedResult(r.withinTolerance ? 'PASS' : 'FAIL');
              setCompletedResults((prev) => [...prev, res2.result]);
              if (res2.isComplete) {
                setScreenState('complete');
                setTimeout(() => navigate(`/operator/complete/${serial}?status=${res2.finalStatus}`), 1800);
              }
            });
            nextSim.start();
            simulatorRef.current = nextSim;
            setScreenState('measuring');
          }, 800);
        }
      }, 1800);

      sim.stop();
    });

    sim.start();
    simulatorRef.current = sim;
  }, [component, currentOp, dimIndex, serial, navigate]);

  useEffect(() => {
    if (screenState === 'measuring' && component && currentOp) {
      startGauge();
    }
  }, [screenState, component, currentOp, startGauge]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-status-fail font-body text-body">{error}</p>
          <button onClick={() => navigate('/operator/dashboard')} className="btn-ghost mt-4">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (screenState === 'loading' && !component) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-text-primary/20 border-t-text-primary rounded-full animate-spin" />
      </div>
    );
  }

  const dim = currentOp?.dimensions[dimIndex];
  const stable = liveReading?.stable ?? false;
  const pct = dim ? ((liveReading?.value ?? dim.nominal) - (dim.nominal - 0.01)) / 0.02 * 100 : 50;

  return (
    <div className="flex flex-col h-full">
      {/* Minimal header bar */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-neutral-100 rounded-2xl flex items-center justify-center">
            <svg className="w-5 h-5 text-text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>
          <div>
            <p className="font-heading font-semibold text-card-title text-text-primary">{component?.part_code}</p>
            <p className="font-body text-small text-text-secondary">{component?.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="font-body text-tiny text-text-secondary">Serial</p>
            <p className="font-mono text-body font-semibold text-text-primary">{serial}</p>
          </div>
          <div className="flex items-center gap-2 bg-surface border border-border-light rounded-full px-4 py-2">
            <span className={`w-2 h-2 rounded-full ${gaugeConnected ? 'bg-status-pass' : 'bg-status-fail'}`} />
            <span className={`font-body text-small font-medium ${gaugeConnected ? 'text-status-pass' : 'text-status-fail'}`}>
              {gaugeConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-5 gap-6 min-h-0">
        {/* Left sidebar — operation info */}
        <div className="col-span-2 space-y-4 overflow-y-auto pr-2">
          <div className="bg-surface rounded-3xl p-6 shadow-card">
            <p className="font-body text-tiny font-semibold text-text-secondary uppercase tracking-wider mb-1">
              Operation
            </p>
            <p className="font-heading font-semibold text-section text-text-primary">
              {currentOp?.operation_name}
            </p>
            <p className="font-body text-small text-text-secondary mt-0.5">
              {opIndex + 1} of {totalOps}
            </p>
          </div>

          {dim && (
            <div className="bg-surface rounded-3xl p-6 shadow-card space-y-4">
              <div>
                <p className="font-body text-tiny font-semibold text-text-secondary uppercase tracking-wider">Dimension</p>
                <p className="font-heading font-semibold text-card-title text-text-primary mt-0.5">{dim.dimension_name}</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-1">
                  <span className="font-body text-small text-text-secondary">Nominal</span>
                  <span className="font-mono text-body font-medium text-text-primary">{dim.nominal.toFixed(3)}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="font-body text-small text-text-secondary">Min Limit</span>
                  <span className="font-mono text-body font-medium text-status-fail">{dim.min_limit.toFixed(3)}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="font-body text-small text-text-secondary">Max Limit</span>
                  <span className="font-mono text-body font-medium text-status-pass">{dim.max_limit.toFixed(3)}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-t border-border-light pt-2">
                  <span className="font-body text-small text-text-secondary">Unit</span>
                  <span className="font-body text-small font-medium text-text-primary">{dim.unit}</span>
                </div>
              </div>
            </div>
          )}

          {/* Progress */}
          <div className="bg-surface rounded-3xl p-6 shadow-card">
            <p className="font-body text-tiny font-semibold text-text-secondary uppercase tracking-wider mb-4">
              Progress
            </p>
            <div className="space-y-2">
              {Array.from({ length: totalOps }).map((_, i) => {
                const done = i < opIndex;
                const current = i === opIndex;
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl font-body text-body ${
                      done
                        ? 'bg-status-pass/8 text-status-pass'
                        : current
                        ? 'bg-neutral-100 text-text-primary'
                        : 'text-text-secondary/50'
                    }`}
                  >
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-tiny font-bold shrink-0 ${
                      done
                        ? 'bg-status-pass text-white'
                        : current
                        ? 'border-2 border-text-primary text-text-primary'
                        : 'border-2 border-text-secondary/20'
                    }`}>
                      {done ? '✓' : current ? '●' : i + 1}
                    </span>
                    <span className="truncate">
                      {currentOp?.operation_name || `Operation ${i + 1}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Completed */}
          {completedResults.length > 0 && (
            <div className="bg-surface rounded-3xl p-6 shadow-card">
              <p className="font-body text-tiny font-semibold text-text-secondary uppercase tracking-wider mb-3">
                Completed Measurements
              </p>
              <div className="space-y-1">
                {completedResults.map((r) => (
                  <div key={r.id} className="flex items-center justify-between font-body text-body py-1.5">
                    <span className="text-text-secondary">{r.dimension_id === dim?.id ? dim?.dimension_name : `Dim ${r.dimension_id}`}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-text-primary">{r.measured_value.toFixed(4)}</span>
                      <span className={`font-semibold ${r.result === 'PASS' ? 'text-status-pass' : 'text-status-fail'}`}>
                        {r.result}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right — hero gauge area */}
        <div className="col-span-3 flex flex-col gap-4">
          <div className="flex-1 bg-surface rounded-3xl shadow-card flex flex-col items-center justify-center relative min-h-0">
            <AnimatePresence mode="wait">
              {screenState === 'measuring' && (
                <motion.div
                  key="measuring"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col items-center"
                >
                  <p className="font-body text-small text-text-secondary mb-4">
                    {stable ? 'Reading captured — stable' : 'Live Measurement'}
                  </p>
                  <motion.p
                    key={liveReading?.value ?? 'init'}
                    initial={{ scale: 1 }}
                    animate={{ scale: 1 }}
                    className={`font-heading font-bold transition-colors duration-300 ${
                      stable ? 'text-hero-lg text-status-pass' : 'text-hero-lg text-text-primary'
                    }`}
                  >
                    {liveReading?.value.toFixed(4) ?? '—'}
                  </motion.p>
                  {dim && (
                    <div className="w-full max-w-md mt-8 px-4">
                      <div className="relative h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                        <div
                          className="absolute top-0 h-full rounded-full"
                          style={{
                            left: `${Math.max(0, Math.min(95, pct))}%`,
                            width: '4%',
                            backgroundColor: stable ? '#16A34A' : '#111111',
                            transition: 'all 0.15s ease',
                          }}
                        />
                      </div>
                      <div className="flex justify-between font-mono text-tiny text-text-secondary mt-2">
                        <span>{dim.min_limit.toFixed(3)}</span>
                        <span className="text-text-primary/60">Nom: {dim.nominal.toFixed(3)}</span>
                        <span>{dim.max_limit.toFixed(3)}</span>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-8">
                    <span className={`w-2 h-2 rounded-full ${stable ? 'bg-status-pass animate-pulse' : 'bg-status-warning'}`} />
                    <span className={`font-body text-small ${stable ? 'text-status-pass' : 'text-status-warning'}`}>
                      {stable ? 'Stable — capturing...' : 'Waiting for stable reading'}
                    </span>
                  </div>
                </motion.div>
              )}

              {screenState === 'captured' && (
                <motion.div
                  key="captured"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="flex flex-col items-center"
                >
                  {capturedResult === 'PASS' ? (
                    <div className="flex flex-col items-center">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                        className="w-20 h-20 rounded-full bg-status-pass/10 flex items-center justify-center mb-6"
                      >
                        <svg className="w-10 h-10 text-status-pass" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                          <polyline points="20,6 9,17 4,12" />
                        </svg>
                      </motion.div>
                      <p className="font-body text-small text-text-secondary mb-2">Captured Value</p>
                      <p className="font-heading font-bold text-hero text-status-pass">{capturedValue?.toFixed(4)}</p>
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mt-4 px-6 py-2 rounded-full bg-status-pass/10"
                      >
                        <span className="font-heading font-semibold text-section text-status-pass">PASS</span>
                      </motion.div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                        className="w-20 h-20 rounded-full bg-status-fail/10 flex items-center justify-center mb-6"
                      >
                        <svg className="w-10 h-10 text-status-fail" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </motion.div>
                      <p className="font-body text-small text-text-secondary mb-2">Captured Value</p>
                      <p className="font-heading font-bold text-hero text-status-fail">{capturedValue?.toFixed(4)}</p>
                      <div className="mt-4 px-6 py-2 rounded-full bg-status-fail/10">
                        <span className="font-heading font-semibold text-section text-status-fail">FAIL</span>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {screenState === 'transitioning' && (
                <motion.div
                  key="transitioning"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center"
                >
                  <div className="w-12 h-12 border-2 border-text-primary/20 border-t-text-primary rounded-full animate-spin mb-4" />
                  <p className="font-body text-body text-text-secondary">Moving to next operation...</p>
                </motion.div>
              )}

              {screenState === 'complete' && (
                <motion.div
                  key="complete"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                    className="w-24 h-24 rounded-full bg-status-pass/10 flex items-center justify-center mb-6"
                  >
                    <svg className="w-12 h-12 text-status-pass" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <polyline points="20,6 9,17 4,12" />
                    </svg>
                  </motion.div>
                  <p className="font-heading font-semibold text-title text-status-pass">All Inspections Complete</p>
                  <p className="font-body text-body text-text-secondary mt-2">Redirecting to summary...</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
