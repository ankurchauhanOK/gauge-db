import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getInspectionData, submitMeasurement } from '../data/service';
import { GaugeSimulator } from '../simulation/gauge';
import type { GaugeReading } from '../simulation/gauge';
import type { InspectionPlan, Operation, Component, InspectionResult, Machine } from '../../../shared/types';

type ScreenState = 'loading' | 'measuring' | 'captured' | 'transitioning' | 'complete';

export default function InspectionScreen() {
  const { serial } = useParams<{ serial: string }>();
  const navigate = useNavigate();
  const simulatorRef = useRef<GaugeSimulator | null>(null);

  const [screenState, setScreenState] = useState<ScreenState>('loading');
  const [component, setComponent] = useState<Component | null>(null);
  const [machine, setMachine] = useState<Machine | null>(null);
  const [plan, setPlan] = useState<InspectionPlan | null>(null);
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
      setPlan(data.component ? null : null);
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
          }, 1200);
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
            // Start next operation's gauge
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
                setTimeout(() => navigate(`/operator/complete/${serial}?status=${res2.finalStatus}`), 1200);
              }
            });
            nextSim.start();
            simulatorRef.current = nextSim;
            setScreenState('measuring');
          }, 800);
        }
      }, 1500);

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
      <div className="p-6 flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gauge-red text-lg">{error}</p>
          <button onClick={() => navigate('/operator/dashboard')} className="btn-ghost mt-4">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (screenState === 'loading' && !component) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-gauge-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const dim = currentOp?.dimensions[dimIndex];
  const stable = liveReading?.stable ?? false;

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-xs text-surface-500 uppercase tracking-wider">Component</p>
            <p className="text-lg font-bold text-white">{component?.part_code}</p>
            <p className="text-sm text-surface-400">{component?.description}</p>
          </div>
          <div className="w-px h-12 bg-surface-700" />
          <div>
            <p className="text-xs text-surface-500 uppercase tracking-wider">Serial Number</p>
            <p className="text-xl font-mono font-bold text-gauge-blue">{serial}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${gaugeConnected ? 'bg-gauge-green' : 'bg-gauge-red'}`} />
          <span className={`text-sm ${gaugeConnected ? 'text-gauge-green' : 'text-gauge-red'}`}>
            {gaugeConnected ? 'Gauge Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Main inspection area */}
      <div className="flex-1 grid grid-cols-5 gap-6">
        {/* Left: Operation info */}
        <div className="col-span-2 space-y-4">
          <div className="card">
            <p className="text-xs text-surface-500 uppercase tracking-wider mb-1">Operation</p>
            <p className="text-xl font-bold text-white">{currentOp?.operation_name}</p>
            <p className="text-sm text-surface-400">
              Operation {opIndex + 1} of {totalOps}
            </p>
          </div>

          {dim && (
            <div className="card space-y-4">
              <div>
                <p className="text-xs text-surface-500 uppercase tracking-wider">Dimension</p>
                <p className="text-lg font-semibold text-white">{dim.dimension_name}</p>
              </div>
              <div className="flex justify-between items-center py-2 border-t border-surface-700">
                <span className="text-sm text-surface-400">Nominal</span>
                <span className="text-lg font-mono text-white">{dim.nominal.toFixed(3)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-surface-400">Min Limit</span>
                <span className="text-lg font-mono text-gauge-red">{dim.min_limit.toFixed(3)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-surface-400">Max Limit</span>
                <span className="text-lg font-mono text-gauge-green">{dim.max_limit.toFixed(3)}</span>
              </div>
              <div className="flex justify-between items-center border-t border-surface-700 pt-2">
                <span className="text-sm text-surface-400">Unit</span>
                <span className="text-sm text-surface-200">{dim.unit}</span>
              </div>
            </div>
          )}

          {/* Progress */}
          <div className="card">
            <p className="text-xs text-surface-500 uppercase tracking-wider mb-3">Progress</p>
            <div className="space-y-2">
              {Array.from({ length: totalOps }).map((_, i) => {
                const done = i < opIndex;
                const current = i === opIndex;
                const dimDoneCount = current ? completedResults.length : 0;
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                      done
                        ? 'bg-gauge-green/10 text-gauge-green'
                        : current
                        ? 'bg-gauge-blue/10 text-gauge-blue border border-gauge-blue/20'
                        : 'text-surface-500'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0"
                      style={{
                        borderColor: done ? '#22c55e' : current ? '#3b82f6' : '#4b5563',
                        backgroundColor: done ? '#22c55e' : 'transparent',
                        color: done ? '#fff' : undefined,
                      }}
                    >
                      {done ? '✓' : current ? '●' : i + 1}
                    </span>
                    <span className="truncate">
                      {plan?.operations[i]?.operation_name || `Operation ${i + 1}`}
                    </span>
                    {done && <span className="ml-auto text-xs">PASS</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Gauge reading */}
        <div className="col-span-3 flex flex-col gap-4">
          <div className="card flex-1 flex flex-col items-center justify-center relative">
            {screenState === 'measuring' && (
              <>
                <p className="text-sm text-surface-400 mb-4">
                  {stable ? 'Reading Stable — Capturing...' : 'Live Reading'}
                </p>
                <p className={`font-mono font-bold transition-all duration-100 ${
                  stable ? 'text-gauge-3xl text-gauge-green' : 'text-gauge-2xl text-white'
                }`}>
                  {liveReading?.value.toFixed(4) ?? '—'}
                </p>
                {dim && (
                  <div className="w-full max-w-md mt-6">
                    <div className="relative h-3 bg-surface-700 rounded-full overflow-hidden">
                      {/* Tolerance range bar */}
                      <div
                        className="absolute top-0 h-full bg-gradient-to-r from-gauge-red via-gauge-green to-gauge-red rounded-full"
                        style={{
                          left: `${((dim.min_limit - (dim.nominal - 0.01)) / 0.02) * 100}%`,
                          width: `${((dim.max_limit - dim.min_limit) / 0.02) * 100}%`,
                          opacity: 0.3,
                        }}
                      />
                      {/* Live reading indicator */}
                      <div
                        className="absolute top-0 h-full w-1 bg-white rounded-full transition-all duration-150"
                        style={{
                          left: `${Math.max(0, Math.min(100, ((liveReading?.value ?? dim.nominal) - (dim.nominal - 0.01)) / 0.02 * 100))}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-surface-500 mt-1">
                      <span>{dim.min_limit.toFixed(3)}</span>
                      <span className="text-surface-400">Nom: {dim.nominal.toFixed(3)}</span>
                      <span>{dim.max_limit.toFixed(3)}</span>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2 mt-6">
                  <span className={`w-2 h-2 rounded-full ${stable ? 'bg-gauge-green animate-pulse' : 'bg-gauge-amber'}`} />
                  <span className={`text-sm ${stable ? 'text-gauge-green' : 'text-gauge-amber'}`}>
                    {stable ? 'Stable Signal' : 'Waiting for stable reading...'}
                  </span>
                </div>
              </>
            )}

            {screenState === 'captured' && (
              <div className="text-center">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  capturedResult === 'PASS' ? 'bg-gauge-green/20' : 'bg-gauge-red/20'
                }`}>
                  <span className={`text-4xl ${capturedResult === 'PASS' ? 'text-gauge-green' : 'text-gauge-red'}`}>
                    {capturedResult === 'PASS' ? '✓' : '✕'}
                  </span>
                </div>
                <p className="text-sm text-surface-400 mb-2">Captured Value</p>
                <p className={`text-gauge-3xl font-mono font-bold ${capturedResult === 'PASS' ? 'text-gauge-green' : 'text-gauge-red'}`}>
                  {capturedValue?.toFixed(4)}
                </p>
                <p className={`text-2xl font-bold mt-2 ${capturedResult === 'PASS' ? 'text-gauge-green' : 'text-gauge-red'}`}>
                  {capturedResult}
                </p>
              </div>
            )}

            {screenState === 'transitioning' && (
              <div className="text-center">
                <div className="w-16 h-16 border-2 border-gauge-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-lg text-surface-300">Moving to next operation...</p>
              </div>
            )}

            {screenState === 'complete' && (
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-gauge-green/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl text-gauge-green">✓</span>
                </div>
                <p className="text-2xl font-bold text-gauge-green">All Inspections Complete</p>
                <p className="text-surface-400 mt-2">Redirecting...</p>
              </div>
            )}
          </div>

          {/* Recent measurements */}
          {completedResults.length > 0 && (
            <div className="card">
              <p className="text-xs text-surface-500 uppercase tracking-wider mb-2">Completed Measurements</p>
              <div className="space-y-1">
                {completedResults.map((r) => (
                  <div key={r.id} className="flex items-center justify-between text-sm py-1">
                    <span className="text-surface-300">{r.dimension_id === dim?.id ? dim?.dimension_name : `Dimension ${r.dimension_id}`}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-surface-200">{r.measured_value.toFixed(4)}</span>
                      <span className={`font-bold ${r.result === 'PASS' ? 'text-gauge-green' : 'text-gauge-red'}`}>
                        {r.result}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
