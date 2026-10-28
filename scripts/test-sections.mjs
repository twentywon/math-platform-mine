import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { chromium } from "playwright";
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
try {
  const context = await browser.newContext({
      offline: true,
      viewport: { width: 1440, height: 1100 },
    }),
    page = await context.newPage(),
    errors = [],
    requests = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => requests.push(r.url()));
  await page.setContent(await readFile("dist/monoon.html", "utf8"));
  await page
    .getByRole("button", { name: /잘라서 발견하는 입체의 단면/ })
    .click();
  await page
    .getByRole("heading", { name: /잘라서 발견하는 입체의 단면/ })
    .waitFor();
  const result = page.locator(".section-result");
  await result.getByText("정사각형 단면", { exact: true }).waitFor();
  await page.getByRole("button", { name: "비스듬히", exact: true }).click();
  await result.getByText("육각형 단면", { exact: true }).waitFor();
  await page.getByRole("slider", { name: "절단면 위치", exact: true }).focus();
  await page.keyboard.press("End");
  await result.getByText("입체와 만나지 않아요", { exact: true }).waitFor();
  await page.getByRole("button", { name: "처음 상태로", exact: true }).click();
  for (const name of [
    "정육면체",
    "직육면체",
    "정사면체",
    "삼각기둥",
    "사각뿔",
    "원기둥",
    "원뿔",
    "구",
  ]) {
    await page.getByRole("button", { name, exact: true }).click();
    await page.getByTestId("solid-section").waitFor();
    for (const preset of ["수평", "수직", "비스듬히"]) {
      await page.getByRole("button", { name: preset, exact: true }).click();
      await page.getByTestId("solid-section").waitFor();
    }
  }
  await page.getByRole("button", { name: "정육면체", exact: true }).click();
  await page.getByRole("button", { name: "비스듬히", exact: true }).click();
  const scene = page.locator(".section-scene"),
    before = await page.getByTestId("solid-section").getAttribute("points"),
    box = await scene.boundingBox();
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.6, {
    steps: 10,
  });
  await page.mouse.up();
  assert.notEqual(
    await page.getByTestId("solid-section").getAttribute("points"),
    before,
  );
  await result.getByText("육각형 단면", { exact: true }).waitFor();
  await page.getByRole("checkbox", { name: "절단 평면 표시" }).uncheck();
  assert.equal(await page.getByTestId("cutting-plane").count(), 0);
  await page.getByRole("checkbox", { name: "절단 평면 표시" }).check();
  await page.getByRole('button',{name:'시점 초기화',exact:true}).click();
  await page.screenshot({
    path: "/tmp/monoon-sections-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  await page.screenshot({
    path: "/tmp/monoon-sections-mobile.png",
    fullPage: true,
  });
  assert.deepEqual(errors, []);
  assert.deepEqual(requests, []);
  console.log(
    "PASS: 8 solids, square/hexagonal/empty sections, plane controls, independent camera drag, mobile layout, offline, 0 errors",
  );
} finally {
  await browser.close();
}
