import { useState, useEffect } from 'react';
import { getTraceability } from '../data/service';
import PageHeader from '../components/shared/PageHeader';
import SearchInput from '../components/shared/SearchInput';
import { motion } from 'framer-motion';

export default function Traceability() {
  const [serial, setSerial] = useState('');
  const [events, setEvents] = useState<{ event: string; timestamp: string; details: string }[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  async function handleSearch() {
    if (!serial.trim()) return;
    setLoading(true);
    setNotFound(false);
    const data = await getTraceability(serial.trim());
    setEvents(data);
    if (!data) setNotFound(true);
    setLoading(false);
  }

  useEffect(() => {
    if (!serial) { setEvents(null); setNotFound(false); }
  }, [serial]);

  const eventColor = (event: string) => {
    if (event.includes('Accepted') || event.includes('Completed') || event.includes('Marked')) return 'border-status-pass text-status-pass';
    if (event.includes('Rejected') || event.includes('FAIL')) return 'border-status-fail text-status-fail';
    if (event.includes('Generated')) return 'border-status-info text-status-info';
    return 'border-border text-text-secondary';
  };

  const eventIcon = (event: string) => {
    if (event.includes('Accepted') || event.includes('Completed') || event.includes('Marked')) return '✓';
    if (event.includes('Rejected')) return '✕';
    return '●';
  };

  return (
    <div>
      <PageHeader title="Traceability" subtitle="Track component history by serial number" />

      <div className="flex gap-3 mb-8 max-w-xl">
        <div className="flex-1">
          <SearchInput value={serial} onChange={setSerial} placeholder="Enter Serial Number" />
        </div>
        <button onClick={handleSearch} className="btn-primary px-8" disabled={loading || !serial.trim()}>
          {loading ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" /> : 'Search'}
        </button>
      </div>

      {notFound && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-surface rounded-3xl p-10 shadow-card text-center max-w-lg">
          <p className="font-body text-section text-text-secondary">No traceability data found</p>
          <p className="font-body text-body text-text-secondary mt-1">Serial number "{serial}" not found in the system</p>
        </motion.div>
      )}

      {events && (
        <div className="max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-surface rounded-3xl p-6 shadow-card mb-6">
            <p className="font-body text-tiny font-semibold text-text-secondary uppercase tracking-wider">Serial Number</p>
            <p className="font-heading font-bold text-display text-text-primary mt-1">{serial}</p>
          </motion.div>

          <div className="relative">
            {events.map((e, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex gap-4 pb-8 last:pb-0 relative"
              >
                {i < events.length - 1 && (
                  <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-border-light" />
                )}
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-tiny font-bold shrink-0 ${eventColor(e.event)}`}>
                  {eventIcon(e.event)}
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-center justify-between">
                    <p className="font-body text-body font-semibold text-text-primary">{e.event}</p>
                    <p className="font-body text-tiny text-text-secondary ml-4 whitespace-nowrap">{e.timestamp}</p>
                  </div>
                  <p className="font-body text-small text-text-secondary mt-1">{e.details}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {!events && !notFound && (
        <div className="bg-surface rounded-3xl p-10 shadow-card text-center max-w-lg">
          <p className="font-body text-section text-text-secondary">Enter a serial number to view traceability</p>
          <p className="font-body text-body text-text-secondary mt-1">e.g. SB2507140001</p>
        </div>
      )}
    </div>
  );
}
