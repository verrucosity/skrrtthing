import clsx from "clsx";

export function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex justify-center gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={clsx(
            "h-1.5 w-6 rounded-full transition-colors",
            i === current ? "bg-accent" : "bg-edge",
          )}
        />
      ))}
    </div>
  );
}
