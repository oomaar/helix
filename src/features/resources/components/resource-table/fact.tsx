type FactProps = { label: string; value: string };

export function Fact({ label, value }: FactProps) {
  return (
    <div>
      <dt className="text-text-3 text-[10.5px] tracking-wide uppercase">
        {label}
      </dt>
      <dd className="text-text-2 capitalize">{value}</dd>
    </div>
  );
}
