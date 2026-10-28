import React, { useState, useMemo, useEffect } from "react";
import {
  ArrowLeft,
  Shapes,
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Compass,
  Info,
} from "lucide-react";
import {
  shapes,
  routes,
  simulate,
  stateAt,
  distance,
  rotate,
  eventAt,
  eventLength,
  boundaryPolygon,
} from "./geometry.js";
import {
  exact,
  exactModel,
  exactState,
  exactHypotenuse,
  latex,
  exactText,
} from "./exact.js";
import katex from "katex";
function MathText({ expression }) {
  const html = useMemo(
    () =>
      katex.renderToString(latex(expression), {
        output: "mathml",
        throwOnError: false,
        strict: "ignore",
      }),
    [expression],
  );
  return (
    <span
      className="exact-math"
      data-expression={expression}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
const fmt = (n) => Number(n.toFixed(2)).toLocaleString("ko-KR");
const defaultDimensions = {
  side: 3,
  width: 3,
  height: 2,
  base: 3,
  leg: 2.25,
  radius: 2,
};
function LengthInput({ label, value, onChange, readOnly = false, exactValue }) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  const valid = Number.isFinite(+draft) && +draft >= 0.25 && +draft <= 20;
  return (
    <label className="length-field">
      <span>{label}</span>
      <div>
        {readOnly ? (
          <span
            className="readonly-length"
            role="textbox"
            aria-label={label}
            aria-readonly="true"
          >
            <MathText expression={exactValue} />
          </span>
        ) : (
          <input
            aria-label={label}
            type="number"
            min=".25"
            max="20"
            step=".25"
            value={draft}
            aria-invalid={!valid}
            onChange={(e) => {
              const v = e.target.value;
              setDraft(v);
              if (v !== "" && +v >= 0.25 && +v <= 20) onChange(+v);
            }}
            onBlur={() => {
              if (!valid) setDraft(String(value));
            }}
          />
        )}
        <span>cm</span>
      </div>
      {!readOnly && !valid && <small>0.25~20 cm를 입력해 주세요.</small>}
    </label>
  );
}
export default function Rolling({ onBack }) {
  const [id, setId] = useState("square"),
    [dimensions, setDimensions] = useState(defaultDimensions),
    [mode, setMode] = useState("line"),
    [vertex, setVertex] = useState(0),
    [progress, setProgress] = useState(0),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(1),
    [showTrace, setShowTrace] = useState(true);
  const sim = useMemo(
    () => simulate(id, dimensions, mode, mode === "line" ? 8 : 24),
    [id, dimensions, mode],
  );
  const symbolModel = useMemo(
    () => exactModel(sim, id, dimensions, mode, vertex),
    [sim, id, dimensions, mode, vertex],
  );
  const symbolState = useMemo(
    () => exactState(symbolModel, progress),
    [symbolModel, progress],
  );
  const state = useMemo(
    () => stateAt(sim, progress, vertex),
    [sim, progress, vertex],
  );
  useEffect(() => {
    setProgress(0);
    setPlaying(false);
  }, [sim]);
  useEffect(() => {
    if (!playing) return;
    let frame, start;
    const from = progress;
    const tick = (t) => {
      if (start === undefined) start = t;
      setProgress(
        Math.min(
          sim.events.length,
          Math.round((from + ((t - start) / 1800) * speed) * 100) / 100,
        ),
      );
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, speed, sim]);
  useEffect(() => {
    if (progress >= sim.events.length) setPlaying(false);
  }, [progress, sim]);
  const e = state.event || sim.events.at(-1),
    labels = sim.initial.map((_, i) => String.fromCharCode(65 + i)),
    pointWord = id === "circle" ? "관찰점" : "꼭짓점";
  const update = (key, value) => setDimensions((d) => ({ ...d, [key]: value }));
  function selectPoint(i) {
    setVertex(i);
    setShowTrace(true);
    setPlaying(false);
  }
  function step(d) {
    setPlaying(false);
    setProgress((p) =>
      Math.max(
        0,
        Math.min(
          sim.events.length,
          d > 0 ? Math.floor(p + 1) : Math.ceil(p - 1),
        ),
      ),
    );
  }
  const shape = shapes.find((s) => s.id === id);
  return (
    <main className="sim-page sim-theme theme-rolling">
      <button className="back" onClick={onBack}>
        <ArrowLeft size={15} /> 시뮬레이션 탐색
      </button>
      <div className="sim-title">
        <div>
          <div className="card-meta">
            <span>중1 수학</span>
            <span>원과 부채꼴</span>
          </div>
          <h1>
            데굴데굴, 도형 굴리기 <span>LAB 01</span>
          </h1>
          <p>
            그림 속 {pointWord}을 클릭하고, 굴러가며 그리는 궤적을 관찰해
            보세요.
          </p>
        </div>
        <div className="title-icon">
          <Shapes size={29} />
        </div>
      </div>
      <div className="lab-layout">
        <aside className="settings">
          <div className="panel-title">
            <Compass size={17} />
            <h3>나만의 실험 설정</h3>
          </div>
          <div className="field-label">
            01 <strong>굴릴 도형</strong>
          </div>
          <div className="shape-grid">
            {shapes.map((s) => (
              <button
                key={s.id}
                aria-pressed={id === s.id}
                className={id === s.id ? "selected" : ""}
                onClick={() => {
                  setId(s.id);
                  setVertex(0);
                }}
              >
                <ShapeIcon shape={s} />
                <span>{s.name}</span>
              </button>
            ))}
          </div>
          <div className="field-label">
            02{" "}
            <strong>
              {id === "circle" ? "반지름 입력" : "변의 길이 입력"}
            </strong>
          </div>
          <div className="length-grid">
            {shape.n &&
              labels.map((label, i) => (
                <LengthInput
                  key={i}
                  label={`변 ${label}${labels[(i + 1) % labels.length]}`}
                  value={dimensions.side}
                  onChange={(v) => update("side", v)}
                />
              ))}
            {id === "rectangle" && (
              <>
                <LengthInput
                  label="가로 (BC · DA)"
                  value={dimensions.width}
                  onChange={(v) => update("width", v)}
                />
                <LengthInput
                  label="세로 (AB · CD)"
                  value={dimensions.height}
                  onChange={(v) => update("height", v)}
                />
              </>
            )}
            {id === "right" && (
              <>
                <LengthInput
                  label="변 AB (높이)"
                  value={dimensions.leg}
                  onChange={(v) => update("leg", v)}
                />
                <LengthInput
                  label="변 CA (밑변)"
                  value={dimensions.base}
                  onChange={(v) => update("base", v)}
                />
                <LengthInput
                  label="변 BC (빗변)"
                  value={Math.hypot(dimensions.base, dimensions.leg)}
                  exactValue={exactHypotenuse(dimensions.base, dimensions.leg)}
                  readOnly
                />
              </>
            )}
            {id === "isosceles" && (
              <>
                <LengthInput
                  label="변 AB"
                  value={dimensions.side}
                  onChange={(v) => update("side", v)}
                />
                <LengthInput
                  label="변 CA"
                  value={dimensions.side}
                  onChange={(v) => update("side", v)}
                />
                <LengthInput
                  label="변 BC (빗변)"
                  value={dimensions.side * Math.SQRT2}
                  exactValue={exact(`${dimensions.side}*sqrt(2)`)}
                  readOnly
                />
              </>
            )}
            {id === "circle" && (
              <LengthInput
                label="반지름"
                value={dimensions.radius}
                onChange={(v) => update("radius", v)}
              />
            )}
          </div>
          <p className="dimension-note">
            {shape.n
              ? "정다각형의 변은 모두 같아요. 어느 변을 입력해도 함께 바뀝니다."
              : id === "right"
                ? "직각을 이루는 두 변을 입력하면 빗변은 자동으로 계산합니다."
                : id === "isosceles"
                  ? "두 직각변은 같은 길이로 바뀌고 빗변은 자동 계산합니다."
                  : id === "circle"
                    ? "원 둘레 위의 점 A·B·C·D를 눌러 궤적을 관찰하세요."
                    : "마주 보는 변은 같은 길이로 설정됩니다."}
          </p>
          <div className="field-label">
            03 <strong>굴러가는 경로</strong>
          </div>
          <div className="route-tabs">
            {routes.map((route) => (
              <button
                key={route.id}
                aria-pressed={mode === route.id}
                className={mode === route.id ? "selected" : ""}
                onClick={() => setMode(route.id)}
              >
                {route.name}
              </button>
            ))}
          </div>
          {mode !== "line" && (
            <p className="dimension-note">
              {
                {
                  rectangle: "가로 16 cm · 세로 10 cm",
                  triangle: "밑변 16 cm · 높이 13 cm",
                  equilateral: "한 변 16 cm",
                  square: "한 변 12 cm",
                  hexagon: "한 변 8 cm",
                }[mode]
              }
            </p>
          )}
          <div className="field-label">
            04 <strong>관찰할 {pointWord}</strong>
          </div>
          <div className="vertex-row">
            {labels.map((v, i) => (
              <button
                key={v}
                aria-label={`${pointWord} ${v}`}
                aria-pressed={vertex === i}
                className={vertex === i ? "selected" : ""}
                onClick={() => selectPoint(i)}
              >
                {v}
              </button>
            ))}
          </div>
          <div className="setting-tip">
            <Info size={15} />
            <p>
              그림의 점을 누르면 현재 단계에서 관찰점을 바꿀 수 있어요.
              길이·도형·경로를 바꾸면 처음부터 시작합니다.
            </p>
          </div>
        </aside>
        <section className="lab-main">
          <div className="canvas-panel">
            <div className="canvas-heading">
              <span>
                <span className="live-dot" /> 도형 굴리기 실험실
              </span>
              <label>
                <input
                  type="checkbox"
                  checked={showTrace}
                  onChange={(e) => setShowTrace(e.target.checked)}
                />{" "}
                궤적 표시
              </label>
            </div>
            <Scene
              sim={sim}
              symbolModel={symbolModel}
              symbolState={symbolState}
              state={state}
              progress={progress}
              vertex={vertex}
              showTrace={showTrace}
              mode={mode}
              onSelectPoint={selectPoint}
            />
            <div className="canvas-legend">
              <span>
                <i className="legend-shape" /> 회전하는 도형
              </span>
              <span>
                <i className="legend-trace" /> {pointWord} {labels[vertex]}의
                궤적
              </span>
              <span>
                <i className="legend-pivot" />{" "}
                {sim.isCircle ? "접점" : "회전 중심"}
              </span>
            </div>
            <div className="playback">
              <div className="timeline-label">
                <span>
                  회전 진행 ·{" "}
                  {e.kind === "corner"
                    ? "모서리 회전"
                    : sim.isCircle
                      ? "원 굴리기"
                      : "도형 구르기"}
                </span>
                <span>
                  {fmt(progress)} / {sim.events.length} 단계
                </span>
              </div>
              <input
                aria-label="회전 진행 단계"
                type="range"
                min="0"
                max={sim.events.length}
                step=".01"
                value={progress}
                onChange={(e) => {
                  setPlaying(false);
                  setProgress(+e.target.value);
                }}
              />
              <div className="controls">
                <button
                  title="처음으로"
                  aria-label="처음으로"
                  onClick={() => {
                    setPlaying(false);
                    setProgress(0);
                  }}
                >
                  <RotateCcw size={17} />
                </button>
                <button aria-label="이전 단계" onClick={() => step(-1)}>
                  <ChevronLeft size={21} />
                </button>
                <button
                  className="play-button"
                  onClick={() => {
                    if (progress >= sim.events.length) setProgress(0);
                    setPlaying(!playing);
                  }}
                >
                  {playing ? (
                    <Pause size={16} fill="currentColor" />
                  ) : (
                    <Play size={16} fill="currentColor" />
                  )}
                  {playing ? "일시정지" : "굴려 보기"}
                </button>
                <button aria-label="다음 단계" onClick={() => step(1)}>
                  <ChevronRight size={21} />
                </button>
                <select
                  aria-label="재생 속도"
                  value={speed}
                  onChange={(e) => setSpeed(+e.target.value)}
                >
                  {[0.5, 1, 2].map((s) => (
                    <option key={s} value={s}>
                      {s}× 속도
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="stats">
            <div>
              <span>현재 단계의 전체 회전각</span>
              <strong>
                <MathText expression={symbolState.degrees} />
                <small>°</small>
              </strong>
              <p>
                {e.kind === "corner"
                  ? "경로 모서리에서의 추가 회전"
                  : "한 단계의 회전각"}
              </p>
            </div>
            <div>
              <span>
                {sim.isCircle ? "접점에서 관찰점까지" : "현재 회전 반지름"}
              </span>
              <strong>
                <MathText expression={symbolState.radius} /> <small>cm</small>
              </strong>
              <p>
                {pointWord} {labels[vertex]}까지의 거리
              </p>
            </div>
            <div className="distance-stat">
              <span>
                {pointWord} {labels[vertex]}의 누적 이동 거리
              </span>
              <strong>
                <MathText expression={symbolState.length} /> <small>cm</small>
              </strong>
              <p>
                {sim.isCircle
                  ? "원 둘레의 점이 그린 궤적의 길이"
                  : "지금까지 그린 모든 호의 길이"}
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
function ShapeIcon({ shape }) {
  const n = shape.n || 3,
    pts = Array.from({ length: n }, (_, i) => {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
      return `${18 + 12 * Math.cos(a)},${18 + 12 * Math.sin(a)}`;
    }).join(" ");
  return (
    <svg width="30" height="30" viewBox="0 0 36 36" aria-hidden="true">
      {shape.id === "circle" ? (
        <circle cx="18" cy="18" r="12" />
      ) : shape.id === "square" ? (
        <rect x="7" y="7" width="22" height="22" rx="1" />
      ) : shape.id === "rectangle" ? (
        <rect x="4" y="9" width="28" height="18" rx="1" />
      ) : shape.id === "right" ? (
        <polygon points="6,4 6,30 29,30" />
      ) : shape.id === "isosceles" ? (
        <polygon points="6,6 6,30 30,30" />
      ) : (
        <polygon points={pts} />
      )}
    </svg>
  );
}
function Scene({
  sim,
  symbolModel,
  symbolState,
  state,
  progress,
  vertex,
  showTrace,
  mode,
  onSelectPoint,
}) {
  const all = useMemo(() => {
    const points = [...sim.initial, ...sim.final, ...boundaryPolygon(mode)];
    for (const e of sim.events)
      for (let i = 0; i <= 16; i++) {
        const pose = eventAt(e, i / 16);
        points.push(...pose.points);
        if (sim.isCircle)
          points.push(
            { x: pose.center.x - sim.radius, y: pose.center.y - sim.radius },
            { x: pose.center.x + sim.radius, y: pose.center.y + sim.radius },
          );
      }
    return points;
  }, [sim, mode]);
  const fullTrace = useMemo(
    () => stateAt(sim, sim.events.length, vertex).traces,
    [sim, vertex],
  );
  const minX = Math.min(...all.map((p) => p.x)) - 3,
    maxX = Math.max(...all.map((p) => p.x)) + 3,
    minY = Math.min(...all.map((p) => p.y)) - 3,
    maxY = Math.max(...all.map((p) => p.y)) + 4;
  const scale = Math.min(770 / (maxX - minX), 310 / (maxY - minY)),
    offsetX = (840 - (maxX - minX) * scale) / 2,
    offsetY = (350 - (maxY - minY) * scale) / 2;
  const xy = (p) => ({
      x: offsetX + (p.x - minX) * scale,
      y: offsetY + (maxY - p.y) * scale,
    }),
    str = (pts) =>
      pts
        .map((p) => {
          const q = xy(p);
          return `${q.x},${q.y}`;
        })
        .join(" ");
  const e = state.event || sim.events.at(-1),
    fraction = state.event ? state.fraction : 1,
    pivot = xy(state.pivot),
    selected = xy(state.points[vertex]),
    initial = xy({ x: 0, y: 0 });
  const angleCenter = e.kind === "circle-roll" ? state.center : e.pivot,
    screenCenter = xy(angleCenter),
    referenceCenter = e.kind === "circle-roll" ? e.center : e.pivot;
  const referencePoint = e.points[vertex],
    base = Math.atan2(
      referencePoint.y - referenceCenter.y,
      referencePoint.x - referenceCenter.x,
    ),
    arcRadius = 27 / scale;
  const arcPoint = (a) =>
      xy({
        x: angleCenter.x + arcRadius * Math.cos(base + a),
        y: angleCenter.y + arcRadius * Math.sin(base + a),
      }),
    start = arcPoint(0),
    end = arcPoint(e.angle),
    current = arcPoint(e.angle * fraction);
  const arcPath = (target) =>
    `M ${start.x} ${start.y} A 27 27 0 ${Math.abs(target) > Math.PI ? 1 : 0} 1 ${arcPoint(target).x} ${arcPoint(target).y}`;
  const angleLabel = `θ = ${exactText(symbolState.degrees)}°`,
    actualLabel = `현재 ${exactText(symbolState.actualDegrees)}°`;
  const center = state.center ? xy(state.center) : null;
  const completedAngles = [];
  sim.events.slice(0, state.completed).forEach((event, index) => {
    // A point at the pivot has no traveled arc to annotate.
    if (eventLength(event, vertex, 1, sim) < 1e-8) return;
    const middle = eventAt(event, 0.5);
    const anchor = xy(middle.points[vertex]);
    const origin = xy(
      event.kind === "circle-roll" ? middle.center : event.pivot,
    );
    const dx = anchor.x - origin.x,
      dy = anchor.y - origin.y;
    const norm = Math.hypot(dx, dy) || 1;
    const labelX = Math.max(30, Math.min(810, anchor.x + (dx / norm) * 18));
    const preferredY = Math.max(62, Math.min(320, anchor.y + (dy / norm) * 18));
    let labelY = preferredY;
    for (let attempt = 0; attempt < 14; attempt++) {
      if (
        !completedAngles.some(
          (other) =>
            Math.abs(other.labelX - labelX) < 48 &&
            Math.abs(other.labelY - labelY) < 20,
        )
      )
        break;
      const offset =
        (Math.floor(attempt / 2) + 1) * 22 * (attempt % 2 === 0 ? -1 : 1);
      labelY = Math.max(62, Math.min(320, preferredY + offset));
    }
    completedAngles.push({
      index,
      anchor,
      labelX,
      labelY,
      degrees: exact(`(${symbolModel.events[index].angle})*180/pi`),
    });
  });
  return (
    <svg
      className="scene"
      viewBox="0 0 840 350"
      role="img"
      aria-label={`도형 굴리기 ${fmt(progress)}단계, ${sim.isCircle ? "관찰점" : "꼭짓점"} 이동 거리 ${exactText(symbolState.length)}cm`}
    >
      <defs>
        <pattern
          id="labdots"
          width="22"
          height="22"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="1" cy="1" r=".8" fill="#d8e3dc" />
        </pattern>
      </defs>
      <rect width="840" height="350" fill="url(#labdots)" />
      {mode === "line" ? (
        <>
          <line
            x1="25"
            x2="815"
            y1={initial.y}
            y2={initial.y}
            stroke="#8ca298"
            strokeWidth="1.5"
          />
          {Array.from(
            { length: Math.min(200, Math.ceil(maxX - minX)) },
            (_, i) =>
              i * Math.max(1, Math.ceil((maxX - minX) / 200)) + Math.ceil(minX),
          ).map((v) => {
            const p = xy({ x: v, y: 0 });
            return (
              <g key={v}>
                <line
                  x1={p.x}
                  x2={p.x}
                  y1={p.y - 4}
                  y2={p.y + 4}
                  stroke="#8ca298"
                />
                {v % 2 === 0 && (
                  <text
                    x={p.x}
                    y={p.y + 19}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#80938a"
                  >
                    {v}
                  </text>
                )}
              </g>
            );
          })}
          <text x="805" y={initial.y + 33} fontSize="11" fill="#80938a">
            cm
          </text>
        </>
      ) : (
        <polygon
          data-testid="boundary"
          points={str(boundaryPolygon(mode))}
          fill="#e6ece5"
          stroke="#94a697"
          strokeWidth="1.5"
        />
      )}
      {sim.isCircle ? (
        <circle
          cx={xy(sim.initialCenter).x}
          cy={xy(sim.initialCenter).y}
          r={sim.radius * scale}
          fill="none"
          stroke="#a8b9ac"
          strokeDasharray="4 4"
        />
      ) : (
        <polygon
          points={str(sim.initial)}
          fill="none"
          stroke="#a8b9ac"
          strokeDasharray="4 4"
        />
      )}
      {showTrace && fullTrace.length > 1 && (
        <polyline
          data-testid="full-trace"
          points={str(fullTrace)}
          fill="none"
          stroke="#d18a54"
          strokeOpacity=".35"
          strokeWidth="2"
          strokeDasharray="5 5"
          pointerEvents="none"
        />
      )}
      {showTrace && state.traces.length > 1 && (
        <polyline
          data-testid="trace"
          points={str(state.traces)}
          fill="none"
          stroke="#d18a54"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {sim.isCircle ? (
        <circle
          data-testid="rolling-circle"
          cx={center.x}
          cy={center.y}
          r={sim.radius * scale}
          fill="#83aa93"
          fillOpacity=".48"
          stroke="#3f7e60"
          strokeWidth="2"
        />
      ) : (
        <polygon
          data-testid="rolling-polygon"
          points={str(state.points)}
          fill="#83aa93"
          fillOpacity=".48"
          stroke="#3f7e60"
          strokeWidth="2"
        />
      )}
      {showTrace && (
        <g data-testid="completed-angles" pointerEvents="none">
          {completedAngles.map(({ index, anchor, labelX, labelY, degrees }) => (
            <g
              key={index}
              data-testid="completed-angle"
              data-step={index + 1}
              data-vertex={vertex}
              data-arc-x={anchor.x}
              data-arc-y={anchor.y}
              aria-label={`${String.fromCharCode(65 + vertex)}점 ${index + 1}단계 회전각 ${exactText(degrees)}도`}
            >
              <title>
                {String.fromCharCode(65 + vertex)}점 · {index + 1}단계 ·{" "}
                {sim.isCircle ? "원 회전각" : "회전각"} {exactText(degrees)}°
              </title>
              <line
                x1={anchor.x}
                y1={anchor.y}
                x2={labelX}
                y2={labelY}
                stroke="#c18b59"
                strokeWidth="1"
                strokeOpacity=".65"
              />
              <text
                x={labelX}
                y={labelY}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="12"
                fontWeight="600"
                fill="#ab682f"
                stroke="#fbfcf9"
                strokeWidth="5"
                paintOrder="stroke"
              >
                {exactText(degrees)}°
              </text>
            </g>
          ))}
        </g>
      )}
      {distance(referencePoint, referenceCenter) > 1e-7 && (
        <g className="angle-marker" pointerEvents="none">
          <path
            d={`M ${screenCenter.x} ${screenCenter.y} L ${start.x} ${start.y} A 27 27 0 0 1 ${end.x} ${end.y} Z`}
            fill="#d7a76d"
            fillOpacity=".15"
          />
          <line
            x1={screenCenter.x}
            y1={screenCenter.y}
            x2={start.x}
            y2={start.y}
            stroke="#bb8144"
            strokeDasharray="3 3"
          />
          <line
            x1={screenCenter.x}
            y1={screenCenter.y}
            x2={end.x}
            y2={end.y}
            stroke="#bb8144"
            strokeDasharray="3 3"
          />
          <path
            d={arcPath(e.angle)}
            fill="none"
            stroke="#bb8144"
            strokeDasharray="3 3"
          />
          {fraction > 0 && (
            <>
              <line
                x1={screenCenter.x}
                y1={screenCenter.y}
                x2={current.x}
                y2={current.y}
                stroke="#b97636"
              />
              <path
                d={arcPath(e.angle * fraction)}
                fill="none"
                stroke="#b97636"
                strokeWidth="2"
              />
            </>
          )}
          <text
            data-testid="angle-label"
            x={Math.min(705, screenCenter.x + 36)}
            y={Math.max(66, screenCenter.y - 28)}
            fontSize="13"
            fontWeight="600"
            fill="#a96d32"
            stroke="#fbfcf9"
            strokeWidth="4"
            paintOrder="stroke"
          >
            {angleLabel}
          </text>
          <text
            x={Math.min(705, screenCenter.x + 36)}
            y={Math.max(82, screenCenter.y - 12)}
            fontSize="10"
            fill="#a96d32"
            stroke="#fbfcf9"
            strokeWidth="3"
            paintOrder="stroke"
          >
            {actualLabel}
          </text>
        </g>
      )}
      <g pointerEvents="none">
        <line
          x1={pivot.x}
          y1={pivot.y}
          x2={selected.x}
          y2={selected.y}
          stroke="#d18a54"
          strokeDasharray="4 4"
        />
        <circle
          cx={pivot.x}
          cy={pivot.y}
          r="7"
          fill="none"
          stroke="#3f7e60"
          strokeWidth="1.5"
        />
        <circle cx={pivot.x} cy={pivot.y} r="2" fill="#3f7e60" />
      </g>
      {state.points.map((p, i) => {
        const q = xy(p),
          name = `${sim.isCircle ? "관찰점" : "꼭짓점"} ${String.fromCharCode(65 + i)} 선택`;
        return (
          <g
            key={i}
            className="clickable-point"
            role="button"
            tabIndex="0"
            aria-label={name}
            aria-pressed={vertex === i}
            onClick={() => onSelectPoint(i)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelectPoint(i);
              }
            }}
          >
            <circle cx={q.x} cy={q.y} r="15" fill="transparent" />
            <circle
              className="point-dot"
              cx={q.x}
              cy={q.y}
              r={vertex === i ? 6 : 4}
              fill={vertex === i ? "#d18a54" : "#3f7e60"}
              stroke="white"
              strokeWidth="1.5"
              pointerEvents="none"
            />
            <text
              x={q.x + 9}
              y={q.y - 9}
              fontSize="12"
              fontWeight="600"
              fill={vertex === i ? "#af6634" : "#3f7e60"}
              pointerEvents="none"
            >
              {String.fromCharCode(65 + i)}
            </text>
          </g>
        );
      })}
      <rect
        x="20"
        y="18"
        width="203"
        height="29"
        rx="5"
        fill="white"
        fillOpacity=".92"
      />
      <text x="32" y="37" fontSize="11" fill="#64796d">
        {mode === "line"
          ? "직선 위에서 구르기"
          : routes.find((r) => r.id === mode).name + " 따라 구르기"}
      </text>
      <text x="808" y="37" textAnchor="end" fontSize="11" fill="#70876d">
        그림의 점을 눌러 궤적 선택
      </text>
    </svg>
  );
}
