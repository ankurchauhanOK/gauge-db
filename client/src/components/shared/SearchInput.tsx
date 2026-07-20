interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
}: SearchInputProps) {
  return (
    <div className="relative">
      <svg
        className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/50"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-surface border border-border rounded-2xl pl-12 pr-5 h-12
          text-body text-text-primary placeholder:text-text-secondary/40
          focus:outline-none focus:border-text-primary/30 focus:ring-1 focus:ring-text-primary/10
          transition-apple duration-apple ease-apple"
      />
    </div>
  );
}
