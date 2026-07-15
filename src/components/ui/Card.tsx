import type { ReactNode } from "react";
import clsx from "clsx";

interface CardProps {
  title?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function Card({ title, action, className, children }: CardProps) {
  return (
    <section className={clsx("rounded-lg border border-edge bg-surface", className)}>
      {(title || action) && (
        <header className="flex items-center justify-between border-b border-edge px-4 py-2.5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            {title}
          </h2>
          {action}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}
