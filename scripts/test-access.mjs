// Build first. All requests stay on a credential-free loopback test server.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { readdir, readFile, mkdtemp, rm } from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const files = await readdir(path.join(root, "app/api"), { recursive: true });
const endpoints = [];
for (const file of files.filter((file) => file.endsWith("route.ts"))) {
  const source = await readFile(path.join(root, "app/api", file), "utf8");
  for (const method of source.matchAll(/export async function (GET|POST)\(/g)) {
    endpoints.push({
      method: method[1],
      pathname: `/api/${file.replace(/\/?route\.ts$/, "")}`,
    });
  }
}
assert.equal(endpoints.length, 15, "Review the security test when API routes change");

const listener = net.createServer();
listener.listen(0, "127.0.0.1");
await once(listener, "listening");
const port = listener.address().port;
await new Promise((resolve) => listener.close(resolve));
const vault = await mkdtemp(path.join(os.tmpdir(), "nexus-access-test-"));
const child = spawn(process.execPath, [
  "--import", fileURLToPath(new URL("./test-block-outbound.mjs", import.meta.url)),
  "node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port),
], {
  cwd: root,
  // No real secrets or user environment are passed to this process.
  env: {
    PATH: process.env.PATH,
    NODE_ENV: "production",
    NEXT_TELEMETRY_DISABLED: "1",
    OBSIDIAN_VAULT_PATH: vault,
    GITHUB_TOKEN: "test-placeholder",
    CLAUDE_API_KEY: "sk-ant-test-placeholder",
    OPENAI_API_KEY: "test-placeholder",
    GEMINI_API_KEY: "test-placeholder",
  },
  stdio: ["ignore", "pipe", "pipe"],
});
let serverLog = "";
child.stdout.on("data", (data) => { serverLog += data; });
child.stderr.on("data", (data) => { serverLog += data; });
const base = `http://127.0.0.1:${port}`;

try {
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (child.exitCode !== null) throw new Error(`Test server exited: ${serverLog}`);
    try {
      const response = await fetch(base);
      if (response.ok) {
        assert.match(await response.text(), /funciones privadas están temporalmente pausadas/);
        ready = true;
        break;
      }
    } catch { /* server is still starting */ }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.ok(ready, `Test server did not become ready: ${serverLog}`);

  let checks = 0;
  for (const endpoint of endpoints) {
    for (const forgedIdentity of [false, true]) {
      const headers = forgedIdentity ? {
        Cookie: "session=forged; authjs.session-token=forged",
        Authorization: "Bearer forged",
        "x-vercel-id": "forged",
        "x-middleware-subrequest": "middleware:middleware:middleware:middleware:middleware",
      } : {};
      if (endpoint.method === "POST") headers["Content-Type"] = "application/json";
      const response = await fetch(base + endpoint.pathname, {
        method: endpoint.method,
        headers,
        // Deliberately invalid JSON: access must be denied before parsing it.
        body: endpoint.method === "POST" ? "{invalid" : undefined,
      });
      assert.equal(response.status, 503, `${endpoint.method} ${endpoint.pathname}`);
      assert.match(response.headers.get("cache-control"), /no-store/);
      assert.equal((await response.json()).code, "AUTH_SETUP_REQUIRED");
      checks++;
    }
  }
  assert.deepEqual(await readdir(vault), [], "No vault files may be created before authorization");
  assert.ok(!serverLog.includes("[outbound-blocked]"), "A handler attempted an external API call");
  console.log(`PASS: ${checks} anonymous/forged-identity requests denied across ${endpoints.length} handlers; dashboard notice present; no outbound calls or vault writes.`);
} finally {
  if (child.exitCode === null) {
    child.kill("SIGTERM");
    await once(child, "exit");
  }
  await rm(vault, { recursive: true, force: true });
}
