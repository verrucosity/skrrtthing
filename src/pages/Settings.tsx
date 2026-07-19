import { useState } from "react";
import { Download, ExternalLink } from "lucide-react";
import { Page } from "../components/layout/Page";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { StatusDot, statusLabels } from "../components/ui/StatusDot";
import { useSettingsStore } from "../stores/settingsStore";
import { useConnectionStore } from "../stores/connectionStore";
import { useGoalStore } from "../stores/goalStore";
import { useTextOutputStore } from "../stores/textOutputStore";
import { useUpdateStore } from "../stores/updateStore";
import { useWizardStore } from "../stores/wizardStore";
import { missingScopes, validateToken } from "../services/twitch/api";
import { Modal } from "../components/ui/Modal";
import { testStreamlabsToken } from "../services/streamlabs/socket";
import { openExternal } from "../lib/external";
import {
  DEFAULT_WEEKLY_TEMPLATE,
  DEFAULT_SATURDAY_TEMPLATE,
  renderWeeklyText,
  renderSaturdayText,
} from "../lib/textOutput";
import { formatTime } from "../lib/format";
import { isInSaturdayWindow } from "../lib/weeklyWindow";
import { APP_VERSION, checkForUpdatesVerbose } from "../hooks/useUpdateChecker";

type TestResult = { ok: boolean; message: string } | null;

