type LegendItem = { label: string; color: string };

export function Legend({ items }: { items: readonly LegendItem[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {items.map((item) => (
        <span
          key={item.label}
          className="text-text-2 flex items-center gap-1.5 text-[11px]"
        >
          <span
            className="h-2 w-2 flex-none rounded-[3px]"
            style={{ background: item.color }}
          />
          {item.label}
        </span>
      ))}
    </div>
  );
}
