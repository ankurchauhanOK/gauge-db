import { useState, type FormEvent } from 'react';
import { getOperatorSearch } from '../data/service';
import type { ProductionRecord } from '../../../shared/types';
import PageHeader from '../components/shared/PageHeader';
import SearchInput from '../components/shared/SearchInput';
import StatusBadge from '../components/shared/StatusBadge';
import { motion } from 'framer-motion';

const statusMap: Record<string, 'PASS' | 'FAIL' | 'WARNING' | 'INFO'> = {
  accepted: 'PASS',
  rejected: 'FAIL',
  in_progress: 'WARNING',
  qr_marked: 'INFO',
  completed: 'PASS',
};

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

  return (
    <div>
      <PageHeader title="Search Component" subtitle="Find components by serial number or part code" />

      <form onSubmit={handleSearch} className="flex gap-3 mb-8 max-w-xl">
        <div className="flex-1">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search by Serial Number, Part Code..."
          />
        </div>
        <button type="submit" className="btn-primary px-8" disabled={loading || !query.trim()}>
          {loading ? (
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
          ) : 'Search'}
        </button>
      </form>

      {searched && !loading && results.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-surface rounded-3xl p-10 shadow-card text-center max-w-lg">
          <p className="font-body text-section text-text-secondary">No components found</p>
          <p className="font-body text-body text-text-secondary mt-1">Try a different search term</p>
        </motion.div>
      )}

      {results.length > 0 && (
        <div className="bg-surface rounded-3xl shadow-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-light">
                <th className="text-left text-tiny font-body font-semibold text-text-secondary uppercase tracking-wider px-6 py-4">Serial Number</th>
                <th className="text-left text-tiny font-body font-semibold text-text-secondary uppercase tracking-wider px-6 py-4">Part Code</th>
                <th className="text-left text-tiny font-body font-semibold text-text-secondary uppercase tracking-wider px-6 py-4">Date</th>
                <th className="text-left text-tiny font-body font-semibold text-text-secondary uppercase tracking-wider px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {results.map((r) => (
                <tr key={r.id} className="hover:bg-neutral-50 transition-all duration-150">
                  <td className="px-6 py-4 font-mono text-body font-medium text-text-primary">{r.serial_number}</td>
                  <td className="px-6 py-4 font-body text-body text-text-primary">{r.part_code}</td>
                  <td className="px-6 py-4 font-body text-body text-text-secondary">
                    {new Date(r.started_at).toLocaleDateString('en-GB')}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={statusMap[r.status] || 'WARNING'} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!searched && (
        <div className="bg-surface rounded-3xl p-10 shadow-card text-center max-w-lg">
          <p className="font-body text-section text-text-secondary">Enter a serial number or part code to search</p>
          <p className="font-body text-body text-text-secondary mt-2">e.g. SB2507140001 or BUSH-001</p>
        </div>
      )}
    </div>
  );
}
