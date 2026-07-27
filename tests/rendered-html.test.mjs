import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const templateRoot = new URL("../", import.meta.url);

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html", host: "localhost" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
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

  await access(new URL("dist/server/index.js", templateRoot));
});
