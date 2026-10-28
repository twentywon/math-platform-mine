import React from "react";
import {
  ArrowUpRight,
  ChevronRight,
  Box,
  Layers,
  Compass,
  Ruler,
  Sun,
  Flame as FlameIcon,
} from "lucide-react";
export function PolyhedraCard({ onOpen }) {
  return (
    <button
      className="sim-card poly-card sim-theme theme-polyhedra"
      onClick={onOpen}
    >
      <div className="card-art poly-card-art">
        <span className="art-tag">3D INTERACTIVE</span>
        <svg viewBox="0 0 470 210" aria-hidden="true">
          <path
            d="M82 113H144V51H206V113H268V175H206V237H144V175H82Z"
            transform="translate(0 -25) scale(.8)"
            fill="#c3d9c8"
            stroke="#668a72"
            strokeWidth="1.5"
            strokeDasharray="5 4"
          />
          <path
            d="M306 44 375 78 375 148 306 182 237 148 237 78Z"
            fill="#a9cbb5"
            stroke="#54816a"
            strokeWidth="2"
          />
          <path
            d="M237 78 306 113 375 78M306 113V182"
            fill="none"
            stroke="#54816a"
            strokeWidth="2"
          />
          <path
            d="M178 102Q205 66 226 95"
            fill="none"
            stroke="#cc9866"
            strokeWidth="2"
            strokeDasharray="4 4"
          />
          <path
            d="m216 91 11 5-2-12"
            fill="none"
            stroke="#cc9866"
            strokeWidth="2"
          />
        </svg>
        <span className="art-arrow">
          <Box size={21} />
        </span>
      </div>
      <div className="card-body">
        <div className="card-meta">
          <span>중1 수학</span>
          <span>입체도형 · 정다면체</span>
        </div>
        <h3>
          펼치고 접는 정다면체 <Box size={18} />
        </h3>
        <p>
          평면의 전개도가 입체가 되는 순간.
          <br />
          모든 정다면체의 전개도를 3D로 접어 보세요.
        </p>
        <div className="card-footer">
          <span>
            <Layers size={14} /> 5가지 정다면체 · 86,784종 전개도
          </span>
          <span>
            탐구 시작하기 <ChevronRight size={14} />
          </span>
        </div>
      </div>
    </button>
  );
}

export function ConstructionCard({ onOpen }) {
  return (
    <button
      className="sim-card construction-card sim-theme theme-construction"
      onClick={onOpen}
    >
      <div className="card-art">
        <span className="art-tag">STEP BY STEP</span>
        <svg viewBox="0 0 470 210" aria-hidden="true">
          <path d="M70 162H400" stroke="#9bb19a" />
          <path
            d="M137 162 A96 96 0 0 1 329 162M188 162 A96 96 0 0 0 380 162"
            fill="none"
            stroke="#cf9e6b"
            strokeWidth="2"
            strokeDasharray="5 5"
          />
          <path d="M233 50V178" stroke="#60916d" strokeWidth="2" />
          <path
            d="m137 162 57-115 88 115"
            fill="none"
            stroke="#719b7c"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <circle
            cx="194"
            cy="47"
            r="8"
            fill="#e1eadb"
            stroke="#719b7c"
            strokeWidth="2"
          />
          <path
            d="M194 39V28"
            stroke="#719b7c"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <circle cx="137" cy="162" r="4" fill="#4b7957" />
          <circle cx="282" cy="162" r="4" fill="#c48d57" />
          <rect
            x="304"
            y="66"
            width="115"
            height="23"
            rx="3"
            fill="#d2e0cc"
            stroke="#90ad89"
            transform="rotate(-23 304 66)"
          />
        </svg>
        <span className="art-arrow">
          <Compass size={21} />
        </span>
      </div>
      <div className="card-body">
        <div className="card-meta">
          <span>중1 수학</span>
          <span>기본 도형 · 작도</span>
        </div>
        <h3>
          자와 컴퍼스 작도 실험실 <ArrowUpRight size={18} />
        </h3>
        <p>
          눈금 없이도 정확하게 그릴 수 있을까요?
          <br />
          도구의 움직임을 따라 한 단계씩 작도해 보세요.
        </p>
        <div className="card-footer">
          <span>
            <Ruler size={14} /> 기본·심화 · SSS·SAS·ASA
          </span>
          <span>
            탐구 시작하기 <ChevronRight size={14} />
          </span>
        </div>
      </div>
    </button>
  );
}

export function OpticsCard({ onOpen }) {
  return (
    <button className="sim-card sim-theme theme-optics" onClick={onOpen}>
      <div className="card-art science-card-art optics-card-art">
        <span className="art-tag">LIGHT LAB</span>
        <svg viewBox="0 0 470 210" aria-hidden="true">
          <path
            d="M244 32Q209 105 244 178Q279 105 244 32Z"
            fill="#8dcfe0"
            fillOpacity=".3"
            stroke="#76b5c9"
            strokeWidth="2"
          />
          {[62, 105, 148].map((y) => (
            <path
              key={y}
              d={`M52 ${y}H230L375 105`}
              fill="none"
              stroke="#ed83a1"
              strokeWidth="2"
            />
          ))}
          <circle cx="375" cy="105" r="5" fill="#f6d693" />
        </svg>
        <span className="art-arrow">
          <Sun size={21} />
        </span>
      </div>
      <div className="card-body">
        <div className="card-meta">
          <span>중2 과학</span>
          <span>빛과 파동</span>
        </div>
        <h3>
          빛의 반사와 굴절 <ArrowUpRight size={19} />
        </h3>
        <p>
          거울과 렌즈를 만나면 빛은 어디로 갈까요?
          <br />
          레이저를 움직이며 빛의 길을 찾아보세요.
        </p>
        <div className="card-footer">
          <span>
            <Sun size={14} /> 거울 2종 · 렌즈 2종
          </span>
          <span>실험 시작하기</span>
        </div>
      </div>
    </button>
  );
}

