import { useCallback, useEffect, useRef } from "react";
// Coalesce high-frequency pointer events while retaining the final release point.
export function useRafCallback(callback) {
  const latest = useRef(callback),
    pending = useRef(null),
    frame = useRef(null);
  latest.current = callback;
  const flush = useCallback(() => {
    if (frame.current !== null) {
      cancelAnimationFrame(frame.current);
      frame.current = null;
    }
    if (pending.current !== null) {
      const value = pending.current;
      pending.current = null;
      latest.current(value);
    }
  }, []);
  const schedule = useCallback(
    (value) => {
      pending.current = value;
      if (frame.current === null) frame.current = requestAnimationFrame(flush);
    },
    [flush],
  );
  const cancel = useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
    pending.current = null;
  }, []);
  useEffect(() => cancel, [cancel]);
  return { schedule, flush, cancel };
}
