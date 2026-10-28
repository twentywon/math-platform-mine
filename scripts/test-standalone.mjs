import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const html = await readFile(process.argv[2] || new URL('../dist/monoon.html', import.meta.url), 'utf8');
assert.ok(!/<script[^>]+src=/i.test(html), 'Standalone HTML must not load external scripts');
assert.ok(!/<link[^>]+rel=["']stylesheet/i.test(html), 'Standalone HTML must include its CSS');
const executablePath = process.env.CHROMIUM_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
const browser = await chromium.launch({ executablePath, args: ['--no-sandbox'] });
try {
  const context = await browser.newContext({ offline: true });
  const page = await context.newPage();
  const errors = [], requests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => requests.push(request.url()));
  // This managed browser blocks file:// navigation by policy. Loading the exact
  // HTML offline verifies that its inline code and styles need no file/server fetch.
  await page.setContent(html, { waitUntil: 'load' });
  await page.getByRole('heading', { name: /공식 너머의 원리/ }).waitFor();
  assert.equal(await page.locator('header').evaluate(el => getComputedStyle(el).display), 'flex');
  await page.getByRole('button', { name: /데굴데굴, 도형 굴리기/ }).click();
  await page.getByRole('button', { name: '꼭짓점 C', exact: true }).click();
  await page.getByRole('button', { name: '다음 단계', exact: true }).click();
  assert.match(await page.locator('svg[role="img"]').getAttribute('aria-label'), /π/);
  const exactDistance=page.locator('.distance-stat .exact-math');
  assert.equal(await exactDistance.getAttribute('data-expression'), '(3/2)*2^(1/2)*pi');
  assert.ok(await exactDistance.locator('msqrt').count()>0);
  assert.ok(await exactDistance.locator('mfrac').count()>0);
  assert.ok(await exactDistance.locator('math').evaluate(el=>parseFloat(getComputedStyle(el).fontSize)>=20), 'Exact formulas must stay readable');

  const firstAngle = page.getByTestId('completed-angle').filter({ hasText: '90°' }).first();
  assert.equal(await page.getByTestId('completed-angle').count(), 1);
  assert.equal(await firstAngle.getAttribute('data-step'), '1');
  const firstPosition = [await firstAngle.getAttribute('data-arc-x'), await firstAngle.getAttribute('data-arc-y')];
  const arcMiddle = (await page.getByTestId('trace').getAttribute('points')).split(' ')[32].split(',').map(Number);
  assert.ok(Math.abs(+firstPosition[0]-arcMiddle[0])<1e-6);
  assert.ok(Math.abs(+firstPosition[1]-arcMiddle[1])<1e-6);
  await page.getByRole('button', { name: '다음 단계', exact: true }).click();
  assert.equal(await page.getByTestId('completed-angle').count(), 2);
  assert.deepEqual([await firstAngle.getAttribute('data-arc-x'), await firstAngle.getAttribute('data-arc-y')], firstPosition);
  await page.screenshot({ path: '/tmp/monoon-completed-angles.png', fullPage: true });
  await page.getByRole('button', { name: '다음 단계', exact: true }).click();
  assert.equal(await page.getByTestId('completed-angle').count(), 2, 'No arc label when C itself is the pivot');
  await page.getByRole('button', { name: '이전 단계', exact: true }).click();
  await page.getByRole('button', { name: '이전 단계', exact: true }).click();
  await page.getByRole('checkbox', { name: '궤적 표시' }).uncheck();
  assert.equal(await page.getByTestId('completed-angle').count(), 0);
  await page.getByRole('checkbox', { name: '궤적 표시' }).check();
  assert.equal(await page.getByTestId('completed-angle').count(), 1);

  assert.equal(await page.getByRole('button', { name: '정십각형', exact: true }).count(), 0);
  assert.equal(await page.getByText('단계별 관찰 기록', { exact: true }).count(), 0);
  assert.equal(await page.getByText('호의 길이가 곧 꼭짓점의 이동 거리예요.', { exact: true }).count(), 0);
  await page.getByRole('button', { name: '꼭짓점 B 선택', exact: true }).click();
  assert.equal(await page.getByRole('button', { name: '꼭짓점 B', exact: true }).getAttribute('aria-pressed'), 'true');
  assert.equal(await page.getByTestId('completed-angle').first().getAttribute('data-vertex'), '1');
  assert.notEqual(await page.getByTestId('completed-angle').first().getAttribute('data-arc-x'), firstPosition[0]);
  assert.equal(Number(await page.getByRole('slider', { name: '회전 진행 단계' }).inputValue()), 1);
  await page.getByTestId('full-trace').waitFor();
  await page.getByRole('button', { name: '꼭짓점 C 선택', exact: true }).press('Enter');
  await page.getByLabel('변 AB', { exact: true }).fill('4');
  assert.equal(await page.getByLabel('변 BC', { exact: true }).inputValue(), '4');
  assert.equal(Number(await page.getByRole('slider', { name: '회전 진행 단계' }).inputValue()), 0);
  await page.getByRole('button', { name: '직사각형', exact: true }).click();
  await page.getByLabel('가로 (BC · DA)', { exact: true }).fill('5');
  await page.getByLabel('세로 (AB · CD)', { exact: true }).fill('2');
  assert.equal(await page.getByLabel('가로 (BC · DA)', { exact: true }).inputValue(), '5');
  await page.getByRole('button', { name: '직각이등변삼각형', exact: true }).click();
  await page.getByLabel('변 AB', { exact: true }).fill('3');
  assert.equal(await page.getByRole('textbox', { name: '변 BC (빗변)', exact: true }).locator('.exact-math').getAttribute('data-expression'),'3*2^(1/2)');
  assert.equal(await page.getByLabel('변 CA', { exact: true }).inputValue(), '3');
  for (const [name,n] of [['사각형 둘레',4],['삼각형 둘레',3],['정삼각형 둘레',3],['정사각형 둘레',4],['정육각형 둘레',6]]) {
    await page.getByRole('button', { name, exact: true }).click();
    assert.equal((await page.getByTestId('boundary').getAttribute('points')).split(' ').length,n);
  }
  await page.getByRole('button', { name: '원', exact: true }).click();
  await page.getByLabel('반지름', { exact: true }).fill('2');
  await page.getByRole('button', { name: '직선', exact: true }).click();
  for(let i=0;i<4;i++)await page.getByRole('button', { name: '다음 단계', exact: true }).click();
  assert.match(await page.locator('svg[role="img"]').getAttribute('aria-label'), /16cm/);
  await page.getByTestId('rolling-circle').waitFor();
  await page.getByTestId('trace').waitFor();
  await page.getByTestId('angle-label').waitFor();
  await page.getByRole('button', { name: '굴려 보기', exact: true }).click();
  await page.waitForTimeout(250);
  await page.getByRole('button', { name: '일시정지', exact: true }).click();
  assert.ok(Number(await page.getByRole('slider', { name: '회전 진행 단계' }).inputValue()) > 0);
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  assert.deepEqual(errors, []);
  assert.deepEqual(requests, [], 'Offline document must make no external requests');
  await page.screenshot({ path: '/tmp/monoon-updated-mobile.png', fullPage: true });
  console.log('PASS: offline HTML, direct point clicks, length inputs, new shapes, 5 boundary polygons, circle cycloid, angle diagram, persistent completed arc angles, removed panels, playback, mobile; 0 requests, 0 errors');
} finally {
  await browser.close();
}
