import React, { useEffect, useReducer, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Flame as FlameIcon,
  RotateCcw,
  Check,
  FlaskConical,
  Info,
  Hand,
  MousePointer2,
} from "lucide-react";
import { flameSamples } from "./flame.js";
import {
  initialFlameLab,
  flameLabReducer,
  flameContact,
  labGeometry,
} from "./flameLab.js";
import { useRafCallback } from "./useRafCallback.js";
import { readSession, saveSession } from "./session.js";
function ActionGroup({ label, onActivate, onPointerDown, children, ...props }) {
  return (
    <g
      role="button"
      tabIndex="0"
      aria-label={label}
      onClick={(event) => {
        event.stopPropagation();
        if (!onPointerDown || event.detail === 0) onActivate();
      }}
      onPointerDown={(event) => {
        event.stopPropagation();
        onPointerDown?.(event);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onActivate();
        }
      }}
      {...props}
    >
      {children}
    </g>
  );
}
function AlcoholLab({ state, dispatch }) {
  const ref = useRef(null),
    drag = useRef(false),
    contact = flameContact(state),
    sample = flameSamples.find((s) => s.id === (contact && state.active)),
    held = flameSamples.find((s) => s.id === state.held),
    color = sample?.color || "#87bfff";
  function getPoint(event) {
    const p = ref.current.createSVGPoint();
    p.x = event.clientX;
    p.y = event.clientY;
    const q = p.matrixTransform(ref.current.getScreenCTM().inverse());
    return { x: q.x, y: q.y };
  }
  function capture(event) {
    event.preventDefault();
    drag.current = { kind: "tool", offset: { x: 0, y: 0 } };
    ref.current.setPointerCapture(event.pointerId);
  }
  const pendingMoves = useRef([]);
  const pointerUpdates = useRafCallback(() => {
    const points = pendingMoves.current;
    pendingMoves.current = [];
    if (points.length) dispatch({ type: "PATH", points });
  });
  function startTool(event, tip = state.tip) {
    const p = getPoint(event);
    capture(event);
    drag.current = { kind: "tool", offset: { x: tip.x - p.x, y: tip.y - p.y } };
  }
  function move(event) {
    if (!drag.current) return;
    const p = getPoint(event),
      { kind, offset } = drag.current;
    const point = { x: p.x + offset.x, y: p.y + offset.y };
    if (kind === "cap") dispatch({ type: "CAP_MOVE", point });
    else {
      pendingMoves.current.push(point);
      pointerUpdates.schedule(true);
    }
  }
  function finish(event) {
    if (!drag.current) return;
    move(event);
    pointerUpdates.flush();
    if (drag.current.kind === "cap") dispatch({ type: "CAP_DROP" });
    drag.current = false;
    if (ref.current.hasPointerCapture(event.pointerId))
      ref.current.releasePointerCapture(event.pointerId);
  }

  function selectSample(id, event) {
    dispatch({ type: "GRAB", id });
    if (state.tool === "tweezers" && event)
      startTool(
        event,
        labGeometry.samples.find((s) => s.id === id),
      );
  }
  function moveKeys(event) {
    const delta = {
      ArrowUp: [0, -8],
      ArrowDown: [0, 8],
      ArrowLeft: [-8, 0],
      ArrowRight: [8, 0],
    }[event.key];
    if (delta) {
      event.preventDefault();
      dispatch({
        type: "MOVE",
        tip: { x: state.tip.x + delta[0], y: state.tip.y + delta[1] },
      });
    }
  }
  return (
    <svg
      ref={ref}
      className="alcohol-lab"
      viewBox="0 0 900 600"
      role="img"
      aria-label={
        state.lit
          ? sample
            ? `${sample.metal} ${sample.name} 불꽃`
            : "알코올램프 기본 파란 불꽃"
          : state.cap === "closed"
            ? "뚜껑이 닫힌 알코올램프"
            : "불이 꺼진 알코올램프"
      }
      onPointerMove={move}
      onPointerUp={finish}
      onPointerCancel={() => {
        pointerUpdates.cancel();
        pendingMoves.current = [];
        drag.current = false;
      }}
      onLostPointerCapture={() => (drag.current = false)}
    >
      <defs>
        <linearGradient id="lab-bench" x2="0" y2="1">
          <stop stopColor="#30394a" />
          <stop offset="1" stopColor="#151e2b" />
        </linearGradient>
        <linearGradient id="lab-steel">
          <stop stopColor="#526879" />
          <stop offset=".3" stopColor="#edf4f7" />
          <stop offset=".52" stopColor="#8ea9bb" />
          <stop offset=".7" stopColor="#d4e4ec" />
          <stop offset="1" stopColor="#526879" />
        </linearGradient>
        <pattern
          id="lab-grain"
          width="17"
          height="13"
          patternUnits="userSpaceOnUse"
        >
          <path d="M0 12H17" stroke="#b5bed0" strokeOpacity=".035" />
        </pattern>
        <radialGradient id="alcohol-room">
          <stop stopColor="#29263d" />
          <stop offset="1" stopColor="#131d2d" />
        </radialGradient>
        <radialGradient id="alcohol-glow">
          <stop stopColor={color} stopOpacity=".23" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="alcohol-flame" x1="0" y1="1" x2="0" y2="0">
          <stop stopColor="#81bcff" stopOpacity=".35" />
          <stop offset=".3" stopColor={color} stopOpacity=".9" />
          <stop offset=".75" stopColor={color} stopOpacity=".75" />
          <stop offset="1" stopColor={color} stopOpacity=".1" />
        </linearGradient>
        <linearGradient id="alcohol-glass">
          <stop stopColor="#b4d7e6" stopOpacity=".16" />
          <stop offset=".35" stopColor="#d3e8ed" stopOpacity=".05" />
          <stop offset=".75" stopColor="#c2e4ec" stopOpacity=".2" />
          <stop offset="1" stopColor="#8db8d0" stopOpacity=".08" />
        </linearGradient>
        <linearGradient id="cap-metal">
          <stop stopColor="#4b6478" />
          <stop offset=".45" stopColor="#b2c3cf" />
          <stop offset=".7" stopColor="#778fa1" />
          <stop offset="1" stopColor="#354a60" />
        </linearGradient>
        <clipPath id="alcohol-bottle">
          <path d="M418 355H462V370Q510 385 525 425Q550 480 515 519Q492 543 440 543Q388 543 365 519Q330 480 355 425Q370 385 418 370Z" />
        </clipPath>
      </defs>
      <rect width="900" height="600" fill="url(#alcohol-room)" />
      <path
        d="M231 405H716L735 559H225Z"
        fill="url(#lab-bench)"
        stroke="#526175"
        strokeOpacity=".35"
      />
      <path d="M231 405H716L735 559H225Z" fill="url(#lab-grain)" />
      <ellipse
        cx="635"
        cy="531"
        rx="47"
        ry="13"
        fill="#101827"
        stroke="#788b9e"
        strokeDasharray="4 4"
      />
      {state.cap === "closed" && (
        <text x="635" y="558" textAnchor="middle" fontSize="10" fill="#96a8bb">
          뚜껑 놓는 곳
        </text>
      )}
      {state.cap === "open" && (
        <ellipse
          cx="440"
          cy="344"
          rx="39"
          ry="18"
          fill="none"
          stroke="#cdb0ca"
          strokeOpacity=".65"
          strokeDasharray="4 4"
        />
      )}
      <path d="M18 550H718" stroke="#546071" strokeOpacity=".5" />
      <text x="440" y="584" textAnchor="middle" fill="#9aaabd" fontSize="12">
        알코올램프 · 시료를 집어 불꽃에 가져가세요
      </text>
      <rect
        x="20"
        y="48"
        width="198"
        height="465"
        rx="14"
        fill="#ffffff04"
        stroke="#ffffff12"
      />
      <text x="40" y="78" fill="#94a8bb" fontSize="12">
        실험 도구
      </text>
      <ActionGroup
        label="핀셋 집기"
        onActivate={() => dispatch({ type: "TWEEZERS" })}
        onPointerDown={(event) => {
          dispatch({ type: "TWEEZERS" });
          startTool(event, { x: 147, y: 161 });
        }}
        className="lab-object"
        aria-pressed={state.tool === "tweezers"}
      >
        <rect
          x="38"
          y="94"
          width="162"
          height="90"
          rx="9"
          fill={state.tool === "tweezers" ? "#344050" : "#223247"}
          stroke={state.tool === "tweezers" ? "#caa0c2" : "#526378"}
        />
        <path
          opacity={state.tool === "tweezers" ? 0.18 : 1}
          d="M25 107Q71 126 127 148L147 153M25 107Q69 139 123 158L147 169"
          fill="none"
          stroke="url(#lab-steel)"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <text x="119" y="173" textAnchor="middle" fill="#c6d1de" fontSize="11">
          핀셋 {state.tool === "tweezers" ? "사용 중" : "드래그해서 집기"}
        </text>
      </ActionGroup>
      <ActionGroup
        label={
          state.tool === "match" && !state.matchLit
            ? "성냥 긋기"
            : "성냥 꺼내기"
        }
        onActivate={() =>
          dispatch({
            type:
              state.tool === "match" && !state.matchLit ? "STRIKE" : "MATCH",
          })
        }
        className="lab-object"
      >
        <rect
          x="48"
          y="218"
          width="145"
          height="69"
          rx="5"
          fill="#9f6d5a"
          stroke="#d7b49b"
        />
        <path d="M48 218 65 202H210L193 218Z" fill="#c4987a" />
        <rect x="65" y="248" width="128" height="32" fill="#493232" />
        <path
          d="M68 252H190M68 258H190M68 264H190M68 270H190"
          stroke="#8a6152"
          strokeDasharray="2 3"
        />
        <text x="121" y="239" textAnchor="middle" fill="#f3dbbb" fontSize="12">
          성냥갑
        </text>
        <text x="119" y="313" textAnchor="middle" fill="#95aabd" fontSize="10">
          클릭해 꺼내고, 갈색 면에 긋기
        </text>
      </ActionGroup>
      <text x="41" y="365" fill="#90a2b6" fontSize="10">
        ① 뚜껑 열기
      </text>
      <text x="41" y="390" fill="#90a2b6" fontSize="10">
        ② 성냥에 불붙여 심지로 이동
      </text>
      <text x="41" y="415" fill="#90a2b6" fontSize="10">
        ③ 핀셋으로 시료를 집어 관찰
      </text>
      <text x="41" y="440" fill="#90a2b6" fontSize="10">
        ④ 뚜껑을 덮어 불 끄기
      </text>
      <ellipse
        cx="440"
        cy="542"
        rx="126"
        ry="14"
        fill="#050b15"
        opacity=".55"
      />
      {state.lit && (
        <g data-testid="flame-light" style={{ "--flame-color": color }}>
          <ellipse
            cx="450"
            cy="255"
            rx="130"
            ry="170"
            fill="url(#alcohol-glow)"
          />
          <g className="alcohol-flame-flicker">
            <path
              d="M450 333C401 326 403 289 423 257C443 224 432 207 449 161C464 201 484 223 477 254C505 291 498 319 476 330C468 335 458 338 450 333Z"
              fill="url(#alcohol-flame)"
            />
            <path
              d="M450 332C428 318 431 292 449 261C460 289 477 309 468 326Z"
              fill={color}
              opacity=".6"
            />
            <path
              d="M438 333Q437 312 450 292Q465 315 463 333Z"
              fill="#8cc6ff"
            />
          </g>
        </g>
      )}
      <path
        d="M418 355H462V370Q510 385 525 425Q550 480 515 519Q492 543 440 543Q388 543 365 519Q330 480 355 425Q370 385 418 370Z"
        fill="url(#alcohol-glass)"
        stroke="#9cb9ca"
        strokeWidth="1.8"
      />
      <g clipPath="url(#alcohol-bottle)">
        <path
          d="M340 463Q391 454 440 463T540 463V548H340Z"
          fill="#7ba8bc"
          fillOpacity=".23"
        />
        <ellipse
          cx="440"
          cy="463"
          rx="103"
          ry="9"
          fill="#9ac5d1"
          fillOpacity=".13"
        />
        <path
          d="M380 415Q354 475 389 513"
          stroke="#c2dce6"
          strokeOpacity=".28"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
        />
      </g>
      <path
        d="M499 416Q527 467 502 509M400 390Q411 383 420 381"
        fill="none"
        stroke="#d9f1f9"
        strokeOpacity=".4"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <ellipse
        cx="440"
        cy="535"
        rx="67"
        ry="5"
        fill="none"
        stroke="#91b6ca"
        strokeOpacity=".4"
      />
      <rect
        x="404"
        y="478"
        width="74"
        height="27"
        rx="4"
        fill="#e0e7dd"
        fillOpacity=".09"
        stroke="#d2dfda"
        strokeOpacity=".18"
      />
      <text x="442" y="495" fill="#a9b8c5" fontSize="15" textAnchor="middle">
        ALCOHOL
      </text>
      <path
        d="M448 464 452 346 450 329"
        fill="none"
        stroke="#cbbfa5"
        strokeWidth="5"
      />
      <ellipse
        cx="440"
        cy="356"
        rx="25"
        ry="6"
        fill="#698397"
        stroke="#a2b5be"
      />
      <path
        d="M450 353V329"
        stroke="#e0d5b7"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <circle
        cx="450"
        cy="329"
        r="4"
        fill={state.lit ? "#ffdb9b" : "#9c8a71"}
      />
      <rect
        x="737"
        y="48"
        width="146"
        height="505"
        rx="14"
        fill="#ffffff07"
        stroke="#ffffff18"
      />
      <text x="810" y="79" textAnchor="middle" fill="#b8a4be" fontSize="12">
        금속 시료 보관함
      </text>
      {flameSamples.map((s, i) => {
        const y = 132 + i * 58;
        return (
          <ActionGroup
            key={s.id}
            label={`${s.metal} 시료 집기`}
            onActivate={() => selectSample(s.id)}
            onPointerDown={() => {}}
            className="lab-object sample-object"
            aria-pressed={state.held === s.id}
          >
            <rect
              x="749"
              y={y - 23}
              width="122"
              height="48"
              rx="7"
              fill={state.held === s.id ? "#4e3a52" : "#233044"}
              stroke={state.held === s.id ? "#d6b0c9" : "#49536b"}
            />
            <path
              d={`M760 ${y - 13}h15v5l4 5v15h-23v-15l4-5Z`}
              fill="#a5becb"
              fillOpacity=".18"
              stroke="#a1b4c6"
            />
            <path
              d={`M758 ${y + 4}h19v8h-19Z`}
              fill="#f0ebe4"
              fillOpacity=".9"
            />
            <g pointerEvents="none">
              <path
                d={`M759 ${y - 8}v16q7 6 17 0v-16`}
                fill="none"
                stroke="#d5e7f0"
                strokeOpacity=".45"
              />
              <path d={`m760 ${y + 8} 3-5 4 3 3-6 4 7-4 3Z`} fill="#fff8eb" />
              <path
                d={`M760 ${y - 15}h15`}
                stroke="url(#lab-steel)"
                strokeWidth="5"
              />
            </g>
            <text
              x="812"
              y={y - 3}
              textAnchor="middle"
              fill="#ddd2df"
              fontSize="11"
            >
              {s.metal}
            </text>
            <text
              x="812"
              y={y + 13}
              textAnchor="middle"
              fill="#8f9fb4"
              fontSize="9"
            >
              {s.formula}
            </text>
            {state.records.includes(s.id) && (
              <path
                d={`m852 ${y - 7} 4 4 7-8`}
                fill="none"
                stroke="#d9accb"
                strokeWidth="1.8"
              />
            )}
          </ActionGroup>
        );
      })}
      <text x="810" y="535" textAnchor="middle" fill="#a79ab0" fontSize="9">
        핀셋으로 집어 드래그
      </text>
      {state.tool === "tweezers" && (
        <g
          className="held-lab-tool"
          data-testid="held-tweezers"
          data-tip-x={state.tip.x}
          data-tip-y={state.tip.y}
          transform={`translate(${state.tip.x} ${state.tip.y})`}
          role="button"
          tabIndex="0"
          aria-label="핀셋 이동"
          onPointerDown={(event) => {
            event.stopPropagation();
            startTool(event);
          }}
          onKeyDown={moveKeys}
        >
          <circle r="20" fill="transparent" />
          <path
            d={`M-122 -54Q-76 -35 -20 -13L0 ${state.held ? -2 : -8}M-122 -54Q-78 -22 -24 -3L0 ${state.held ? 2 : 8}`}
            fill="none"
            stroke="url(#lab-steel)"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path d="M-115 -50 -45 -22" stroke="#f0f7fc" strokeWidth="1" />
          {Array.from({ length: 10 }, (_, i) => (
            <path
              key={i}
              d={`M${-104 + i * 5} ${-45 + i * 2.2}l-3 6`}
              stroke="#567084"
              strokeWidth="1.3"
            />
          ))}
          <path
            d="M-26 -13 -5 -5M-24 -3 -5 4"
            stroke="#e5eff4"
            strokeWidth="1.2"
          />
          {held && (
            <g data-testid="held-sample">
              <path
                d="m-4-2 5-5 5 6-3 6-7-1Z"
                fill="#eee8df"
                stroke="#b9bbc6"
                strokeWidth="1"
              />
              <text x="13" y="-8" fill="#e3cce0" fontSize="10">
                {held.symbol}
              </text>
            </g>
          )}
        </g>
      )}
      {state.tool === "match" && (
        <g
          className="held-lab-tool"
          data-testid="held-match"
          data-tip-x={state.tip.x}
          data-tip-y={state.tip.y}
          transform={`translate(${state.tip.x} ${state.tip.y})`}
          role="button"
          tabIndex="0"
          aria-label="성냥 이동"
          onPointerDown={(event) => {
            event.stopPropagation();
            startTool(event);
          }}
          onKeyDown={moveKeys}
        >
          <circle r="20" fill="transparent" />
          <path
            d="M-83 38 0 0"
            stroke="#d4ad7e"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <ellipse
            rx="6"
            ry="4.5"
            transform="rotate(-25)"
            fill={state.matchLit ? "#ffd188" : "#a44d47"}
          />
          {state.matchLit && (
            <path
              data-testid="match-flame"
              d="M0 3C-15-3-7-18 1-29C10-14 15-1 0 3Z"
              fill="#ffb54b"
            />
          )}
        </g>
      )}
      <ActionGroup
        label={
          state.cap === "closed" ? "알코올램프 뚜껑 열기" : "뚜껑 덮어 끄기"
        }
        onActivate={() =>
          dispatch({ type: state.cap === "closed" ? "OPEN" : "COVER" })
        }
        onPointerDown={(event) => {
          if (state.cap === "closing") return;
          const p = getPoint(event);
          capture(event);
          drag.current = {
            kind: "cap",
            offset: {
              x: state.capPosition.x - p.x,
              y: state.capPosition.y - p.y,
            },
          };
        }}
        className="lamp-cap lab-object"
        data-testid="lamp-cap"
        data-state={state.cap}
        transform={`translate(${state.capPosition.x - 440} ${state.capPosition.y - 325})`}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            dispatch({ type: state.cap === "closed" ? "OPEN" : "COVER" });
          }
        }}
      >
        <path
          d="M414 357V312Q414 292 440 292Q466 292 466 312V357Z"
          fill="url(#cap-metal)"
          stroke="#bdccd6"
          strokeWidth="1.5"
        />
        <ellipse
          cx="440"
          cy="357"
          rx="26"
          ry="5"
          fill="#657f93"
          stroke="#b8c8d3"
        />
        <path
          d="M430 292V284Q440 277 450 284V292"
          fill="#849dad"
          stroke="#c7d5dd"
        />
        <text x="440" y="380" textAnchor="middle" fill="#adbbca" fontSize="10">
          {state.cap === "open"
            ? "심지 위로 드래그"
            : state.cap === "closing"
              ? "뚜껑을 덮는 중"
              : "옆으로 드래그해 열기"}
        </text>
      </ActionGroup>
    </svg>
  );
}
function CompareFlame({ sample }) {
  return (
    <div className="comparison-flame">
      <svg
        viewBox="0 0 130 120"
        role="img"
        aria-label={`${sample.metal} ${sample.name} 비교 불꽃`}
      >
        <path
          d="M65 107C25 100 35 65 53 43Q65 23 63 9C91 44 108 97 65 107Z"
          fill={sample.color}
          opacity=".85"
        />
        <path
          d="M65 107C48 97 53 73 64 59Q84 91 65 107Z"
          fill="#f4e8d2"
          opacity=".35"
        />
      </svg>
      <strong>{sample.metal}</strong>
      <span style={{ color: sample.color }}>{sample.name}</span>
    </div>
  );
}
export default function Flame({ onBack }) {
  const [state, dispatch] = useReducer(flameLabReducer, undefined, () => ({
      ...initialFlameLab(),
      records: readSession("flame-records", []),
      last: readSession("flame-last", null),
    })),
    [compare, setCompare] = useState(false),
    [reference, setReference] = useState("potassium"),
    contact = flameContact(state),
    last = flameSamples.find((s) => s.id === state.last),
    active = flameSamples.find(
      (s) => s.id === state.active && contact === s.id,
    ),
    other = flameSamples.find((s) => s.id === reference);
  useEffect(() => {
    saveSession("flame-records", state.records);
    saveSession("flame-last", state.last);
  }, [state.records, state.last]);
  useEffect(() => {
    const drop = (event) => {
      if (event.key === "Escape") dispatch({ type: "RETURN" });
    };
    addEventListener("keydown", drop);
    return () => removeEventListener("keydown", drop);
  }, []);
  useEffect(() => {
    if (state.cap !== "closing") return;
    const timer = setTimeout(() => dispatch({ type: "COVERED" }), 350);
    return () => clearTimeout(timer);
  }, [state.cap]);
  useEffect(() => {
    if (!contact) return;
    const timer = setTimeout(
      () => dispatch({ type: "OBSERVE", id: contact }),
      350,
    );
    return () => clearTimeout(timer);
  }, [contact]);
  return (
    <main className="sim-page science-page flame-page flame-hands-on sim-theme theme-flame">
      <button className="back" onClick={onBack}>
        <ArrowLeft size={15} /> 시뮬레이션 탐색
      </button>
      <div className="sim-title">
        <div>
          <div className="card-meta">
            <span>중2 과학</span>
            <span>물질의 구성</span>
          </div>
          <h1>
            색으로 만나는 불꽃 반응 <span>HANDS-ON LAB</span>
          </h1>
          <p>
            뚜껑을 열고, 성냥으로 점화하고, 핀셋으로 시료를 집어 직접
            관찰하세요.
          </p>
        </div>
        <div className="title-icon">
          <FlameIcon size={29} />
        </div>
      </div>
      <div className="hands-on-layout">
        <details className="lab-help">
          <summary>처음 사용하나요? 실험 순서 보기</summary>
          <ol>
            <li>
              뚜껑을 옆으로 드래그한 뒤 성냥을 꺼내 성냥갑의 갈색 면에 긋습니다.
            </li>
            <li>불붙은 성냥을 램프 심지로 드래그합니다.</li>
            <li>
              핀셋을 끌어 시료에 끝을 대면 자동으로 집습니다. 그대로 불꽃까지
              드래그하세요.
            </li>
            <li>시료를 불꽃 가운데에 잠시 대어 색을 관찰합니다.</li>
            <li>
              옆에 둔 뚜껑을 심지 위로 드래그해 놓아 소화합니다. Esc를 누르면
              선택한 도구를 내려놓습니다.
            </li>
          </ol>
        </details>
        <div className="canvas-panel">
          <div className="canvas-heading">
            <span>
              <span className="live-dot" /> 알코올램프 불꽃색 실험
            </span>
            <div className="lab-status-badges">
              <span>
                {state.cap === "closed"
                  ? "뚜껑 닫힘"
                  : state.cap === "closing"
                    ? "뚜껑 덮는 중"
                    : "뚜껑 열림"}
              </span>
              <span className={state.lit ? "burning" : ""}>
                {state.lit ? "불 켜짐" : "불 꺼짐"}
              </span>
            </div>
          </div>
          <AlcoholLab state={state} dispatch={dispatch} />
          <div className="hands-on-instruction" role="status">
            <Hand size={18} />
            <span>{state.message}</span>
          </div>
          <div className="hands-on-actions">
            <button
              onClick={() => dispatch({ type: "RETURN" })}
              disabled={!state.tool && !state.held}
            >
              <RotateCcw size={14} /> 도구·시료 내려놓기
            </button>
            <button onClick={() => dispatch({ type: "RESET" })}>
              <RotateCcw size={14} /> 실험 처음으로
            </button>
            <span>{state.records.length} / 7종 관찰</span>
          </div>
        </div>
        <div className="lab-sequence-strip">
          {[
            ["뚜껑 열기", state.opened],
            ["성냥으로 점화", state.ignited],
            ["핀셋으로 시료 관찰", state.heated],
            ["뚜껑 덮어 소화", state.extinguished],
          ].map(([label, done], i) => (
            <span key={label} className={done ? "done" : ""}>
              <b>{done ? <Check size={13} /> : i + 1}</b>
              {label}
            </span>
          ))}
        </div>
        <div className="science-observation">
          <span className="observation-icon">
            <FlameIcon size={22} />
          </span>
          <div>
            <small>{active ? "OBSERVING NOW" : "LAST OBSERVATION"}</small>
            <h3>
              {active
                ? `${active.metal}의 불꽃색 · ${active.name}`
                : last
                  ? `최근 관찰: ${last.metal} · ${last.name}`
                  : "오른쪽 시료를 핀셋으로 집어 보세요"}
            </h3>
            <p>
              {active
                ? active.note
                : last
                  ? "핀셋을 불꽃에서 빼면 원래 불꽃색으로 돌아갑니다. 관찰 기록은 아래에 남아 있어요."
                  : "램프는 처음에 불이 꺼져 있습니다. 뚜껑을 열고 성냥갑에 성냥을 그어 심지에 불을 붙여 주세요."}
            </p>
          </div>
        </div>
        <section className="flame-records">
          <div className="poly-section-title">
            <div>
              <div className="eyebrow muted">MY OBSERVATIONS</div>
              <h2>불꽃색 관찰 기록</h2>
            </div>
            <button onClick={() => dispatch({ type: "CLEAR_RECORDS" })}>
              기록 비우기
            </button>
          </div>
          <table aria-label="불꽃색 관찰 기록">
            <thead>
              <tr>
                <th>금속 원소</th>
                <th>시료</th>
                <th>관찰한 불꽃색</th>
              </tr>
            </thead>
            <tbody>
              {state.records.length ? (
                state.records.map((id) => {
                  const s = flameSamples.find((s) => s.id === id);
                  return (
                    <tr key={id}>
                      <th scope="row">{s.metal}</th>
                      <td>{s.formula}</td>
                      <td>
                        <span className="flame-record-color">
                          <i style={{ background: s.color }} />
                          {s.name}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="3" className="empty-records">
                    핀셋으로 시료를 불꽃에 가져가면 관찰 기록이 쌓입니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <label className="science-check comparison-toggle">
            <input
              type="checkbox"
              checked={compare}
              onChange={(e) => setCompare(e.target.checked)}
            />{" "}
            두 불꽃색 비교
          </label>
          {compare && (
            <div className="observed-comparison">
              <div className="comparison-controls">
                <span>최근 관찰한 시료와 기준 색을 비교해 보세요.</span>
                <select
                  className="science-select"
                  aria-label="비교할 기준 시료"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                >
                  {flameSamples.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.metal} · {s.formula}
                    </option>
                  ))}
                </select>
              </div>
              <div className="comparison-swatches">
                {last ? (
                  <CompareFlame sample={last} />
                ) : (
                  <p>먼저 시료를 관찰해 주세요.</p>
                )}
                <CompareFlame sample={other} />
              </div>
            </div>
          )}
          <p className="science-footnote">
            리튬과 스트론튬처럼 비슷한 불꽃색을 나타내는 원소도 있어요.
          </p>
        </section>
        <p className="science-footnote">
          <Info size={13} /> 대표 불꽃색을 재현한 모형입니다. 실제 색은
          농도·조명 등에 따라 다르게 보일 수 있어요.
        </p>
      </div>
    </main>
  );
}
