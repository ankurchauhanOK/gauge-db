import { useState, useEffect } from 'react';
import { getReportsData } from '../data/service';
import PageHeader from '../components/shared/PageHeader';
import StatCard from '../components/shared/StatCard';

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
    <div>
      <PageHeader
        title="Reports"
        subtitle="Production performance overview"
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
        <div className="grid grid-cols-3 gap-5">
          {data && Object.entries(data).map(([key, val]) => (
            <StatCard
              key={key}
              label={key.replace(/_/g, ' ')}
              value={String(val)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
