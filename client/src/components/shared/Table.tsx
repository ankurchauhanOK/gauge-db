import { motion } from 'framer-motion';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
}

export default function Table<T extends Record<string, unknown>>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  emptyMessage = 'No data',
}: TableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-body text-text-secondary">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-3xl shadow-card overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border-light">
            {columns.map((col) => (
              <th
                key={col.key}
                className="text-left text-tiny font-body font-semibold text-text-secondary uppercase tracking-wider px-6 py-4"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <motion.tr
              key={keyExtractor(item)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25, delay: index * 0.03 }}
              className={`border-b border-border-light last:border-0 ${onRowClick ? 'cursor-pointer hover:bg-neutral-50' : ''}`}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((col) => (
                <td key={col.key} className={`px-6 py-4 text-body ${col.className || 'text-text-primary'}`}>
                  {col.render ? col.render(item) : String(item[col.key] ?? '')}
                </td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
