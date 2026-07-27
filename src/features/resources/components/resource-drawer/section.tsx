type SectionProps = {
  title: string;
  children: React.ReactNode;
};

export function Section({ title, children }: SectionProps) {
  return (
    <div>
      <div className="text-text-3 mb-2 text-[10.5px] font-semibold tracking-wide uppercase">
        {title}
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2">{children}</dl>
    </div>
  );
}
