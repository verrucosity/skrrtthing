import type { ReactNode } from "react";

interface PageProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}

export function Page({ title, description, action, children }: PageProps) {
  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-6">
      <header className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100">{title}</h1>
          {description && <p className="mt-0.5 text-sm text-zinc-500">{description}</p>}
        </div>
        {action}
      </header>
      {children}
    </div>
  );
}
