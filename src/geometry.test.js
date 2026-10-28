import test from "node:test";
import assert from "node:assert/strict";
import { simulate, stateAt, distance, shapes } from "./geometry.js";
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-7, `${a} ≠ ${b}`);
test("정사각형: 접점 꼭짓점의 첫 이동은 0, 다음 이동은 사분원", () => {
  const s = simulate("square", 2, "line");
  close(stateAt(s, 1, 0).length, 0);
  close(stateAt(s, 2, 0).length, Math.PI);
  close(s.events[0].angle, -Math.PI / 2);
});
test("정삼각형은 단계마다 120도 회전한다", () => {
  const s = simulate("triangle", 3, "line");
  for (const e of s.events) close(e.angle, (-2 * Math.PI) / 3);
  close(stateAt(s, 2, 0).length, 2 * Math.PI);
});
test("모든 도형의 회전은 변의 길이를 보존한다", () => {
  for (const shape of shapes)
    for (const mode of ["line", "rectangle", "triangle"]) {
      const s = simulate(shape.id, 3, mode);
      const st = stateAt(s, 4.5, 0);
      for (let i = 0; i < s.initial.length; i++)
        close(
          distance(s.initial[i], s.initial[(i + 1) % s.initial.length]),
          distance(st.points[i], st.points[(i + 1) % st.points.length]),
        );
      assert.ok(Number.isFinite(st.length));
    }
});
test("다른 도형의 모서리에서 추가 회전을 계산한다", () => {
  const s = simulate("square", 3, "rectangle", 20);
  const c = s.events.find((e) => e.kind === "corner");
  assert.ok(c);
  close(c.angle, -Math.PI / 2);
  for (const e of s.events)
    for (const p of e.points)
      assert.ok(
        !(p.x > 1e-6 && p.x < 16 - 1e-6 && p.y < -1e-6 && p.y > -10 + 1e-6),
        "도형이 장애물 내부에 들어가면 안 됨",
      );
});
test("부분 단계의 호 길이는 회전각에 비례한다", () => {
  const s = simulate("square", 2, "line");
  close(stateAt(s, 1.5, 0).length, Math.PI / 2);
});

test("직사각형의 가로·세로와 직각이등변삼각형의 두 직각변", () => {
  const rectangle = simulate("rectangle", { width: 5, height: 2 }, "line");
  close(distance(rectangle.initial[0], rectangle.initial[1]), 2);
  close(distance(rectangle.initial[1], rectangle.initial[2]), 5);
  const iso = simulate("isosceles", { side: 3 }, "line");
  close(distance(iso.initial[0], iso.initial[1]), 3);
  close(distance(iso.initial[0], iso.initial[2]), 3);
  close(distance(iso.initial[1], iso.initial[2]), 3 * Math.SQRT2);
});
test("정삼각형·정사각형·정육각형 경로는 변의 길이와 외각이 일정하다", () => {
  for (const [mode, n, side] of [
    ["equilateral", 3, 16],
    ["square", 4, 12],
    ["hexagon", 6, 8],
  ]) {
    const s = simulate("square", 2, mode, 80);
    for (let i = 0; i < n; i++) close(distance(s.path[i], s.path[i + 1]), side);
    const corners = s.events.filter((e) => e.kind === "corner");
    assert.ok(corners.length);
    for (const e of corners) close(Math.abs(e.angle), (2 * Math.PI) / n);
  }
});
test("원 한 바퀴의 사이클로이드 길이는 8r, 중심 이동은 2πr", () => {
  const r = 2,
    s = simulate("circle", r, "line", 4),
    st = stateAt(s, 4, 0);
  close(st.length, 8 * r);
  close(st.center.x, 2 * Math.PI * r);
  close(st.center.y, r);
  close(st.pivot.x, st.center.x);
  close(st.pivot.y, 0);
  close(stateAt(s, 1, 0).length, 4 * r * (1 - Math.cos(Math.PI / 4)));
});
test("원은 모든 다각형 경로에서 반지름과 단계 사이 연속성을 유지한다", () => {
  for (const mode of [
    "rectangle",
    "triangle",
    "equilateral",
    "square",
    "hexagon",
  ]) {
    const s = simulate("circle", 2, mode, 50);
    for (let k = 0; k < s.events.length; k++) {
      const mid = stateAt(s, k + 0.5, 0);
      for (const p of mid.points) close(distance(p, mid.center), 2);
      const before = stateAt(s, k + 1 - 1e-10, 0),
        after = stateAt(s, k + 1, 0);
      assert.ok(distance(before.points[0], after.points[0]) < 1e-7);
    }
    assert.ok(s.events.some((e) => e.kind === "corner"));
  }
});
