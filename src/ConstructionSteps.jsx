import React, { memo, useEffect, useRef, useState } from "react";
import { Check, Compass, Ruler } from "lucide-react";
const ConstructionSteps = memo(function ConstructionSteps({
  lesson,
  displayIndex,
  completed,
  onSelectStep,
}) {
  const list = useRef(null),
    [details, setDetails] = useState(false);
  useEffect(() => {
    const panel = list.current,
      button = panel?.children[displayIndex];
    if (!button) return;
    const box = button.getBoundingClientRect(),
      viewport = panel.getBoundingClientRect();
    if (box.top < viewport.top) panel.scrollTop -= viewport.top - box.top + 6;
    else if (box.bottom > viewport.bottom)
      panel.scrollTop += box.bottom - viewport.bottom + 6;
  }, [displayIndex, lesson, details]);
  function navigate(event, i) {
    const key = event.key;
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(key)) return;
    event.preventDefault();
    const target =
      key === "Home"
        ? 0
        : key === "End"
          ? lesson.steps.length - 1
          : Math.max(
              0,
              Math.min(
                lesson.steps.length - 1,
                i + (key === "ArrowDown" ? 1 : -1),
              ),
            );
    list.current.children[target].focus();
  }
  return (
    <section className="construction-steps" aria-label="작도 단계 선택">
      <div className="poly-section-title">
        <div>
          <div className="eyebrow muted">CONSTRUCTION STEPS</div>
          <h2>
            한 단계씩, 정확하게{" "}
            <small>
              {completed} / {lesson.steps.length}
            </small>
          </h2>
        </div>
        <span>↑↓ 버튼 이동 · Enter 단계 재생</span>
      </div>
      <button
        className="step-detail-toggle"
        aria-expanded={details}
        onClick={() => setDetails((v) => !v)}
      >
        {details ? "현재 단계 설명 접기" : "현재 단계 설명 보기"}
      </button>
      {details && (
        <p className="step-detail-text">
          {lesson.steps[displayIndex]?.description}
        </p>
      )}
      <div ref={list} className="construction-step-list">
        {lesson.steps.map((step, i) => (
          <button
            key={i}
            title={step.description}
            className={
              i === displayIndex ? "current" : i < completed ? "done" : ""
            }
            aria-label={`작도 ${i + 1}단계 ${step.title}`}
            aria-pressed={i === displayIndex}
            onClick={() => onSelectStep(i)}
            onKeyDown={(event) => navigate(event, i)}
          >
            <span className="step-state">
              {i < completed ? <Check size={15} /> : i + 1}
            </span>
            <div>
              <strong>{step.title}</strong>
            </div>
            <span className="step-tool">
              {step.tool.type === "ruler" ? (
                <Ruler size={17} />
              ) : (
                <Compass size={17} />
              )}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
});
export default ConstructionSteps;
