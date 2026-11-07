interface Props<T extends string | number> {
  options: [T, string][];
  value: T | T[];
  onChange: (v: T) => void;
  label?: string;
  labelledBy?: string;
  className?: string;
}

export function Chips<T extends string | number>({ options, value, onChange, label, labelledBy, className }: Props<T>) {
  const on = (v: T) => (Array.isArray(value) ? value.includes(v) : value === v);
  return (
    <div className={className ? `chips ${className}` : "chips"} role="group" aria-label={label} aria-labelledby={labelledBy}>
      {options.map(([v, l]) => (
        <button key={String(v)} type="button" className="chip" aria-pressed={on(v)} onClick={() => onChange(v)}>
          {l}
        </button>
      ))}
    </div>
  );
}
