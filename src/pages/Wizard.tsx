import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, ExternalLink, Sparkles } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { CopyField } from "../components/wizard/CopyField";
import { StepDots } from "../components/wizard/StepDots";
import { useSettingsStore } from "../stores/settingsStore";
import { useConnectionStore } from "../stores/connectionStore";
import { useGoalStore } from "../stores/goalStore";
import { validateToken, missingScopes } from "../services/twitch/api";
import { testStreamlabsToken } from "../services/streamlabs/socket";
import { getSuggestedOutputPaths } from "../lib/paths";
import { openExternal } from "../lib/external";

type StepResult = { ok: boolean; message: string } | null;

const STEPS = ["welcome", "twitch", "streamlabs", "starting-point", "obs", "done"] as const;

interface WizardProps {
  onFinish(): void;
}

export function Wizard({ onFinish }: WizardProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const step = STEPS[stepIndex];

  function next() {
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  }
  function back() {
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  return (
    <div className="flex h-screen items-center justify-center bg-ink px-6">
      <div className="w-full max-w-lg">
        <div className="mb-6">
          <StepDots total={STEPS.length} current={stepIndex} />
        </div>

        <div className="rounded-lg border border-edge bg-surface p-6">
          {step === "welcome" && <WelcomeStep onNext={next} />}
          {step === "twitch" && <TwitchStep onNext={next} onBack={back} />}
          {step === "streamlabs" && <StreamlabsStep onNext={next} onBack={back} />}
          {step === "starting-point" && <StartingPointStep onNext={next} onBack={back} />}
          {step === "obs" && <ObsStep onNext={next} onBack={back} />}
          {step === "done" && <DoneStep onFinish={onFinish} onBack={back} />}
        </div>
      </div>
    </div>
  );
}

function StepShell({
  title,
  description,
  children,
  onBack,
  onNext,
  nextLabel = "Continue",
  nextDisabled = false,
  skip,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  skip?: { label: string; onClick: () => void };
}) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-zinc-100">{title}</h1>
        {description && <p className="mt-1 text-sm text-zinc-400">{description}</p>}
      </div>

      {children}

      <div className="flex items-center justify-between pt-2">
        <div>
          {onBack && (
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft size={14} />
              Back
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {skip && (
            <Button variant="ghost" onClick={skip.onClick}>
              {skip.label}
            </Button>
          )}
          <Button variant="primary" onClick={onNext} disabled={nextDisabled}>
            {nextLabel}
            <ArrowRight size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <StepShell
      title="Welcome to skrrt"
      description="This quick setup connects your Twitch and Streamlabs accounts and sets up the OBS overlay files. Takes about 2 minutes."
      onNext={onNext}
      nextLabel="Get Started"
    >
      <div className="flex items-center justify-center rounded-md bg-raised py-8">
        <Sparkles size={32} className="text-accent" />
      </div>
    </StepShell>
  );
}

function HelpLink({ href, children }: { href: string; children: string }) {
  return (
    <button
      onClick={() => openExternal(href)}
      className="inline-flex items-center gap-1 text-accent-hover hover:underline"
    >
      {children}
      <ExternalLink size={11} />
    </button>
  );
}

function TwitchStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const token = useSettingsStore((s) => s.twitchToken);
  const update = useSettingsStore((s) => s.update);
  const { connectTwitch } = useConnectionStore.getState();
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<StepResult>(null);

  async function testAndConnect() {
    setTesting(true);
    setResult(null);
    try {
      const info = await validateToken(token.trim());
      const missing = missingScopes(info);
      if (missing.length > 0) {
        setResult({ ok: false, message: `Missing scopes: ${missing.join(", ")}` });
      } else {
        setResult({ ok: true, message: `Connected as ${info.login}` });
        void connectTwitch();
      }
    } catch (err) {
      setResult({ ok: false, message: err instanceof Error ? err.message : "Failed to connect" });
    } finally {
      setTesting(false);
    }
  }

  return (
    <StepShell
      title="Connect Twitch"
      description="Paste an access token so skrrt can see bits, subs and gifts as they happen."
      onNext={onNext}
      onBack={onBack}
      nextDisabled={!result?.ok && !!token.trim() === false}
      skip={{ label: "Skip for now", onClick: onNext }}
    >
      <div className="space-y-3">
        <Input
          label="User Access Token"
          secret
          value={token}
          onChange={(e) => {
            update({ twitchToken: e.target.value });
            setResult(null);
          }}
          placeholder="Paste your token here"
        />
        <p className="text-xs text-zinc-500">
          Get one at <HelpLink href="https://twitchtokengenerator.com">twitchtokengenerator.com</HelpLink> —
          check the boxes for <code className="text-zinc-400">bits:read</code> and{" "}
          <code className="text-zinc-400">channel:read:subscriptions</code>, connect your Twitch
          account, then copy the Access Token it gives you.
        </p>
        <Button onClick={() => void testAndConnect()} busy={testing} disabled={!token.trim()}>
          Test & Connect
        </Button>
        {result && (
          <p className={result.ok ? "text-xs text-emerald-400" : "text-xs text-red-400"}>
            {result.message}
          </p>
        )}
      </div>
    </StepShell>
  );
}

function StreamlabsStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const token = useSettingsStore((s) => s.streamlabsToken);
  const update = useSettingsStore((s) => s.update);
  const { connectStreamlabs } = useConnectionStore.getState();
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<StepResult>(null);

  async function testAndConnect() {
    setTesting(true);
    setResult(null);
    try {
      await testStreamlabsToken(token.trim());
      setResult({ ok: true, message: "Connected" });
      connectStreamlabs();
    } catch (err) {
      setResult({ ok: false, message: err instanceof Error ? err.message : "Failed to connect" });
    } finally {
      setTesting(false);
    }
  }

  return (
    <StepShell
      title="Connect Streamlabs"
      description="Optional — only needed if donations should count toward the goal."
      onNext={onNext}
      onBack={onBack}
      skip={{ label: "Skip", onClick: onNext }}
    >
      <div className="space-y-3">
        <Input
          label="Socket API Token"
          secret
          value={token}
          onChange={(e) => {
            update({ streamlabsToken: e.target.value });
            setResult(null);
          }}
          placeholder="Paste your token here"
        />
        <p className="text-xs text-zinc-500">
          Found in the{" "}
          <HelpLink href="https://streamlabs.com/dashboard#/settings/api-settings">
            Streamlabs dashboard
          </HelpLink>{" "}
          under Settings → API Settings → API Tokens → Socket API Token.
        </p>
        <Button onClick={() => void testAndConnect()} busy={testing} disabled={!token.trim()}>
          Test & Connect
        </Button>
        {result && (
          <p className={result.ok ? "text-xs text-emerald-400" : "text-xs text-red-400"}>
            {result.message}
          </p>
        )}
      </div>
    </StepShell>
  );
}

function StartingPointStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const points = useGoalStore((s) => s.points);
  const setPoints = useGoalStore((s) => s.setPoints);
  const [value, setValue] = useState(String(points));

  const parsed = Number(value);
  const valid = value.trim() !== "" && Number.isFinite(parsed) && parsed >= 0;

  function applyAndNext() {
    if (valid) setPoints(parsed);
    onNext();
  }

  return (
    <StepShell
      title="Starting Point"
      description="Already have a goal in progress? Enter the current point count. Otherwise leave it at 0."
      onNext={applyAndNext}
      onBack={onBack}
      nextDisabled={!valid}
    >
      <Input
        label="Current points"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="0"
        inputMode="numeric"
      />
    </StepShell>
  );
}

function ObsStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const update = useSettingsStore((s) => s.update);
  const [paths, setPaths] = useState<{ weekly: string; saturday: string } | null>(null);

  useEffect(() => {
    void getSuggestedOutputPaths().then(setPaths);
  }, []);

  function useDefaults() {
    if (!paths) return;
    update({
      weeklyOutputEnabled: true,
      weeklyOutputPath: paths.weekly,
      saturdayOutputEnabled: true,
      saturdayOutputPath: paths.saturday,
    });
    onNext();
  }

  return (
    <StepShell
      title="OBS Text Files"
      description="skrrt writes the goal numbers to two text files. Point an OBS Text source at each one to show them on stream."
      onNext={useDefaults}
      onBack={onBack}
      nextLabel="Use These Paths"
      nextDisabled={!paths}
      skip={{ label: "Set up later", onClick: onNext }}
    >
      <div className="space-y-3">
        {paths && (
          <>
            <CopyField label="Weekly goal file (57, 114, 171...)" value={paths.weekly} />
            <CopyField label="Saturday goal file (19, 38, 57...)" value={paths.saturday} />
          </>
        )}
        <div className="rounded-md bg-raised p-3 text-xs text-zinc-400">
          <p className="mb-1 font-medium text-zinc-300">In OBS:</p>
          <ol className="list-decimal space-y-0.5 pl-4">
            <li>Sources → + → Text (GDI+) → New</li>
            <li>Check "Read from file"</li>
            <li>Browse → paste the path above</li>
            <li>Pick your font, size and color</li>
          </ol>
        </div>
      </div>
    </StepShell>
  );
}

function DoneStep({ onFinish, onBack }: { onFinish: () => void; onBack: () => void }) {
  return (
    <StepShell title="You're all set" onNext={onFinish} onBack={onBack} nextLabel="Open Dashboard">
      <p className="text-sm text-zinc-400">
        Contributions will start showing up on the Dashboard as they come in. You can revisit any
        of this in Settings at any time.
      </p>
    </StepShell>
  );
}
