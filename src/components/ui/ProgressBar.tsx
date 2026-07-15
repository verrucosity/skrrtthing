interface ProgressBarProps {
  /** 0..1 */
  ratio: number;
}

export function ProgressBar({ ratio }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, ratio * 100));
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-raised">
      <div
        className="h-full rounded-full bg-accent transition-[width] duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
