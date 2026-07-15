import { useState, type FormEvent } from 'react';
import { supervisorSearch, getTraceability } from '../data/service';

type SearchResult = {
  serial: string; part: string; component: string; machine: string;
  operator: string; status: string; qr_status: string; started: string; completed: string | null;
  reason?: string;
  measurements: { dim: string; nominal: string; measured: string; min: string; max: string; result: 'PASS' | 'FAIL' }[];
};

export default function SupervisorSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedSerial, setSelectedSerial] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<{ event: string; timestamp: string; details: string }[] | null>(null);

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    setSelectedSerial(null);
    setTimeline(null);
    const data = await supervisorSearch(query);
    setResults(data as SearchResult[]);
    setLoading(false);
  }

  async function showTimeline(serial: string) {
    setSelectedSerial(serial);
    const data = await getTraceability(serial);
    setTimeline(data);
  }

  function statusColor(s: string) {
    switch (s) {
      case 'accepted': return 'text-gauge-green';
      case 'rejected': return 'text-gauge-red';
      default: return 'text-gauge-amber';
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">Search & Traceability</h1>

      <form onSubmit={handleSearch} className="flex gap-3">
        <input
          className="input text-lg flex-1 max-w-md"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by Serial, Part Code, or QR"
        />
        <button type="submit" className="btn-primary px-8" disabled={loading || !query.trim()}>
          {loading ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" /> : 'Search'}
        </button>
      </form>

      {searched && !loading && results.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-surface-400 text-lg">No components found</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="grid grid-cols-2 gap-6">
          <div className="card overflow-hidden">
            <p className="text-sm font-semibold text-surface-200 mb-3">Search Results</p>
            <div className="space-y-2">
              {results.map(r => (
                <button
                  key={r.serial}
                  onClick={() => showTimeline(r.serial)}
                  className={`w-full text-left p-3 rounded-lg transition-all text-sm border ${
                    selectedSerial === r.serial
                      ? 'bg-gauge-blue/10 border-gauge-blue/30'
                      : 'bg-surface-800/50 border-transparent hover:bg-surface-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-gauge-blue">{r.serial}</span>
                    <span className={`font-semibold ${statusColor(r.status)}`}>{r.status}</span>
                  </div>
                  <p className="text-surface-400 text-xs mt-0.5">{r.part} · {r.machine} · {r.operator}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            {timeline && (
              <div className="card">
                <p className="text-sm font-semibold text-surface-200 mb-3">Traceability Timeline: {selectedSerial}</p>
                <div className="relative">
                  {timeline.map((e, i) => (
                    <div key={i} className="flex gap-3 pb-5 last:pb-0 relative">
                      {i < timeline.length - 1 && <div className="absolute left-[11px] top-5 bottom-0 w-0.5 bg-surface-700" />}
                      <div className={`w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                        e.event.includes('Accepted') || e.event.includes('Completed') || e.event.includes('Marked') ? 'border-gauge-green text-gauge-green' :
                        e.event.includes('Rejected') || e.event.includes('FAIL') ? 'border-gauge-red text-gauge-red' :
                        'border-surface-500 text-surface-500'
                      }`}>
                        <span className="text-[10px] font-bold">{e.event.includes('Rejected') ? '✕' : e.event.includes('Accepted') || e.event.includes('Completed') || e.event.includes('Marked') ? '✓' : ''}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">{e.event}</p>
                        <p className="text-xs text-surface-500 mt-0.5">{e.timestamp}</p>
                        <p className="text-xs text-surface-400 mt-0.5">{e.details}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedSerial && results.find(r => r.serial === selectedSerial) && (
              <div className="card mt-4">
                <p className="text-sm font-semibold text-surface-200 mb-3">Measurements</p>
                <div className="space-y-2">
                  {(results.find(r => r.serial === selectedSerial)?.measurements || []).map((m, i) => (
                    <div key={i} className="bg-surface-800/50 rounded-lg p-3 text-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-surface-300 font-medium">{m.dim}</span>
                        <span className={`font-bold ${m.result === 'PASS' ? 'text-gauge-green' : 'text-gauge-red'}`}>{m.result}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-xs text-surface-400">
                        <span>Nom: {m.nominal}</span>
                        <span>Min: {m.min}</span>
                        <span>Max: {m.max}</span>
                        <span>Measured: <span className="text-white font-mono">{m.measured}</span></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {!searched && (
        <div className="card text-center py-16">
          <p className="text-surface-500 text-lg">Search for a component to view its history</p>
          <p className="text-surface-600 text-sm mt-1">Serial number, part code, or QR code</p>
        </div>
      )}
    </div>
  );
}
