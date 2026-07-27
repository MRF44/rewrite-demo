import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { access, readFile } from "node:fs/promises";
import { createServer } from "node:net";
import test from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";

const templateRoot = new URL("../", import.meta.url);
const projectRoot = fileURLToPath(templateRoot);

async function availablePort() {
  const listener = createServer();
  listener.unref();
  await new Promise((resolve, reject) => {
    listener.once("error", reject);
    listener.listen(0, "127.0.0.1", resolve);
  });
  const address = listener.address();
  assert(address && typeof address !== "string");
  await new Promise((resolve, reject) => {
    listener.close((error) => (error ? reject(error) : resolve()));
  });
  return address.port;
}

async function render() {
  const port = await availablePort();
  const nextBin = fileURLToPath(
    new URL("../node_modules/next/dist/bin/next", import.meta.url),
  );
  const server = spawn(
    process.execPath,
    [nextBin, "start", "--hostname", "127.0.0.1", "--port", String(port)],
    {
      cwd: projectRoot,
      env: { ...process.env, NODE_ENV: "production" },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  let output = "";
  server.stdout.on("data", (chunk) => {
    output += chunk;
  });
  server.stderr.on("data", (chunk) => {
    output += chunk;
  });
  server.on("error", (error) => {
    output += error.stack ?? error.message;
  });

  try {
    for (let attempt = 0; attempt < 100; attempt += 1) {
      if (server.exitCode !== null) {
        throw new Error(`Next.js exited before serving the page:\n${output}`);
      }
      try {
        const response = await fetch(`http://127.0.0.1:${port}/`, {
          headers: { accept: "text/html" },
        });
        const body = await response.arrayBuffer();
        return new Response(body, {
          headers: response.headers,
          status: response.status,
        });
      } catch {
        await delay(100);
      }
    }
    throw new Error(`Timed out waiting for Next.js:\n${output}`);
  } finally {
    if (server.exitCode === null) {
      const exited = once(server, "exit");
      server.kill();
      await Promise.race([exited, delay(5_000)]);
    }
  }
}

test("server-renders the complete Rewrite product case", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Rewrite — Change one decision<\/title>/i);
  assert.match(html, /Change one decision\./);
  assert.match(html, /Selected old decision/);
  assert.match(html, /RevSync is planning-only for every supported country/);
  assert.match(html, /Classify what the rewrite touches/);
  assert.match(html, /Before vs After/);
  assert.match(html, /The rewrite, accounted for/);
  assert.match(html, /Preserve the record\. Remove the claim\./);
  assert.match(html, /Before\/work\/qa-screenshots\/light-tax-actual-vs-estimated\.png/);
  assert.match(html, /After\/work\/qa-screenshots\/planning-en\.png/);
  assert.doesNotMatch(html, /codex-preview|Building your site|SkeletonPreview/);
});

test("ships product assets and removes the disposable starter", async () => {
  const [page, layout, packageJson, hosting] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../.openai/hosting.json", import.meta.url), "utf8"),
  ]);

  await Promise.all([
    access(new URL("../public/og.png", import.meta.url)),
    access(new URL("../public/evidence/before-tax-obligations.png", import.meta.url)),
    access(new URL("../public/evidence/after-planning-only.png", import.meta.url)),
  ]);
  await assert.rejects(
    access(new URL("../app/_sites-preview/SkeletonPreview.tsx", import.meta.url)),
  );

  assert.match(
    page,
    /localStorage\.setItem\(\s*"rewrite-revsync-session"/,
  );
  assert.match(page, /downloadReport/);
  assert.match(page, /Keep/);
  assert.match(page, /Adapt/);
  assert.match(page, /Remove/);
  assert.match(page, /Review/);
  assert.match(layout, /\/og\.png/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.doesNotMatch(page, /codex-preview|SkeletonPreview/);
  assert.doesNotMatch(layout, /Starter Project|codex-preview/);
  assert.deepEqual(JSON.parse(hosting), { d1: null, r2: null });

  await access(new URL(".next/BUILD_ID", templateRoot));
});
