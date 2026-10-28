import nerdamer from "nerdamer";

const cache = new Map();
export function exact(expression) {
  const source = String(expression);
  if (cache.has(source)) return cache.get(source);
  let result = nerdamer(source).expand().toString();
  if (/^-?0(?:\.0+)?$/.test(result)) result = "0";
  if (cache.size >= 12000) cache.delete(cache.keys().next().value);
  cache.set(source, result);
  return result;
}
const add = (a, b) => exact(`(${a})+(${b})`),
  sub = (a, b) => exact(`(${a})-(${b})`),
  mul = (a, b) => exact(`(${a})*(${b})`),
  div = (a, b) => exact(`(${a})/(${b})`);
const vec = (x, y) => ({ x: exact(x), y: exact(y) }),
  plus = (a, b) => vec(add(a.x, b.x), add(a.y, b.y)),
  minus = (a, b) => vec(sub(a.x, b.x), sub(a.y, b.y)),
  times = (a, s) => vec(mul(a.x, s), mul(a.y, s));
const dot = (a, b) => add(mul(a.x, b.x), mul(a.y, b.y)),
  cross = (a, b) => sub(mul(a.x, b.y), mul(a.y, b.x)),
  norm = (a) => exact(`sqrt(${dot(a, a)})`);
function trig(turn) {
  // Exact regular-polygon angles, rather than recognizing rounded coordinates.
  const mod = ((turn % 10) + 10) % 10;
  const pentCos = [
    "1",
    "(1+sqrt(5))/4",
    "(sqrt(5)-1)/4",
    "(1-sqrt(5))/4",
    "-(1+sqrt(5))/4",
    "-1",
    "-(1+sqrt(5))/4",
    "(1-sqrt(5))/4",
    "(sqrt(5)-1)/4",
    "(1+sqrt(5))/4",
  ];
  const pentSin = [
    "0",
    "sqrt(10-2*sqrt(5))/4",
    "(1+sqrt(5))*sqrt(10-2*sqrt(5))/8",
    "(1+sqrt(5))*sqrt(10-2*sqrt(5))/8",
    "sqrt(10-2*sqrt(5))/4",
    "0",
    "-sqrt(10-2*sqrt(5))/4",
    "-(1+sqrt(5))*sqrt(10-2*sqrt(5))/8",
    "-(1+sqrt(5))*sqrt(10-2*sqrt(5))/8",
    "-sqrt(10-2*sqrt(5))/4",
  ];
  return [exact(pentCos[mod]), exact(pentSin[mod])];
}
function regularTrig(i, n) {
  return n === 5
    ? trig(i * 2)
    : [exact(`cos(2*${i}*pi/${n})`), exact(`sin(2*${i}*pi/${n})`)];
}
export function exactPolygon(id, d) {
  if (id === "rectangle")
    return [
      vec(0, 0),
      vec(0, d.height),
      vec(-d.width, d.height),
      vec(-d.width, 0),
    ];
  if (id === "right" || id === "isosceles") {
    const b = id === "right" ? d.base : d.side,
      h = id === "right" ? d.leg : d.side;
    return [vec(0, 0), vec(0, h), vec(-b, 0)];
  }
  const n = { triangle: 3, square: 4, pentagon: 5, hexagon: 6, octagon: 8 }[id],
    p = [vec(0, 0)];
  for (let i = 1; i < n; i++) {
    const [c, s] = regularTrig(i, n);
    p.push(plus(p.at(-1), vec(mul(d.side, c), mul(d.side, s))));
  }
  return p;
}
function exactBoundary(mode) {
  if (mode === "line") return [vec(0, 0), vec(10000, 0)];
  if (mode === "rectangle")
    return [vec(0, 0), vec(16, 0), vec(16, -10), vec(0, -10)];
  if (mode === "triangle") return [vec(0, 0), vec(16, 0), vec(8, -13)];
  const n = { equilateral: 3, square: 4, hexagon: 6 }[mode],
    side = { equilateral: 16, square: 12, hexagon: 8 }[mode],
    p = [vec(0, 0)];
  for (let i = 0; i < n - 1; i++) {
    const [c, s] = regularTrig(-i, n);
    p.push(plus(p.at(-1), times(vec(c, s), side)));
  }
  return p;
}
function rotateVector(p, c, s) {
  return vec(sub(mul(p.x, c), mul(p.y, s)), add(mul(p.x, s), mul(p.y, c)));
}
function segmentData(path, seg) {
  const a = path[seg % path.length],
    b = path[(seg + 1) % path.length],
    v = minus(b, a),
    length = norm(v);
  return { a, b, length, direction: times(v, div(1, length)) };
}
function cornerData(path, seg, mode) {
  const here = segmentData(path, seg),
    next = segmentData(path, seg + 1),
    cos = dot(here.direction, next.direction),
    sin = cross(here.direction, next.direction);
  const angle =
    mode === "rectangle" || mode === "square"
      ? "pi/2"
      : mode === "equilateral"
        ? "2*pi/3"
        : mode === "hexagon"
          ? "pi/3"
          : exact(`acos(${cos})`);
  return { angle, cos, sin };
}
function polygonModel(sim, id, d, mode, vertex) {
  const initial = exactPolygon(id, d),
    path = exactBoundary(mode),
    n = initial.length,
    events = [];
  let front = 0,
    seg = 0,
    along = "0",
    orientation = vec(1, 0);
  for (const event of sim.events) {
    const segment = segmentData(path, seg),
      frontPoint = plus(segment.a, times(segment.direction, along));
    let radius, angle, cos, sin;
    if (event.kind === "corner") {
      const relative = rotateVector(
        minus(initial[vertex], initial[front]),
        orientation.x,
        orientation.y,
      );
      radius = norm(minus(plus(frontPoint, relative), segment.b));
      ({ angle, cos, sin } = cornerData(path, seg, mode));
      seg++;
      along = sub(along, segment.length);
    } else {
      const k = Math.min((vertex - front + n) % n, (front - vertex + n) % n);
      const regularRadius = {
        triangle: ["0", d.side],
        square: ["0", d.side, `(${d.side})*sqrt(2)`],
        pentagon: ["0", d.side, `(${d.side})*(1+sqrt(5))/2`],
        hexagon: ["0", d.side, `(${d.side})*sqrt(3)`, `2*(${d.side})`],
        octagon: [
          "0",
          d.side,
          `(${d.side})*sqrt(2+sqrt(2))`,
          `(${d.side})*(1+sqrt(2))`,
          `(${d.side})*sqrt(4+2*sqrt(2))`,
        ],
      };
      radius = regularRadius[id]
        ? exact(regularRadius[id][k])
        : norm(minus(initial[vertex], initial[front]));
      const before = minus(initial[front], initial[(front + n - 1) % n]),
        after = minus(initial[(front + 1) % n], initial[front]),
        den = mul(norm(before), norm(after));
      if (
        ["triangle", "square", "pentagon", "hexagon", "octagon"].includes(id)
      ) {
        const turn = regularTrig(1, n);
        cos = turn[0];
        sin = mul(-1, turn[1]);
      } else {
        cos = div(dot(before, after), den);
        sin = mul(-1, div(cross(before, after), den));
      }
      angle =
        id === "rectangle"
          ? "pi/2"
          : id === "isosceles"
            ? front === 0
              ? "pi/2"
              : "3*pi/4"
            : id === "right"
              ? exact(`acos(${cos})`)
              : exact(`2*pi/${n}`);
      along = add(along, norm(after));
      front = (front + 1) % n;
    }
    events.push({ radius, angle, kind: event.kind });
    if (mode !== "line") orientation = rotateVector(orientation, cos, sin);
  }
  return { events, sim, isCircle: false };
}
function primitive(expression, value) {
  const k = Math.floor(value / (2 * Math.PI));
  return exact(`4*${k}+2-2*cos(((${expression})-2*${k}*pi)/2)`);
}
function circleModel(sim, d, mode, vertex) {
  const path = exactBoundary(mode),
    events = [],
    r = exact(d.radius);
  let seg = 0,
    along = "0",
    rotation = "0",
    rotationValue = 0,
    heading = "0",
    headingValue = 0;
  for (const event of sim.events) {
    const phase = exact(`${vertex}*pi/2-(${rotation})-(${heading})`),
      phaseValue = (vertex * Math.PI) / 2 - rotationValue - headingValue;
    let angle, radius;
    if (event.kind === "corner") {
      angle = cornerData(path, seg, mode).angle;
      radius = exact(`sqrt(2*(${r})^2*(1-cos(${phase})))`);
      seg++;
      along = "0";
      heading = sub(heading, angle);
      headingValue -= Math.abs(event.angle);
    } else {
      const fullQuarter = Math.abs(event.angle + Math.PI / 2) < 1e-9;
      const travel = fullQuarter
        ? exact(`(${r})*pi/2`)
        : sub(segmentData(path, seg).length, along);
      angle = div(travel, r);
      along = add(along, travel);
    }
    events.push({ radius, angle, phase, phaseValue, kind: event.kind });
    rotation = add(rotation, angle);
    rotationValue += Math.abs(event.angle);
  }
  return { events, sim, radius: r, isCircle: true };
}
export function exactModel(sim, id, dimensions, mode, vertex) {
  return id === "circle"
    ? circleModel(sim, dimensions, mode, vertex)
    : polygonModel(sim, id, dimensions, mode, vertex);
}
export function exactEventLength(model, index, t = 1) {
  const e = model.events[index],
    fraction = exact(String(t));
  if (fraction === "0") return "0";
  if (e.kind !== "circle-roll")
    return exact(`(${e.radius})*(${e.angle})*(${fraction})`);
  const end = sub(e.phase, mul(e.angle, fraction)),
    endValue = e.phaseValue - Math.abs(model.sim.events[index].angle) * t;
  return exact(
    `2*(${model.radius})*((${primitive(e.phase, e.phaseValue)})-(${primitive(end, endValue)}))`,
  );
}
export function exactState(model, progress) {
  const p = Math.max(0, Math.min(progress, model.events.length)),
    completed = Math.floor(p),
    fraction = Number((p - completed).toFixed(2)),
    index = Math.min(completed, model.events.length - 1),
    e = model.events[index];
  model.prefix ||= ["0"];
  while (model.prefix.length <= completed) {
    const i = model.prefix.length - 1;
    model.prefix.push(add(model.prefix[i], exactEventLength(model, i)));
  }
  let length = model.prefix[completed];
  if (completed < model.events.length)
    length = add(length, exactEventLength(model, index, fraction));
  const t = completed === model.events.length ? 1 : fraction;
  const radius =
    e.kind === "circle-roll"
      ? exact(
          `sqrt(2*(${model.radius})^2*(1-cos((${e.phase})-(${e.angle})*${t})))`,
        )
      : e.radius;
  return {
    length,
    radius,
    degrees: exact(`(${e.angle})*180/pi`),
    actualDegrees: exact(`(${e.angle})*180/pi*${t}`),
  };
}
export function exactHypotenuse(a, b) {
  return exact(`sqrt((${a})^2+(${b})^2)`);
}
const latexCache = new Map();
export function latex(expression) {
  if (latexCache.has(expression)) return latexCache.get(expression);
  const text = nerdamer(expression).toTeX();
  if (latexCache.size >= 1200)
    latexCache.delete(latexCache.keys().next().value);
  latexCache.set(expression, text);
  return text;
}
// Readable text for SVG labels and accessibility; the metric cards use MathML.
export function exactText(expression) {
  const tex = latex(expression).replace(/\\left|\\right/g, "");
  let index = 0;
  function readGroup() {
    while (tex[index] === " ") index++;
    if (tex[index] === "{") {
      index++;
      return read("}");
    }
    return tex[index++] || "";
  }
  function read(end) {
    let out = "";
    while (index < tex.length) {
      const ch = tex[index++];
      if (ch === end) break;
      if (ch === "\\") {
        let command = "";
        while (/[a-zA-Z]/.test(tex[index] || "") && index < tex.length)
          command += tex[index++];
        if (command === "frac") {
          const numerator = readGroup(),
            denominator = readGroup();
          out += `(${numerator})/(${denominator})`;
        } else if (command === "sqrt") {
          const radicand = readGroup();
          out += /^\d+$/.test(radicand) ? `√${radicand}` : `√(${radicand})`;
        } else if (command === "pi") out += "π";
        else if (command === "cdot") out += "·";
        else out += command;
      } else if (ch === "{") out += read("}");
      else out += ch;
    }
    return out.replace(/\s+/g, "").trim();
  }
  return read();
}
export function valueOf(expression) {
  return Number(nerdamer(expression).evaluate().text("decimals"));
}
