export const basicConstructions = [
  { id: "segment", name: "길이가 같은 선분 옮기기" },
  { id: "angle", name: "크기가 같은 각 옮기기" },
  { id: "parallel", name: "평행선의 작도" },
  { id: "triangle", name: "삼각형의 작도" },
];
export const advancedConstructions = [
  { id: "bisector", name: "선분의 수직이등분선" },
  { id: "angleBisector", name: "각의 이등분선" },
  { id: "perpendicular", name: "수선의 작도" },
];
export const defaults = {
  length: 5,
  angle: 60,
  a: 4,
  b: 5,
  c: 6,
  alpha: 50,
  beta: 60,
};
export const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y }),
  sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y }),
  scale = (a, s) => ({ x: a.x * s, y: a.y * s }),
  distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const point = (x, y) => ({ x, y }),
  rad = (d) => (d * Math.PI) / 180,
  at = (o, r, a) => add(o, point(r * Math.cos(a), r * Math.sin(a)));
const line = (a, b, options = {}) => ({ type: "line", a, b, ...options }),
  arc = (center, radius, start, end, options = {}) => ({
    type: "arc",
    center,
    radius,
    start,
    end,
    ...options,
  }),
  mark = (name, p, options = {}) => ({ type: "point", name, p, ...options }),
  label = (text, p) => ({ type: "text", text, p });
const ruler = (a, b) => ({ type: "ruler", a, b }),
  compass = (center, radius, start, end, measure = false) => ({
    type: "compass",
    center,
    radius,
    start,
    end,
    measure,
  });
