import { useState } from "react";
import { Sidebar } from "./components/layout/Sidebar";
import { Dashboard } from "./pages/Dashboard";
import { EventLog } from "./pages/EventLog";
import { Statistics } from "./pages/Statistics";
import { Settings } from "./pages/Settings";
import { Wizard } from "./pages/Wizard";
import { useAppInit } from "./hooks/useAppInit";
import { useTextOutput } from "./hooks/useTextOutput";
import { useUpdateChecker } from "./hooks/useUpdateChecker";
import { useSettingsStore } from "./stores/settingsStore";
import { useWizardStore } from "./stores/wizardStore";
import type { PageId } from "./pages";

const pages: Record<PageId, () => JSX.Element> = {
  dashboard: Dashboard,
  log: EventLog,
  stats: Statistics,
  settings: Settings,
};

export default function App() {
  const ready = useAppInit();
  useTextOutput();
  useUpdateChecker();
  const [page, setPage] = useState<PageId>("dashboard");
  const onboardingComplete = useSettingsStore((s) => s.onboardingComplete);
  const updateSettings = useSettingsStore((s) => s.update);
  const wizardOpen = useWizardStore((s) => s.open);
  const hideWizard = useWizardStore((s) => s.hide);

  if (!ready) {
    return <div className="flex h-screen items-center justify-center bg-ink" />;
  }

  if (!onboardingComplete || wizardOpen) {
    return (
      <Wizard
        onFinish={() => {
          updateSettings({ onboardingComplete: true });
          hideWizard();
        }}
      />
    );
  }

  const Current = pages[page];
  return (
    <div className="flex h-screen bg-ink text-zinc-100">
      <Sidebar page={page} onNavigate={setPage} />
      <main className="flex-1 overflow-y-auto">
        <Current />
      </main>
    </div>
  );
}
