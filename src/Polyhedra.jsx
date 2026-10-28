import React, { useEffect, useMemo, useRef, useState, memo } from "react";
import {
  ArrowLeft,
  Box,
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  Move3D,
  Layers,
  Hand,
  Check,
  Maximize2,
} from "lucide-react";
import {
  solids,
  netsFor,
  createNet,
  foldNet,
  netBounds,
  faceColors,
  add,
  sub,
  mul,
  dot,
  cross,
  norm,
  unit,
  mean,
} from "./polyhedra.js";

const SolidIcon = memo(function SolidIcon({ solid }) {
  return (
    <svg width="38" height="38" viewBox="0 0 40 40" aria-hidden="true">
      {solid.id === "cube" ? (
        <>
          <path d="M20 4 35 12 35 29 20 37 5 29 5 12Z" />
          <path d="M5 12 20 21 35 12M20 21V37" />
        </>
      ) : solid.id === "tetrahedron" ? (
        <>
          <path d="M20 4 36 32 4 32Z" />
          <path d="M20 4 21 24 36 32M21 24 4 32" />
        </>
      ) : (
        <>
          <path d="M20 3 35 12 35 28 20 37 5 28 5 12Z" />
          <path
            d={
              solid.id === "octahedron"
                ? "M20 3 5 23 20 37 35 23ZM5 23H35"
                : "M20 3 27 14 35 12M27 14 25 26 35 28M25 26 15 26 20 37M15 26 12 14 5 12M12 14 27 14M15 26 5 28"
            }
          />
        </>
      )}
    </svg>
  );
});
const NetPreview = memo(function NetPreview({ solid, mask }) {
  const faces = useMemo(
      () => foldNet(createNet(solid, mask), 0),
      [solid, mask],
    ),
    b = netBounds(faces),
    pad = Math.max(b.width, b.height) * 0.1;
  return (
    <svg
      viewBox={`${b.minX - pad} ${-b.maxY - pad} ${b.width + 2 * pad} ${b.height + 2 * pad}`}
      aria-hidden="true"
    >
      {faces.map((face, i) => (
        <polygon
          key={i}
          points={face.map((p) => `${p[0]},${-p[1]}`).join(" ")}
          fill={faceColors[i % faceColors.length]}
          stroke="#668875"
          strokeWidth=".03"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
});
function FoldScene({ net, amount, camera, setCamera, zoom, numbers, hinges }) {
  const drag = useRef(null);
  const faces = useMemo(() => foldNet(net, amount), [net, amount]);
  const center = mean(faces.flat()),
    radius = Math.max(...faces.flat().map((p) => norm(sub(p, center)))),
    scale = (188 / radius) * zoom;
  const rotate = (p) => {
    const [x, y, z] = sub(p, center),
      cy = Math.cos(camera.yaw),
      sy = Math.sin(camera.yaw),
      cp = Math.cos(camera.pitch),
      sp = Math.sin(camera.pitch),
      xx = x * cy + z * sy,
      zz = -x * sy + z * cy;
    return [xx, y * cp - zz * sp, y * sp + zz * cp];
  };
  const project = (p) => {
    const f = (radius * 4) / (radius * 4 - p[2]);
    return [420 + p[0] * scale * f, 245 - p[1] * scale * f];
  };
  const ordered = faces
    .map((face, index) => {
      const rotated = face.map(rotate),
        normal = unit(
          cross(sub(rotated[1], rotated[0]), sub(rotated[2], rotated[0])),
        );
      return {
        index,
        points: rotated.map(project),
        depth: mean(rotated)[2],
        center: project(mean(rotated)),
        light: 0.8 + 0.2 * Math.abs(normal[2]),
      };
    })
    .sort((a, b) => a.depth - b.depth);
  function down(e) {
    drag.current = { x: e.clientX, y: e.clientY, camera };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function move(e) {
    if (!drag.current) return;
    setCamera({
      yaw: drag.current.camera.yaw + (e.clientX - drag.current.x) * 0.009,
      pitch: Math.max(
        -1.5,
        Math.min(
          1.5,
          drag.current.camera.pitch + (e.clientY - drag.current.y) * 0.009,
        ),
      ),
    });
  }
  return (
    <svg
      className="fold-scene"
      viewBox="0 0 840 480"
      role="img"
      aria-label={`${net.solid.name} 전개도 ${Math.round(amount * 100)}% 접힘, 드래그하여 3D 회전`}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={() => (drag.current = null)}
      onPointerCancel={() => (drag.current = null)}
      onLostPointerCapture={() => (drag.current = null)}
    >
      <defs>
        <pattern
          id="fold-grid"
          width="28"
          height="28"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="1" cy="1" r=".9" fill="#dbe5dd" />
        </pattern>
      </defs>
      <rect width="840" height="480" fill="#f7faf5" />
      <rect width="840" height="480" fill="url(#fold-grid)" />
      <ellipse
        cx="420"
        cy="438"
        rx="145"
        ry="12"
        fill="#8da78c"
        opacity=".08"
      />
      {ordered.map(({ index, points, center, light }) => (
        <g key={index} data-testid="fold-face" data-face={index}>
          <polygon
            points={points.map((p) => p.join(",")).join(" ")}
            fill={faceColors[index % faceColors.length]}
            style={{ filter: `brightness(${light})` }}
            stroke="#557b65"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
          {hinges &&
            amount < 0.98 &&
            net.solid.faceEdges[index].map((edge, i) =>
              net.mask & (1 << edge) ? (
                <line
                  key={edge}
                  x1={points[i][0]}
                  y1={points[i][1]}
                  x2={points[(i + 1) % points.length][0]}
                  y2={points[(i + 1) % points.length][1]}
                  stroke="#587864"
                  strokeWidth="1.7"
                  strokeDasharray="5 4"
                />
              ) : null,
            )}
          {numbers && (
            <text
              x={center[0]}
              y={center[1]}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="13"
              fontWeight="600"
              fill="#3a5b46"
              stroke="#fff"
              strokeWidth="2"
              paintOrder="stroke"
              pointerEvents="none"
            >
              {index + 1}
            </text>
          )}
        </g>
      ))}
      <text x="22" y="30" fontSize="11" fill="#79917b">
        {amount === 0
          ? "펼쳐진 전개도"
          : amount === 1
            ? "완성된 정다면체"
            : "전개도를 접는 중"}
      </text>
      <text x="818" y="30" textAnchor="end" fontSize="11" fill="#79917b">
        접힘 {Math.round(amount * 100)}%
      </text>
      <g pointerEvents="none">
        <rect
          x="315"
          y="446"
          width="210"
          height="23"
          rx="11"
          fill="#ffffffb0"
        />
        <text x="420" y="461" textAnchor="middle" fontSize="10" fill="#8a9b87">
          마우스 또는 손가락으로 돌려 보세요
        </text>
      </g>
    </svg>
  );
}
export default function Polyhedra({ onBack }) {
  const [id, setId] = useState("cube"),
    [index, setIndex] = useState(0),
    [draft, setDraft] = useState("1"),
    [amount, setAmount] = useState(0),
    [playing, setPlaying] = useState(false),
    [direction, setDirection] = useState(1),
    [camera, setCamera] = useState({ yaw: 0, pitch: 0 }),
    [zoom, setZoom] = useState(1),
    [numbers, setNumbers] = useState(true),
    [hinges, setHinges] = useState(true);
  const solid = solids.find((s) => s.id === id),
    nets = useMemo(() => netsFor(id), [id]),
    net = useMemo(() => createNet(solid, nets[index]), [solid, nets, index]),
    page = Math.floor(index / 12),
    start = page * 12;
  useEffect(() => setDraft(String(index + 1)), [index]);
  useEffect(() => {
    if (!playing) return;
    let frame, startTime;
    const initial = amount;
    const tick = (time) => {
      if (startTime === undefined) startTime = time;
      const next = Math.max(
        0,
        Math.min(1, initial + (direction * (time - startTime)) / 3800),
      );
      setAmount(next);
      if ((direction > 0 && next >= 1) || (direction < 0 && next <= 0))
        setPlaying(false);
      else frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, net, direction]);
  function selectNet(i) {
    setIndex(Math.max(0, Math.min(nets.length - 1, i)));
    setAmount(0);
    setDirection(1);
    setPlaying(false);
    setCamera({ yaw: 0, pitch: 0 });
  }
  function selectSolid(next) {
    setId(next);
    setIndex(0);
    setDraft("1");
    setAmount(0);
    setDirection(1);
    setPlaying(false);
    setCamera({ yaw: 0, pitch: 0 });
    setZoom(1);
  }
  function jump() {
    const value = Number(draft);
    if (Number.isInteger(value) && value >= 1 && value <= nets.length)
      selectNet(value - 1);
    else setDraft(String(index + 1));
  }
  function pose(value) {
    setDirection(value === 0 ? 1 : -1);
    setPlaying(false);
    setAmount(value);
    setCamera(value === 0 ? { yaw: 0, pitch: 0 } : { yaw: -0.48, pitch: 0.38 });
  }
  return (
    <main className="sim-page poly-page sim-theme theme-polyhedra">
      <button className="back" onClick={onBack}>
        <ArrowLeft size={15} /> 시뮬레이션 탐색
      </button>
      <div className="sim-title">
        <div>
          <div className="card-meta">
            <span>중1 수학</span>
            <span>입체도형 · 정다면체</span>
          </div>
          <h1>
            펼치고 접는 정다면체 <span>LAB 02</span>
          </h1>
          <p>
            모서리를 따라 접고, 돌려 보며 평면과 입체 사이의 관계를 발견하세요.
          </p>
        </div>
        <div className="title-icon">
          <Box size={29} />
        </div>
      </div>
      <div className="lab-layout">
        <aside className="settings poly-settings">
          <div className="panel-title">
            <Box size={17} />
            <h3>입체 탐구 설정</h3>
          </div>
          <div className="field-label">
            01 <strong>정다면체 선택</strong>
          </div>
          <div className="solid-options">
            {solids.map((s) => (
              <button
                key={s.id}
                className={id === s.id ? "selected" : ""}
                aria-pressed={id === s.id}
                onClick={() => selectSolid(s.id)}
              >
                <SolidIcon solid={s} />
                <span>
                  <strong>{s.name}</strong>
                  <small>
                    {s.polygon} {s.faces.length}개
                  </small>
                </span>
                {id === s.id && <Check size={14} />}
              </button>
            ))}
          </div>
          <div className="field-label">
            02 <strong>전개도 선택</strong>
            <span>{nets.length.toLocaleString()}종</span>
          </div>
          <div className="net-stepper">
            <button
              aria-label="이전 전개도"
              disabled={index === 0}
              onClick={() => selectNet(index - 1)}
            >
              <ChevronLeft size={16} />
            </button>
            <div>
              <b>{(index + 1).toLocaleString()}</b>
              <small> / {nets.length.toLocaleString()}</small>
            </div>
            <button
              aria-label="다음 전개도"
              disabled={index === nets.length - 1}
              onClick={() => selectNet(index + 1)}
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <form
            className="net-jump"
            onSubmit={(e) => {
              e.preventDefault();
              jump();
            }}
          >
            <label>
              <span>전개도 번호</span>
              <input
                aria-label="전개도 번호"
                type="number"
                min="1"
                max={nets.length}
                step="1"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
            </label>
            <button type="submit">이동</button>
          </form>
          <button
            className="random-net"
            onClick={() => selectNet(Math.floor(Math.random() * nets.length))}
          >
            <Shuffle size={14} /> 무작위 전개도
          </button>
          <div className="field-label">
            03 <strong>표시 설정</strong>
          </div>
          <label className="poly-check">
            <input
              type="checkbox"
              checked={numbers}
              onChange={(e) => setNumbers(e.target.checked)}
            />{" "}
            면 번호 표시
          </label>
          <label className="poly-check">
            <input
              type="checkbox"
              checked={hinges}
              onChange={(e) => setHinges(e.target.checked)}
            />{" "}
            접는 모서리 표시
          </label>
          <div className="setting-tip">
            <Hand size={16} />
            <p>
              그림을 드래그하면 어느 방향에서든 관찰할 수 있어요. 전개도를
              바꾸면 완전히 펼쳐진 상태에서 시작해요.
            </p>
          </div>
        </aside>
        <section className="lab-main">
          <div className="canvas-panel">
            <div className="canvas-heading">
              <span>
                <span className="live-dot" /> {solid.name} · 전개도 {index + 1}
              </span>
              <span className="poly-3d-badge">
                <Move3D size={14} /> 3D 실험실
              </span>
            </div>
            <FoldScene
              net={net}
              amount={amount}
              camera={camera}
              setCamera={setCamera}
              zoom={zoom}
              numbers={numbers}
              hinges={hinges}
            />
            <div className="fold-toolbar">
              <div>
                <button onClick={() => pose(0)}>전개도 보기</button>
                <button onClick={() => pose(1)}>입체 보기</button>
              </div>
              <div>
                <label>
                  확대{" "}
                  <input
                    aria-label="3D 확대"
                    type="range"
                    min=".65"
                    max="1.6"
                    step=".05"
                    value={zoom}
                    onChange={(e) => setZoom(+e.target.value)}
                  />
                </label>
                <button
                  aria-label="3D 시점 초기화"
                  title="시점 초기화"
                  onClick={() => {
                    setCamera({ yaw: 0, pitch: 0 });
                    setZoom(1);
                  }}
                >
                  <RotateCcw size={14} />
                </button>
              </div>
            </div>
            <div className="playback">
              <div className="timeline-label">
                <span>펼쳐진 전개도</span>
                <strong>{Math.round(amount * 100)}% 접힘</strong>
                <span>완성된 정다면체</span>
              </div>
              <input
                aria-label="접기 정도"
                type="range"
                min="0"
                max="100"
                step="1"
                value={Math.round(amount * 100)}
                onChange={(e) => {
                  setPlaying(false);
                  setAmount(+e.target.value / 100);
                }}
              />
              <div className="controls">
                <button aria-label="완전히 펼치기" onClick={() => pose(0)}>
                  <RotateCcw size={17} />
                </button>
                <button
                  className="play-button"
                  onClick={() => {
                    if (!playing && amount === 0) {
                      setDirection(1);
                      setCamera({ yaw: -0.35, pitch: 0.3 });
                    }
                    if (!playing && amount === 1) setDirection(-1);
                    setPlaying(!playing);
                  }}
                >
                  {playing ? (
                    <Pause size={16} fill="currentColor" />
                  ) : (
                    <Play size={16} fill="currentColor" />
                  )}
                  {playing
                    ? "일시정지"
                    : amount >= 1 || direction < 0
                      ? "펼쳐 보기"
                      : "접어 보기"}
                </button>
                <button aria-label="완전히 접기" onClick={() => pose(1)}>
                  <Box size={18} />
                </button>
              </div>
            </div>
          </div>
          <section className="solid-facts">
            <div className="poly-section-title">
              <div>
                <div className="eyebrow muted">PLATONIC SOLIDS</div>
                <h2>정다면체를 이루는 것들</h2>
              </div>
              <span>선택한 정다면체가 표에 표시돼요</span>
            </div>
            <div className="facts-scroll">
              <table aria-label="정다면체의 구성 요소">
                <thead>
                  <tr>
                    <th>정다면체</th>
                    <th>한 면의 모양</th>
                    <th>면</th>
                    <th>모서리</th>
                    <th>꼭짓점</th>
                    <th>
                      한 꼭짓점에
                      <br />
                      모이는 면
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {solids.map((s) => (
                    <tr key={s.id} className={id === s.id ? "selected" : ""}>
                      <th scope="row">{s.name}</th>
                      <td>{s.polygon}</td>
                      <td>{s.faces.length}</td>
                      <td>{s.edges.length}</td>
                      <td>{s.vertices.length}</td>
                      <td>{s.meet}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="euler-note">
              모든 정다면체에서{" "}
              <strong>꼭짓점 수 − 모서리 수 + 면 수 = 2</strong>가 성립해요.
            </p>
          </section>
          <section className="net-gallery">
            <div className="poly-section-title">
              <div>
                <div className="eyebrow muted">NET COLLECTION</div>
                <h2>
                  {solid.name}의 모든 전개도{" "}
                  <small>{nets.length.toLocaleString()}종</small>
                </h2>
              </div>
              <span>
                {start + 1}–{Math.min(start + 12, nets.length)} /{" "}
                {nets.length.toLocaleString()}
              </span>
            </div>
            <p className="net-scope">
              모서리만 잘라 얻는 전개도입니다. 회전·뒤집기로 같은 전개도는
              하나로 셉니다.
            </p>
            <div className="net-thumbnails">
              {nets.slice(start, start + 12).map((mask, i) => (
                <button
                  key={mask}
                  className={index === start + i ? "selected" : ""}
                  aria-label={`전개도 ${start + i + 1} 선택`}
                  aria-pressed={index === start + i}
                  onClick={() => selectNet(start + i)}
                >
                  <NetPreview solid={solid} mask={mask} />
                  <span>
                    전개도 {start + i + 1}
                    {index === start + i && <Check size={12} />}
                  </span>
                </button>
              ))}
            </div>
            <div className="net-pagination">
              <button
                aria-label="이전 전개도 페이지"
                disabled={page === 0}
                onClick={() => selectNet(start - 12)}
              >
                <ChevronLeft size={15} /> 이전
              </button>
              <span>
                {page + 1} / {Math.ceil(nets.length / 12)}
              </span>
              <button
                aria-label="다음 전개도 페이지"
                disabled={start + 12 >= nets.length}
                onClick={() => selectNet(start + 12)}
              >
                다음 <ChevronRight size={15} />
              </button>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