const n = (x) => String(Number(Number(x).toFixed(10)));
function step(title, description, tool, shapes = []) {
  return { title, description, tool, shapes };
}
function measured(steps, A, B, text) {
  steps.push(
    step(
      "컴퍼스에 길이 담기",
      text,
      compass(
        A,
        distance(A, B),
        Math.atan2(B.y - A.y, B.x - A.x),
        Math.atan2(B.y - A.y, B.x - A.x),
        true,
      ),
    ),
  );
}
function givenSegment(givens, A, length, name) {
  const B = add(A, point(length, 0));
  givens.push(
    line(A, B, { given: true }),
    mark(name[0], A),
    mark(name[1], B),
    label(`${name} = ${n(length)} cm`, add(A, point(length / 2, 0.55))),
  );
  return [A, B];
}
function givenAngle(givens, O, angle, name, r = 2) {
  const u = at(O, r, 0),
    v = at(O, r, angle);
  givens.push(
    line(O, at(O, r * 1.5, 0), { given: true }),
    line(O, at(O, r * 1.5, angle), { given: true }),
    mark(name, O),
    arc(O, r * 0.45, 0, angle, { given: true }),
    label(`${n((angle * 180) / Math.PI)}°`, at(O, r * 0.8, angle / 2)),
  );
  return { O, u, v };
}
function copyAngle(
  steps,
  givens,
  {
    source,
    angle,
    target,
    heading = 0,
    sign = 1,
    radius = 2,
    rayLength = 5,
    tag = "A",
  },
) {
  const s1 = at(source, radius, 0),
    s2 = at(source, radius, angle),
    p1 = at(target, radius, heading),
    p2 = at(target, radius, heading + sign * angle),
    chord = distance(s1, s2),
    a = Math.atan2(p2.y - p1.y, p2.x - p1.x);
  steps.push(
    step(
      "원래 각에 호 그리기",
      "각의 꼭짓점을 중심으로 호를 그려 두 변과 만나는 점을 잡습니다.",
      compass(source, radius, 0, angle + 0.15),
      [
        arc(source, radius, 0, angle + 0.15),
        mark(`${tag}₁`, s1),
        mark(`${tag}₂`, s2),
      ],
    ),
  );
  steps.push(
    step(
      "같은 반지름의 호 옮기기",
      "처음 호의 반지름으로 새 꼭짓점에서도 호를 그립니다.",
      compass(
        target,
        radius,
        heading - sign * 0.1,
        heading + sign * (angle + 0.2),
      ),
      [
        arc(
          target,
          radius,
          heading - sign * 0.1,
          heading + sign * (angle + 0.2),
        ),
        mark(`${tag}₃`, p1),
      ],
    ),
  );
  measured(
    steps,
    s1,
    s2,
    "두 변 위에 생긴 두 점 사이의 거리를 컴퍼스에 담습니다.",
  );
  steps.push(
    step(
      "두 점 사이의 간격 옮기기",
      "방금 담은 두 교점 사이의 간격을 유지합니다. 새 호 위의 점을 중심으로 호를 그립니다.",
      compass(p1, chord, a - 0.45, a + 0.45),
      [arc(p1, chord, a - 0.45, a + 0.45), mark(`${tag}₄`, p2)],
    ),
  );
  const end = at(target, rayLength, heading + sign * angle);
  steps.push(
    step(
      "각의 두 번째 변 긋기",
      "새 꼭짓점과 두 호의 교점을 눈금 없는 자로 이어 같은 크기의 각을 만듭니다.",
      ruler(target, end),
      [line(target, end, { result: true })],
    ),
  );
  return { p1, p2, end, chord };
}
function validate(kind, p) {
  const lengths =
    kind === "segment"
      ? ["length"]
      : kind === "sss"
        ? ["a", "b", "c"]
        : kind === "sas"
          ? ["b", "c"]
          : kind === "asa"
            ? ["c"]
            : [];
  for (const k of lengths)
    if (!Number.isFinite(p[k]) || p[k] < 0.5 || p[k] > 12)
      return "선분의 길이는 0.5~12 cm로 입력해 주세요.";
  const angles =
    kind === "angle" || kind === "angleBisector" || kind === "sas"
      ? ["angle"]
      : kind === "asa"
        ? ["alpha", "beta"]
        : [];
  for (const k of angles)
    if (!Number.isFinite(p[k]) || p[k] < 5 || p[k] > 175)
      return "각의 크기는 5°~175°로 입력해 주세요.";
  if (kind === "sss" && Math.max(p.a, p.b, p.c) * 2 >= p.a + p.b + p.c - 1e-9)
    return "삼각형의 가장 긴 변은 나머지 두 변의 길이의 합보다 짧아야 합니다.";
  if (kind === "asa" && p.alpha + p.beta >= 180 - 1e-9)
    return "두 각의 합은 180°보다 작아야 합니다.";
  return null;
}
export function buildConstruction(
  kind,
  params = defaults,
  variant = "outside",
) {
  const p = { ...defaults, ...params },
    error = validate(kind, p);
  if (error) return { valid: false, error, steps: [], givens: [] };
  const givens = [],
    steps = [],
    data = {};
  let title = "",
    proof = "";
  if (kind === "segment") {
    title = "길이가 같은 선분 옮기기";
    const A = point(0, 5),
      P = point(0, 0),
      [_, B] = givenSegment(givens, A, p.length, "AB"),
      Q = point(p.length, 0);
    givens.push(mark("P", P));
    steps.push(
      step(
        "옮길 자리에서 반직선 긋기",
        "점 P를 지나는 반직선을 눈금 없는 자로 긋습니다.",
        ruler(P, point(p.length + 2, 0)),
        [line(P, point(p.length + 2, 0), { aux: true })],
      ),
    );
    measured(
      steps,
      A,
      B,
      "컴퍼스의 두 끝을 A와 B에 맞추어 주어진 선분의 길이를 담습니다.",
    );
    steps.push(
      step(
        "같은 길이의 호 그리기",
        "컴퍼스 간격을 유지한 채 P를 중심으로 호를 그립니다. 반직선과 만나는 점이 Q입니다.",
        compass(P, p.length, -0.45, 0.45),
        [arc(P, p.length, -0.45, 0.45), mark("Q", Q)],
      ),
    );
    steps.push(
      step(
        "선분 PQ 완성하기",
        "눈금 없는 자로 P와 Q를 이어 선분을 완성합니다.",
        ruler(P, Q),
        [line(P, Q, { result: true })],
      ),
    );
    proof = `PQ = AB = ${n(p.length)} cm`;
    Object.assign(data, { A, B, P, Q });
  } else if (kind === "angle") {
    title = "크기가 같은 각 옮기기";
    const O = point(-4, 6),
      P = point(3, 0),
      theta = rad(p.angle);
    givenAngle(givens, O, theta, "O");
    givens.push(mark("P", P));
    steps.push(
      step(
        "새 각의 첫 번째 변 긋기",
        "점 P에서 반직선을 눈금 없는 자로 긋습니다.",
        ruler(P, add(P, point(5, 0))),
        [line(P, add(P, point(5, 0)), { result: true })],
      ),
    );
    const copied = copyAngle(steps, givens, {
      source: O,
      angle: theta,
      target: P,
      tag: "S",
    });
    proof = `옮긴 각 = 원래 각 = ${n(p.angle)}°`;
    Object.assign(data, { O, P, theta, copied });
  } else if (kind === "parallel") {
    title = "평행선의 작도";
    const Q = point(-3, 0),
      P = point(1, 4),
      theta = Math.PI / 4,
      R = 1.6;
    givens.push(
      line(point(-6, 0), point(8, 0), { given: true }),
      label("직선 ℓ", point(8, 0.5)),
      mark("P", P),
      mark("Q", Q),
    );
    steps.push(
      step(
        "점 P와 직선 위의 점 Q 잇기",
        "눈금 없는 자로 Q와 P를 잇고 P 너머까지 연장합니다.",
        ruler(Q, at(P, 4, theta)),
        [line(Q, at(P, 4, theta), { aux: true })],
      ),
    );
    copyAngle(steps, givens, {
      source: Q,
      angle: theta,
      target: P,
      heading: theta,
      sign: -1,
      radius: R,
      rayLength: 6,
      tag: "S",
    });
    steps.push(
      step(
        "평행선 양쪽으로 연장하기",
        "만든 변을 양쪽으로 연장합니다. 동위각이 같으므로 새 직선은 ℓ과 평행합니다.",
        ruler(add(P, point(-6, 0)), add(P, point(7, 0))),
        [
          line(add(P, point(-6, 0)), add(P, point(7, 0)), { result: true }),
          label("직선 m", add(P, point(7, 0.5))),
        ],
      ),
    );
    proof = "동위각이 같으므로 m ∥ ℓ";
    Object.assign(data, {
      P,
      Q,
      parallel: [add(P, point(-6, 0)), add(P, point(7, 0))],
    });
  } else if (["sss", "sas", "asa"].includes(kind)) {
    title =
      kind === "sss"
        ? "삼각형의 작도 · SSS"
        : kind === "sas"
          ? "삼각형의 작도 · SAS"
          : "삼각형의 작도 · ASA";
    const A = point(0, 0),
      B = point(p.c, 0);
    let C;
    if (kind === "sss") {
      const x = (p.b * p.b + p.c * p.c - p.a * p.a) / (2 * p.c);
      C = point(x, Math.sqrt(Math.max(0, p.b * p.b - x * x)));
    } else if (kind === "sas") C = at(A, p.b, rad(p.angle));
    else {
      const AC =
        (p.c * Math.sin(rad(p.beta))) / Math.sin(rad(p.alpha + p.beta));
      C = at(A, AC, rad(p.alpha));
    }
    const high = Math.max(4, C.y) + 2,
      sourceC = givenSegment(givens, point(0, high), p.c, "UV");
    givens.push(mark("A", A));
    steps.push(
      step(
        "밑변을 놓을 반직선 긋기",
        "점 A에서 반직선을 눈금 없는 자로 긋습니다.",
        ruler(A, point(p.c + 2, 0)),
        [line(A, point(p.c + 2, 0), { aux: true })],
      ),
    );
    measured(steps, ...sourceC, "주어진 밑변 AB의 길이를 컴퍼스에 담습니다.");
    steps.push(
      step(
        "밑변 AB 만들기",
        "A를 중심으로 호를 그려 반직선과 만나는 점 B를 잡습니다.",
        compass(A, p.c, -0.4, 0.4),
        [
          arc(A, p.c, -0.4, 0.4),
          mark("B", B),
          line(A, B, { result: true, at: 0.95 }),
        ],
      ),
    );
    if (kind === "sss") {
      const sourceB = givenSegment(givens, point(0, high + 1.3), p.b, "WX"),
        sourceA = givenSegment(givens, point(0, high + 2.6), p.a, "YZ");
      measured(steps, ...sourceB, "변 AC에 해당하는 길이를 컴퍼스에 담습니다.");
      const ta = Math.atan2(C.y, C.x),
        tb = Math.atan2(C.y, C.x - p.c);
      steps.push(
        step(
          "A를 중심으로 호 그리기",
          "A를 중심으로 AC의 길이를 반지름으로 하는 호를 그립니다.",
          compass(A, p.b, ta - 0.55, ta + 0.55),
          [arc(A, p.b, ta - 0.55, ta + 0.55)],
        ),
      );
      measured(steps, ...sourceA, "변 BC에 해당하는 길이를 컴퍼스에 담습니다.");
      steps.push(
        step(
          "B를 중심으로 호 그리기",
          "B를 중심으로 BC의 길이를 반지름으로 하는 호를 그립니다. 위쪽 교점을 C로 잡습니다.",
          compass(B, p.a, tb - 0.55, tb + 0.55),
          [arc(B, p.a, tb - 0.55, tb + 0.55), mark("C", C)],
        ),
      );
      steps.push(
        step("A와 C 잇기", "눈금 없는 자로 A와 C를 잇습니다.", ruler(A, C), [
          line(A, C, { result: true }),
        ]),
      );
    } else if (kind === "sas") {
      const O = point(p.c + 5, high),
        theta = rad(p.angle);
      givenAngle(givens, O, theta, "O", 1.7);
      copyAngle(steps, givens, {
        source: O,
        angle: theta,
        target: A,
        radius: Math.min(1.7, p.c * 0.4, p.b * 0.4),
        rayLength: p.b + 1.5,
        tag: "D",
      });
      const sourceB = givenSegment(givens, point(0, high + 1.3), p.b, "WX");
      measured(steps, ...sourceB, "변 AC의 길이를 컴퍼스에 담습니다.");
      steps.push(
        step(
          "다른 변의 끝점 C 잡기",
          "A를 중심으로 AC 길이의 호를 그려 새 반직선과 만나는 점 C를 잡습니다.",
          compass(A, p.b, theta - 0.4, theta + 0.4),
          [
            arc(A, p.b, theta - 0.4, theta + 0.4),
            mark("C", C),
            line(A, C, { result: true, at: 0.95 }),
          ],
        ),
      );
    } else {
      const O = point(0, high + 2),
        T = point(7, high + 2);
      givenAngle(givens, O, rad(p.alpha), "O", 1.7);
      givenAngle(givens, T, rad(p.beta), "T", 1.7);
      copyAngle(steps, givens, {
        source: O,
        angle: rad(p.alpha),
        target: A,
        radius: Math.min(1.7, p.c * 0.3),
        rayLength: distance(A, C) * 1.15,
        tag: "D",
      });
      copyAngle(steps, givens, {
        source: T,
        angle: rad(p.beta),
        target: B,
        heading: Math.PI,
        sign: -1,
        radius: Math.min(1.7, p.c * 0.3),
        rayLength: distance(B, C) * 1.15,
        tag: "E",
      });
      steps.push(
        step(
          "두 반직선의 교점 C 잡기",
          "눈금 없는 자로 첫 번째 변을 다시 따라 그으며 두 반직선의 교점을 C로 표시합니다.",
          ruler(A, C),
          [mark("C", C), line(A, C, { result: true })],
        ),
      );
    }
    steps.push(
      step(
        "삼각형 ABC 완성하기",
        "눈금 없는 자로 B와 C를 이어 삼각형 ABC를 완성합니다.",
        ruler(B, C),
        [line(B, C, { result: true })],
      ),
    );
    proof =
      kind === "sss"
        ? `AB = ${n(p.c)}, AC = ${n(p.b)}, BC = ${n(p.a)} cm`
        : kind === "sas"
          ? `AB = ${n(p.c)} cm, AC = ${n(p.b)} cm, ∠A = ${n(p.angle)}°`
          : `AB = ${n(p.c)} cm, ∠A = ${n(p.alpha)}°, ∠B = ${n(p.beta)}°`;
    Object.assign(data, { A, B, C });
  } else if (kind === "bisector") {
    title = "선분의 수직이등분선";
    const A = point(-3, 0),
      B = point(3, 0),
      R = 4.5,
      h = Math.sqrt(R * R - 9),
      P = point(0, h),
      Q = point(0, -h);
    givens.push(line(A, B, { given: true }), mark("A", A), mark("B", B));
    steps.push(
      step(
        "A를 중심으로 두 호 그리기",
        "선분 AB의 절반보다 크게 컴퍼스를 벌려 A를 중심으로 위아래를 지나는 호를 그립니다.",
        compass(A, R, -1.2, 1.2),
        [arc(A, R, -1.2, 1.2)],
      ),
    );
    steps.push(
      step(
        "같은 간격으로 B에서 호 그리기",
        "컴퍼스 간격을 바꾸지 않고 B를 중심으로 호를 그려 두 교점 P, Q를 잡습니다.",
        compass(B, R, Math.PI - 1.2, Math.PI + 1.2),
        [arc(B, R, Math.PI - 1.2, Math.PI + 1.2), mark("P", P), mark("Q", Q)],
      ),
    );
    steps.push(
      step(
        "두 교점을 잇기",
        "눈금 없는 자로 P와 Q를 잇고 양쪽으로 연장합니다.",
        ruler(point(0, h + 1), point(0, -h - 1)),
        [
          line(point(0, h + 1), point(0, -h - 1), { result: true }),
          mark("M", point(0, 0)),
          { type: "right", p: point(0, 0) },
        ],
      ),
    );
    proof = "AM = MB, PQ ⟂ AB";
    Object.assign(data, { A, B, P, Q, M: point(0, 0) });
  } else if (kind === "angleBisector") {
    title = "각의 이등분선";
    const O = point(0, 0),
      theta = rad(p.angle),
      D = point(3, 0),
      E = at(O, 3, theta),
      F = add(D, E);
    givenAngle(givens, O, theta, "O", 3.7);
    steps.push(
      step(
        "각의 두 변에서 같은 거리 잡기",
        "O를 중심으로 호를 그려 두 변과 만나는 점 D, E를 잡습니다.",
        compass(O, 3, 0, theta + 0.15),
        [arc(O, 3, 0, theta + 0.15), mark("D", D), mark("E", E)],
      ),
    );
    steps.push(
      step(
        "D를 중심으로 호 그리기",
        "D를 중심으로 반지름 3인 호를 각의 안쪽에 그립니다.",
        compass(D, 3, theta - 0.55, theta + 0.55),
        [arc(D, 3, theta - 0.55, theta + 0.55)],
      ),
    );
    steps.push(
      step(
        "같은 간격으로 E에서 호 그리기",
        "같은 반지름으로 E를 중심으로 호를 그려 O가 아닌 교점 F를 잡습니다.",
        compass(E, 3, -0.55, 0.55),
        [arc(E, 3, -0.55, 0.55), mark("F", F)],
      ),
    );
    steps.push(
      step(
        "O와 F 잇기",
        "눈금 없는 자로 O와 F를 이으면 각을 이등분하는 반직선이 됩니다.",
        ruler(O, scale(F, 1.2)),
        [line(O, scale(F, 1.2), { result: true })],
      ),
    );
    proof = `이등분한 각은 각각 ${n(p.angle / 2)}°`;
    Object.assign(data, { O, D, E, F, theta });
  } else {
    title = "수선의 작도";
    const outside = variant === "outside",
      P = point(0, outside ? 4 : 0),
      A = point(-3, 0),
      B = point(3, 0),
      R = outside ? 5 : 4.5,
      F = point(0, outside ? -4 : Math.sqrt(R * R - 9));
    givens.push(
      line(point(-6, 0), point(6, 0), { given: true }),
      mark("P", P),
      label("직선 ℓ", point(6, 0.6)),
    );
    steps.push(
      step(
        "직선 위에 두 점 A, B 잡기",
        "P를 중심으로 호를 그려 직선과 만나는 두 점 A, B를 잡습니다.",
        compass(
          P,
          outside ? 5 : 3,
          outside ? -2.5 : 0,
          outside ? -0.65 : Math.PI,
        ),
        [
          arc(
            P,
            outside ? 5 : 3,
            outside ? -2.5 : 0,
            outside ? -0.65 : Math.PI,
          ),
          mark("A", A),
          mark("B", B),
        ],
      ),
    );
    const a = Math.atan2(F.y - A.y, F.x - A.x),
      b = Math.atan2(F.y - B.y, F.x - B.x);
    steps.push(
      step(
        "A를 중심으로 호 그리기",
        "AB의 절반보다 큰 반지름으로 A를 중심으로 호를 그립니다.",
        compass(A, R, a - 0.5, a + 0.5),
        [arc(A, R, a - 0.5, a + 0.5)],
      ),
    );
    steps.push(
      step(
        "같은 간격으로 B에서 호 그리기",
        "같은 간격으로 B에서도 호를 그려 두 호의 교점 F를 잡습니다.",
        compass(B, R, b - 0.5, b + 0.5),
        [arc(B, R, b - 0.5, b + 0.5), mark("F", F)],
      ),
    );
    steps.push(
      step(
        "점 P와 교점 F 잇기",
        "눈금 없는 자로 P와 F를 잇습니다. 만들어진 직선은 ℓ에 수직입니다.",
        ruler(
          point(0, Math.max(P.y, F.y) + 1),
          point(0, Math.min(P.y, F.y) - 1),
        ),
        [
          line(
            point(0, Math.max(P.y, F.y) + 1),
            point(0, Math.min(P.y, F.y) - 1),
            { result: true },
          ),
          { type: "right", p: point(0, 0) },
          ...(outside ? [mark("H", point(0, 0))] : []),
        ],
      ),
    );
    proof = "PF ⟂ ℓ";
    Object.assign(data, { P, A, B, F, outside });
  }
  return { valid: true, kind, title, givens, steps, proof, data };
}
export function constructionBounds(lesson) {
  const points = [];
  for (const shape of [
    ...lesson.givens,
    ...lesson.steps.flatMap((s) => s.shapes),
  ]) {
    if (shape.type === "line") points.push(shape.a, shape.b);
    else if (
      shape.type === "point" ||
      shape.type === "text" ||
      shape.type === "right"
    )
      points.push(shape.p);
    else if (shape.type === "arc")
      for (let i = 0; i <= 24; i++)
        points.push(
          at(
            shape.center,
            shape.radius,
            shape.start + ((shape.end - shape.start) * i) / 24,
          ),
        );
  }
  for (const s of lesson.steps) {
    const t = s.tool;
    if (t.type === "compass")
      points.push(
        t.center,
        at(t.center, t.radius, t.start),
        at(t.center, t.radius, t.end),
      );
    else points.push(t.a, t.b);
  }
  return {
    minX: Math.min(...points.map((p) => p.x)),
    maxX: Math.max(...points.map((p) => p.x)),
    minY: Math.min(...points.map((p) => p.y)),
    maxY: Math.max(...points.map((p) => p.y)),
  };
}
