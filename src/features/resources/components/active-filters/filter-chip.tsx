import { CloseIcon } from "@/shared/icons";

type FilterChipProps = {
  label: string;
  onRemove: () => void;
};

export function FilterChip({ label, onRemove }: FilterChipProps) {
  return (
    <span className="bg-surface-2 text-text-2 border-border-token inline-flex items-center gap-1.5 rounded-full border py-0.5 pr-1 pl-2.5 text-[11.5px]">
      {label}
      <button
        type="button"
        aria-label={`Remove ${label}`}
        onClick={onRemove}
        className="hover:bg-hover flex h-4 w-4 cursor-pointer items-center justify-center rounded-full"
      >
        <CloseIcon size={11} />
      </button>
    </span>
  );
}
