type StatProps = { label: string; value: string };

export function Stat({ label, value }: StatProps) {
  return (
    <div className="border-border-token rounded-lg border px-3 py-2">
      <div className="text-text-3 text-[10.5px] tracking-wide uppercase">
        {label}
      </div>
      <div className="text-text font-mono text-[15px] font-bold">{value}</div>
    </div>
  );
}
