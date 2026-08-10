import { useRef, useState } from "react";
import { MessageCircle, Paperclip, X } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { Modal } from "./ui/Modal";
import { APP_VERSION } from "../hooks/useUpdateChecker";
import { inTauri } from "../lib/env";
import { useFeedbackStore, type Ticket } from "../stores/feedbackStore";
import { fetchFeedbackStatuses } from "../lib/feedbackStatus";

const STATUS_LABEL: Record<Ticket["status"], string> = {
  sent: "sent",
  seen: "seen",
  "in progress": "in progress",
  fixed: "fixed",
};

async function fileToBytes(file: File): Promise<number[]> {
  const buf = await file.arrayBuffer();
  return Array.from(new Uint8Array(buf));
}

export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tickets = useFeedbackStore((s) => s.tickets);
  const addTicket = useFeedbackStore((s) => s.addTicket);
  const applyStatuses = useFeedbackStore((s) => s.applyStatuses);

  function launch() {
    setOpen(true);
    void fetchFeedbackStatuses().then(applyStatuses);
  }

  function close() {
    setOpen(false);
    setMessage("");
    setImage(null);
    setSent(false);
    setError(null);
  }

  async function send() {
    if (!message.trim()) return;
    setSending(true);
    setError(null);
    const ticketId = Math.random().toString(36).slice(2, 8);
    try {
      if (inTauri) {
        const imagePayload = image
          ? { image_bytes: await fileToBytes(image), image_name: image.name }
          : {};
        await invoke("send_feedback", {
          message,
          appVersion: APP_VERSION,
          ticketId,
          ...imagePayload,
        });
      }
      addTicket({
        id: ticketId,
        preview: message.trim().slice(0, 60),
        at: new Date().toISOString(),
        status: "sent",
      });
      setSent(true);
      setMessage("");
      setImage(null);
    } catch (err) {
      setError(typeof err === "string" ? err : String(err));
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button
        onClick={launch}
        className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-zinc-400 transition-colors hover:bg-raised hover:text-zinc-200"
      >
        <MessageCircle size={16} />
        Feedback
      </button>

      <Modal
        open={open}
        title="Send Feedback"
        onClose={close}
        actions={
          sent
            ? undefined
            : [
                {
                  label: sending ? "Sending..." : "Send",
                  onClick: () => void send(),
                  variant: "primary",
                },
              ]
        }
      >
        {sent ? (
          <p className="text-emerald-400">Sent, thanks.</p>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-zinc-500">
              If a bug, or something you wanna add or change happens, hit me here hermano.
            </p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              placeholder="What's up?"
              className="w-full rounded-md border border-edge bg-ink px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-accent focus:outline-none"
            />

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setImage(e.target.files?.[0] ?? null)}
            />
            {image ? (
              <div className="flex items-center gap-2 rounded-md border border-edge bg-raised px-3 py-2 text-xs text-zinc-300">
                <Paperclip size={13} className="shrink-0 text-zinc-500" />
                <span className="flex-1 truncate">{image.name}</span>
                <button onClick={() => setImage(null)} className="text-zinc-500 hover:text-zinc-300">
                  <X size={13} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300"
              >
                <Paperclip size={13} />
                Attach a screenshot
              </button>
            )}

            {error && <p className="text-xs text-red-400">{error}</p>}

            {tickets.length > 0 && (
              <div className="border-t border-edge pt-3">
                <p className="mb-1.5 text-xs font-medium text-zinc-500">Your reports</p>
                <div className="max-h-24 space-y-1 overflow-y-auto">
                  {tickets.map((t) => (
                    <div key={t.id} className="flex items-center justify-between gap-2 text-xs">
                      <span className="truncate text-zinc-500">{t.preview || "(no text)"}</span>
                      <span className="shrink-0 text-zinc-600">{STATUS_LABEL[t.status]}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