export function FlameCard({ onOpen }) {
  return (
    <button className="sim-card sim-theme theme-flame" onClick={onOpen}>
      <div className="card-art science-card-art flame-card-art">
        <span className="art-tag">COLOR LAB</span>
        <svg viewBox="0 0 470 210" aria-hidden="true">
          <defs>
            <linearGradient id="card-lamp-glass">
              <stop stopColor="#c0e4eb" stopOpacity=".35" />
              <stop offset=".5" stopColor="#d9ecf0" stopOpacity=".06" />
              <stop offset="1" stopColor="#a4cfdf" stopOpacity=".3" />
            </linearGradient>
          </defs>
          <ellipse
            cx="211"
            cy="187"
            rx="76"
            ry="9"
            fill="#161a2c"
            opacity=".6"
          />
          <path
            d="M195 117h32v17q50 20 39 52h-110q-11-32 39-52Z"
            fill="url(#card-lamp-glass)"
            stroke="#a5bccd"
          />
          <path d="M158 169h108v17H158Z" fill="#aecedb" opacity=".2" />
          <path d="M210 173v-59" stroke="#d7c9ab" strokeWidth="3" />
          <ellipse cx="211" cy="118" rx="18" ry="4" fill="#9eb1be" />
          <path
            d="M211 116C184 106 190 87 203 65Q217 45 210 24C228 54 237 72 229 88Q237 110 211 116Z"
            fill="#d5a4ff"
            opacity=".8"
          />
          <path d="M210 116Q199 96 211 80Q227 104 218 116Z" fill="#bcd5ff" />
          <path
            d="M342 46Q295 65 252 87L229 91M342 46Q298 75 253 99L230 96"
            fill="none"
            stroke="#c0d1dc"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path d="m225 92 6-4 5 5-5 5Z" fill="#f1e9dd" />
          <g stroke="#a8bccd">
            <path
              d="M331 171v-29q14-14 28 0v29Z"
              fill="#a5b6c6"
              fillOpacity=".3"
            />
            <ellipse cx="345" cy="171" rx="14" ry="3" fill="#7e95a8" />
          </g>
          {[367, 407].map((x, i) => (
            <g key={x}>
              <path
                d={`M${x} 133h15v8l4 7v31h-23v-31l4-7Z`}
                fill="#a0bbc9"
                fillOpacity=".15"
                stroke="#9cb0c6"
              />
              <path d={`M${x - 2} 167h19v11h-19Z`} fill="#eee7df" />
              <path d={`M${x} 132h15`} stroke="#c6d0d9" strokeWidth="4" />
              <text
                x={x + 7}
                y="160"
                textAnchor="middle"
                fontSize="8"
                fill="#d4c5dd"
              >
                {i ? "Cu" : "Li"}
              </text>
            </g>
          ))}
        </svg>
        <span className="art-arrow">
          <FlameIcon size={21} />
        </span>
      </div>
      <div className="card-body">
        <div className="card-meta">
          <span>중2 과학</span>
          <span>물질의 구성</span>
        </div>
        <h3>
          색으로 만나는 불꽃 반응 <ArrowUpRight size={19} />
        </h3>
        <p>
          금속 원소마다 달라지는 불꽃의 색.
          <br />
          시료를 넣고 비교하며 원소의 특징을 찾아보세요.
        </p>
        <div className="card-footer">
          <span>
            <FlameIcon size={14} /> 금속 원소 7종 · 비교 관찰
          </span>
          <span>실험 시작하기</span>
        </div>
      </div>
    </button>
  );
}

export function SectionsCard({ onOpen }) {
  return (
    <button
      className="sim-card sections-card sim-theme theme-sections"
      onClick={onOpen}
    >
      <div className="card-art sections-card-art">
        <span className="art-tag">3D SECTION LAB</span>
        <svg viewBox="0 0 470 210" aria-hidden="true">
          <path
            d="m153 36 88 35v95l-88 30-88-43V66Z"
            fill="#c8ae90"
            fillOpacity=".3"
            stroke="#9b7857"
            strokeWidth="2"
          />
          <path
            d="m65 66 88 42 88-37M153 108v88"
            fill="none"
            stroke="#9b7857"
            strokeWidth="2"
          />
          <path
            d="m43 112 111-34 114 47-114 44Z"
            fill="#cf7754"
            fillOpacity=".6"
            stroke="#a95636"
            strokeWidth="2"
          />
          <path
            d="m316 68 72 28v61l-72 26-59-32V94Z"
            fill="#e1a183"
            stroke="#a95636"
            strokeWidth="2"
          />
        </svg>
        <span className="art-arrow">
          <ArrowUpRight size={22} />
        </span>
      </div>
      <div className="card-body">
        <div className="card-meta">
          <span>중1 수학</span>
          <span>입체도형</span>
        </div>
        <h3>
          잘라서 발견하는 입체의 단면 <ArrowUpRight size={19} />
        </h3>
        <p>
          입체도형을 자르면 어떤 모양이 생길까요?
          <br />
          절단면의 위치와 기울기를 직접 바꿔 보세요.
        </p>
        <div className="card-footer">
          <span>
            <Box size={14} /> 8가지 입체 · 3D 단면
          </span>
          <span>
            탐구 시작하기 <ChevronRight size={14} />
          </span>
        </div>
      </div>
    </button>
  );
}
