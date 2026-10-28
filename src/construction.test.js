import test from "node:test";
import assert from "node:assert/strict";
import {
  buildConstruction,
  defaults,
  distance,
  constructionBounds,
} from "./construction.js";
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} ≠ ${b}`),
  dot = (a, b) => a.x * b.x + a.y * b.y,
  sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y });
test("선분 옮기기는 입력한 길이를 정확히 복사한다", () => {
  for (const length of [0.5, 3.5, 12]) {
    const l = buildConstruction("segment", { ...defaults, length });
    assert.ok(l.valid);
    near(distance(l.data.A, l.data.B), length);
    near(distance(l.data.P, l.data.Q), length);
  }
});
test("각 옮기기는 원호의 반지름과 현의 길이를 보존한다", () => {
  for (const angle of [5, 60, 90, 175]) {
    const l = buildConstruction("angle", { ...defaults, angle }),
      { P, copied } = l.data;
    near(distance(P, copied.p1), distance(P, copied.p2));
    near(distance(copied.p1, copied.p2), copied.chord);
    near(
      (Math.atan2(copied.p2.y - P.y, copied.p2.x - P.x) * 180) / Math.PI,
      angle,
    );
  }
});
test("평행선은 주어진 점을 지나며 원래 직선과 같은 방향이다", () => {
  const { data } = buildConstruction("parallel");
  near(data.parallel[0].y, data.P.y);
  near(data.parallel[1].y, data.P.y);
});
test("SSS·SAS·ASA 삼각형이 입력한 조건을 만족한다", () => {
  for (const [kind, p] of [
    ["sss", { a: 4, b: 5, c: 6 }],
    ["sas", { b: 4, c: 7, angle: 110 }],
    ["asa", { c: 6, alpha: 40, beta: 65 }],
  ]) {
    const l = buildConstruction(kind, { ...defaults, ...p });
    assert.ok(l.valid);
    const { A, B, C } = l.data;
    near(distance(A, B), p.c);
    const angleA = (Math.atan2(C.y - A.y, C.x - A.x) * 180) / Math.PI,
      ba = sub(A, B),
      bc = sub(C, B),
      angleB =
        (Math.acos(dot(ba, bc) / (distance(A, B) * distance(C, B))) * 180) /
        Math.PI;
    if (kind === "sss") {
      near(distance(A, C), p.b);
      near(distance(B, C), p.a);
    }
    if (kind === "sas") {
      near(distance(A, C), p.b);
      near(angleA, p.angle);
    }
    if (kind === "asa") {
      near(angleA, p.alpha);
      near(angleB, p.beta);
    }
  }
});
test("작도 불가능한 삼각형과 비어 있는 입력을 차단한다", () => {
  for (const [kind, p] of [
    ["sss", { a: 2, b: 3, c: 5 }],
    ["sss", { a: 1, b: 2, c: 8 }],
    ["asa", { alpha: 100, beta: 80 }],
    ["asa", { alpha: 150, beta: 70 }],
    ["sas", { angle: 180 }],
    ["segment", { length: NaN }],
  ])
    assert.equal(buildConstruction(kind, { ...defaults, ...p }).valid, false);
});
test("수직이등분선과 각의 이등분선은 같은 거리 조건을 만족한다", () => {
  const { A, B, P, Q, M } = buildConstruction("bisector").data;
  near(distance(A, P), distance(B, P));
  near(distance(A, Q), distance(B, Q));
  near(distance(A, M), distance(B, M));
  near(dot(sub(P, Q), sub(A, B)), 0);
  for (const angle of [5, 70, 175]) {
    const { data } = buildConstruction("angleBisector", { ...defaults, angle });
    near(distance(data.D, data.F), distance(data.E, data.F));
    near((Math.atan2(data.F.y, data.F.x) * 180) / Math.PI, angle / 2);
  }
});
test("직선 밖·위의 점에서 만든 수선은 그 점을 지나고 직선에 수직이다", () => {
  for (const type of ["outside", "on"]) {
    const l = buildConstruction("perpendicular", defaults, type),
      { P, A, B, F } = l.data;
    near(P.x, F.x);
    near(distance(A, F), distance(B, F));
    near(distance(P, A), distance(P, B));
  }
});
test("모든 단계에서 실제 자와 컴퍼스가 그린 도형과 도구 간격이 일치한다", () => {
  for (const kind of [
    "segment",
    "angle",
    "parallel",
    "sss",
    "sas",
    "asa",
    "bisector",
    "angleBisector",
    "perpendicular",
  ]) {
    const l = buildConstruction(kind);
    assert.ok(l.steps.length > 0);
    const bounds = constructionBounds(l);
    assert.ok(bounds.maxX > bounds.minX && bounds.maxY > bounds.minY);
    for (const step of l.steps) {
      assert.ok(["ruler", "compass"].includes(step.tool.type));
      for (const s of step.shapes)
        if (s.type === "arc") {
          assert.equal(step.tool.type, "compass");
          near(distance(s.center, step.tool.center), 0);
          near(s.radius, step.tool.radius);
        }
    }
  }
});
