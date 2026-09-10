import { spawn } from "node:child_process";
import assert from "node:assert/strict";
const env = {
  ...process.env,
  NEXT_PUBLIC_SUPABASE_URL: "",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
  NEXT_TELEMETRY_DISABLED: "1",
};
// Short-lived production server for HTTP smoke tests; no browser or real account.
const server = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    "3107",
  ],
  { env, stdio: ["ignore", "pipe", "pipe"] },
);
let logs = "";
server.stdout.on("data", (b) => (logs += b));
server.stderr.on("data", (b) => (logs += b));
try {
  let ready = false;
  for (let i = 0; i < 60; i++) {
    try {
      await fetch("http://127.0.0.1:3107/setup");
      ready = true;
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 250));
    }
  }
  assert.ok(ready, logs);
  for (const route of ["/login", "/register", "/setup"]) {
    const r = await fetch("http://127.0.0.1:3107" + route);
    assert.equal(r.status, 200);
    assert.match(await r.text(), /lang="th"/);
    console.log("PASS HTTP", route);
  }
  const dashboard = await fetch("http://127.0.0.1:3107/dashboard", {
    redirect: "manual",
  });
  assert.equal(dashboard.status, 307);
  assert.equal(dashboard.headers.get("location"), "/setup");
  console.log("PASS missing configuration redirects to setup");
  const callback = await fetch("http://127.0.0.1:3107/auth/callback", {
    redirect: "manual",
  });
  assert.equal(callback.status, 307);
  assert.match(callback.headers.get("location"), /login\?error=confirmation/);
  console.log("PASS invalid auth callback redirects to login");
} finally {
  server.kill("SIGTERM");
  await new Promise((resolve) => {
    if (server.exitCode !== null) resolve();
    else server.once("exit", resolve);
  });
}
