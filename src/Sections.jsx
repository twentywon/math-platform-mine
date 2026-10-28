import React, { useMemo, useRef, useState } from "react";
import { ArrowLeft, Box, RotateCcw, Move, Layers } from "lucide-react";
import {
  sectionSolids,
  planeNormal,
  planeOffset,
  intersectSolid,
  basis,
  add,
  mul,
} from "./sections.js";
import { useRafCallback } from "./useRafCallback.js";
import "./sections.css";
export default function Sections({ onBack }) {
  const [id, setId] = useState("cube"),
    [tilt, setTilt] = useState(0),
    [azimuth, setAzimuth] = useState(45),
    [position, setPosition] = useState(0),
    [yaw, setYaw] = useState(-35),
    [pitch, setPitch] = useState(22),
    [showPlane, setShowPlane] = useState(true);
  const solid = sectionSolids.find((s) => s.id === id),
    normal = useMemo(() => planeNormal(tilt, azimuth), [tilt, azimuth]),
    offset = planeOffset(solid, normal, position),
    section = useMemo(
      () => intersectSolid(solid, normal, offset),
      [solid, normal, offset],
    );
  const drag = useRef(null),
    updates = useRafCallback(({ yaw, pitch }) => {
      setYaw(yaw);
      setPitch(pitch);
    });
  const project = (p) => {
    const a = (yaw * Math.PI) / 180,
      b = (pitch * Math.PI) / 180,
      x = p[0] * Math.cos(a) + p[2] * Math.sin(a),
      z = -p[0] * Math.sin(a) + p[2] * Math.cos(a);
    return [
      380 + x * 135,
      300 - (p[1] * Math.cos(b) - z * Math.sin(b)) * 135,
      p[1] * Math.sin(b) + z * Math.cos(b),
    ];
  };
  const path = (points) =>
    points.map((p) => project(p).slice(0, 2).join(",")).join(" ");
  const [u, v] = basis(normal),
    origin = mul(normal, offset),
    plane = [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ].map(([a, b]) => add(origin, add(mul(u, a * 2), mul(v, b * 2))));
  const faces = solid.faces
    .map((f) => ({
      points: f.map((i) => solid.vertices[i]),
      depth:
        f.reduce((s, i) => s + project(solid.vertices[i])[2], 0) / f.length,
    }))
    .sort((a, b) => a.depth - b.depth);
  const flat = section.flat.map(([x, y]) => [160 + x * 77, 140 - y * 77]),
    flatPath = flat.map((p) => p.join(",")).join(" ");
  function preset(t, a = 45) {
    setTilt(t);
    setAzimuth(a);
    setPosition(0);
  }
  const result =
    section.dimension < 0
      ? "입체와 만나지 않아요"
      : section.dimension < 2
        ? "점이나 선분에서만 만나요"
        : `${section.kind} 단면`;
  return (
    <main className="sim-page sections-page sim-theme theme-sections">
      <button className="back" onClick={onBack}>
        <ArrowLeft size={15} /> 시뮬레이션 탐색
      </button>
      <div className="sim-title">
        <div>
          <div className="card-meta">
            <span>중1 수학</span>
            <span>입체도형</span>
          </div>
          <h1>
            잘라서 발견하는 입체의 단면 <span>SECTION LAB</span>
          </h1>
          <p>
            절단면의 위치와 기울기를 바꾸고, 같은 입체에서 어떤 단면이 생기는지
            관찰하세요.
          </p>
        </div>
        <div className="title-icon">
          <Box size={29} />
        </div>
      </div>
      <div className="section-shapes" aria-label="입체도형 선택">
        {sectionSolids.map((s) => (
          <button
            key={s.id}
            className={id === s.id ? "active" : ""}
            aria-pressed={id === s.id}
            onClick={() => {
              setId(s.id);
              setPosition(0);
            }}
          >
            <Box size={17} />
            {s.name}
          </button>
        ))}
      </div>
      <div className="section-layout">
        <section className="canvas-panel section-board">
          <div className="canvas-heading">
            <span>
              <span className="live-dot" />
              {solid.name} · 3D 관찰
            </span>
            <button
              onClick={() => {
                setYaw(-35);
                setPitch(22);
              }}
            >
              <RotateCcw size={14} /> 시점 초기화
            </button>
          </div>
          <svg
            className="section-scene"
            viewBox="0 0 760 600"
            role="img"
            aria-label={`${solid.name}의 ${result}`}
            tabIndex="0"
            onPointerDown={(e) => {
              e.preventDefault();
              e.currentTarget.setPointerCapture(e.pointerId);
              drag.current = { x: e.clientX, y: e.clientY, yaw, pitch };
            }}
            onPointerMove={(e) => {
              if (drag.current) {
                const d = drag.current;
                updates.schedule({
                  yaw: d.yaw + (e.clientX - d.x) * 0.4,
                  pitch: Math.max(
                    -75,
                    Math.min(75, d.pitch + (e.clientY - d.y) * 0.35),
                  ),
                });
              }
            }}
            onPointerUp={(e) => {
              updates.flush();
              drag.current = null;
              e.currentTarget.releasePointerCapture(e.pointerId);
            }}
            onPointerCancel={() => {
              updates.cancel();
              drag.current = null;
            }}
            onLostPointerCapture={() => {
              drag.current = null;
            }}
            onKeyDown={(e) => {
              if (e.key.startsWith("Arrow")) {
                e.preventDefault();
                if (e.key === "ArrowLeft") setYaw((v) => v - 5);
                if (e.key === "ArrowRight") setYaw((v) => v + 5);
                if (e.key === "ArrowUp") setPitch((v) => Math.max(-75, v - 5));
                if (e.key === "ArrowDown") setPitch((v) => Math.min(75, v + 5));
              }
            }}
          >
            <defs>
              <radialGradient id="section-bg">
                <stop stopColor="#f8f1ea" />
                <stop offset="1" stopColor="#eee7df" />
              </radialGradient>
              <radialGradient id="section-sphere">
                <stop stopColor="#fff7e9" stopOpacity=".8" />
                <stop offset="1" stopColor="#b99570" stopOpacity=".4" />
              </radialGradient>
            </defs>
            <rect width="760" height="600" fill="url(#section-bg)" />
            <ellipse
              cx="380"
              cy="507"
              rx="195"
              ry="25"
              fill="#745541"
              opacity=".08"
            />
            {[-2, -1, 0, 1, 2].map((i) => (
              <g key={i} stroke="#b7a48f" strokeOpacity=".18">
                <polyline
                  points={path([
                    [-2, -1.55, i],
                    [2, -1.55, i],
                  ])}
                />
                <polyline
                  points={path([
                    [i, -1.55, -2],
                    [i, -1.55, 2],
                  ])}
                />
              </g>
            ))}
            {solid.id === "sphere" ? (
              <>
                <circle
                  cx="380"
                  cy="300"
                  r="135"
                  fill="url(#section-sphere)"
                  stroke="#a38568"
                />
                {[0, 1, 2].map((axis) => (
                  <polyline
                    key={axis}
                    points={path(
                      Array.from({ length: 97 }, (_, i) => {
                        const p = [
                          Math.cos((i * Math.PI) / 48),
                          Math.sin((i * Math.PI) / 48),
                          0,
                        ];
                        return axis === 0
                          ? p
                          : axis === 1
                            ? [p[0], 0, p[1]]
                            : [0, p[0], p[1]];
                      }),
                    )}
                    fill="none"
                    stroke="#9d7b5a"
                    strokeOpacity=".35"
                    strokeDasharray="5 5"
                  />
                ))}
              </>
            ) : (
              faces.map((f, i) => (
                <polygon
                  key={i}
                  points={path(f.points)}
                  fill="#bfa387"
                  fillOpacity={solid.curved ? ".045" : ".13"}
                  stroke={solid.curved ? "none" : "#9e8063"}
                  strokeOpacity=".6"
                  strokeWidth="1.2"
                />
              ))
            )}
            {solid.curved && solid.id !== "sphere" && (
              <g fill="none" stroke="#94765c" strokeOpacity=".65">
                {[-1, 1]
                  .filter((y) => solid.id !== "cone" || y === -1)
                  .map((y) => (
                    <polyline
                      key={y}
                      points={path(
                        Array.from({ length: 193 }, (_, i) => [
                          Math.cos((i * Math.PI) / 96),
                          y,
                          Math.sin((i * Math.PI) / 96),
                        ]),
                      )}
                    />
                  ))}
                {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((a) => (
                  <polyline
                    key={a}
                    points={path([
                      [Math.cos(a), -1, Math.sin(a)],
                      solid.id === "cone"
                        ? [0, 1, 0]
                        : [Math.cos(a), 1, Math.sin(a)],
                    ])}
                    strokeOpacity=".3"
                  />
                ))}
              </g>
            )}
            {showPlane && (
              <polygon
                data-testid="cutting-plane"
                points={path(plane)}
                fill="#ce795b"
                fillOpacity=".14"
                stroke="#ad5a3f"
                strokeOpacity=".6"
                strokeDasharray="7 5"
              />
            )}
            {section.dimension === 2 && (
              <polygon
                data-testid="solid-section"
                points={path(section.points)}
                fill="#d96945"
                fillOpacity=".75"
                stroke="#8e3922"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
            )}
            {section.dimension === 1 && (
              <polyline
                points={path(section.points)}
                stroke="#a94f2f"
                strokeWidth="4"
              />
            )}
            {section.dimension === 0 && (
              <circle
                cx={project(section.points[0])[0]}
                cy={project(section.points[0])[1]}
                r="5"
                fill="#a94f2f"
              />
            )}
            <text x="25" y="34" fill="#886a53" fontSize="12">
              반투명 입체 · 주황색 부분이 단면이에요
            </text>
            <text
              x="380"
              y="570"
              textAnchor="middle"
              fill="#886a53"
              fontSize="12"
            >
              드래그하거나 방향키를 눌러 입체를 돌려 보세요
            </text>
          </svg>
          <div className="section-board-foot">
            <Move size={15} /> 시점 회전은 절단면의 모양을 바꾸지 않아요.
          </div>
        </section>
        <aside className="section-controls">
          <section className="section-flat-panel">
            <h2>
              <Layers size={17} /> 단면을 정면에서 보면
            </h2>
            <svg
              viewBox="0 0 320 280"
              role="img"
              aria-label={`단면 정면: ${result}`}
              data-testid="section-flat"
            >
              <defs>
                <pattern
                  id="section-grid"
                  width="20"
                  height="20"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M20 0H0V20"
                    fill="none"
                    stroke="#e8ddd0"
                    strokeWidth=".7"
                  />
                </pattern>
              </defs>
              <rect width="320" height="280" fill="url(#section-grid)" />
              {section.dimension === 2 ? (
                <polygon
                  points={flatPath}
                  fill="#e5a187"
                  fillOpacity=".65"
                  stroke="#ad5133"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              ) : section.dimension === 1 ? (
                <polyline points={flatPath} stroke="#ad5133" strokeWidth="3" />
              ) : section.dimension === 0 ? (
                <circle cx="160" cy="140" r="4" fill="#ad5133" />
              ) : (
                <text
                  x="160"
                  y="145"
                  textAnchor="middle"
                  fill="#8e7767"
                  fontSize="13"
                >
                  만나는 부분이 없어요
                </text>
              )}
            </svg>
            <div className="section-result" role="status">
              <strong>{result}</strong>
              {section.dimension === 2 && !solid.curved && (
                <span>
                  변 {section.points.length}개 · 꼭짓점 {section.points.length}
                  개
                </span>
              )}
              {section.dimension < 2 && (
                <span>넓이를 가진 단면이 아니에요.</span>
              )}
            </div>
          </section>
          <section className="section-settings">
            <h2>절단면 조절</h2>
            <div className="section-presets">
              <button onClick={() => preset(0)}>수평</button>
              <button onClick={() => preset(90, 0)}>수직</button>
              <button onClick={() => preset(55)}>비스듬히</button>
            </div>
            <Slider
              label="절단면 위치"
              value={position}
              min={-110}
              max={110}
              onChange={setPosition}
              text={
                position === 0
                  ? "가운데"
                  : `${position > 0 ? "+" : ""}${position}%`
              }
            />
            <div className="section-range-help">
              <span>−방향 / 바깥</span>
              <span>+방향 / 바깥</span>
            </div>
            <Slider
              label="절단면 기울기"
              value={tilt}
              min={0}
              max={90}
              onChange={setTilt}
              text={`${tilt}°`}
            />
            <Slider
              label="절단 방향"
              value={azimuth}
              min={0}
              max={180}
              onChange={setAzimuth}
              text={`${azimuth}°`}
            />
            <label className="section-check">
              <input
                type="checkbox"
                checked={showPlane}
                onChange={(e) => setShowPlane(e.target.checked)}
              />{" "}
              절단 평면 표시
            </label>
            <button
              className="section-reset"
              onClick={() => {
                preset(0);
                setYaw(-35);
                setPitch(22);
                setShowPlane(true);
              }}
            >
              <RotateCcw size={14} /> 처음 상태로
            </button>
          </section>
        </aside>
      </div>
      <div className="section-tip">
        <Box size={23} />
        <p>
          <strong>정육면체를 비스듬히 자르면 육각형도 만들 수 있어요.</strong>
          <br />
          같은 기울기에서 위치만 바꿔 보세요. 단면의 모양과 크기가 어떻게
          달라지나요?
        </p>
      </div>
      <p className="section-note">
        위치 0%는 선택한 방향에서 입체의 양 끝 사이 가운데이며, ±100%는
        양 끝입니다. 곡면의 윤곽은 화면에서 매끄럽게 보이도록 촘촘히
        나누어 그립니다.
      </p>
    </main>
  );
}
function Slider({ label, value, min, max, onChange, text }) {
  return (
    <label className="section-slider">
      <span>
        {label}
        <output>{text}</output>
      </span>
      <input
        aria-label={label}
        type="range"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(+e.target.value)}
      />
    </label>
  );
}
