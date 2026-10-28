export const shapes = [
  { id: "triangle", name: "정삼각형", n: 3 },
  { id: "square", name: "정사각형", n: 4 },
  { id: "pentagon", name: "정오각형", n: 5 },
  { id: "hexagon", name: "정육각형", n: 6 },
  { id: "octagon", name: "정팔각형", n: 8 },
  { id: "rectangle", name: "직사각형" },
  { id: "right", name: "직각삼각형" },
  { id: "isosceles", name: "직각이등변삼각형" },
  { id: "circle", name: "원" },
];
export const routes = [
  { id: "line", name: "직선" },
  { id: "rectangle", name: "사각형 둘레" },
  { id: "triangle", name: "삼각형 둘레" },
  { id: "equilateral", name: "정삼각형 둘레" },
  { id: "square", name: "정사각형 둘레" },
  { id: "hexagon", name: "정육각형 둘레" },
];
export const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const dims = (value) =>
  typeof value === "number"
    ? {
        side: value,
        width: value,
        height: value * 0.65,
        base: value,
        leg: value * 0.75,
        radius: value,
      }
    : value;
export function polygon(id, value) {
  const d = dims(value),
    s = d.side;
  if (id === "rectangle")
    return [
      { x: 0, y: 0 },
      { x: 0, y: d.height },
      { x: -d.width, y: d.height },
      { x: -d.width, y: 0 },
    ];
  if (id === "right" || id === "isosceles") {
    const b = id === "isosceles" ? s : d.base,
      h = id === "isosceles" ? s : d.leg;
    return [
      { x: 0, y: 0 },
      { x: 0, y: h },
      { x: -b, y: 0 },
    ];
  }
  if (id === "circle") {
    const r = d.radius;
    return [
      { x: 0, y: 0 },
      { x: r, y: r },
      { x: 0, y: 2 * r },
      { x: -r, y: r },
    ];
  }
  const n = shapes.find((v) => v.id === id).n,
    pts = [{ x: 0, y: 0 }];
  for (let i = 1; i < n; i++) {
    const a = (i * 2 * Math.PI) / n;
    pts.push({
      x: pts[i - 1].x + s * Math.cos(a),
      y: pts[i - 1].y + s * Math.sin(a),
    });
  }
  return pts;
}
export function rotate(p, c, a) {
  const x = p.x - c.x,
    y = p.y - c.y;
  return {
    x: c.x + x * Math.cos(a) - y * Math.sin(a),
    y: c.y + x * Math.sin(a) + y * Math.cos(a),
  };
}
function regularBoundary(n, side) {
  const p = [{ x: 0, y: 0 }];
  for (let i = 0; i < n - 1; i++) {
    const a = (-i * 2 * Math.PI) / n;
    p.push({ x: p[i].x + side * Math.cos(a), y: p[i].y + side * Math.sin(a) });
  }
  return p;
}
export function boundaryPolygon(mode) {
  if (mode === "rectangle")
    return [
      { x: 0, y: 0 },
      { x: 16, y: 0 },
      { x: 16, y: -10 },
      { x: 0, y: -10 },
    ];
  if (mode === "triangle")
    return [
      { x: 0, y: 0 },
      { x: 16, y: 0 },
      { x: 8, y: -13 },
    ];
  if (mode === "equilateral") return regularBoundary(3, 16);
  if (mode === "square") return regularBoundary(4, 12);
  if (mode === "hexagon") return regularBoundary(6, 8);
  return [];
}
export function boundary(mode) {
  if (mode === "line")
    return [
      { x: 0, y: 0 },
      { x: 10000, y: 0 },
    ];
  const p = boundaryPolygon(mode);
  return [...p, ...p, ...p, ...p, p[0]];
}
function turnAt(path, seg) {
  const a = path[seg],
    b = path[seg + 1],
    c = path[seg + 2];
  let angle =
    Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(b.y - a.y, b.x - a.x);
  while (angle > 0) angle -= 2 * Math.PI;
  while (angle <= -2 * Math.PI) angle += 2 * Math.PI;
  return angle;
}
export function eventAt(e, t) {
  if (e.kind === "circle-roll") {
    const center = {
      x: e.center.x + e.direction.x * e.travel * t,
      y: e.center.y + e.direction.y * e.travel * t,
    };
    return {
      center,
      points: e.points.map((p) => {
        const q = rotate(p, e.center, e.angle * t);
        return {
          x: q.x + center.x - e.center.x,
          y: q.y + center.y - e.center.y,
        };
      }),
      pivot: {
        x: e.pivot.x + e.direction.x * e.travel * t,
        y: e.pivot.y + e.direction.y * e.travel * t,
      },
    };
  }
  return {
    points: e.points.map((p) => rotate(p, e.pivot, e.angle * t)),
    center: e.center ? rotate(e.center, e.pivot, e.angle * t) : null,
    pivot: e.pivot,
  };
}
function circleSimulation(value, mode, count) {
  const radius = dims(value).radius,
    path = boundary(mode),
    initial = polygon("circle", value),
    events = [];
  let points = initial,
    center = { x: 0, y: radius },
    seg = 0,
    along = 0;
  while (events.length < count && path[seg + 1]) {
    const a = path[seg],
      b = path[seg + 1],
      len = distance(a, b),
      direction = { x: (b.x - a.x) / len, y: (b.y - a.y) / len };
    let e;
    if (along >= len - 1e-9) {
      if (!path[seg + 2]) break;
      e = {
        points,
        center,
        pivot: b,
        angle: turnAt(path, seg),
        kind: "corner",
      };
      seg++;
      along = 0;
    } else {
      const travel = Math.min((radius * Math.PI) / 2, len - along);
      e = {
        points,
        center,
        pivot: { x: a.x + direction.x * along, y: a.y + direction.y * along },
        angle: -travel / radius,
        kind: "circle-roll",
        travel,
        direction,
      };
      along += travel;
    }
    events.push(e);
    const end = eventAt(e, 1);
    points = end.points;
    center = end.center;
  }
  return {
    initial,
    initialCenter: { x: 0, y: radius },
    events,
    final: points,
    finalCenter: center,
    path,
    radius,
    isCircle: true,
    mode,
  };
}
export function simulate(id, value, mode, count = 12) {
  if (id === "circle") return circleSimulation(value, mode, count);
  let pts = polygon(id, value),
    front = 0,
    seg = 0;
  const path = boundary(mode),
    events = [];
  for (let k = 0; k < count; k++) {
    const start = path[seg],
      end = path[seg + 1];
    if (!end) break;
    const len = distance(start, end),
      dx = (end.x - start.x) / len,
      dy = (end.y - start.y) / len;
    const along = (pts[front].x - start.x) * dx + (pts[front].y - start.y) * dy;
    let pivot,
      angle,
      kind = "roll";
    if (along > len + 1e-7) {
      if (!path[seg + 2]) break;
      angle = turnAt(path, seg);
      pivot = end;
      kind = "corner";
      seg++;
    } else {
      pivot = pts[front];
      const prev = pts[(front + pts.length - 1) % pts.length],
        next = pts[(front + 1) % pts.length];
      const ax = pivot.x - prev.x,
        ay = pivot.y - prev.y,
        bx = next.x - pivot.x,
        by = next.y - pivot.y;
      angle = -Math.atan2(ax * by - ay * bx, ax * bx + ay * by);
    }
    events.push({
      points: pts.map((p) => ({ ...p })),
      pivot: { ...pivot },
      angle,
      kind,
    });
    pts = pts.map((p) => rotate(p, pivot, angle));
    if (kind === "roll") front = (front + 1) % pts.length;
  }
  return { initial: polygon(id, value), events, final: pts, path, mode };
}
// Primitive of |sin(x/2)|, continuous across full turns (including negative x).
function sinePrimitive(x) {
  const turns = Math.floor(x / (2 * Math.PI)),
    rest = x - turns * 2 * Math.PI;
  return 4 * turns + 2 * (1 - Math.cos(rest / 2));
}
export function eventLength(e, vertex, t, sim) {
  if (e.kind !== "circle-roll")
    return distance(e.points[vertex], e.pivot) * Math.abs(e.angle) * t;
  const p = e.points[vertex],
    contact = { x: e.pivot.x - e.center.x, y: e.pivot.y - e.center.y };
  const phase =
    Math.atan2(p.y - e.center.y, p.x - e.center.x) -
    Math.atan2(contact.y, contact.x);
  return (
    2 *
    sim.radius *
    (sinePrimitive(phase) - sinePrimitive(phase - Math.abs(e.angle) * t))
  );
}
export function stateAt(sim, progress, vertex) {
  const p = Math.max(0, Math.min(progress, sim.events.length)),
    completed = Math.floor(p),
    fraction = completed === sim.events.length ? 0 : p - completed,
    ev = sim.events[completed];
  const pose = ev
    ? eventAt(ev, fraction)
    : {
        points: sim.final,
        center: sim.finalCenter,
        pivot: eventAt(sim.events.at(-1), 1).pivot,
      };
  let length = 0;
  const traces = [];
  for (let i = 0; i < sim.events.length; i++) {
    const e = sim.events[i],
      part = i < completed ? 1 : i === completed ? fraction : 0;
    if (part > 0) {
      length += eventLength(e, vertex, part, sim);
      const samples = Math.max(1, Math.ceil(part * 64));
      for (let j = 0; j <= samples; j++)
        traces.push(eventAt(e, (part * j) / samples).points[vertex]);
    }
  }
  return { ...pose, length, traces, event: ev, completed, fraction };
}
