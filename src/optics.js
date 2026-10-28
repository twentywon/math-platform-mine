export const opticalElements = [
  {
    id: "convexMirror",
    name: "볼록 거울",
    kind: "mirror",
    behavior: "퍼지는 빛",
    description:
      "평행하게 들어온 빛이 반사된 뒤 퍼집니다. 뒤로 연장한 선은 거울 뒤쪽에서 만납니다.",
  },
  {
    id: "concaveMirror",
    name: "오목 거울",
    kind: "mirror",
    behavior: "모이는 빛",
    description:
      "광축과 가까운 평행광은 반사된 뒤 거울 앞쪽 초점 부근으로 모입니다.",
  },
  {
    id: "convexLens",
    name: "볼록 렌즈",
    kind: "lens",
    behavior: "모이는 빛",
    description:
      "평행광이 렌즈의 두 면에서 굴절하여 반대쪽 초점 부근으로 모입니다.",
  },
  {
    id: "concaveLens",
    name: "오목 렌즈",
    kind: "lens",
    behavior: "퍼지는 빛",
    description:
      "렌즈를 지난 빛이 퍼집니다. 뒤로 연장한 선은 광원 쪽의 초점 부근에서 만납니다.",
  },
];
export const view = { left: -14, right: 17, bottom: -7, top: 7 };
export const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y }),
  sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y }),
  mul = (a, k) => ({ x: a.x * k, y: a.y * k }),
  dot = (a, b) => a.x * b.x + a.y * b.y,
  norm = (a) => Math.hypot(a.x, a.y),
  unit = (a) => mul(a, 1 / norm(a));
