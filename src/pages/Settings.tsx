import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { Page } from "../components/layout/Page";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { StatusDot, statusLabels } from "../components/ui/StatusDot";
import { useSettingsStore } from "../stores/settingsStore";
import { useConnectionStore } from "../stores/connectionStore";
import { useGoalStore } from "../stores/goalStore";
import { missingScopes, validateToken } from "../services/twitch/api";
import { testStreamlabsToken } from "../services/streamlabs/socket";
import { openExternal } from "../lib/external";

type TestResult = { ok: boolean; message: string } | null;

export function Settings() {
  return (
    <Page title="Settings" description="Credentials stay on this machine, in the app's data folder.">
      <div className="space-y-4">
        <TwitchSection />
        <StreamlabsSection />
        <GeneralSection />
        <DangerSection />
      </div>
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
        setResult({ ok: false, message: `Valid token for ${info.login}, but missing scopes: ${missing.join(", ")}` });
      } else {
        const hours = Math.floor(info.expires_in / 3600);
        const expiry = info.expires_in === 0 ? "never expires" : `expires in ~${hours}h`;
        setResult({ ok: true, message: `Connected as ${info.login} — all scopes present, token ${expiry}.` });
      }
    } catch (err) {
      setResult({ ok: false, message: err instanceof Error ? err.message : "Validation failed" });
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
          hint="Your channel and client ID are detected from the token automatically."
        />
        <p className="text-xs text-zinc-500">
          Need a token? Create an app in the{" "}
          <HelpLink href="https://dev.twitch.tv/console/apps">Twitch developer console</HelpLink>{" "}
          and use an OAuth flow, or use a generator like{" "}
          <HelpLink href="https://twitchtokengenerator.com">twitchtokengenerator.com</HelpLink>{" "}
          with the scopes <code className="text-zinc-400">bits:read</code> and{" "}
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
      setResult({ ok: false, message: err instanceof Error ? err.message : "Connection failed" });
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
          hint="Only needed if you count Streamlabs donations toward the goal."
        />
        <p className="text-xs text-zinc-500">
          Found in the{" "}
          <HelpLink href="https://streamlabs.com/dashboard#/settings/api-settings">
            Streamlabs dashboard
          </HelpLink>{" "}
          under Settings → API Settings → API Tokens → Socket API Token.
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

function GeneralSection() {
  const autoConnect = useSettingsStore((s) => s.autoConnect);
  const update = useSettingsStore((s) => s.update);

  return (
    <Card title="General">
      <label className="flex cursor-pointer items-center justify-between text-sm">
        <span>
          <span className="block text-zinc-200">Connect on launch</span>
          <span className="block text-xs text-zinc-500">
            Reconnect to Twitch and Streamlabs automatically when the app starts.
          </span>
        </span>
        <input
          type="checkbox"
          checked={autoConnect}
          onChange={(e) => update({ autoConnect: e.target.checked })}
          className="h-4 w-4 accent-[#9147ff]"
        />
      </label>
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
