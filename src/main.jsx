import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowUpRight,
  BookOpen,
  FlaskConical,
  Shapes,
  ChevronRight,
  MoveRight,
  Compass,
  Check,
} from "lucide-react";
import {
  PolyhedraCard,
  ConstructionCard,
  OpticsCard,
  FlameCard,
  SectionsCard,
} from "./cards.jsx";
import "./style.css";
import "./themes.css";
const Sections = lazy(() => import("./Sections.jsx"));
const Rolling = lazy(() => import("./Rolling.jsx"));
const Polyhedra = lazy(() => import("./Polyhedra.jsx"));
const Construction = lazy(() => import("./Construction.jsx"));
const Optics = lazy(() => import("./Optics.jsx"));
const FlameExperiment = lazy(() => import("./Flame.jsx"));
class LabBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <main className="lab-loading" role="alert">
        <div>
          <h2>실험실을 불러오지 못했어요.</h2>
          <p>페이지를 새로고침한 뒤 다시 열어 주세요.</p>
          <button onClick={() => location.reload()}>새로고침</button>
          <a href="#">시뮬레이션 탐색으로 돌아가기</a>
        </div>
      </main>
    ) : (
      this.props.children
    );
  }
}
function App() {
  const [grade, setGrade] = useState(1),
    [subject, setSubject] = useState("math"),
    [page, setPage] = useState(
      () =>
        ({
          "#rolling": "sim",
          "#polyhedra": "polyhedra",
          "#construction": "construction",
          "#optics": "optics",
          "#flame": "flame",
          "#sections": "sections",
        })[location.hash] || "home",
    );
  const firstRoute = useRef(true);
  useEffect(() => {
    if (firstRoute.current) {
      firstRoute.current = false;
      return;
    }
    const frame = requestAnimationFrame(() => {
      if (page === "home")
        document.getElementById("explore")?.scrollIntoView({ block: "start" });
      else window.scrollTo(0, 0);
    });
    return () => cancelAnimationFrame(frame);
  }, [page]);
  useEffect(() => {
    const fn = () =>
      setPage(
        {
          "#rolling": "sim",
          "#polyhedra": "polyhedra",
          "#construction": "construction",
          "#optics": "optics",
          "#flame": "flame",
          "#sections": "sections",
        }[location.hash] || "home",
      );
    addEventListener("hashchange", fn);
    return () => removeEventListener("hashchange", fn);
  }, []);
  function open() {
    location.hash = "rolling";
    setPage("sim");
  }
  return (
    <>
      <header>
        <a className="brand" href="#" onClick={() => setPage("home")}>
          <span className="brand-icon">
            <Shapes size={23} />
          </span>
          모눈<span className="brand-en">MONOON</span>
        </a>
        <nav>
          <a
            className={page === "home" ? "active" : ""}
            href="#"
            onClick={() => setPage("home")}
          >
            시뮬레이션 탐색
          </a>
          <span>움직이며 배우는 수학과 과학</span>
        </nav>
        <span className="header-label">
          <span className="live-dot" /> 배움이 움직이는 공간
        </span>
      </header>
      <LabBoundary key={page}>
        <Suspense
          fallback={
            <main className="lab-loading" role="status">
              실험실을 불러오고 있어요…
            </main>
          }
        >
          {page === "home" ? (
            <main className="home">
              <section className="hero">
                <div>
                  <div className="eyebrow">
                    <span /> 상상에서 이해로, 모눈
                  </div>
                  <h1>
                    공식 너머의 원리,
                    <br />
                    <span>직접 움직여 발견하세요.</span>
                  </h1>
                  <p>
                    눈으로 보고, 손으로 바꾸고, 스스로 이해하는 시간.
                    <br />
                    수학과 과학 속 다양한 상황을 나만의 실험으로 만나 보세요.
                  </p>
                  <button
                    className="primary"
                    onClick={() =>
                      document
                        .getElementById("explore")
                        .scrollIntoView({ behavior: "smooth" })
                    }
                  >
                    시뮬레이션 둘러보기 <ArrowUpRight size={17} />
                  </button>
                  <div className="hero-caption">
                    <Check size={14} /> 설치 없이 바로 시작하는 작은 실험실
                  </div>
                </div>
                <HeroArt />
              </section>
              <section id="explore" className="explore">
                <div className="section-heading">
                  <div>
                    <div className="eyebrow muted">
                      EXPLORE THE POSSIBILITIES
                    </div>
                    <h2>오늘은 무엇을 탐구해 볼까요?</h2>
                  </div>
                  <p>학년과 과목을 골라 나에게 맞는 실험을 찾아보세요.</p>
                </div>
                <div className="filters">
                  <div className="grade-tabs">
                    {[1, 2, 3].map((g) => (
                      <button
                        key={g}
                        className={grade === g ? "selected" : ""}
                        onClick={() => setGrade(g)}
                      >
                        중학교 {g}학년
                      </button>
                    ))}
                  </div>
                  <div className="subject-tabs">
                    <button
                      className={subject === "math" ? "selected" : ""}
                      onClick={() => setSubject("math")}
                    >
                      <Compass size={16} /> 수학
                    </button>
                    <button
                      className={subject === "science" ? "selected" : ""}
                      onClick={() => setSubject("science")}
                    >
                      <FlaskConical size={16} /> 과학
                    </button>
                  </div>
                </div>
                <div className="result-heading">
                  <span>
                    중{grade} · {subject === "math" ? "수학" : "과학"}{" "}
                    <small>
                      {grade === 1 && subject === "math"
                        ? "4"
                        : grade === 2 && subject === "science"
                          ? "2"
                          : "0"}
                      개의 시뮬레이션
                    </small>
                  </span>
                  <span className="tiny">
                    호기심을 클릭해 보세요 <MoveRight size={14} />
                  </span>
                </div>
                {grade === 1 && subject === "math" ? (
                  <div className="cards">
                    <button
                      className="sim-card sim-theme theme-rolling"
                      onClick={open}
                    >
                      <div className="card-art">
                        <span className="art-tag">INTERACTIVE</span>
                        <MiniArt />
                        <span className="art-arrow">
                          <ArrowUpRight size={22} />
                        </span>
                      </div>
                      <div className="card-body">
                        <div className="card-meta">
                          <span>중1 수학</span>
                          <span>원과 부채꼴</span>
                        </div>
                        <h3>
                          데굴데굴, 도형 굴리기 <ArrowUpRight size={19} />
                        </h3>
                        <p>
                          도형을 굴리면 꼭짓점은 어떤 길을 그릴까요?
                          <br />
                          회전각과 이동 거리의 관계를 발견해 보세요.
                        </p>
                        <div className="card-footer">
                          <span>
                            <Shapes size={14} /> 기하 · 회전 · 궤적
                          </span>
                          <span>
                            탐구 시작하기 <ChevronRight size={14} />
                          </span>
                        </div>
                      </div>
                    </button>
                    <PolyhedraCard
                      onOpen={() => {
                        location.hash = "polyhedra";
                        setPage("polyhedra");
                      }}
                    />
                    <SectionsCard
                      onOpen={() => {
                        location.hash = "sections";
                        setPage("sections");
                      }}
                    />
                    <ConstructionCard
                      onOpen={() => {
                        location.hash = "construction";
                        setPage("construction");
                      }}
                    />
                  </div>
                ) : grade === 2 && subject === "science" ? (
                  <div className="cards">
                    <OpticsCard
                      onOpen={() => {
                        location.hash = "optics";
                        setPage("optics");
                      }}
                    />
                    <FlameCard
                      onOpen={() => {
                        location.hash = "flame";
                        setPage("flame");
                      }}
                    />
                  </div>
                ) : (
                  <div className="empty">
                    <FlaskConical size={34} />
                    <h3>새로운 탐구를 준비하고 있어요</h3>
                    <p>
                      중{grade} {subject === "math" ? "수학" : "과학"}{" "}
                      시뮬레이션이 곧 추가됩니다.
                    </p>
                    <button
                      onClick={() => {
                        setGrade(1);
                        setSubject("math");
                      }}
                    >
                      중1 수학 탐구 살펴보기 <MoveRight size={15} />
                    </button>
                  </div>
                )}
              </section>
              <section className="bottom-note">
                <span>
                  <BookOpen size={20} />
                </span>
                <div>
                  <strong>정답을 넘어, 이해에 도착하도록.</strong>
                  <p>
                    작은 변화가 만드는 차이를 관찰하며 나만의 수학적 감각을 길러
                    보세요.
                  </p>
                </div>
                <span className="note-doodle">✳</span>
              </section>
            </main>
          ) : page === "optics" ? (
            <Optics
              onBack={() => {
                setGrade(2);
                setSubject("science");
                location.hash = "";
                setPage("home");
              }}
            />
          ) : page === "flame" ? (
            <FlameExperiment
              onBack={() => {
                setGrade(2);
                setSubject("science");
                location.hash = "";
                setPage("home");
              }}
            />
          ) : page === "sections" ? (
            <Sections
              onBack={() => {
                setGrade(1);
                setSubject("math");
                location.hash = "";
                setPage("home");
              }}
            />
          ) : page === "construction" ? (
            <Construction
              onBack={() => {
                location.hash = "";
                setPage("home");
              }}
            />
          ) : page === "polyhedra" ? (
            <Polyhedra
              onBack={() => {
                location.hash = "";
                setPage("home");
              }}
            />
          ) : (
            <Rolling
              onBack={() => {
                location.hash = "";
                setPage("home");
              }}
            />
          )}
        </Suspense>
      </LabBoundary>
      <footer>
        <a className="footer-brand" href="#">
          모눈 <span>생각이 자라는 작은 실험실</span>
        </a>
        <span>© {new Date().getFullYear()} MONOON. 배움의 모든 순간에.</span>
      </footer>
    </>
  );
}
function HeroArt() {
  return (
    <div className="hero-art">
      <svg viewBox="0 0 500 330" aria-hidden="true">
        <defs>
          <pattern
            id="dots"
            width="23"
            height="23"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="1" cy="1" r="1" fill="#c6d8cd" />
          </pattern>
        </defs>
        <rect width="500" height="330" fill="url(#dots)" />
        <ellipse cx="270" cy="268" rx="170" ry="21" fill="#e1eadf" />
        <path d="M52 259H460" stroke="#9caf9d" strokeWidth="1.5" />
        <path
          d="M92 259 A87 87 0 0 1 266 259 A87 87 0 0 1 440 259"
          fill="none"
          stroke="#da9b66"
          strokeWidth="2"
          strokeDasharray="5 6"
        />
        <path
          d="M180 259L180 172L267 172L267 259Z"
          fill="#e1e9e0"
          stroke="#8eae98"
          strokeWidth="1.5"
          strokeDasharray="5 5"
        />
        <path
          d="M267 259L316 140L435 189L386 308Z"
          transform="translate(-2 -37)"
          fill="#91b6a0"
          fillOpacity=".75"
          stroke="#3f7d60"
          strokeWidth="2"
        />
        <circle
          cx="314"
          cy="103"
          r="6"
          fill="#d48650"
          stroke="#fff"
          strokeWidth="3"
        />
        <path
          d="M267 222h38a38 38 0 0 0-23-35"
          fill="none"
          stroke="#3f7d60"
          strokeWidth="1.5"
        />
        <text x="305" y="211" fill="#3f7d60" fontSize="15">
          θ
        </text>
        <circle cx="178" cy="259" r="4" fill="#3f7d60" />
        <text x="170" y="283" fill="#718477" fontSize="12">
          O
        </text>
        <path d="M79 76l9-22 9 22-22-12h26Z" fill="none" stroke="#a9bba5" />
        <circle cx="421" cy="67" r="19" fill="none" stroke="#b2c6b3" />
        <path d="M411 67h20M421 57v20" stroke="#b2c6b3" />
      </svg>
      <div className="art-float">
        <span className="float-icon">
          <Compass size={19} />
        </span>
        <div>
          <small>오늘의 작은 발견</small>
          <strong>움직이면, 원리가 보여요.</strong>
        </div>
      </div>
      <span className="art-formula">s = rθ</span>
    </div>
  );
}
function MiniArt() {
  return (
    <svg viewBox="0 0 470 210" aria-hidden="true">
      <defs>
        <pattern id="grid" width="23" height="23" patternUnits="userSpaceOnUse">
          <path d="M23 0H0V23" fill="none" stroke="#dce7dd" strokeWidth=".7" />
        </pattern>
      </defs>
      <rect width="470" height="210" fill="url(#grid)" />
      <path d="M44 163H432" stroke="#9aac9d" />
      <path
        d="M78 163a65 65 0 0 1 130 0 65 65 0 0 1 130 0"
        fill="none"
        stroke="#cd9266"
        strokeWidth="2"
        strokeDasharray="4 5"
      />
      <path
        d="M143 163V98H208V163Z"
        fill="#c3d7c9"
        fillOpacity=".4"
        stroke="#95b19c"
        strokeDasharray="4 4"
      />
      <path
        d="M208 163l33-80 80 33-33 80Z"
        fill="#8aaf97"
        fillOpacity=".8"
        stroke="#4b8060"
        strokeWidth="2"
      />
      <circle
        cx="241"
        cy="83"
        r="5"
        fill="#d28b59"
        stroke="white"
        strokeWidth="2"
      />
      <text x="233" y="69" fontSize="12" fill="#956342">
        A
      </text>
      <path d="M208 145a23 23 0 0 1 16 7" fill="none" stroke="#4b8060" />
      <text x="232" y="148" fontSize="13" fill="#4b8060">
        θ
      </text>
      <text x="348" y="185" fontSize="11" fill="#95a397">
        x
      </text>
    </svg>
  );
}
createRoot(document.getElementById("root")).render(<App />);
