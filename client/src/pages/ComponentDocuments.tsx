import type { ComponentDetail } from '../../../shared/types';

const typeLabel: Record<string, string> = {
  drawing: 'Drawing',
  sop: 'SOP',
  cad: 'CAD',
  control_plan: 'Control Plan',
  other: 'Other',
};

const typeColor: Record<string, string> = {
  drawing: 'bg-status-info/8 text-status-info border-status-info/20',
  sop: 'bg-status-pass/8 text-status-pass border-status-pass/20',
  cad: 'bg-status-warning/8 text-status-warning border-status-warning/20',
  control_plan: 'bg-status-fail/8 text-status-fail border-status-fail/20',
  other: 'bg-neutral-100 text-text-secondary/60 border-border-light',
};

export default function ComponentDocuments({
  detail,
}: {
  detail: ComponentDetail;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="font-heading font-semibold text-card-title text-text-primary">Documents</p>
        <button className="btn-primary text-small h-10 px-5">+ Upload Document</button>
      </div>

      {detail.documents.length === 0 ? (
        <div className="bg-surface rounded-3xl p-12 border border-border-light text-center">
          <p className="font-body text-body text-text-secondary/60 mb-4">No documents attached</p>
          <button className="btn-primary">Upload Drawing or SOP</button>
        </div>
      ) : (
        <div className="bg-surface rounded-3xl border border-border-light overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-light">
                <th className="text-left font-body text-tiny font-medium text-text-secondary uppercase tracking-wide px-5 py-3">Name</th>
                <th className="text-left font-body text-tiny font-medium text-text-secondary uppercase tracking-wide px-5 py-3">Type</th>
                <th className="text-left font-body text-tiny font-medium text-text-secondary uppercase tracking-wide px-5 py-3">Uploaded</th>
                <th className="text-right font-body text-tiny font-medium text-text-secondary uppercase tracking-wide px-5 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {detail.documents.map((doc) => (
                <tr key={doc.id} className="border-b border-border-light last:border-0">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-text-secondary shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                        <polyline points="14,2 14,8 20,8" />
                      </svg>
                      <span className="font-body text-body font-medium text-text-primary">{doc.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`font-body text-tiny font-semibold px-2 py-0.5 rounded-full border ${typeColor[doc.type] || typeColor.other}`}>
                      {typeLabel[doc.type] || doc.type}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-body text-small text-text-secondary">
                      {new Date(doc.uploaded_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button className="font-body text-small font-medium text-text-secondary hover:text-text-primary transition-colors">
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