export function Settings() {
  const updateAvailable = useUpdateStore((s) => s.available);
  const updateChecking = useUpdateStore((s) => s.checking);
  const updateError = useUpdateStore((s) => s.error);
  const clearUpdate = useUpdateStore((s) => s.clear);

  return (
    <Page title="Settings" description="Your credentials stay right here on this machine, in the app's data folder.">
      <div className="space-y-4">
        <TwitchSection />
        <StreamlabsSection />
        <StartingPointSection />
        <WeeklyOutputSection />
        <SaturdayOutputSection />
        <GeneralSection />
        <TestEventsSection />
        <UpdateSection
          checking={updateChecking}
          error={updateError}
          onCheck={() => void checkForUpdatesVerbose()}
        />
        <DangerSection />
      </div>

      <Modal
        open={!!updateAvailable}
        title="Update Available"
        onClose={clearUpdate}
        actions={[
          {
            label: "Download",
            onClick: () => {
              if (updateAvailable) openExternal(updateAvailable.downloadUrl);
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
            Grab the new .msi installer and run it, that's all it takes to update.
          </p>
          {updateAvailable?.body && (
            <div className="max-h-48 overflow-y-auto rounded bg-raised p-2 text-xs text-zinc-300">
              {updateAvailable.body}
            </div>
          )}
        </div>
      </Modal>
    </Page>
  );
}

function SectionStatus({ service }: { service: "twitch" | "streamlabs" }) {
  const state = useConnectionStore((s) => s[service]);
  return (
    <span className="flex items-center gap-2 text-xs text-zinc-400">
      <StatusDot status={state.status} />
      {statusLabels[state.status]}
    </span>
  );
}

function TestMessage({ result }: { result: TestResult }) {
  if (!result) return null;
  return (
    <p className={result.ok ? "text-xs text-emerald-400" : "text-xs text-red-400"}>
      {result.message}
    </p>
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

function TwitchSection() {
  const token = useSettingsStore((s) => s.twitchToken);
  const update = useSettingsStore((s) => s.update);
  const twitch = useConnectionStore((s) => s.twitch);
  const { connectTwitch, disconnectTwitch } = useConnectionStore.getState();
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<TestResult>(null);

  const connected = twitch.status === "connected" || twitch.status === "connecting";

  async function runTest() {
    setTesting(true);
    setResult(null);
    try {
      const info = await validateToken(token.trim());
      const missing = missingScopes(info);
      if (missing.length > 0) {
        setResult({
          ok: false,
          message: `Valid token for ${info.login}, but missing scopes: ${missing.join(", ")}`,
        });
      } else {
        const hours = Math.floor(info.expires_in / 3600);
        const expiry = info.expires_in === 0 ? "never expires" : `expires in ~${hours}h`;
        setResult({
          ok: true,
          message: `Connected as ${info.login}, got all the right scopes, token ${expiry}.`,
        });
      }
    } catch (err) {
      setResult({
        ok: false,
        message: err instanceof Error ? err.message : "Validation failed",
      });
    } finally {
      setTesting(false);
    }
  }

  return (
    <Card title="Twitch" action={<SectionStatus service="twitch" />}>
      <div className="space-y-4">
        <Input
          label="User Access Token"
          secret
          value={token}
          onChange={(e) => update({ twitchToken: e.target.value })}
          placeholder="Paste a token with bits:read and channel:read:subscriptions"
          hint="We'll figure out your channel and client ID from the token automatically."
        />
        <p className="text-xs text-zinc-500">
          Need a token? You can create an app in the{" "}
          <HelpLink href="https://dev.twitch.tv/console/apps">
            Twitch developer console
          </HelpLink>{" "}
          and run an OAuth flow, or just use a generator like{" "}
          <HelpLink href="https://twitchtokengenerator.com">twitchtokengenerator.com</HelpLink>{" "}
          and check the scopes <code className="text-zinc-400">bits:read</code> and{" "}
          <code className="text-zinc-400">channel:read:subscriptions</code>.
        </p>
        <div className="flex items-center gap-2">
          {connected ? (
            <Button variant="secondary" onClick={disconnectTwitch}>
              Disconnect
            </Button>
          ) : (
            <Button variant="primary" onClick={() => void connectTwitch()} disabled={!token.trim()}>
              Connect
            </Button>
          )}
          <Button onClick={() => void runTest()} busy={testing} disabled={!token.trim()}>
            Test Connection
          </Button>
        </div>
        <TestMessage result={result} />
        {twitch.status === "error" && twitch.error && (
          <p className="text-xs text-red-400">{twitch.error}</p>
        )}
      </div>
    </Card>
  );
}

function StreamlabsSection() {
  const token = useSettingsStore((s) => s.streamlabsToken);
  const update = useSettingsStore((s) => s.update);
  const streamlabs = useConnectionStore((s) => s.streamlabs);
  const { connectStreamlabs, disconnectStreamlabs } = useConnectionStore.getState();
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<TestResult>(null);

  const connected = streamlabs.status === "connected" || streamlabs.status === "connecting";

  async function runTest() {
    setTesting(true);
    setResult(null);
    try {
      await testStreamlabsToken(token.trim());
      setResult({ ok: true, message: "Socket connection succeeded." });
    } catch (err) {
      setResult({
        ok: false,
        message: err instanceof Error ? err.message : "Connection failed",
      });
    } finally {
      setTesting(false);
    }
  }

  return (
    <Card title="Streamlabs" action={<SectionStatus service="streamlabs" />}>
      <div className="space-y-4">
        <Input
          label="Socket API Token"
          secret
          value={token}
          onChange={(e) => update({ streamlabsToken: e.target.value })}
          placeholder="Paste your Streamlabs socket token"
          hint="Only needed if you want donations to count toward the goal."
        />
        <p className="text-xs text-zinc-500">
          You'll find it in the{" "}
          <HelpLink href="https://streamlabs.com/dashboard#/settings/api-settings">
            Streamlabs dashboard
          </HelpLink>
          , under Settings, then API Settings, then API Tokens, then Socket API Token.
        </p>
        <div className="flex items-center gap-2">
          {connected ? (
            <Button variant="secondary" onClick={disconnectStreamlabs}>
              Disconnect
            </Button>
          ) : (
            <Button variant="primary" onClick={connectStreamlabs} disabled={!token.trim()}>
              Connect
            </Button>
          )}
          <Button onClick={() => void runTest()} busy={testing} disabled={!token.trim()}>
            Test Connection
          </Button>
        </div>
        <TestMessage result={result} />
        {streamlabs.status === "error" && streamlabs.error && (
          <p className="text-xs text-red-400">{streamlabs.error}</p>
        )}
      </div>
    </Card>
  );
}

function StartingPointSection() {
  const points = useGoalStore((s) => s.points);
  const setPoints = useGoalStore((s) => s.setPoints);
  const [value, setValue] = useState(String(points));
  const [saved, setSaved] = useState(false);

  const parsed = Number(value);
  const valid = value.trim() !== "" && Number.isFinite(parsed) && parsed >= 0;

  function apply() {
    if (!valid) return;
    setPoints(parsed);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <Card title="Starting Point">
      <div className="space-y-4">
        <p className="text-xs text-zinc-500">
          Already have a goal going on Twitch? Set the counter to match instead of starting from
          zero. This just moves the counter directly, it won't touch your bits, subs or donation
          totals, and it shows up in the log as a manual adjustment.
        </p>
        <div className="flex items-end gap-2">
          <Input
            label="Current points"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setSaved(false);
            }}
            placeholder="0"
            inputMode="numeric"
          />
          <Button onClick={apply} disabled={!valid || parsed === points} variant="primary">
            Set
          </Button>
        </div>
        <p className="text-xs text-zinc-500">
          You're currently at <span className="font-mono text-zinc-300">{points}</span> points.
        </p>
        {saved && <p className="text-xs text-emerald-400">Counter updated.</p>}
      </div>
    </Card>
  );
}

function WeeklyOutputSection() {
  const enabled = useSettingsStore((s) => s.weeklyOutputEnabled);
  const path = useSettingsStore((s) => s.weeklyOutputPath);
  const template = useSettingsStore((s) => s.weeklyOutputTemplate);
  const update = useSettingsStore((s) => s.update);
  const points = useGoalStore((s) => s.points);
  const lastWriteAt = useTextOutputStore((s) => s.weeklyLastWriteAt);
  const writeError = useTextOutputStore((s) => s.weeklyError);

  return (
    <Card
      title="Weekly Goal Output"
      action={
        <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-400">
          Enabled
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => update({ weeklyOutputEnabled: e.target.checked })}
            className="h-4 w-4 accent-[#9147ff]"
          />
        </label>
      }
    >
      <div className="space-y-4">
        <p className="text-xs text-zinc-500">
          This writes the weekly goal (57, 114, 171 and so on) to a text file every time it
          changes. In OBS, add a <span className="text-zinc-400">Text (GDI+)</span> source, turn
          on <span className="text-zinc-400">Read from file</span>, and point it at this file.
        </p>
        <Input
          label="Output file"
          value={path}
          onChange={(e) => update({ weeklyOutputPath: e.target.value })}
          placeholder="C:\Users\you\Documents\skrrt-weekly.txt"
        />
        <Input
          label="Format"
          value={template}
          onChange={(e) => update({ weeklyOutputTemplate: e.target.value })}
          placeholder={DEFAULT_WEEKLY_TEMPLATE}
          hint="Placeholders: {current}, {current_decimal}, {target}, {remaining}"
        />
        <p className="text-xs text-zinc-500">
          Preview: <span className="font-mono text-zinc-300">{renderWeeklyText(points, template)}</span>
        </p>
        {enabled && writeError && <p className="text-xs text-red-400">{writeError}</p>}
        {enabled && !writeError && lastWriteAt && (
          <p className="text-xs text-emerald-400">Last written {formatTime(lastWriteAt)}</p>
        )}
      </div>
    </Card>
  );
}

function SaturdayOutputSection() {
  const enabled = useSettingsStore((s) => s.saturdayOutputEnabled);
  const path = useSettingsStore((s) => s.saturdayOutputPath);
  const template = useSettingsStore((s) => s.saturdayOutputTemplate);
  const update = useSettingsStore((s) => s.update);
  const points = useGoalStore((s) => s.points);
  const lastWriteAt = useTextOutputStore((s) => s.saturdayLastWriteAt);
  const writeError = useTextOutputStore((s) => s.saturdayError);
  const inWindow = isInSaturdayWindow();

  return (
    <Card
      title="Saturday Goal Output"
      action={
        <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-400">
          Enabled
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => update({ saturdayOutputEnabled: e.target.checked })}
            className="h-4 w-4 accent-[#9147ff]"
          />
        </label>
      }
    >
      <div className="space-y-4">
        <p className="text-xs text-zinc-500">
          This one only writes during the Saturday 8pm to Sunday 7:59pm PT window. Outside of
          that, the file just sits there untouched.
        </p>
        <Input
          label="Output file"
          value={path}
          onChange={(e) => update({ saturdayOutputPath: e.target.value })}
          placeholder="C:\Users\you\Documents\skrrt-saturday.txt"
        />
        <Input
          label="Format"
          value={template}
          onChange={(e) => update({ saturdayOutputTemplate: e.target.value })}
          placeholder={DEFAULT_SATURDAY_TEMPLATE}
          hint="Placeholders: {current}, {target}, {stars}"
        />
        <p className="text-xs text-zinc-500">
          Preview: <span className="font-mono text-zinc-300">{renderSaturdayText(points, template)}</span>
          {inWindow && <span className="ml-2 text-emerald-400">(active now)</span>}
          {!inWindow && <span className="ml-2 text-zinc-600">(inactive until Sat 8pm PT)</span>}
        </p>
        {enabled && writeError && <p className="text-xs text-red-400">{writeError}</p>}
        {enabled && !writeError && lastWriteAt && (
          <p className="text-xs text-emerald-400">Last written {formatTime(lastWriteAt)}</p>
        )}
      </div>
    </Card>
  );
}

function UpdateSection({
  checking,
  error,
  onCheck,
}: {
  checking: boolean;
  error: string | null;
  onCheck(): void;
}) {
  return (
    <Card
      title="Updates"
      action={<span className="text-xs text-zinc-500">v{APP_VERSION}</span>}
    >
      <div className="space-y-3">
        <p className="text-xs text-zinc-500">This checks GitHub for a newer version.</p>
        <Button onClick={onCheck} busy={checking} variant="secondary" className="w-full">
          <Download size={14} />
          Check for Updates
        </Button>
        {error && <p className="text-xs text-amber-400">{error}</p>}
      </div>
    </Card>
  );
}

function GeneralSection() {
  const autoConnect = useSettingsStore((s) => s.autoConnect);
  const update = useSettingsStore((s) => s.update);
  const showWizard = useWizardStore((s) => s.show);

  return (
    <Card title="General">
      <div className="space-y-4">
        <label className="flex cursor-pointer items-center justify-between text-sm">
          <span>
            <span className="block text-zinc-200">Connect on launch</span>
            <span className="block text-xs text-zinc-500">
              This reconnects to Twitch and Streamlabs automatically every time the app opens.
            </span>
          </span>
          <input
            type="checkbox"
            checked={autoConnect}
            onChange={(e) => update({ autoConnect: e.target.checked })}
            className="h-4 w-4 accent-[#9147ff]"
          />
        </label>
        <div className="flex items-center justify-between border-t border-edge pt-4">
          <span>
            <span className="block text-sm text-zinc-200">Setup wizard</span>
            <span className="block text-xs text-zinc-500">
              Want to go through the guided setup again for Twitch, Streamlabs or OBS? Run it
              anytime.
            </span>
          </span>
          <Button variant="secondary" onClick={showWizard}>
            Run Setup Wizard
          </Button>
        </div>
      </div>
    </Card>
  );
}

function TestEventsSection() {
  const addBits = useGoalStore((s) => s.addBits);
  const addSub = useGoalStore((s) => s.addSub);
  const addGiftSubs = useGoalStore((s) => s.addGiftSubs);
  const addDonation = useGoalStore((s) => s.addDonation);
  const [fired, setFired] = useState<string | null>(null);

  function fire(label: string, action: () => void) {
    action();
    setFired(label);
    setTimeout(() => setFired(null), 1500);
  }

  const tests: Array<{ label: string; onClick: () => void }> = [
    { label: "100 Bits (+0.17)", onClick: () => addBits(100, { user: "test_user" }) },
    { label: "150 Bits (+0.25)", onClick: () => addBits(150, { user: "test_user" }) },
    { label: "300 Bits (+0.50)", onClick: () => addBits(300, { user: "test_user" }) },
    { label: "450 Bits (+0.75)", onClick: () => addBits(450, { user: "test_user" }) },
    { label: "600 Bits (+1)", onClick: () => addBits(600, { user: "test_user" }) },
    { label: "Tier 1 Sub (+1)", onClick: () => addSub("1000", { user: "test_user" }) },
    { label: "Tier 2 Sub (+2)", onClick: () => addSub("2000", { user: "test_user" }) },
    { label: "Tier 3 Sub (+6)", onClick: () => addSub("3000", { user: "test_user" }) },
    {
      label: "5x Gifted Tier 1 (+5)",
      onClick: () => addGiftSubs("1000", 5, { user: "test_user" }),
    },
    { label: "$6 Donation (+1)", onClick: () => addDonation(600, { user: "test_user" }) },
  ];

  return (
    <Card title="Test Events">
      <div className="space-y-3">
        <p className="text-xs text-zinc-500">
          Fire off some fake contributions to check that the counter, Event Log and OBS text
          files are all updating right. No real bits, subs or money involved.
        </p>
        <p className="text-xs text-zinc-500">
          Every bit counts right away, so 100 bits shows up as +0.17 immediately, no waiting
          around for a full point.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {tests.map((t) => (
            <Button key={t.label} variant="secondary" onClick={() => fire(t.label, t.onClick)}>
              {t.label}
            </Button>
          ))}
        </div>
        {fired && <p className="text-xs text-emerald-400">Sent: {fired}</p>}
      </div>
    </Card>
  );
}

function DangerSection() {
  const resetEverything = useGoalStore((s) => s.resetEverything);
  const [confirming, setConfirming] = useState(false);

  return (
    <Card title="Danger Zone">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-zinc-500">
          Wipe the counter, statistics, weekly history and event log. Settings are kept.
        </p>
        <Button
          variant="danger"
          onClick={() => {
            if (confirming) {
              resetEverything();
              setConfirming(false);
            } else {
              setConfirming(true);
              setTimeout(() => setConfirming(false), 3000);
            }
          }}
        >
          {confirming ? "Really reset?" : "Reset progress"}
        </Button>
      </div>
    </Card>
  );
}