export function reflect(direction, normal) {
  const d = unit(direction),
    n = unit(normal);
  return unit(sub(d, mul(n, 2 * dot(d, n))));
}
export function refract(direction, normal, n1, n2) {
  const d = unit(direction);
  let n = unit(normal);
  if (dot(d, n) > 0) n = mul(n, -1);
  const cosine = -dot(d, n),
    ratio = n1 / n2,
    k = 1 - ratio * ratio * (1 - cosine * cosine);
  if (k < 0) return { direction: reflect(d, n), tir: true };
  return {
    direction: unit(
      add(mul(d, ratio), mul(n, ratio * cosine - Math.sqrt(Math.max(0, k)))),
    ),
    tir: false,
  };
}
export function elementSurfaces(id) {
  if (id === "concaveMirror")
    return [
      {
        kind: "circle",
        center: { x: -8, y: 0 },
        radius: 8,
        branch: 1,
        aperture: 4.6,
        id: "mirror",
      },
    ];
  if (id === "convexMirror")
    return [
      {
        kind: "circle",
        center: { x: 8, y: 0 },
        radius: 8,
        branch: -1,
        aperture: 4.6,
        id: "mirror",
      },
    ];
  const convex = id === "convexLens",
    R = 9,
    t = convex ? 2.2 : 1.2,
    a = 4;
  const left = {
    kind: "circle",
    center: { x: convex ? R - t / 2 : -R - t / 2, y: 0 },
    radius: R,
    branch: convex ? -1 : 1,
    aperture: a,
    id: "front",
  };
  const right = {
    kind: "circle",
    center: { x: convex ? -R + t / 2 : R + t / 2, y: 0 },
    radius: R,
    branch: convex ? 1 : -1,
    aperture: a,
    id: "back",
  };
  return [
    left,
    right,
    ...[-a, a].map((y) => ({
      kind: "edge",
      a: { x: surfaceX(left, y), y },
      b: { x: surfaceX(right, y), y },
      normal: { x: 0, y: Math.sign(y) },
      id: y > 0 ? "top" : "bottom",
    })),
  ];
}
export function surfaceX(s, y) {
  return (
    s.center.x + s.branch * Math.sqrt(Math.max(0, s.radius * s.radius - y * y))
  );
}
function intersect(origin, direction, surface) {
  if (surface.kind === "circle") {
    const oc = sub(origin, surface.center),
      b = dot(oc, direction),
      c = dot(oc, oc) - surface.radius ** 2,
      disc = b * b - c;
    if (disc < 0) return null;
    for (const t of [-b - Math.sqrt(disc), -b + Math.sqrt(disc)]) {
      if (t < 1e-6) continue;
      const p = add(origin, mul(direction, t));
      if (
        Math.abs(p.y) > surface.aperture + 1e-8 ||
        (p.x - surface.center.x) * surface.branch < 0
      )
        continue;
      return {
        point: p,
        t,
        normal: unit(sub(p, surface.center)),
        surface: surface.id,
      };
    }
    return null;
  }
  if (Math.abs(direction.y) < 1e-10) return null;
  const t = (surface.a.y - origin.y) / direction.y,
    p = add(origin, mul(direction, t));
  if (
    t < 1e-6 ||
    p.x < Math.min(surface.a.x, surface.b.x) - 1e-8 ||
    p.x > Math.max(surface.a.x, surface.b.x) + 1e-8
  )
    return null;
  return { point: p, t, normal: surface.normal, surface: surface.id };
}
export function boundaryEnd(origin, direction) {
  const candidates = [];
  if (Math.abs(direction.x) > 1e-10)
    for (const x of [view.left, view.right]) {
      const t = (x - origin.x) / direction.x,
        y = origin.y + t * direction.y;
      if (t > 1e-7 && y >= view.bottom - 1e-8 && y <= view.top + 1e-8)
        candidates.push({ t, point: { x, y } });
    }
  if (Math.abs(direction.y) > 1e-10)
    for (const y of [view.bottom, view.top]) {
      const t = (y - origin.y) / direction.y,
        x = origin.x + t * direction.x;
      if (t > 1e-7 && x >= view.left - 1e-8 && x <= view.right + 1e-8)
        candidates.push({ t, point: { x, y } });
    }
  return candidates.sort((a, b) => a.t - b.t)[0]?.point || origin;
}
export function traceLaser(
  id,
  height,
  index = 1.5,
  direction = { x: 1, y: 0 },
) {
  let origin = { x: -11, y: height },
    d = unit(direction),
    inside = false;
  const surfaces = elementSurfaces(id),
    segments = [],
    hits = [];
  const mirror = id.endsWith("Mirror");
  for (let i = 0; i < 10; i++) {
    const candidates = surfaces
        .map((s) => intersect(origin, d, s))
        .filter(Boolean)
        .sort((a, b) => a.t - b.t),
      hit = candidates[0];
    if (!hit) {
      segments.push({ a: origin, b: boundaryEnd(origin, d), inside });
      break;
    }
    segments.push({ a: origin, b: hit.point, inside });
    if (mirror) {
      d = reflect(d, hit.normal);
      hits.push({
        ...hit,
        incoming: segments.at(-1),
        outgoing: d,
        kind: "reflection",
      });
      segments.push({
        a: hit.point,
        b: boundaryEnd(hit.point, d),
        inside: false,
      });
      break;
    }
    const next = refract(d, hit.normal, inside ? index : 1, inside ? 1 : index);
    hits.push({
      ...hit,
      incoming: segments.at(-1),
      outgoing: next.direction,
      kind: next.tir ? "internal" : "refraction",
    });
    d = next.direction;
    if (!next.tir) inside = !inside;
    if (!inside) {
      segments.push({
        a: hit.point,
        b: boundaryEnd(hit.point, d),
        inside: false,
      });
      break;
    }
    origin = hit.point;
  }
  const last = hits.at(-1),
    diverging = id === "convexMirror" || id === "concaveLens";
  const extension =
    last && diverging
      ? { a: last.point, b: boundaryEnd(last.point, mul(last.outgoing, -1)) }
      : null;
  return { segments, hits, extension, missed: hits.length === 0 };
}
export function focalPosition(id, index = 1.5) {
  const ray = traceLaser(id, 0.0001, index),
    hit = ray.hits.at(-1);
  if (!hit || Math.abs(hit.outgoing.y) < 1e-12) return null;
  return hit.point.x - (hit.point.y * hit.outgoing.x) / hit.outgoing.y;
}
export function evenlySpaced(count) {
  return count === 1
    ? [0]
    : Array.from({ length: count }, (_, i) =>
        Number((-2.8 + (5.6 * i) / (count - 1)).toFixed(1)),
      );
}
