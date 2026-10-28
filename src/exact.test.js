import test from "node:test";
import assert from "node:assert/strict";
import { simulate, stateAt, shapes, routes } from "./geometry.js";
import {
  exact,
  exactModel,
  exactState,
  exactHypotenuse,
  valueOf,
  latex,
  exactText,
} from "./exact.js";
const d = { side: 3, width: 3, height: 2, base: 3, leg: 2.25, radius: 2 };
const equal = (a, b) => assert.equal(exact(`(${a})-(${b})`), "0");
test("정사각형의 반지름과 호의 길이에 √2와 π를 유지한다", () => {
  const sim = simulate("square", d, "line", 8),
    m = exactModel(sim, "square", d, "line", 2);
  equal(exactState(m, 0).radius, "3*sqrt(2)");
  equal(exactState(m, 1).length, "3*pi*sqrt(2)/2");
  equal(exactState(m, 1.5).length, "3*pi*sqrt(2)/2+3*pi/4");
  assert.match(latex(exactState(m, 1).length), /sqrt\{2\}/);
});
test("직각삼각형 빗변은 근호로 단순화하고 유리수 입력은 정확히 보존한다", () => {
  equal(exactHypotenuse(3, 3), "3*sqrt(2)");
  equal(exactHypotenuse(3, 2), "sqrt(13)");
  equal(exactHypotenuse(0.3, 0.4), "1/2");
  const dims = { ...d, side: 1.25 },
    s = simulate("square", dims, "line");
  equal(
    exactState(exactModel(s, "square", dims, "line", 2), 1).length,
    "5*pi*sqrt(2)/8",
  );
});
test("정오각형의 대각선은 황금비, 정육각형·정팔각형은 근호로 표현한다", () => {
  for (const [id, expected] of [
    ["pentagon", "3*(1+sqrt(5))/2"],
    ["hexagon", "3*sqrt(3)"],
    ["octagon", "3*sqrt(2+sqrt(2))"],
  ]) {
    const s = simulate(id, d, "line");
    equal(exactState(exactModel(s, id, d, "line", 2), 0).radius, expected);
  }
});
test("원의 사이클로이드도 정확한 근호식으로 계산한다", () => {
  const sim = simulate("circle", d, "line", 8),
    m = exactModel(sim, "circle", d, "line", 0);
  equal(exactState(m, 1).length, "8-4*sqrt(2)");
  equal(exactState(m, 4).length, "16");
});
test("모든 도형과 경로에서 기호식은 실제 기하 계산과 일치한다", () => {
  for (const shape of shapes)
    for (const route of routes) {
      const sim = simulate(shape.id, d, route.id, 24),
        vertex = 2,
        m = exactModel(sim, shape.id, d, route.id, vertex);
      for (const p of [0, 0.5, 1, 6.25, 24]) {
        const symbol = exactState(m, p),
          numeric = stateAt(sim, p, vertex);
        assert.ok(
          Math.abs(valueOf(symbol.length) - numeric.length) < 1e-6,
          `${shape.id}/${route.id}/${p} length`,
        );
        const radius = Math.hypot(
          numeric.points[vertex].x - numeric.pivot.x,
          numeric.points[vertex].y - numeric.pivot.y,
        );
        assert.ok(
          Math.abs(valueOf(symbol.radius) - radius) < 1e-6,
          `${shape.id}/${route.id}/${p} radius`,
        );
      }
    }
});

test('그림과 접근성 텍스트에서도 π와 근호를 유지한다',()=>{
 assert.match(exactText('3*pi*sqrt(2)/2'),/π/);
 assert.match(exactText('3*pi*sqrt(2)/2'),/√2/);
 assert.match(exactText('180*acos(-8/sqrt(233))/pi'),/√233/);
});

test('누적 거리 캐시는 끝까지 재생한 뒤 되감거나 점을 바꿔도 정확하다',()=>{
 const sim=simulate('square',d,'line',8),model=exactModel(sim,'square',d,'line',2);
 exactState(model,8);
 equal(exactState(model,1).length,'3*pi*sqrt(2)/2');
 equal(exactState(model,1.5).length,'3*pi*sqrt(2)/2+3*pi/4');
 equal(exactState(model,0).length,'0');
 const another=exactModel(sim,'square',d,'line',0);equal(exactState(another,1).length,'0');
});
