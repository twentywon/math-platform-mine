import test from "node:test";
import assert from "node:assert/strict";
import {
  sectionSolids,
  planeNormal,
  planeExtent,
  planeOffset,
  intersectSolid,
  dot,
} from "./sections.js";
const solid = (id) => sectionSolids.find((s) => s.id === id);
test("정육면체의 수평 단면은 정사각형, 중심 대각 단면은 육각형이다", () => {
  assert.equal(intersectSolid(solid("cube"), [0, 1, 0], 0).kind, "정사각형");
  const n = planeNormal(55, 45),
    s = intersectSolid(solid("cube"), n, 0);
  assert.equal(s.kind, "육각형");
  assert.equal(s.points.length, 6);
  for (const p of s.points) assert.ok(Math.abs(dot(n, p)) < 1e-9);
});
test("같은 입체도형도 절단 위치에 따라 삼각형, 육각형, 빈 단면이 된다", () => {
  const cube = solid("cube"),
    n = planeNormal(55, 45);
  assert.equal(intersectSolid(cube, n, 1.2).kind, "삼각형");
  assert.equal(intersectSolid(cube, n, 2).dimension, -1);
  assert.equal(intersectSolid(cube, [0, 1, 0], 1).kind, "정사각형");
  assert.equal(
    intersectSolid(cube, planeNormal(90, 45), Math.SQRT2).dimension,
    1,
  );
  const [lo, hi] = planeExtent(cube, n);
  assert.equal(intersectSolid(cube, n, hi).dimension, 0);
  assert.equal(planeOffset(cube, n, 100), hi);
  assert.equal(planeOffset(cube, n, -100), lo);
});
test("기둥과 뿔의 단면과 구의 해석적 원 단면을 구별한다", () => {
  assert.equal(intersectSolid(solid("prism"), [0, 1, 0], 0).kind, "삼각형");
  assert.equal(intersectSolid(solid("pyramid"), [0, 1, 0], 0).kind, "정사각형");
  assert.equal(intersectSolid(solid("pyramid"), [1, 0, 0], 0).kind, "삼각형");
  assert.equal(
    intersectSolid(solid("tetrahedron"), [0, 1, 0], 0).points.length,
    4,
  );
  assert.equal(intersectSolid(solid("cylinder"), [0, 1, 0], 0).kind, "원");
  assert.equal(
    intersectSolid(solid("cylinder"), [1, 0, 0], 0).kind,
    "직사각형",
  );
  assert.equal(
    intersectSolid(solid("cylinder"), planeNormal(25, 0), 0).kind,
    "타원",
  );
  assert.equal(intersectSolid(solid("cone"), [1, 0, 0], 0).kind, "삼각형");
  assert.equal(intersectSolid(solid("cone"), [0, 1, 0], 1).dimension, 0);
  const n = planeNormal(30, 45),
    circle = intersectSolid(solid("sphere"), n, 0.5);
  assert.equal(circle.kind, "원");
  for (const p of circle.points) {
    assert.ok(Math.abs(dot(p, n) - 0.5) < 1e-9);
    assert.ok(Math.abs(dot(p, p) - 1) < 1e-9);
  }
  assert.equal(intersectSolid(solid("sphere"), n, 1).dimension, 0);
  assert.equal(intersectSolid(solid("sphere"), n, 1.1).dimension, -1);
});
test("8가지 도형의 다양한 절단면에서 모든 점은 평면 위에 놓이고 유한하다", () => {
  for (const s of sectionSolids)
    for (const tilt of [0, 30, 55, 90])
      for (const a of [0, 45, 90])
        for (const percent of [-110, -100, -50, 0, 50, 100, 110]) {
          const n = planeNormal(tilt, a),
            d = planeOffset(s, n, percent),
            section = intersectSolid(s, n, d);
          for (const p of section.points) {
            assert.ok(p.every(Number.isFinite));
            assert.ok(Math.abs(dot(p, n) - d) < 1e-7);
          }
          if (section.dimension === 2) assert.ok(section.points.length >= 3);
        }
});
