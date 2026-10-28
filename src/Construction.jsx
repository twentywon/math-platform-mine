import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  memo,
} from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Compass,
  Ruler,
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Check,
  Info,
  Triangle,
  Layers,
  ZoomIn,
  ZoomOut,
  SlidersHorizontal,
  Maximize2,
} from "lucide-react";
import {
  basicConstructions,
  advancedConstructions,
  defaults,
  buildConstruction,
  constructionBounds,
} from "./construction.js";
import ConstructionSteps from "./ConstructionSteps.jsx";
import { useRafCallback } from "./useRafCallback.js";
const clamp = (v) => Math.max(0, Math.min(1, v));
const ConstructionMarks = memo(function ConstructionMarks({
  lesson,
  cursor,
  playing,
  tools,
  aids,
}) {
  const bounds = useMemo(() => constructionBounds(lesson), [lesson]),
    w = Math.max(5, bounds.maxX - bounds.minX),
    h = Math.max(5, bounds.maxY - bounds.minY),
    unit = Math.min(660 / w, 340 / h),
    cx = (bounds.minX + bounds.maxX) / 2,
    cy = (bounds.minY + bounds.maxY) / 2;
  const xy = (p) => ({
    x: 450 + (p.x - cx) * unit,
    y: 275 - (p.y - cy) * unit,
  });
  function shape(item, t, key, given = false) {
    if (t <= 0) return null;
    if (!aids && !given && (item.type === "arc" || item.aux)) return null;
    const reveal =
        item.at === undefined
          ? clamp((t - 0.22) / 0.68)
          : clamp((t - item.at) / (1 - item.at)),
      color = given ? "#778d81" : item.result ? "#39785a" : "#d39961";
    if (item.type === "line") {
      if (!reveal) return null;
      const a = xy(item.a),
        b = xy(item.b);
      return (
        <line
          key={key}
          data-testid={item.result ? "construction-result-line" : undefined}
          x1={a.x}
          y1={a.y}
          x2={a.x + (b.x - a.x) * reveal}
          y2={a.y + (b.y - a.y) * reveal}
          stroke={color}
          strokeWidth={item.result ? 3 : 1.7}
          strokeDasharray={item.aux ? "5 5" : undefined}
          strokeLinecap="round"
        />
      );
    }
    if (item.type === "arc") {
      if (!reveal) return null;
      const center = xy(item.center),
        a = item.start,
        delta = (item.end - a) * reveal,
        r = item.radius * unit,
        start = {
          x: center.x + r * Math.cos(a),
          y: center.y - r * Math.sin(a),
        },
        end = {
          x: center.x + r * Math.cos(a + delta),
          y: center.y - r * Math.sin(a + delta),
        };
      return (
        <path
          key={key}
          data-testid="construction-arc"
          d={`M ${start.x} ${start.y} A ${r} ${r} 0 ${Math.abs(delta) > Math.PI ? 1 : 0} ${delta > 0 ? 0 : 1} ${end.x} ${end.y}`}
          fill="none"
          stroke={color}
          strokeWidth={given ? 1.2 : 1.7}
          strokeDasharray={!given && t >= 1 ? "5 4" : undefined}
        />
      );
    }
    if (t < 0.96) return null;
    const p = xy(item.p);
    if (item.type === "right")
      return (
        <path
          key={key}
          d={`M ${p.x + 12} ${p.y} v -12 h -12`}
          fill="none"
          stroke="#619273"
          strokeWidth="1.5"
        />
      );
    if (item.type === "text")
      return (
        <text
          key={key}
          x={p.x}
          y={p.y}
          textAnchor="middle"
          fontSize="12"
          fill="#879b8d"
          stroke="#fcfdf9"
          strokeWidth="4"
          paintOrder="stroke"
        >
          {item.text}
        </text>
      );
    return (
      <g key={key}>
        <circle
          cx={p.x}
          cy={p.y}
          r="3.6"
          fill={given ? "#668271" : "#507d5c"}
          stroke="#fff"
          strokeWidth="1.5"
        />
        <text
          x={p.x + 8}
          y={p.y + 16}
          fontSize="12"
          fontWeight="600"
          fill="#50765d"
          stroke="#fcfdf9"
          strokeWidth="4"
          paintOrder="stroke"
        >
          {item.name}
        </text>
      </g>
    );
  }
  const index = Math.min(Math.floor(cursor), lesson.steps.length - 1),
    fraction = cursor - index,
    tool = lesson.steps[index].tool,
    showTool =
      tools && (playing || cursor % 1 > 1e-7) && cursor < lesson.steps.length,
    draw = clamp((fraction - 0.22) / 0.68),
    approach = clamp(fraction / 0.18);
  let toolDrawing = null;
  if (showTool && tool.type === "ruler") {
    const a = xy(tool.a),
      b = xy(tool.b),
      length = Math.hypot(b.x - a.x, b.y - a.y),
      angle = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
    toolDrawing = (
      <g
        data-testid="construction-tool"
        data-tool="ruler"
        transform={`translate(${a.x} ${a.y - 32 * (1 - approach)}) rotate(${angle})`}
      >
        <rect
          x="-18"
          y="-25"
          width={length + 36}
          height="25"
          rx="4"
          fill="#dce8db"
          fillOpacity=".8"
          stroke="#749779"
          strokeWidth="1.2"
        />
        <path d={`M -12 -5 H ${length + 12}`} stroke="#6d9070" opacity=".5" />
        <rect
          x={Math.max(0, length / 2 - 29)}
          y="-20"
          width="58"
          height="12"
          rx="4"
          fill="#f7fbf4"
          stroke="#b3c8ae"
          strokeWidth=".8"
        />
      </g>
    );
  } else if (showTool) {
    const center = xy(tool.center),
      angle = tool.start + (tool.end - tool.start) * draw,
      opening = tool.measure ? 0.55 + 0.45 * clamp(fraction / 0.4) : 1,
      r = tool.radius * unit * opening,
      pencil = {
        x: center.x + r * Math.cos(angle),
        y: center.y - r * Math.sin(angle),
      },
      dx = pencil.x - center.x,
      dy = pencil.y - center.y,
      len = Math.hypot(dx, dy) || 1,
      height = Math.min(62, Math.max(30, len * 0.35)),
      hinge = {
        x: (center.x + pencil.x) / 2 + (dy / len) * height,
        y: (center.y + pencil.y) / 2 - (dx / len) * height,
      };
    toolDrawing = (
      <g
        data-testid="construction-tool"
        data-tool="compass"
        transform={`translate(0 ${-40 * (1 - approach)})`}
      >
        <path
          d={`M ${center.x} ${center.y} L ${hinge.x} ${hinge.y} L ${pencil.x} ${pencil.y}`}
          fill="none"
          stroke="#688b77"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={`M ${center.x} ${center.y} L ${hinge.x} ${hinge.y} L ${pencil.x} ${pencil.y}`}
          fill="none"
          stroke="#c4d4c8"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle
          cx={hinge.x}
          cy={hinge.y}
          r="8"
          fill="#eef3eb"
          stroke="#63866e"
          strokeWidth="2"
        />
        <path
          d={`M ${hinge.x} ${hinge.y - 8} v -12`}
          stroke="#63866e"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <circle cx={hinge.x} cy={hinge.y} r="2" fill="#8aa18f" />
        <circle cx={center.x} cy={center.y} r="3" fill="#3c6650" />
        <circle cx={pencil.x} cy={pencil.y} r="3" fill="#c7854c" />
        <path
          d={`M ${pencil.x} ${pencil.y} l 0 5`}
          stroke="#8d5f38"
          strokeWidth="2"
        />
      </g>
    );
  }
  const records = [
    ...lesson.givens.map((item, i) => ({
      item,
      t: 1,
      key: `g-${i}`,
      given: true,
    })),
    ...lesson.steps.flatMap((step, i) =>
      step.shapes.map((item, j) => ({
        item,
        t: clamp(cursor - i),
        key: `${i}-${j}`,
        given: false,
      })),
    ),
  ];
  return (
    <>
      {" "}
      {records
        .filter((r) => !["point", "text", "right"].includes(r.item.type))
        .map((r) => shape(r.item, r.t, r.key, r.given))}
      {records
        .filter((r) => ["point", "text", "right"].includes(r.item.type))
        .map((r) => shape(r.item, r.t, r.key, r.given))}
      {toolDrawing}
    </>
  );
});
function ConstructionScene({
  lesson,
  cursor,
  playing,
  tools,
  aids,
  zoom,
  pan,
  setPan,
  onKeyDown,
}) {
  const svgRef = useRef(null),
    drag = useRef(null);
  const panUpdates = useRafCallback(setPan);
  function down(event) {
    const box = svgRef.current.getBoundingClientRect();
    drag.current = {
      x: event.clientX,
      y: event.clientY,
      pan,
      ratio: 900 / box.width,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function move(event) {
    if (!drag.current) return;
    panUpdates.schedule({
      x:
        drag.current.pan.x +
        (event.clientX - drag.current.x) * drag.current.ratio,
      y:
        drag.current.pan.y +
        (event.clientY - drag.current.y) * drag.current.ratio,
    });
  }

  const index = Math.min(Math.floor(cursor), lesson.steps.length - 1),
    tool = lesson.steps[index].tool,
    showTool =
      tools && (playing || cursor % 1 > 1e-7) && cursor < lesson.steps.length;
  return (
    <svg
      ref={svgRef}
      className="construction-scene pannable-construction"
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={() => {
        panUpdates.flush();
        drag.current = null;
      }}
      onPointerCancel={() => {
        panUpdates.cancel();
        drag.current = null;
      }}
      onLostPointerCapture={() => (drag.current = null)}
      viewBox="0 0 900 540"
      role="img"
      tabIndex={0}
      onKeyDown={onKeyDown}
      aria-keyshortcuts="Space ArrowRight ArrowLeft"
      aria-label={`${lesson.title}, 완료 ${Math.floor(cursor)} / ${lesson.steps.length} 단계`}
    >
      <defs>
        <pattern
          id="construction-dots"
          width="24"
          height="24"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="1" cy="1" r=".8" fill="#dbe6db" />
        </pattern>
      </defs>
      <rect width="900" height="540" fill="#f9fbf6" />
      <rect width="900" height="540" fill="url(#construction-dots)" />
      <g
        className="construction-drawing"
        transform={`translate(${450 + pan.x} ${275 + pan.y}) scale(${zoom}) translate(-450 -275)`}
      >
        <ConstructionMarks
          lesson={lesson}
          cursor={cursor}
          playing={playing}
          tools={tools}
          aids={aids}
        />
      </g>
      <g pointerEvents="none">
        <rect x="20" y="18" width="164" height="29" rx="5" fill="#ffffffd9" />
        <text x="32" y="37" fontSize="11" fill="#78907b">
          {cursor >= lesson.steps.length
            ? "작도 완료"
            : playing
              ? `${Math.floor(cursor) + 1}단계 작도 중`
              : "주어진 도형과 작도 과정"}
        </text>
        {showTool && (
          <>
            <rect
              x="699"
              y="18"
              width="180"
              height="29"
              rx="5"
              fill="#edf3e8"
            />
            <text
              x="789"
              y="37"
              textAnchor="middle"
              fontSize="11"
              fill="#64865c"
            >
              {tool.type === "ruler"
                ? "눈금 없는 자로 선 긋기"
                : tool.measure
                  ? "컴퍼스에 길이 담기"
                  : "컴퍼스 간격을 유지해 회전"}
            </text>
          </>
        )}
      </g>
    </svg>
  );
}
export default function Construction({ onBack }) {
  const [topic, setTopic] = useState("segment"),
    [triangle, setTriangle] = useState("sss"),
    [variant, setVariant] = useState("outside"),
    [params, setParams] = useState(defaults),
    [cursor, setCursor] = useState(0),
    [mode, setMode] = useState(null),
    [run, setRun] = useState(0),
    [speed, setSpeed] = useState(1),
    [tools, setTools] = useState(true),
    [aids, setAids] = useState(true),
    [showSettings, setShowSettings] = useState(false),
    [zoom, setZoom] = useState(1.25),
    [pan, setPan] = useState({ x: 0, y: 0 }),
    [boardFocus, setBoardFocus] = useState(false);
  useEffect(() => {
    if (!boardFocus) return;
    const close = (event) => {
      if (event.key === "Escape") setBoardFocus(false);
    };
    addEventListener("keydown", close);
    return () => removeEventListener("keydown", close);
  }, [boardFocus]);
  const kind = topic === "triangle" ? triangle : topic,
    numeric = useMemo(
      () =>
        Object.fromEntries(
          Object.entries(params).map(([k, v]) => [
            k,
            v === "" ? NaN : Number(v),
          ]),
        ),
      [params],
    ),
    lesson = useMemo(
      () => buildConstruction(kind, numeric, variant),
      [kind, numeric, variant],
    ),
    count = lesson.steps.length;
  useEffect(() => {
    setCursor(0);
    setMode(null);
    setPan({ x: 0, y: 0 });
  }, [lesson]);
  useEffect(() => {
    if (!mode || !lesson.valid) return;
    let frame, time0;
    const start = cursor,
      target = mode === "all" ? count : Math.min(count, Math.floor(start) + 1);
    const tick = (t) => {
      if (time0 === undefined) time0 = t;
      const next = Math.min(target, start + ((t - time0) / 1900) * speed);
      setCursor(next);
      if (next >= target) setMode(null);
      else frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [mode, run, speed, lesson]);
  const displayIndex = Math.min(
      count - 1,
      Math.max(0, mode ? Math.floor(cursor) : Math.ceil(cursor) - 1),
    ),
    current = lesson.steps[displayIndex],
    finished = lesson.valid && cursor >= count;
  const selectStep = useCallback(
    (index) => {
      if (!lesson.valid) return;
      setCursor(index);
      setMode("step");
      setRun((n) => n + 1);
    },
    [lesson.valid],
  );
  function start(which, from = cursor) {
    if (!lesson.valid) return;
    setCursor(from);
    setMode(which);
    setRun((n) => n + 1);
  }
  function choose(id) {
    setTopic(id);
    setMode(null);
    setCursor(0);
  }
  function boardKeys(event) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === " ") {
      event.preventDefault();
      mode ? setMode(null) : start("all", finished ? 0 : cursor);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      if (!finished) start("step", cursor);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      setMode(null);
      setCursor(Math.max(0, Math.ceil(cursor) - 1));
    }
  }
  const fields =
    kind === "segment"
      ? [["length", "선분 AB의 길이", "cm"]]
      : kind === "angle" || kind === "angleBisector"
        ? [["angle", "원래 각의 크기", "°"]]
        : kind === "sss"
          ? [
              ["c", "변 AB", "cm"],
              ["b", "변 AC", "cm"],
              ["a", "변 BC", "cm"],
            ]
          : kind === "sas"
            ? [
                ["c", "변 AB", "cm"],
                ["b", "변 AC", "cm"],
                ["angle", "끼인각 ∠A", "°"],
              ]
            : kind === "asa"
              ? [
                  ["c", "변 AB", "cm"],
                  ["alpha", "밑각 ∠A", "°"],
                  ["beta", "밑각 ∠B", "°"],
                ]
              : [];
  return (
    <main
      className={`sim-page construction-page sim-theme theme-construction ${boardFocus ? "board-focus" : ""}`}
    >
      <button className="back" onClick={onBack}>
        <ArrowLeft size={15} /> 시뮬레이션 탐색
      </button>
      <div className="sim-title">
        <div>
          <div className="card-meta">
            <span>중1 수학</span>
            <span>기본 도형 · 작도</span>
          </div>
          <h1>
            자와 컴퍼스 작도 실험실 <span>LAB 03</span>
          </h1>
          <p>
            눈금 없는 자와 컴퍼스만으로, 정확한 도형을 만드는 과정을 탐구하세요.
          </p>
        </div>
        <div className="title-icon">
          <Compass size={29} />
        </div>
      </div>
      <div className="construction-board-tools">
        <button
          aria-expanded={showSettings}
          aria-controls="construction-settings"
          onClick={() => setShowSettings(!showSettings)}
        >
          <SlidersHorizontal size={15} />
          {showSettings ? "작도 설정 접기" : "작도 설정 열기"}
        </button>
        <span>드래그로 이동 · 보드 선택 후 Space 재생/정지 · ←/→ 단계</span>
        <div>
          <button
            aria-label="작도 그림 축소"
            onClick={() =>
              setZoom((z) => Math.max(0.75, Number((z - 0.25).toFixed(2))))
            }
          >
            <ZoomOut size={16} />
          </button>
          <b>{Math.round(zoom * 100)}%</b>
          <button
            aria-label="작도 그림 확대"
            onClick={() =>
              setZoom((z) => Math.min(3, Number((z + 0.25).toFixed(2))))
            }
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
          >
            그림 맞추기
          </button>
        </div>
      </div>
      <div
        className={`lab-layout construction-layout ${showSettings ? "settings-open" : ""}`}
      >
        <aside
          id="construction-settings"
          hidden={!showSettings}
          className="settings construction-settings"
        >
          <div className="panel-title">
            <Ruler size={17} />
            <h3>나만의 작도 설정</h3>
          </div>
          <div className="field-label">
            01 <strong>기본 작도</strong>
          </div>
          <div className="construction-options">
            {basicConstructions.map((item) => (
              <button
                key={item.id}
                className={topic === item.id ? "selected" : ""}
                aria-pressed={topic === item.id}
                onClick={() => choose(item.id)}
              >
                {item.id === "triangle" ? (
                  <Triangle size={15} />
                ) : (
                  <Compass size={15} />
                )}
                <span>{item.name}</span>
                {topic === item.id && <Check size={13} />}
              </button>
            ))}
          </div>
          <div className="field-label">
            02 <strong>심화 작도</strong>
          </div>
          <div className="construction-options">
            {advancedConstructions.map((item) => (
              <button
                key={item.id}
                className={topic === item.id ? "selected" : ""}
                aria-pressed={topic === item.id}
                onClick={() => choose(item.id)}
              >
                <Compass size={15} />
                <span>{item.name}</span>
                {topic === item.id && <Check size={13} />}
              </button>
            ))}
          </div>
          {topic === "triangle" && (
            <>
              <div className="field-label">
                03 <strong>삼각형의 작도 조건</strong>
              </div>
              <div className="construction-methods">
                {[
                  ["sss", "SSS", "세 변의 길이"],
                  ["sas", "SAS", "두 변과 그 끼인각"],
                  ["asa", "ASA", "한 변과 그 양 끝 각"],
                ].map(([id, name, text]) => (
                  <button
                    key={id}
                    className={triangle === id ? "selected" : ""}
                    aria-label={`${name} ${text}`}
                    aria-pressed={triangle === id}
                    onClick={() => setTriangle(id)}
                  >
                    <b>{name}</b>
                    <span>{text}</span>
                  </button>
                ))}
              </div>
            </>
          )}
          {topic === "perpendicular" && (
            <div className="route-tabs perpendicular-types">
              {[
                ["outside", "직선 밖의 점"],
                ["on", "직선 위의 점"],
              ].map(([v, text]) => (
                <button
                  key={v}
                  className={variant === v ? "selected" : ""}
                  onClick={() => setVariant(v)}
                >
                  {text}
                </button>
              ))}
            </div>
          )}
          {fields.length > 0 && (
            <>
              <div className="field-label">
                {topic === "triangle" ? "04" : "03"}{" "}
                <strong>길이와 각도 설정</strong>
              </div>
              <div className="construction-inputs">
                {fields.map(([key, name, unit]) => {
                  const label = name;
                  return (
                    <label key={key}>
                      <span>{label}</span>
                      <div>
                        <input
                          aria-label={label}
                          type="number"
                          min={unit === "cm" ? 0.5 : 5}
                          max={unit === "cm" ? 12 : 175}
                          step={unit === "cm" ? 0.5 : 1}
                          value={params[key]}
                          onChange={(e) =>
                            setParams((p) => ({ ...p, [key]: e.target.value }))
                          }
                        />
                        <span>{unit}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
              <p className="dimension-note">
                길이 0.5~12 cm · 각도 5°~175°
                <br />
                조건을 바꾸면 작도가 처음으로 돌아갑니다.
              </p>
            </>
          )}
          {!lesson.valid && (
            <div className="construction-error" role="alert">
              <Info size={15} />
              <p>{lesson.error}</p>
            </div>
          )}
          <div className="setting-tip">
            <Info size={15} />
            <p>
              자는 눈금으로 길이를 재지 않아요. 길이와 각의 크기는 컴퍼스의
              간격을 옮겨 맞춥니다.
            </p>
          </div>
        </aside>
        <section className="lab-main">
          <div className="construction-workspace">
            {boardFocus && (
              <div className="focus-zoom-controls">
                <button
                  aria-label="전체화면 그림 축소"
                  onClick={() => setZoom((z) => Math.max(0.75, z - 0.25))}
                >
                  <ZoomOut size={16} />
                </button>
                <span>{Math.round(zoom * 100)}%</span>
                <button
                  aria-label="전체화면 그림 확대"
                  onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                >
                  <ZoomIn size={16} />
                </button>
              </div>
            )}
            <div className="canvas-panel">
              <div className="canvas-heading">
                <span>
                  <span className="live-dot" />{" "}
                  {lesson.valid ? lesson.title : "작도 조건 확인"}
                </span>
                <div className="construction-switches">
                  <button
                    className="board-focus-button"
                    onClick={() => setBoardFocus(!boardFocus)}
                  >
                    <Maximize2 size={13} />
                    {boardFocus ? "전체화면 닫기" : "보드 전체화면"}
                  </button>
                  <label>
                    <input
                      type="checkbox"
                      checked={tools}
                      onChange={(e) => setTools(e.target.checked)}
                    />{" "}
                    도구 표시
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={aids}
                      onChange={(e) => setAids(e.target.checked)}
                    />{" "}
                    보조선 표시
                  </label>
                </div>
              </div>
              {lesson.valid ? (
                <ConstructionScene
                  lesson={lesson}
                  cursor={cursor}
                  playing={!!mode}
                  tools={tools}
                  aids={aids}
                  zoom={zoom}
                  pan={pan}
                  setPan={setPan}
                  onKeyDown={boardKeys}
                />
              ) : (
                <div className="invalid-construction">
                  <Triangle size={38} />
                  <h3>이 조건으로는 작도할 수 없어요</h3>
                  <p>{lesson.error}</p>
                </div>
              )}
              <div className="construction-tool-legend">
                <span>
                  <Ruler size={14} /> 눈금 없는 자
                </span>
                <span>
                  <Compass size={14} /> 컴퍼스
                </span>
                <span>
                  <i /> 완성 선분
                </span>
              </div>
              <div className="playback">
                <div className="timeline-label">
                  <span>
                    {finished
                      ? "모든 단계 완료"
                      : `단계 ${Math.max(0, displayIndex) + 1}`}
                  </span>
                  <span data-testid="construction-progress">
                    {Math.floor(cursor)} / {count} 단계 완료
                  </span>
                </div>
                <input
                  aria-label="작도 진행"
                  type="range"
                  min="0"
                  max={Math.max(1, count)}
                  step=".01"
                  disabled={!lesson.valid}
                  value={cursor}
                  onChange={(e) => {
                    setMode(null);
                    setCursor(+e.target.value);
                  }}
                />
                <div className="controls">
                  <button
                    aria-label="작도 처음으로"
                    disabled={!lesson.valid}
                    onClick={() => {
                      setMode(null);
                      setCursor(0);
                    }}
                  >
                    <RotateCcw size={17} />
                  </button>
                  <button
                    aria-label="작도 이전 단계"
                    disabled={!lesson.valid || cursor <= 0}
                    onClick={() => {
                      setMode(null);
                      setCursor(Math.max(0, Math.ceil(cursor) - 1));
                    }}
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    className="play-button"
                    disabled={!lesson.valid}
                    onClick={() =>
                      mode ? setMode(null) : start("all", finished ? 0 : cursor)
                    }
                  >
                    {mode ? (
                      <Pause size={15} fill="currentColor" />
                    ) : (
                      <Play size={15} fill="currentColor" />
                    )}
                    {mode ? "일시정지" : "전체 연속 재생"}
                  </button>
                  <button
                    aria-label="작도 다음 단계"
                    disabled={!lesson.valid || finished}
                    onClick={() => start("step", cursor)}
                  >
                    <ChevronRight size={20} />
                  </button>
                  <select
                    aria-label="작도 재생 속도"
                    value={speed}
                    onChange={(e) => setSpeed(+e.target.value)}
                  >
                    {[0.5, 1, 2, 4].map((n) => (
                      <option key={n} value={n}>
                        {n}× 속도
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            {lesson.valid && (
              <ConstructionSteps
                lesson={lesson}
                displayIndex={displayIndex}
                completed={Math.floor(cursor)}
                onSelectStep={selectStep}
              />
            )}
          </div>
          {lesson.valid && (
            <>
              <div
                className={`construction-current ${finished ? "finished" : ""}`}
              >
                <span className="current-step-number">
                  {finished ? (
                    <Check size={22} />
                  ) : (
                    String(displayIndex + 1).padStart(2, "0")
                  )}
                </span>
                <div>
                  <small>
                    {finished
                      ? "CONSTRUCTION COMPLETE"
                      : current.tool.type === "ruler"
                        ? "눈금 없는 자"
                        : "컴퍼스"}
                  </small>
                  <h3>{finished ? "작도를 완성했어요" : current.title}</h3>
                  <p>{finished ? lesson.proof : current.description}</p>
                </div>
                <button
                  onClick={() => start("step", Math.max(0, displayIndex))}
                >
                  <RotateCcw size={14} /> 이 단계 다시 보기
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
