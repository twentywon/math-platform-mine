import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Sun,
  MoveVertical,
  RotateCcw,
  Lightbulb,
  Power,
  Info,
  Check,
} from "lucide-react";
import {
  opticalElements,
  elementSurfaces,
  surfaceX,
  traceLaser,
  focalPosition,
  evenlySpaced,
  view,
  add,
  mul,
} from "./optics.js";
import { useRafCallback } from "./useRafCallback.js";
import { readSession, saveSession } from "./session.js";
function OpticsScene({
  type,
  rays,
  positions,
  setPositions,
  index,
  on,
  extensions,
  normals,
  selected,
  setSelected,
}) {
  const svg = useRef(null),
    drag = useRef(null),
    W = 930,
    H = 470,
    S = (W - 62) / (view.right - view.left),
    xy = (p) => ({ x: 31 + (p.x - view.left) * S, y: H / 2 - p.y * S }),
    worldY = (event) => {
      const point = svg.current.createSVGPoint();
      point.x = event.clientX;
      point.y = event.clientY;
      return (
        -(
          point.matrixTransform(svg.current.getScreenCTM().inverse()).y -
          H / 2
        ) / S
      );
    };
  const surfaces = useMemo(() => elementSurfaces(type), [type]),
    mirror = type.endsWith("Mirror"),
    f = useMemo(() => focalPosition(type, index), [type, index]),
    axis = xy({ x: 0, y: 0 }),
    front = surfaces[0],
    curve = (surface) =>
      Array.from({ length: 81 }, (_, i) => {
        const y = -surface.aperture + (2 * surface.aperture * i) / 80;
        return xy({ x: surfaceX(surface, y), y });
      });
  const poly = (points) => points.map((p) => `${p.x},${p.y}`).join(" "),
    mirrorPoints = useMemo(() => curve(front), [type]),
    lensPoints = useMemo(
      () =>
        mirror ? [] : [...curve(surfaces[0]), ...curve(surfaces[1]).reverse()],
      [type],
    );
  const heightUpdates = useRafCallback(({ i, y }) =>
    setPositions((values) =>
      values[i] === y ? values : values.map((v, k) => (k === i ? y : v)),
    ),
  );
  function update(event) {
    if (drag.current === null) return;
    const y =
      Math.round(Math.max(-5.5, Math.min(5.5, worldY(event))) * 10) / 10;
    heightUpdates.schedule({ i: drag.current, y });
  }
  return (
    <svg
      ref={svg}
      className="optics-scene"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`${opticalElements.find((e) => e.id === type).name} 광선 실험, 레이저 ${positions.length}개`}
      onPointerMove={update}
      onPointerUp={() => {
        heightUpdates.flush();
        drag.current = null;
      }}
      onPointerCancel={() => {
        heightUpdates.cancel();
        drag.current = null;
      }}
      onLostPointerCapture={() => (drag.current = null)}
    >
      <defs>
        <pattern
          id="optics-grid"
          width="28"
          height="28"
          patternUnits="userSpaceOnUse"
        >
          <path d="M28 0H0V28" fill="none" stroke="#294252" strokeWidth=".6" />
        </pattern>
        <filter id="laser-glow">
          <feGaussianBlur stdDeviation="2.4" />
        </filter>
        <linearGradient id="lens-glass" x1="0" x2="1">
          <stop stopColor="#8bd8ef" stopOpacity=".24" />
          <stop offset=".5" stopColor="#a8eeff" stopOpacity=".06" />
          <stop offset="1" stopColor="#71cce6" stopOpacity=".3" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill="#101e2d" />
      <rect width={W} height={H} fill="url(#optics-grid)" />
      <line
        x1="15"
        x2={W - 15}
        y1={axis.y}
        y2={axis.y}
        stroke="#708597"
        strokeDasharray="6 5"
        strokeWidth="1"
      />
      <text
        x={W - 34}
        y={axis.y + 18}
        textAnchor="end"
        fill="#8fa3b2"
        fontSize="11"
      >
        광축
      </text>
      <line
        x1={axis.x}
        x2={axis.x}
        y1="32"
        y2={H - 35}
        stroke="#50697a"
        strokeDasharray="3 6"
        strokeWidth=".8"
      />
      {f !== null &&
        (() => {
          const p = xy({ x: f, y: 0 });
          return (
            <g data-testid="optics-focus">
              <circle cx={p.x} cy={p.y} r="4" fill="#f5ca74" />
              <text
                x={p.x}
                y={p.y - 13}
                textAnchor="middle"
                fontSize="12"
                fontWeight="600"
                fill="#f5ca74"
              >
                F
              </text>
              <text
                x={p.x}
                y={p.y + 31}
                textAnchor="middle"
                fontSize="10"
                fill="#b5a885"
              >
                근축 초점
              </text>
            </g>
          );
        })()}
      {mirror ? (
        <>
          <polyline
            points={poly(mirrorPoints.map((p) => ({ ...p, x: p.x + 5 })))}
            fill="none"
            stroke="#62778c"
            strokeWidth="8"
          />
          {mirrorPoints
            .filter((_, i) => i % 5 === 0)
            .map((p, i) => (
              <line
                key={i}
                x1={p.x + 6}
                y1={p.y}
                x2={p.x + 13}
                y2={p.y - 7}
                stroke="#647a90"
                strokeWidth="1.5"
              />
            ))}
          <polyline
            points={poly(mirrorPoints)}
            fill="none"
            stroke="#c0e1ee"
            strokeWidth="3"
          />
        </>
      ) : (
        <polygon
          data-testid="optics-lens"
          points={poly(lensPoints)}
          fill="url(#lens-glass)"
          stroke="#84cbe1"
          strokeWidth="1.8"
        />
      )}
      {on &&
        rays.map((ray, i) => (
          <g
            key={i}
            data-testid="laser-ray"
            opacity={selected === i ? 1 : 0.78}
          >
            {ray.extension &&
              extensions &&
              (() => {
                const a = xy(ray.extension.a),
                  b = xy(ray.extension.b);
                return (
                  <line
                    data-testid="virtual-extension"
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke="#e0a3b4"
                    strokeWidth="1.2"
                    strokeDasharray="6 5"
                    opacity=".55"
                  />
                );
              })()}
            {ray.segments.map((segment, j) => {
              const a = xy(segment.a),
                b = xy(segment.b),
                mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
                angle = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
              return (
                <g key={j}>
                  <line
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke="#ff658e"
                    strokeWidth="5"
                    filter="url(#laser-glow)"
                    opacity=".3"
                  />
                  <line
                    data-testid="ray-segment"
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke="#ff8faa"
                    strokeWidth={selected === i ? 2.3 : 1.8}
                  />
                  <line
                    className="ray-pulse"
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke="#ffe0e8"
                    strokeWidth="2.5"
                    strokeDasharray="3 44"
                  />
                  <path
                    d="M -6 -4 1 0 -6 4"
                    transform={`translate(${mid.x} ${mid.y}) rotate(${angle})`}
                    fill="none"
                    stroke="#ffd1de"
                    strokeWidth="1.5"
                  />
                </g>
              );
            })}
            {normals &&
              ray.hits.map((hit, j) => {
                const a = xy(add(hit.point, mul(hit.normal, 1.1))),
                  b = xy(add(hit.point, mul(hit.normal, -1.1)));
                return (
                  <line
                    key={j}
                    data-testid="ray-normal"
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke="#86b9cd"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                );
              })}
          </g>
        ))}
      {positions.map((y, i) => {
        const p = xy({ x: -11, y });
        return (
          <g
            key={i}
            className="laser-handle"
            role="button"
            tabIndex="0"
            aria-label={`레이저 ${i + 1} 위아래 이동`}
            aria-pressed={selected === i}
            onPointerDown={(event) => {
              event.preventDefault();
              drag.current = i;
              setSelected(i);
              svg.current.setPointerCapture(event.pointerId);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowUp" || event.key === "ArrowDown") {
                event.preventDefault();
                setSelected(i);
                setPositions((values) =>
                  values.map((v, k) =>
                    k === i
                      ? Number(
                          Math.max(
                            -5.5,
                            Math.min(
                              5.5,
                              v + (event.key === "ArrowUp" ? 0.1 : -0.1),
                            ),
                          ).toFixed(1),
                        )
                      : v,
                  ),
                );
              }
            }}
          >
            <rect
              x={p.x - 57}
              y={p.y - 15}
              width="60"
              height="30"
              rx="7"
              fill="transparent"
            />
            <rect
              x={p.x - 48}
              y={p.y - 11}
              width="42"
              height="22"
              rx="5"
              fill={selected === i ? "#29526c" : "#233747"}
              stroke={selected === i ? "#a4dfef" : "#657f90"}
              strokeWidth="1.3"
            />
            <path
              d={`M ${p.x - 6} ${p.y - 6} H ${p.x + 1} V ${p.y + 6} H ${p.x - 6}`}
              fill="#8b9daa"
            />
            <circle
              cx={p.x + 1}
              cy={p.y}
              r="3"
              fill={on ? "#ff8faa" : "#6d8495"}
            />
            <text
              x={p.x - 27}
              y={p.y + 4}
              textAnchor="middle"
              fill="#c9dce8"
              fontSize="10"
            >
              {i + 1}
            </text>
          </g>
        );
      })}
      <text x="20" y="27" fill="#9db9cc" fontSize="11">
        레이저를 위아래로 드래그하세요
      </text>
      <text x={W - 20} y="27" textAnchor="end" fill="#82a4ba" fontSize="10">
        {mirror ? "빛의 반사" : "공기 → 투명체 → 공기"}
      </text>
    </svg>
  );
}
export default function Optics({ onBack }) {
  const saved = readSession("optics", {});
  const [type, setType] = useState(() => saved.type || "convexLens"),
    [positions, setPositions] = useState(() => saved.positions || [-2, 0, 2]),
    [index, setIndex] = useState(() => saved.index || 1.5),
    [on, setOn] = useState(true),
    [extensions, setExtensions] = useState(() => saved.extensions ?? true),
    [normals, setNormals] = useState(() => saved.normals ?? false),
    [selected, setSelected] = useState(0);
  useEffect(() => {
    saveSession("optics", { type, positions, index, extensions, normals });
  }, [type, positions, index, extensions, normals]);
  const rays = useMemo(
    () => positions.map((y) => traceLaser(type, y, index)),
    [type, positions, index],
  );
  const element = opticalElements.find((e) => e.id === type),
    mirror = element.kind === "mirror",
    ray = rays[selected] ?? rays[0];
  return (
    <main className="sim-page science-page optics-page sim-theme theme-optics">
      <button className="back" onClick={onBack}>
        <ArrowLeft size={15} /> 시뮬레이션 탐색
      </button>
      <div className="sim-title">
        <div>
          <div className="card-meta">
            <span>중2 과학</span>
            <span>빛과 파동</span>
          </div>
          <h1>
            빛의 반사와 굴절 <span>LIGHT LAB</span>
          </h1>
          <p>광원을 움직이고, 거울과 렌즈가 만드는 빛의 경로를 관찰하세요.</p>
        </div>
        <div className="title-icon">
          <Sun size={29} />
        </div>
      </div>
      <div className="lab-layout">
        <aside className="settings science-settings">
          <div className="panel-title">
            <Sun size={17} />
            <h3>광학 실험 설정</h3>
          </div>
          <div className="field-label">
            01 <strong>거울과 렌즈</strong>
          </div>
          <div className="optical-elements">
            {opticalElements.map((e) => (
              <button
                key={e.id}
                className={type === e.id ? "selected" : ""}
                aria-pressed={type === e.id}
                onClick={() => setType(e.id)}
              >
                <span className={`optical-symbol ${e.id}`} />
                <span>{e.name}</span>
                {type === e.id && <Check size={13} />}
              </button>
            ))}
          </div>
          <div className="field-label">
            02 <strong>레이저 개수</strong>
            <span>{positions.length}개</span>
          </div>
          <input
            aria-label="레이저 개수"
            type="range"
            min="1"
            max="7"
            step="1"
            value={positions.length}
            onChange={(e) => {
              setPositions(evenlySpaced(+e.target.value));
              setSelected(0);
            }}
          />
          <div className="range-label">
            <span>1개</span>
            <span>7개</span>
          </div>
          <div className="field-label">
            03 <strong>광원 높이</strong>
            <button
              className="small-reset"
              onClick={() => setPositions(evenlySpaced(positions.length))}
            >
              <RotateCcw size={12} /> 간격 고르게
            </button>
          </div>
          <div className="laser-sliders">
            {positions.map((y, i) => (
              <label key={i} className={selected === i ? "selected" : ""}>
                <span>
                  <button
                    aria-label={`레이저 ${i + 1} 선택`}
                    onClick={() => setSelected(i)}
                  >
                    {i + 1}
                  </button>{" "}
                  레이저 {i + 1}
                  <b>
                    {y > 0 ? "+" : ""}
                    {y}
                  </b>
                </span>
                <input
                  aria-label={`레이저 ${i + 1} 높이`}
                  type="range"
                  min="-5.5"
                  max="5.5"
                  step=".1"
                  value={y}
                  onFocus={() => setSelected(i)}
                  onChange={(e) =>
                    setPositions((values) =>
                      values.map((v, k) => (k === i ? +e.target.value : v)),
                    )
                  }
                />
              </label>
            ))}
          </div>
          {!mirror && (
            <>
              <div className="field-label">
                04 <strong>투명체의 굴절률 n</strong>
              </div>
              <select
                className="science-select"
                aria-label="렌즈 굴절률"
                value={index}
                onChange={(e) => setIndex(+e.target.value)}
              >
                {[1.33, 1.5, 1.7].map((n) => (
                  <option key={n} value={n}>
                    n = {n}
                  </option>
                ))}
              </select>
            </>
          )}
          <div className="setting-tip">
            <MoveVertical size={16} />
            <p>
              그림의 레이저를 직접 끌어 보세요. 선택한 광원은 키보드 ↑·↓로도
              움직일 수 있어요.
            </p>
          </div>
        </aside>
        <section className="lab-main">
          <div className="canvas-panel">
            <div className="canvas-heading">
              <span>
                <span className="live-dot" /> {element.name} 실험
              </span>
              <button
                className={`light-toggle ${on ? "on" : ""}`}
                onClick={() => setOn(!on)}
              >
                <Power size={13} />
                {on ? "레이저 끄기" : "레이저 켜기"}
              </button>
            </div>
            <OpticsScene
              type={type}
              rays={rays}
              positions={positions}
              setPositions={setPositions}
              index={index}
              on={on}
              extensions={extensions}
              normals={normals}
              selected={selected}
              setSelected={setSelected}
            />
            <div className="optics-toolbar">
              <label>
                <input
                  type="checkbox"
                  checked={extensions}
                  onChange={(e) => setExtensions(e.target.checked)}
                />{" "}
                뒤로 연장한 선
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={normals}
                  onChange={(e) => setNormals(e.target.checked)}
                />{" "}
                법선 표시
              </label>
              <span>실선: 실제 빛 · 점선: 연장선</span>
            </div>
          </div>
          <div className="science-observation">
            <span className="observation-icon">
              <Lightbulb size={22} />
            </span>
            <div>
              <small>지금 관찰할 수 있는 것</small>
              <h3>
                {element.name} · {element.behavior}
              </h3>
              <p>{element.description}</p>
              {ray.missed && (
                <p className="ray-missed">
                  선택한 레이저는 기구의 가장자리 밖으로 지나가고 있어요.
                </p>
              )}
            </div>
          </div>
          <div className="optics-facts">
            <div>
              <span>광학 기구</span>
              <strong>{element.name}</strong>
            </div>
            <div>
              <span>레이저 {selected + 1}의 변화</span>
              <strong>
                {ray.missed
                  ? "그대로 진행"
                  : mirror
                    ? "반사"
                    : ray.hits.some((h) => h.kind === "internal")
                      ? "굴절·내부 반사"
                      : `${ray.hits.length}번 굴절`}
              </strong>
            </div>
            <div>
              <span>관찰 포인트</span>
              <strong>
                {mirror ? "입사각 = 반사각" : "경계면마다 방향 변화"}
              </strong>
            </div>
          </div>
          <p className="science-footnote">
            <Info size={13} /> F는 광축에 가까운 빛의 초점입니다. 구면의
            가장자리 빛은 같은 점에 정확히 모이지 않을 수 있어요.
          </p>
        </section>
      </div>
    </main>
  );
}
