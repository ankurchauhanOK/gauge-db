import { useState } from 'react';
import { getTraceability } from '../data/service';

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

  const statusIcon = (event: string) => {
    if (event.includes('Accepted') || event.includes('Completed') || event.includes('Marked')) return '✓';
    if (event.includes('Rejected')) return '✕';
    return '●';
  };

  const statusColor = (event: string) => {
    if (event.includes('Accepted') || event.includes('Completed') || event.includes('Marked')) return 'text-gauge-green border-gauge-green';
    if (event.includes('Rejected') || event.includes('FAIL')) return 'text-gauge-red border-gauge-red';
    if (event.includes('Generated')) return 'text-gauge-blue border-gauge-blue';
    return 'text-surface-400 border-surface-600';
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">Traceability</h1>

      <div className="flex gap-3">
        <input
          className="input text-lg flex-1 max-w-md"
          value={serial}
          onChange={e => setSerial(e.target.value)}
          placeholder="Enter Serial Number"
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
        />
        <button onClick={handleSearch} className="btn-primary px-8" disabled={loading || !serial.trim()}>
          {loading ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" /> : 'Search'}
        </button>
      </div>

      {notFound && (
        <div className="card text-center py-12">
          <p className="text-surface-400 text-lg">No traceability data found</p>
          <p className="text-surface-500 text-sm mt-1">Serial number "{serial}" not found in the system</p>
        </div>
      )}

      {events && (
        <div className="max-w-2xl">
          <div className="card mb-4">
            <p className="text-xs text-surface-500 uppercase tracking-wider">Serial Number</p>
            <p className="text-xl font-mono font-bold text-gauge-blue">{serial}</p>
          </div>

          <div className="relative">
            {events.map((e, i) => (
              <div key={i} className="flex gap-4 pb-8 last:pb-0 relative">
                {i < events.length - 1 && (
                  <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-surface-700" />
                )}
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 ${statusColor(e.event)}`}>
                  {statusIcon(e.event)}
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-white">{e.event}</p>
                    <p className="text-xs text-surface-500">{e.timestamp}</p>
                  </div>
                  <p className="text-sm text-surface-400 mt-1">{e.details}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!events && !notFound && (
        <div className="card text-center py-16">
          <p className="text-surface-500 text-lg">Enter a serial number to view traceability</p>
          <p className="text-surface-600 text-sm mt-1">e.g. SB2507140001</p>
        </div>
      )}
    </div>
  );
}
