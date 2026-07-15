import { useState, useEffect } from 'react';
import { getReportsData } from '../data/service';

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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Reports</h1>
        <div className="flex gap-2">
          <button className="btn-secondary text-sm" onClick={() => alert('Export CSV placeholder')}>Export CSV</button>
          <button className="btn-secondary text-sm" onClick={() => alert('Export PDF placeholder')}>Export PDF</button>
        </div>
      </div>

      <div className="flex gap-1 bg-surface-900 rounded-lg p-1 w-fit">
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all capitalize ${
              activeTab === t ? 'bg-gauge-blue text-white' : 'text-surface-400 hover:text-surface-200'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-gauge-blue border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {activeTab === 'daily' || activeTab === 'weekly' || activeTab === 'monthly' ? (
            <div className="grid grid-cols-3 gap-4">
              {data && Object.entries(data).map(([key, val]) => (
                <div key={key} className="card">
                  <p className="stat-label">{key.replace(/_/g, ' ')}</p>
                  <p className="stat-value text-white">{String(val)}</p>
                </div>
              ))}
            </div>
          ) : activeTab === 'machine' || activeTab === 'operator' ? (
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-700">
                    <Th>{activeTab === 'machine' ? 'Machine' : 'Operator'}</Th>
                    <Th>Produced</Th>
                    <Th>Accepted</Th>
                    <Th>Rejected</Th>
                    <Th>Quality %</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-800">
                  {(data as unknown as { name: string; produced: number; accepted: number; rejected: number; quality: string }[] | undefined)?.map((row, i) => (
                    <tr key={i} className="hover:bg-surface-800/50">
                      <td className="py-3 px-4 text-sm text-surface-200">{row.name}</td>
                      <td className="py-3 px-4 text-sm text-surface-300">{row.produced}</td>
                      <td className="py-3 px-4 text-sm text-gauge-green">{row.accepted}</td>
                      <td className="py-3 px-4 text-sm text-gauge-red">{row.rejected}</td>
                      <td className="py-3 px-4 text-sm text-gauge-amber">{row.quality}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function Th({ children }: { children: string }) {
  return <th className="text-left py-3 px-4 text-xs font-medium text-surface-500 uppercase tracking-wider">{children}</th>;
}
