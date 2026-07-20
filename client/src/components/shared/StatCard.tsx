import { motion } from 'framer-motion';

interface StatCardProps {
  label: string;
  value: string | number;
  target?: number;
  trend?: { value: number; positive: boolean };
  subtitle?: string;
  color?: string;
}

export default function StatCard({ label, value, target, trend, subtitle, color }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="bg-surface rounded-3xl p-6 shadow-card"
    >
      <p className="text-small font-body font-medium text-text-secondary tracking-wide mb-1">
        {label}
      </p>
      <p className={`font-heading font-bold text-display leading-none ${color || 'text-text-primary'}`}>
        {value}
      </p>
      {(target !== undefined || trend || subtitle) && (
        <div className="flex items-center gap-3 mt-2">
          {target !== undefined && (
            <p className="text-small text-text-secondary">
              Target <span className="font-semibold text-text-primary">{target}</span>
            </p>
          )}
          {trend && (
            <span className={`text-small font-semibold ${trend.positive ? 'text-status-pass' : 'text-status-fail'}`}>
              {trend.positive ? '↑' : '↓'} {trend.value}%
            </span>
          )}
          {subtitle && (
            <p className="text-small text-text-secondary">{subtitle}</p>
          )}
        </div>
      )}
    </motion.div>
  );
}
