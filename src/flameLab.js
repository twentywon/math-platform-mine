import { flameSamples, recordObservation } from "./flame.js";
export const labGeometry = {
  wick: { x: 450, y: 329 },
  heat: { x: 450, y: 250, rx: 43, ry: 79 },
  striker: { left: 65, right: 193, top: 248, bottom: 280 },
  samples: flameSamples.map((sample, i) => ({
    id: sample.id,
    x: 770,
    y: 132 + i * 58,
  })),
};
export function initialFlameLab() {
  return {
    cap: "closed",
    capPosition: { x: 440, y: 325 },
    lit: false,
    tool: null,
    matchLit: false,
    strikeTravel: 0,
    held: null,
    active: null,
    last: null,
    records: [],
    tip: { x: 135, y: 152 },
    opened: false,
    ignited: false,
    heated: false,
    extinguished: false,
    message: "먼저 알코올램프의 뚜껑을 옆으로 드래그해 열어 주세요.",
  };
}
export function flameContact(state) {
  const { heat } = labGeometry;
  return state.cap === "open" &&
    state.lit &&
    state.tool === "tweezers" &&
    state.held &&
    ((state.tip.x - heat.x) / heat.rx) ** 2 +
      ((state.tip.y - heat.y) / heat.ry) ** 2 <=
      1
    ? state.held
    : null;
}
export function flameLabReducer(state, action) {
  switch (action.type) {
    case "CAP_MOVE": {
      if (state.cap === "closing") return state;
      const capPosition = {
        x: Math.max(32, Math.min(865, action.point.x)),
        y: Math.max(40, Math.min(540, action.point.y)),
      };
      const lifted = Math.hypot(capPosition.x - 440, capPosition.y - 325) > 50;
      return {
        ...state,
        capPosition,
        cap: lifted ? "open" : state.cap,
        opened: state.opened || lifted,
        message: lifted
          ? "뚜껑을 옮겼어요. 성냥으로 점화하거나 심지 위로 다시 드래그해 덮으세요."
          : state.message,
      };
    }
    case "CAP_DROP": {
      if (
        Math.hypot(state.capPosition.x - 440, state.capPosition.y - 325) < 60
      ) {
        return {
          ...state,
          capPosition: { x: 440, y: 325 },
          cap: state.cap === "open" ? "closing" : "closed",
          active: null,
        };
      }
      return state;
    }
    case "OPEN":
      return state.cap === "closed"
        ? {
            ...state,
            cap: "open",
            capPosition: { x: 635, y: 496 },
            opened: true,
            message:
              "성냥을 꺼낸 뒤 성냥갑에 그어 불을 붙이고, 심지로 가져가세요.",
          }
        : state;
    case "COVER":
      return state.cap === "open"
        ? {
            ...state,
            cap: "closing",
            capPosition: { x: 440, y: 325 },
            active: null,
            message: "뚜껑을 덮어 불꽃을 끄고 있어요.",
          }
        : state;
    case "COVERED":
      return state.cap === "closing"
        ? {
            ...state,
            cap: "closed",
            lit: false,
            active: null,
            tool: null,
            matchLit: false,
            extinguished: state.ignited || state.extinguished,
            message:
              "뚜껑을 덮어 불이 꺼졌어요. 기록에서 관찰한 색을 비교해 보세요.",
          }
        : state;
    case "TWEEZERS":
      return {
        ...state,
        tool: "tweezers",
        matchLit: false,
        tip: action.tip || { x: 147, y: 161 },
        message: state.held
          ? "집고 있는 시료를 불꽃에 가져가세요."
          : "오른쪽 시료를 핀셋으로 집은 채 불꽃으로 드래그하세요.",
      };
    case "MATCH":
      return {
        ...state,
        tool: "match",
        matchLit: false,
        strikeTravel: 0,
        held: null,
        active: null,
        tip: { x: 116, y: 237 },
        message:
          "성냥 머리를 성냥갑의 갈색 마찰면에 그어 주세요. 성냥갑을 한 번 더 클릭해도 됩니다.",
      };
    case "STRIKE":
      return state.tool === "match"
        ? {
            ...state,
            matchLit: true,
            message:
              state.cap === "open"
                ? "불붙은 성냥을 램프의 심지에 가져가세요."
                : "먼저 램프 뚜껑을 열어야 심지에 불을 붙일 수 있어요.",
          }
        : state;
    case "GRAB": {
      if (state.tool !== "tweezers")
        return {
          ...state,
          message: "먼저 왼쪽 도구함의 핀셋을 드래그해 집어 주세요.",
        };
      const sample = labGeometry.samples.find((s) => s.id === action.id);
      if (!sample) return state;
      return {
        ...state,
        held: action.id,
        active: null,
        tip: { x: sample.x, y: sample.y },
        message: state.lit
          ? "시료를 집었어요. 핀셋 끝을 불꽃의 가운데로 드래그하세요."
          : "시료를 집었어요. 먼저 뚜껑을 열고 성냥으로 램프를 점화해 주세요.",
      };
    }
    case "PATH":
      return action.points.reduce(
        (next, tip) => flameLabReducer(next, { type: "MOVE", tip }),
        state,
      );
    case "MOVE": {
      if (!state.tool) return state;
      const tip = {
        x: Math.max(5, Math.min(895, action.tip.x)),
        y: Math.max(30, Math.min(570, action.tip.y)),
      };
      let next = { ...state, tip };
      if (state.tool === "match") {
        const s = labGeometry.striker,
          inStriker =
            tip.x >= s.left &&
            tip.x <= s.right &&
            tip.y >= s.top &&
            tip.y <= s.bottom;
        next.strikeTravel = inStriker
          ? (state.strikeTravel || 0) +
            Math.hypot(tip.x - state.tip.x, tip.y - state.tip.y)
          : 0;
        if (!state.matchLit && next.strikeTravel >= 15)
          next = {
            ...next,
            matchLit: true,
            message: "성냥에 불이 붙었어요. 이제 심지로 가져가세요.",
          };
        if (
          state.matchLit &&
          Math.hypot(tip.x - labGeometry.wick.x, tip.y - labGeometry.wick.y) <
            31
        ) {
          if (state.cap === "open")
            next = {
              ...next,
              lit: true,
              ignited: true,
              tool: null,
              matchLit: false,
              message:
                "점화했어요. 핀셋을 드래그하고 오른쪽 시료를 집어 불꽃에 가져가세요.",
            };
          else next.message = "뚜껑이 닫혀 있어 심지에 불을 붙일 수 없어요.";
        }
      }
      if (state.tool === "tweezers" && !state.held) {
        const dx = tip.x - state.tip.x,
          dy = tip.y - state.tip.y,
          length = dx * dx + dy * dy;
        const sample = labGeometry.samples.find((s) => {
          const t = length
            ? Math.max(
                0,
                Math.min(
                  1,
                  ((s.x - state.tip.x) * dx + (s.y - state.tip.y) * dy) /
                    length,
                ),
              )
            : 0;
          return (
            Math.hypot(s.x - state.tip.x - t * dx, s.y - state.tip.y - t * dy) <
            19
          );
        });
        if (sample)
          next = {
            ...next,
            held: sample.id,
            message:
              "시료를 집었어요. 손을 놓지 않고 불꽃 가운데까지 끌어가세요.",
          };
      }
      if (!flameContact(next)) next.active = null;
      return next;
    }
    case "OBSERVE": {
      const id = flameContact(state);
      if (!id || id !== action.id) return state;
      const sample = flameSamples.find((s) => s.id === id);
      return {
        ...state,
        active: id,
        last: id,
        heated: true,
        records: recordObservation(state.records, id),
        message: `${sample.metal}에서 ${sample.name} 불꽃이 나타났어요. 핀셋을 빼면 기본 불꽃으로 돌아갑니다.`,
      };
    }
    case "RETURN":
      return {
        ...state,
        held: null,
        active: null,
        tool: null,
        matchLit: false,
        message: "핀셋과 시료를 정리했어요. 새 시료를 집어 실험해 보세요.",
      };
    case "CLEAR_RECORDS":
      return { ...state, records: [] };
    case "RESET":
      return { ...initialFlameLab(), records: state.records };
    default:
      return state;
  }
}
