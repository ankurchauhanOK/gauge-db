import { useState, useEffect } from 'react';
import { getReportsData } from '../data/service';

const tabs = ['daily', 'weekly', 'monthly'] as const;

export default function SupervisorReports() {
  const [activeTab, setActiveTab] = useState<string>('daily');
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getReportsData(activeTab).then(d => { setData(d as Record<string, unknown>); setLoading(false); });
  }, [activeTab]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">Reports</h1>

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
        <div className="grid grid-cols-3 gap-4">
          {data && Object.entries(data).map(([key, val]) => (
            <div key={key} className="card">
              <p className="stat-label">{key.replace(/_/g, ' ')}</p>
              <p className="stat-value text-white">{String(val)}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <button className="btn-secondary text-sm" onClick={() => alert('Export CSV placeholder')}>Export CSV</button>
        <button className="btn-secondary text-sm" onClick={() => alert('Export PDF placeholder')}>Export PDF</button>
      </div>
    </div>
  );
}
