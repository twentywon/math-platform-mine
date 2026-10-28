import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, sep, extname } from "node:path";
import { chromium } from "playwright";
const root = resolve("dist"),
  html = await readFile(resolve(root, "index.html"), "utf8"),
  entry = html.match(/src="([^"]+\.js)"/)[1],
  size = (await stat(resolve(root, "." + entry))).size;
assert.ok(size < 350000, `Initial entry is unexpectedly large: ${size}`);
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(
        new URL(req.url, "http://localhost").pathname,
      ),
      file = resolve(root, "." + (pathname === "/" ? "/index.html" : pathname));
    if (!file.startsWith(root + sep)) {
      res.writeHead(403);
      res.end();
      return;
    }
    const content = await readFile(file);
    res.setHeader(
      "Content-Type",
      {
        ".html": "text/html",
        ".js": "application/javascript",
        ".css": "text/css",
        ".json": "application/json",
      }[extname(file)] || "application/octet-stream",
    );
    res.end(content);
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const browser = await chromium.launch({
  executablePath:
    process.env.CHROMIUM_PATH ||
    (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined),
  args: ["--no-sandbox"],
});
try {
  const page = await browser.newPage(),
    requests = [],
    errors = [];
  page.on("request", (r) => requests.push(r.url()));
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.getByRole("heading", { name: /공식 너머의 원리/ }).waitFor();
  assert.equal(
    requests.some((url) =>
      /\/(Rolling|Polyhedra|Construction|Optics|Flame|Sections)-/.test(url),
    ),
    false,
    "Home should not load simulator chunks",
  );
  await page.getByRole("button", { name: /자와 컴퍼스 작도 실험실/ }).click();
  await page
    .getByRole("heading", { name: /자와 컴퍼스 작도 실험실/ })
    .waitFor();
  assert.ok(requests.some((url) => /\/Construction-/.test(url)));
  assert.equal(
    requests.some((url) => /\/(Rolling|Polyhedra)-/.test(url)),
    false,
  );
  await page
    .getByRole("button", { name: "시뮬레이션 탐색", exact: true })
    .click();
  await page.getByRole("button", { name: "중학교 2학년", exact: true }).click();
  await page.getByRole("button", { name: "과학", exact: true }).click();
  await page.route("**/assets/Optics-*.js", (route) => route.abort());
  await page.getByRole("button", { name: /빛의 반사와 굴절/ }).click();
  await page
    .getByRole("alert")
    .getByRole("heading", { name: "실험실을 불러오지 못했어요.", exact: true })
    .waitFor();
  console.log(
    JSON.stringify({
      webEntryBytes: size,
      lazyLoading: true,
      failedChunkRecovery: true,
      uncaughtErrors: errors.length,
    }),
  );
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
  await new Promise((r) => server.close(r));
}
