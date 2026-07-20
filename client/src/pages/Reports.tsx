import { useState, useEffect } from 'react';
import { getReportsData } from '../data/service';
import PageHeader from '../components/shared/PageHeader';
import StatCard from '../components/shared/StatCard';

const tabs = ['daily', 'weekly', 'monthly', 'machine', 'operator'] as const;

export default function Reports() {
  const [activeTab, setActiveTab] = useState<string>('daily');
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getReportsData(activeTab).then(d => { setData(d as Record<string, unknown>); setLoading(false); });
  }, [activeTab]);

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Production performance analytics"
        action={
          <div className="flex gap-2">
            <button className="btn-secondary text-small" onClick={() => alert('Export CSV placeholder')}>Export CSV</button>
            <button className="btn-secondary text-small" onClick={() => alert('Export PDF placeholder')}>Export PDF</button>
          </div>
        }
      />

      <div className="flex gap-1 bg-neutral-100 rounded-2xl p-1 w-fit mb-6">
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2 rounded-xl font-body text-small font-medium transition-all capitalize ${
              activeTab === t ? 'bg-surface text-text-primary shadow-soft' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-text-primary/20 border-t-text-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div>
          {(activeTab === 'daily' || activeTab === 'weekly' || activeTab === 'monthly') && data && (
            <div className="grid grid-cols-3 gap-5">
              {Object.entries(data).map(([key, val]) => (
                <StatCard
                  key={key}
                  label={key.replace(/_/g, ' ')}
                  value={String(val)}
                />
              ))}
            </div>
          )}

          {(activeTab === 'machine' || activeTab === 'operator') && (
            <div className="bg-surface rounded-3xl shadow-card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-light">
                    <th className="text-left text-tiny font-body font-semibold text-text-secondary uppercase tracking-wider px-6 py-4">
                      {activeTab === 'machine' ? 'Machine' : 'Operator'}
                    </th>
                    <th className="text-left text-tiny font-body font-semibold text-text-secondary uppercase tracking-wider px-6 py-4">Produced</th>
                    <th className="text-left text-tiny font-body font-semibold text-text-secondary uppercase tracking-wider px-6 py-4">Accepted</th>
                    <th className="text-left text-tiny font-body font-semibold text-text-secondary uppercase tracking-wider px-6 py-4">Rejected</th>
                    <th className="text-left text-tiny font-body font-semibold text-text-secondary uppercase tracking-wider px-6 py-4">Quality %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light">
                  {(data as unknown as { name: string; produced: number; accepted: number; rejected: number; quality: string }[] | undefined)?.map((row, i) => (
                    <tr key={i} className="hover:bg-neutral-50 transition-all duration-150">
                      <td className="px-6 py-4 font-body text-body font-medium text-text-primary">{row.name}</td>
                      <td className="px-6 py-4 font-body text-body text-text-primary">{row.produced}</td>
                      <td className="px-6 py-4 font-body text-body text-status-pass">{row.accepted}</td>
                      <td className="px-6 py-4 font-body text-body text-status-fail">{row.rejected}</td>
                      <td className="px-6 py-4 font-body text-body text-status-warning">{row.quality}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
