interface StatusBadgeProps {
  status: 'PASS' | 'FAIL' | 'WARNING' | 'INFO' | 'OFFLINE' | string;
  size?: 'sm' | 'md';
  showDot?: boolean;
}

const statusConfig: Record<string, { dot: string; text: string; bg: string }> = {
  PASS: {
    dot: 'bg-status-pass',
    text: 'text-status-pass',
    bg: 'bg-status-pass/8',
  },
  FAIL: {
    dot: 'bg-status-fail',
    text: 'text-status-fail',
    bg: 'bg-status-fail/8',
  },
  WARNING: {
    dot: 'bg-status-warning',
    text: 'text-status-warning',
    bg: 'bg-status-warning/8',
  },
  INFO: {
    dot: 'bg-status-info',
    text: 'text-status-info',
    bg: 'bg-status-info/8',
  },
  OFFLINE: {
    dot: 'bg-status-offline',
    text: 'text-status-offline',
    bg: 'bg-status-offline/8',
  },
};

export default function StatusBadge({ status, size = 'md', showDot = true }: StatusBadgeProps) {
  const config = statusConfig[status.toUpperCase()] || statusConfig.INFO;
  const sizeClasses = size === 'sm' ? 'px-2.5 py-0.5 text-tiny' : 'px-3 py-1 text-small';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${config.bg} ${config.text} ${sizeClasses}`}>
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />}
      {status}
    </span>
  );
}
