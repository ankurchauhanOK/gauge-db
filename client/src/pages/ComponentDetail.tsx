import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getComponentDetail } from '../data/service';
import type { ComponentDetail as ComponentDetailType } from '../../../shared/types';
import ComponentInfo from './ComponentInfo';
import ComponentFlow from './ComponentFlow';
import ComponentDocuments from './ComponentDocuments';
import { motion } from 'framer-motion';

type Tab = 'info' | 'flow' | 'docs';

export default function ComponentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<ComponentDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('info');
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getComponentDetail(Number(id)).then((d) => {
      setDetail(d);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-text-primary/20 border-t-text-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="text-center py-20">
        <p className="font-body text-body text-text-secondary">Component not found</p>
        <button onClick={() => navigate('/admin/components')} className="btn-ghost mt-4">
          Back to Component Library
        </button>
      </div>
    );
  }

  const c = detail.component;
  const tabs: { key: Tab; label: string }[] = [
    { key: 'info', label: 'Information' },
    { key: 'flow', label: 'Manufacturing Flow' },
    { key: 'docs', label: 'Documents' },
  ];

  return (
    <div className="max-w-[1440px] mx-auto px-10">
      <div className="mb-8">
        <button
          onClick={() => navigate('/admin/components')}
          className="font-body text-small text-text-secondary hover:text-text-primary transition-colors mb-4 flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <polyline points="15,18 9,12 15,6" />
          </svg>
          Component Library
        </button>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-baseline gap-3 mb-1">
              <h1 className="font-heading font-semibold text-title text-text-primary">{c.part_code}</h1>
              <span className="font-body text-body text-text-secondary">· {c.description}</span>
            </div>
            <p className="font-body text-small text-text-secondary">
              Rev {c.revision} · {c.customer}
            </p>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="font-body text-small font-medium text-text-secondary hover:text-text-primary bg-surface border border-border-light rounded-xl px-4 py-2 transition-all duration-150"
            >
              Rev {c.revision} · History ▾
            </button>
            {showHistory && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 top-12 w-72 bg-surface rounded-2xl shadow-xl border border-border-light py-2 z-10"
              >
                <div className="px-4 py-2 border-b border-border-light">
                  <p className="font-body text-tiny font-semibold text-text-secondary uppercase tracking-wide">Revision History</p>
                </div>
                {detail.revisions.length === 0 ? (
                  <p className="px-4 py-3 font-body text-small text-text-secondary/60">No revisions yet</p>
                ) : (
                  detail.revisions.map((r) => (
                    <div key={r.revision} className="px-4 py-3 border-b border-border-light last:border-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-body text-tiny font-semibold bg-neutral-100 text-text-primary px-1.5 py-0.5 rounded">
                          Rev {r.revision}
                        </span>
                        <span className="font-body text-tiny text-text-secondary">{new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                      <p className="font-body text-small text-text-primary">{r.description}</p>
                      <p className="font-body text-tiny text-text-secondary mt-0.5">{r.created_by}</p>
                    </div>
                  ))
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <div className="border-b border-border-light mb-6">
        <div className="flex gap-6">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setShowHistory(false); }}
              className={`font-body text-small font-medium pb-3 border-b-2 transition-all duration-150 ${
                tab === t.key
                  ? 'border-text-primary text-text-primary'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
      >
        {tab === 'info' && <ComponentInfo detail={detail} onUpdate={setDetail} />}
        {tab === 'flow' && <ComponentFlow detail={detail} onUpdate={setDetail} />}
        {tab === 'docs' && <ComponentDocuments detail={detail} />}
      </motion.div>
    </div>
  );
}
