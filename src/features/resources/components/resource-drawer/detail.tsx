type DetailProps = { label: string; value: string };

export function Detail({ label, value }: DetailProps) {
  return (
    <div>
      <dt className="text-text-3 text-[11px]">{label}</dt>
      <dd className="text-text-2 text-[12.5px] capitalize">{value}</dd>
    </div>
  );
}
