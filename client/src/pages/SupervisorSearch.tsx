import { useState, type FormEvent } from 'react';
import { supervisorSearch, getTraceability } from '../data/service';
import PageHeader from '../components/shared/PageHeader';
import SearchInput from '../components/shared/SearchInput';
import StatusBadge from '../components/shared/StatusBadge';
import { motion } from 'framer-motion';

type SearchResult = {
  serial: string; part: string; component: string; machine: string;
  operator: string; status: string; qr_status: string; started: string; completed: string | null;
  reason?: string;
  measurements: { dim: string; nominal: string; measured: string; min: string; max: string; result: 'PASS' | 'FAIL' }[];
};

const statusMap: Record<string, 'PASS' | 'FAIL' | 'WARNING' | 'INFO'> = {
  accepted: 'PASS', rejected: 'FAIL', in_progress: 'WARNING', qr_marked: 'INFO',
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

  const eventColor = (event: string) => {
    if (event.includes('Accepted') || event.includes('Completed') || event.includes('Marked')) return 'border-status-pass text-status-pass';
    if (event.includes('Rejected') || event.includes('FAIL')) return 'border-status-fail text-status-fail';
    return 'border-border text-text-secondary';
  };

  const eventIcon = (event: string) => {
    if (event.includes('Accepted') || event.includes('Completed') || event.includes('Marked')) return '✓';
    if (event.includes('Rejected')) return '✕';
    return '';
  };

  return (
    <div>
      <PageHeader title="Search & Traceability" subtitle="Search components and view full traceability" />

      <form onSubmit={handleSearch} className="flex gap-3 mb-8 max-w-xl">
        <div className="flex-1">
          <SearchInput value={query} onChange={setQuery} placeholder="Search by Serial, Part Code, or QR" />
        </div>
        <button type="submit" className="btn-primary px-8" disabled={loading || !query.trim()}>
          {loading ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" /> : 'Search'}
        </button>
      </form>

      {searched && !loading && results.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-surface rounded-3xl p-10 shadow-card text-center max-w-lg">
          <p className="font-body text-section text-text-secondary">No components found</p>
        </motion.div>
      )}

      {results.length > 0 && (
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-surface rounded-3xl p-6 shadow-card">
            <p className="font-heading font-semibold text-card-title text-text-primary mb-4">Search Results</p>
            <div className="space-y-2">
              {results.map(r => (
                <button
                  key={r.serial}
                  onClick={() => showTimeline(r.serial)}
                  className={`w-full text-left p-4 rounded-2xl font-body text-body transition-all ${
                    selectedSerial === r.serial
                      ? 'bg-neutral-100 text-text-primary border border-border'
                      : 'bg-neutral-50 text-text-secondary border border-transparent hover:bg-neutral-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-medium text-text-primary">{r.serial}</span>
                    <StatusBadge status={statusMap[r.status] || 'WARNING'} size="sm" />
                  </div>
                  <p className="font-body text-small text-text-secondary mt-0.5">{r.part} &middot; {r.machine} &middot; {r.operator}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            {timeline && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="bg-surface rounded-3xl p-6 shadow-card">
                <p className="font-heading font-semibold text-card-title text-text-primary mb-4">
                  Timeline: {selectedSerial}
                </p>
                <div className="relative">
                  {timeline.map((e, i) => (
                    <div key={i} className="flex gap-3 pb-5 last:pb-0 relative">
                      {i < timeline.length - 1 && <div className="absolute left-[11px] top-5 bottom-0 w-0.5 bg-border-light" />}
                      <div className={`w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${eventColor(e.event)}`}>
                        <span className="text-[10px] font-bold">{eventIcon(e.event)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-body font-semibold text-text-primary">{e.event}</p>
                        <p className="font-body text-tiny text-text-secondary mt-0.5">{e.timestamp}</p>
                        <p className="font-body text-tiny text-text-secondary mt-0.5">{e.details}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {selectedSerial && results.find(r => r.serial === selectedSerial) && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-surface rounded-3xl p-6 shadow-card mt-4">
                <p className="font-heading font-semibold text-card-title text-text-primary mb-4">Measurements</p>
                <div className="space-y-2">
                  {(results.find(r => r.serial === selectedSerial)?.measurements || []).map((m, i) => (
                    <div key={i} className="bg-neutral-50 rounded-2xl p-4 font-body text-body">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-text-primary">{m.dim}</span>
                        <StatusBadge status={m.result} size="sm" />
                      </div>
                      <div className="grid grid-cols-4 gap-2 font-body text-tiny text-text-secondary">
                        <span>Nom: {m.nominal}</span>
                        <span>Min: {m.min}</span>
                        <span>Max: {m.max}</span>
                        <span>Measured: <span className="font-mono text-text-primary">{m.measured}</span></span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      )}

      {!searched && (
        <div className="bg-surface rounded-3xl p-10 shadow-card text-center max-w-lg">
          <p className="font-body text-section text-text-secondary">Search for a component to view its history</p>
          <p className="font-body text-body text-text-secondary mt-1">Serial number, part code, or QR code</p>
        </div>
      )}
    </div>
  );
}
