import { useId, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import clsx from "clsx";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  /** Masks the value and adds a reveal toggle, for tokens and keys. */
  secret?: boolean;
}

export function Input({ label, hint, secret = false, className, ...rest }: InputProps) {
  const id = useId();
  const [revealed, setRevealed] = useState(false);

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-zinc-300">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={secret && !revealed ? "password" : "text"}
          spellCheck={false}
          autoComplete="off"
          className={clsx(
            "w-full rounded-md border border-edge bg-ink px-3 py-2 text-sm text-zinc-100",
            "placeholder:text-zinc-600 focus:border-accent focus:outline-none",
            secret && "pr-10 font-mono",
          )}
          {...rest}
        />
        {secret && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setRevealed((v) => !v)}
            className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-zinc-500 hover:text-zinc-300"
            aria-label={revealed ? "Hide value" : "Show value"}
          >
            {revealed ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
      {hint && <p className="mt-1.5 text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}
