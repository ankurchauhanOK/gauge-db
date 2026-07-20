import { useState, useEffect } from 'react';
import { getSettings, saveSettings } from '../data/service';
import PageHeader from '../components/shared/PageHeader';
import { motion } from 'framer-motion';

export default function Settings() {
  const [settings, setSettings] = useState<Record<string, Record<string, unknown>> | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { getSettings().then(setSettings); }, []);

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    await saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setSaving(false);
  }

  function updateSection(section: string, key: string, value: unknown) {
    if (!settings) return;
    setSettings(s => ({
      ...s,
      [section]: { ...(s as Record<string, Record<string, unknown>>)[section], [key]: value },
    }));
  }

  if (!settings) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-text-primary/20 border-t-text-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Settings"
        subtitle="System configuration"
        action={
          <button onClick={handleSave} className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : saved ? 'Saved' : 'Save Changes'}
          </button>
        }
      />

      <div className="space-y-6">
        <Section title="Company Information">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Company Name" value={settings.company.name as string} onChange={v => updateSection('company', 'name', v)} />
            <Field label="Phone" value={settings.company.phone as string} onChange={v => updateSection('company', 'phone', v)} />
            <Field label="Address" value={settings.company.address as string} onChange={v => updateSection('company', 'address', v)} />
            <Field label="City" value={settings.company.city as string} onChange={v => updateSection('company', 'city', v)} />
            <Field label="Country" value={settings.company.country as string} onChange={v => updateSection('company', 'country', v)} />
          </div>
        </Section>

        <Section title="Shift Timing">
          <div className="grid grid-cols-3 gap-4">
            <Field label="Morning Shift" value={settings.shift.morning as string} onChange={v => updateSection('shift', 'morning', v)} />
            <Field label="Afternoon Shift" value={settings.shift.afternoon as string} onChange={v => updateSection('shift', 'afternoon', v)} />
            <Field label="Night Shift" value={settings.shift.night as string} onChange={v => updateSection('shift', 'night', v)} />
          </div>
        </Section>

        <Section title="Serial Number Format">
          <div className="grid grid-cols-3 gap-4">
            <Field label="Prefix" value={settings.serial_format.prefix as string} onChange={v => updateSection('serial_format', 'prefix', v)} />
            <div>
              <label className="label">Include Date</label>
              <select className="input" value={String(settings.serial_format.include_date)} onChange={e => updateSection('serial_format', 'include_date', e.target.value === 'true')}>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
            <Field label="Digits" value={String(settings.serial_format.digits)} onChange={v => updateSection('serial_format', 'digits', parseInt(v) || 4)} />
          </div>
        </Section>

        <Section title="QR Code Settings">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Format" value={settings.qr.format as string} onChange={v => updateSection('qr', 'format', v)} />
            <Field label="Size" value={settings.qr.size as string} onChange={v => updateSection('qr', 'size', v)} />
            <div className="col-span-2">
              <label className="label">Content Format</label>
              <textarea className="input min-h-[80px] py-3 font-mono text-body" value={settings.qr.content as string} onChange={e => updateSection('qr', 'content', e.target.value)} />
            </div>
          </div>
        </Section>

        <Section title="Backup">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Auto Backup</label>
              <select className="input" value={String(settings.backup.auto_backup)} onChange={e => updateSection('backup', 'auto_backup', e.target.value === 'true')}>
                <option value="true">Enabled</option>
                <option value="false">Disabled</option>
              </select>
            </div>
            <Field label="Backup Time" value={settings.backup.backup_time as string} onChange={v => updateSection('backup', 'backup_time', v)} />
            <Field label="Retention (days)" value={String(settings.backup.retention_days)} onChange={v => updateSection('backup', 'retention_days', parseInt(v) || 30)} />
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface rounded-3xl p-6 shadow-card"
    >
      <h3 className="font-heading font-semibold text-card-title text-text-primary mb-5 pb-3 border-b border-border-light">
        {title}
      </h3>
      {children}
    </motion.div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input className="input" value={value} onChange={e => onChange(e.target.value)} />
    </div>
  );
}
