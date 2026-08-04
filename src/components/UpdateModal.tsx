import { useState } from "react";
import { Modal } from "./ui/Modal";
import { useUpdateStore } from "../stores/updateStore";
import { downloadAndRunInstaller } from "../lib/external";

/**
 * Lives at the top level (not inside any one page) so it still shows up and
 * works even if the current page crashes. Without this, a broken Settings
 * page would leave no way to reach the update at all.
 */
export function UpdateModal() {
  const updateAvailable = useUpdateStore((s) => s.available);
  const clearUpdate = useUpdateStore((s) => s.clear);
  const [installing, setInstalling] = useState(false);
  const [installError, setInstallError] = useState<string | null>(null);

  return (
    <Modal
      open={!!updateAvailable}
      title="Update Available"
      onClose={clearUpdate}
      actions={[
        {
          label: installing ? "Installing..." : "Update Now",
          onClick: () => {
            if (!updateAvailable) return;
            setInstallError(null);
            setInstalling(true);
            void downloadAndRunInstaller(updateAvailable.downloadUrl).catch((err) => {
              setInstalling(false);
              setInstallError(typeof err === "string" ? err : String(err));
            });
          },
          variant: "primary",
        },
      ]}
    >
      <div className="space-y-3">
        <p>
          Version <span className="font-mono font-semibold">{updateAvailable?.tagName}</span> is
          available.
        </p>
        <p className="text-xs text-zinc-400">
          {installing
            ? "Downloading the update, this app will close and the installer will pick up from there."
            : "This downloads and runs the installer for you, right over the current install."}
        </p>
        {installError && <p className="text-xs text-red-400">{installError}</p>}
        {updateAvailable?.body && (
          <div className="max-h-48 overflow-y-auto rounded bg-raised p-2 text-xs text-zinc-300">
            {updateAvailable.body}
          </div>
        )}
      </div>
    </Modal>
  );
}
