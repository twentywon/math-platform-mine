import test from "node:test";
import assert from "node:assert/strict";
import {
  opticalElements,
  traceLaser,
  reflect,
  refract,
  unit,
  dot,
  sub,
  norm,
  focalPosition,
  evenlySpaced,
} from "./optics.js";
import { flameSamples, recordObservation } from "./flame.js";
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`);
test("거울은 입사각과 반사각을 같게 유지한다", () => {
  for (const angle of [0, 0.2, 0.7, 1]) {
    const d = { x: Math.cos(angle), y: Math.sin(angle) },
      n = { x: -1, y: 0 },
      out = reflect(d, n);
    near(norm(out), 1);
    near(Math.abs(dot(d, n)), Math.abs(dot(out, n)));
    near(out.x, -d.x);
    near(out.y, d.y);
  }
});
test("굴절은 스넬의 법칙을 따르고 수직 입사광의 방향은 바뀌지 않는다", () => {
  const d = { x: Math.cos(0.4), y: Math.sin(0.4) },
    out = refract(d, { x: -1, y: 0 }, 1, 1.5);
  assert.equal(out.tir, false);
  near(d.y, 1.5 * out.direction.y);
  const normal = refract({ x: 1, y: 0 }, { x: -1, y: 0 }, 1, 1.7);
  near(normal.direction.x, 1);
  near(normal.direction.y, 0);
});
test("임계각보다 큰 내부 입사는 전반사로 계산한다", () => {
  const out = refract(
    { x: Math.cos(1), y: Math.sin(1) },
    { x: 1, y: 0 },
    1.5,
    1,
  );
  assert.equal(out.tir, true);
  assert.ok(out.direction.x < 0);
  near(norm(out.direction), 1);
});
test("볼록·오목 거울과 렌즈의 모임·퍼짐 방향과 초점 위치가 맞는다", () => {
  for (const [id, xsign, ysign] of [
    ["convexMirror", -1, 1],
    ["concaveMirror", -1, -1],
    ["convexLens", 1, -1],
    ["concaveLens", 1, 1],
  ]) {
    const ray = traceLaser(id, 2),
      last = ray.hits.at(-1);
    assert.ok(last.outgoing.x * xsign > 0);
    assert.ok(last.outgoing.y * ysign > 0);
    assert.equal(ray.hits.length, id.endsWith("Mirror") ? 1 : 2);
  }
  near(focalPosition("concaveMirror"), -4);
  near(focalPosition("convexMirror"), 4);
  assert.ok(focalPosition("convexLens") > 0);
  assert.ok(focalPosition("concaveLens") < 0);
  assert.ok(
    focalPosition("convexLens", 1.7) < focalPosition("convexLens", 1.33),
  );
});
test("광선 추적은 모든 위치에서 유한하며 양쪽 높이에 대해 대칭이다", () => {
  for (const e of opticalElements)
    for (const index of [1.33, 1.5, 1.7])
      for (const height of [0, 0.5, 2, 3.8, 4.5, 5.5]) {
        const a = traceLaser(e.id, height, index),
          b = traceLaser(e.id, -height, index);
        assert.equal(a.hits.length, b.hits.length);
        for (let i = 0; i < a.segments.length; i++)
          for (const endpoint of ["a", "b"]) {
            assert.ok(
              Number.isFinite(a.segments[i][endpoint].x) &&
                Number.isFinite(a.segments[i][endpoint].y),
            );
            near(a.segments[i][endpoint].x, b.segments[i][endpoint].x);
            near(a.segments[i][endpoint].y, -b.segments[i][endpoint].y);
          }
        if (height > 4.6) assert.equal(a.missed, true);
      }
});
test("레이저 개수별 기본 배치는 광축을 기준으로 대칭이다", () => {
  for (let n = 1; n <= 7; n++) {
    const p = evenlySpaced(n);
    assert.equal(p.length, n);
    for (let i = 0; i < n; i++) near(p[i], -p[n - 1 - i]);
  }
});
test("불꽃색 시료는 동일한 염화물 계열 7종이고 중복 관찰은 한 번만 기록한다", () => {
  assert.equal(flameSamples.length, 7);
  assert.equal(new Set(flameSamples.map((s) => s.id)).size, 7);
  for (const s of flameSamples) {
    assert.match(s.formula, /Cl/);
    assert.match(s.color, /^#[a-f\d]{6}$/i);
    assert.ok(s.name && s.metal);
  }
  assert.equal(flameSamples.find((s) => s.id === "sodium").name, "노란색");
  assert.equal(flameSamples.find((s) => s.id === "potassium").name, "보라색");
  assert.deepEqual(
    recordObservation(recordObservation([], "sodium"), "sodium"),
    ["sodium"],
  );
});
