import { useState, type FormEvent } from 'react';
import { getOperatorSearch } from '../data/service';
import type { ProductionRecord } from '../../../shared/types';

export default function OperatorSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProductionRecord[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const data = await getOperatorSearch(query);
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  const statusColor = (status: string) => {
    switch (status) {
      case 'accepted':
      case 'qr_marked': return 'text-gauge-green';
      case 'rejected': return 'text-gauge-red';
      default: return 'text-gauge-amber';
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'in_progress': return 'In Progress';
      case 'accepted': return 'Accepted';
      case 'rejected': return 'Rejected';
      case 'qr_marked': return 'QR Marked';
      case 'completed': return 'Completed';
      default: return status;
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-white mb-6">Search Component</h1>

      <form onSubmit={handleSearch} className="flex gap-3 mb-6">
        <input
          type="text"
          className="input text-lg flex-1"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by Serial Number, Part Code, or QR Code"
          autoFocus
        />
        <button type="submit" className="btn-primary px-8" disabled={loading || !query.trim()}>
          {loading ? (
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
          ) : (
            'Search'
          )}
        </button>
      </form>

      {searched && !loading && results.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-surface-400 text-lg">No components found</p>
          <p className="text-surface-500 text-sm mt-1">Try a different search term</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-700">
                <Th>Serial Number</Th>
                <Th>Part Code</Th>
                <Th>Date</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-800">
              {results.map((r) => (
                <tr key={r.id} className="hover:bg-surface-800/50 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-mono text-sm text-gauge-blue">{r.serial_number}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-surface-200">{r.part_code}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-surface-400">
                      {new Date(r.started_at).toLocaleDateString('en-GB')}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-sm font-semibold ${statusColor(r.status)}`}>
                      {statusLabel(r.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!searched && (
        <div className="card text-center py-16">
          <p className="text-surface-500 text-lg">Enter a serial number or part code to search</p>
          <p className="text-surface-600 text-sm mt-2">
            e.g. SB2507140001 or BUSH-001
          </p>
        </div>
      )}
    </div>
  );
}

function Th({ children }: { children: string }) {
  return (
    <th className="text-left py-3 px-4 text-xs font-medium text-surface-500 uppercase tracking-wider">
      {children}
    </th>
  );
}
