import meshes from "./data/solids.json" with { type: "json" };
import encoded from "./data/nets.json" with { type: "json" };
export const solids = Object.entries(meshes).map(([id, s]) => ({ id, ...s }));
const catalog = new Map();
export function netsFor(id) {
  if (catalog.has(id)) return catalog.get(id);
  const text = atob(encoded[id]),
    bytes = Uint8Array.from(text, (c) => c.charCodeAt(0)),
    view = new DataView(bytes.buffer),
    nets = Array.from({ length: bytes.length / 4 }, (_, i) =>
      view.getUint32(i * 4, true),
    );
  catalog.set(id, nets);
  return nets;
}
export const add = (a, b) => a.map((x, i) => x + b[i]),
  sub = (a, b) => a.map((x, i) => x - b[i]),
  mul = (a, s) => a.map((x) => x * s),
  dot = (a, b) => a.reduce((sum, x, i) => sum + x * b[i], 0),
  cross = (a, b) => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ],
  norm = (a) => Math.hypot(...a),
  unit = (a) => mul(a, 1 / norm(a)),
  mean = (p) => mul(p.reduce(add, [0, 0, 0]), 1 / p.length);
const identity = () => ({ r: [1, 0, 0, 0, 1, 0, 0, 0, 1], t: [0, 0, 0] });
function applyRotation(r, p) {
  return [
    r[0] * p[0] + r[1] * p[1] + r[2] * p[2],
    r[3] * p[0] + r[4] * p[1] + r[5] * p[2],
    r[6] * p[0] + r[7] * p[1] + r[8] * p[2],
  ];
}
function apply(m, p) {
  return add(applyRotation(m.r, p), m.t);
}
function compose(a, b) {
  const r = [];
  for (let row = 0; row < 3; row++)
    for (let col = 0; col < 3; col++)
      r.push(
        a.r[row * 3] * b.r[col] +
          a.r[row * 3 + 1] * b.r[3 + col] +
          a.r[row * 3 + 2] * b.r[6 + col],
      );
  return { r, t: add(applyRotation(a.r, b.t), a.t) };
}
function hinge(a, b, angle) {
  const [x, y, z] = unit(sub(b, a)),
    c = Math.cos(angle),
    s = Math.sin(angle),
    t = 1 - c,
    r = [
      t * x * x + c,
      t * x * y - s * z,
      t * x * z + s * y,
      t * x * y + s * z,
      t * y * y + c,
      t * y * z - s * x,
      t * x * z - s * y,
      t * y * z + s * x,
      t * z * z + c,
    ];
  return { r, t: sub(a, applyRotation(r, a)) };
}
export function createNet(solid, mask) {
  const normals = solid.faces.map((face) =>
    unit(mean(face.map((i) => solid.vertices[i]))),
  );
  const tree = [{ face: 0, parent: -1, edge: -1, angle: 0 }],
    visited = new Set([0]);
  for (const entry of tree) {
    for (const edge of solid.faceEdges[entry.face]) {
      if (!(mask & (1 << edge))) continue;
      const child = solid.edgeFaces[edge].find((i) => i !== entry.face);
      if (visited.has(child)) continue;
      visited.add(child);
      const [a, b] = solid.edges[edge].map((i) => solid.vertices[i]),
        axis = unit(sub(b, a));
      const angle = Math.atan2(
        dot(axis, cross(normals[child], normals[entry.face])),
        dot(normals[child], normals[entry.face]),
      );
      tree.push({ face: child, parent: entry.face, edge, angle });
    }
  }
  if (tree.length !== solid.faces.length) throw new Error("Disconnected net");
  const origin = mean(solid.faces[0].map((i) => solid.vertices[i])),
    x = unit(
      sub(solid.vertices[solid.faces[0][1]], solid.vertices[solid.faces[0][0]]),
    ),
    z = normals[0],
    y = cross(z, x);
  const frame = (p) => {
    const v = sub(p, origin);
    return [dot(v, x), dot(v, y), dot(v, z)];
  };
  return { solid, mask, tree, frame };
}
export function foldNet(net, amount) {
  const { solid, tree, frame } = net,
    matrices = [],
    faces = [];
  matrices[0] = identity();
  for (const entry of tree) {
    if (entry.parent >= 0) {
      const [a, b] = solid.edges[entry.edge].map((i) => solid.vertices[i]);
      matrices[entry.face] = compose(
        matrices[entry.parent],
        hinge(a, b, entry.angle * (1 - amount)),
      );
    }
  }
  for (let face = 0; face < solid.faces.length; face++)
    faces.push(
      solid.faces[face].map((i) =>
        frame(apply(matrices[face], solid.vertices[i])),
      ),
    );
  return faces;
}
export function netBounds(faces) {
  const points = faces.flat(),
    minX = Math.min(...points.map((p) => p[0])),
    maxX = Math.max(...points.map((p) => p[0])),
    minY = Math.min(...points.map((p) => p[1])),
    maxY = Math.max(...points.map((p) => p[1]));
  return { minX, maxX, minY, maxY, width: maxX - minX, height: maxY - minY };
}
export function polygonsOverlap(a, b) {
  for (const poly of [a, b])
    for (let i = 0; i < poly.length; i++) {
      const q = poly[i],
        r = poly[(i + 1) % poly.length],
        axis = [-(r[1] - q[1]), r[0] - q[0]],
        pa = a.map((p) => p[0] * axis[0] + p[1] * axis[1]),
        pb = b.map((p) => p[0] * axis[0] + p[1] * axis[1]);
      if (
        Math.max(...pa) <= Math.min(...pb) + 1e-7 ||
        Math.max(...pb) <= Math.min(...pa) + 1e-7
      )
        return false;
    }
  return true;
}
export const faceColors = [
  "#a8c9b2",
  "#edd1a8",
  "#b7cddd",
  "#d6bfd4",
  "#d5dca9",
  "#a9cfca",
  "#e0b9a5",
  "#bac3dc",
];
