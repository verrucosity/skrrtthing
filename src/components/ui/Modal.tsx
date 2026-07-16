import { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "./Button";

interface ModalProps {
  open: boolean;
  title: string;
  onClose(): void;
  children: ReactNode;
  actions?: { label: string; onClick(): void; variant?: "primary" | "secondary" }[];
}

export function Modal({ open, title, onClose, children, actions }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg border border-edge bg-surface p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-100">{title}</h2>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mb-6 text-sm text-zinc-300">{children}</div>

        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Close
          </Button>
          {actions?.map((action) => (
            <Button
              key={action.label}
              variant={action.variant ?? "primary"}
              onClick={action.onClick}
              className="flex-1"
            >
              {action.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
