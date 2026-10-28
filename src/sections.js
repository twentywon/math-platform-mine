// Convex solid/plane intersection. Curved surfaces use 192 meridians for drawing;
// the sphere section is calculated analytically. All coordinates are unitless.
export const add = (a, b) => a.map((v, i) => v + b[i]);
export const sub = (a, b) => a.map((v, i) => v - b[i]);
export const mul = (a, k) => a.map((v) => v * k);
export const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
export const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
export const unit = (a) => mul(a, 1 / Math.hypot(...a));
export function basis(n) {
  const u = unit(cross(n, Math.abs(n[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]));
  return [u, cross(n, u)];
}
function mesh(id, name, vertices, faces, curved = false) {
  const map = new Map();
  faces.forEach((f) =>
    f.forEach((a, i) => {
      const b = f[(i + 1) % f.length];
      map.set([Math.min(a, b), Math.max(a, b)].join(","), [a, b]);
    }),
  );
  return { id, name, vertices, faces, edges: [...map.values()], curved };
}
const box = (x, y, z) => [
  [-x, -y, -z],
  [x, -y, -z],
  [x, -y, z],
  [-x, -y, z],
  [-x, y, -z],
  [x, y, -z],
  [x, y, z],
  [-x, y, z],
];
const boxFaces = [
  [0, 3, 2, 1],
  [4, 5, 6, 7],
  [0, 1, 5, 4],
  [1, 2, 6, 5],
  [2, 3, 7, 6],
  [3, 0, 4, 7],
];
function roundSolid(cone = false) {
  const count = 192,
    base = Array.from({ length: count }, (_, i) => [
      Math.cos((i * 2 * Math.PI) / count),
      -1,
      Math.sin((i * 2 * Math.PI) / count),
    ]),
    vertices = cone
      ? [...base, [0, 1, 0]]
      : [...base, ...base.map(([x, , z]) => [x, 1, z])];
  const faces = [Array.from({ length: count }, (_, i) => i)];
  if (!cone) faces.push(Array.from({ length: count }, (_, i) => i + count));
  for (let i = 0; i < count; i++)
    faces.push(
      cone
        ? [i, (i + 1) % count, count]
        : [i, (i + 1) % count, ((i + 1) % count) + count, i + count],
    );
  return mesh(
    cone ? "cone" : "cylinder",
    cone ? "원뿔" : "원기둥",
    vertices,
    faces,
    true,
  );
}
export const sectionSolids = [
  mesh("cube", "정육면체", box(1, 1, 1), boxFaces),
  mesh("box", "직육면체", box(1.25, 0.85, 0.7), boxFaces),
  mesh(
    "tetrahedron",
    "정사면체",
    [
      [1, 1, 1],
      [1, -1, -1],
      [-1, 1, -1],
      [-1, -1, 1],
    ],
    [
      [0, 1, 2],
      [0, 3, 1],
      [0, 2, 3],
      [1, 3, 2],
    ],
  ),
  mesh(
    "prism",
    "삼각기둥",
    [
      [-1, -1, -0.7],
      [1, -1, -0.7],
      [0, -1, 1],
      [-1, 1, -0.7],
      [1, 1, -0.7],
      [0, 1, 1],
    ],
    [
      [0, 2, 1],
      [3, 4, 5],
      [0, 1, 4, 3],
      [1, 2, 5, 4],
      [2, 0, 3, 5],
    ],
  ),
  mesh(
    "pyramid",
    "사각뿔",
    [
      [-1, -1, -1],
      [1, -1, -1],
      [1, -1, 1],
      [-1, -1, 1],
      [0, 1, 0],
    ],
    [
      [0, 3, 2, 1],
      [0, 1, 4],
      [1, 2, 4],
      [2, 3, 4],
      [3, 0, 4],
    ],
  ),
  roundSolid(),
  roundSolid(true),
  {
    id: "sphere",
    name: "구",
    curved: true,
    vertices: [],
    faces: [],
    edges: [],
  },
];
export function planeNormal(tilt, azimuth) {
  const t = (tilt * Math.PI) / 180,
    a = (azimuth * Math.PI) / 180;
  return [Math.sin(t) * Math.cos(a), Math.cos(t), Math.sin(t) * Math.sin(a)];
}
export function planeExtent(solid, n) {
  if (solid.id === "sphere") return [-1, 1];
  const v = solid.vertices.map((v) => dot(v, n));
  return [Math.min(...v), Math.max(...v)];
}
export function planeOffset(solid, n, percent) {
  const [lo, hi] = planeExtent(solid, n);
  return (lo + hi) / 2 + (((hi - lo) / 2) * percent) / 100;
}
export function intersectSolid(solid, n, d) {
  const [u, v] = basis(n);
  let points = [];
  if (solid.id === "sphere") {
    if (Math.abs(d) > 1 + 1e-8) return result([]);
    const r = Math.sqrt(Math.max(0, 1 - d * d));
    points =
      r < 1e-7
        ? [mul(n, d)]
        : Array.from({ length: 192 }, (_, i) =>
            add(
              mul(n, d),
              add(
                mul(u, r * Math.cos((i * Math.PI) / 96)),
                mul(v, r * Math.sin((i * Math.PI) / 96)),
              ),
            ),
          );
  } else {
    const push = (p) => {
      if (!points.some((q) => Math.hypot(...sub(q, p)) < 1e-7)) points.push(p);
    };
    for (const [a, b] of solid.edges) {
      const p = solid.vertices[a],
        q = solid.vertices[b],
        da = dot(p, n) - d,
        db = dot(q, n) - d;
      if (Math.abs(da) < 1e-8) push(p);
      if (Math.abs(db) < 1e-8) push(q);
      if (da * db < -1e-16) push(add(p, mul(sub(q, p), da / (da - db))));
    }
  }
  return result(points);
  function result(raw) {
    if (!raw.length)
      return { points: [], flat: [], kind: "없음", dimension: -1 };
    const center = mul(raw.reduce(add, [0, 0, 0]), 1 / raw.length);
    let ordered = raw
      .map((p) => ({ p, x: dot(sub(p, center), u), y: dot(sub(p, center), v) }))
      .sort((a, b) => Math.atan2(a.y, a.x) - Math.atan2(b.y, b.x));
    // A planar convex hull also handles tangency at an edge or a single point.
    if (solid.id !== "sphere" && ordered.length > 2) {
      const sorted = [...ordered].sort((a, b) => a.x - b.x || a.y - b.y);
      const turn = (a, b, c) =>
        (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
      const half = (arr) => {
        const out = [];
        for (const p of arr) {
          while (out.length > 1 && turn(out.at(-2), out.at(-1), p) <= 1e-10)
            out.pop();
          out.push(p);
        }
        return out;
      };
      ordered = [
        ...half(sorted).slice(0, -1),
        ...half([...sorted].reverse()).slice(0, -1),
      ];
    }
    const points = ordered.map((a) => a.p),
      flat = ordered.map((a) => [a.x, a.y]);
    let dimension = points.length === 1 ? 0 : points.length === 2 ? 1 : 2;
    let kind =
      dimension === 0 ? "점" : dimension === 1 ? "선분" : polygonKind(flat);
    if (dimension === 2 && solid.curved) {
      if (solid.id === "sphere" || Math.abs(n[1]) > 1 - 1e-8) kind = "원";
      else if (solid.id === "cylinder")
        kind =
          Math.abs(n[1]) < 1e-8
            ? "직사각형"
            : Math.abs(d / n[1]) + Math.hypot(n[0], n[2]) / Math.abs(n[1]) <=
                1 + 1e-7
              ? "타원"
              : "곡선과 선분으로 이루어진 단면";
      else if (solid.id === "cone")
        kind =
          Math.abs(d - n[1]) < 1e-7
            ? "삼각형"
            : Math.abs(-n[1] - d) > Math.hypot(n[0], n[2]) + 1e-7
              ? "타원"
              : "곡선과 선분으로 이루어진 단면";
    }
    return { points, flat, kind, dimension };
  }
}
function polygonKind(p) {
  const len = p.length;
  if (len === 3) return "삼각형";
  if (len === 4) {
    const edges = p.map((a, i) => sub(p[(i + 1) % len], a)),
      sides = edges.map((e) => Math.hypot(...e));
    const right = edges.every(
      (e, i) => Math.abs(dot(e, edges[(i + 1) % len])) < 1e-6,
    );
    if (right)
      return Math.max(...sides) - Math.min(...sides) < 1e-6
        ? "정사각형"
        : "직사각형";
    return "사각형";
  }
  return { 5: "오각형", 6: "육각형" }[len] || `${len}각형`;
}
