import { useCallback, useRef, useState } from "react";
import { DAY_START_HOUR, HOUR_HEIGHT } from "./utils";

const SNAP_MINUTES = 30;
const MIN_DURATION = 30;

export interface DragState {
  dayIndex: number;
  startMinute: number;
  currentMinute: number;
}

function yToMinute(y: number, round: "floor" | "round" = "round"): number {
  const raw = (y / HOUR_HEIGHT) * 60 + DAY_START_HOUR * 60;
  const fn = round === "floor" ? Math.floor : Math.round;
  return fn(raw / SNAP_MINUTES) * SNAP_MINUTES;
}

export function useTimeGridDrag(
  days: Date[],
  onComplete: (start: Date, end: Date) => void,
) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const scrollRef = useRef<HTMLElement | null>(null);
  const colRefs = useRef<(HTMLElement | null)[]>([]);
  const dragRef = useRef<DragState | null>(null);

  const handleMouseDown = useCallback(
    (dayIndex: number, e: React.MouseEvent) => {
      // Only left click
      if (e.button !== 0) return;
      const col = colRefs.current[dayIndex];
      const scroll = scrollRef.current;
      if (!col || !scroll) return;

      const scrollRect = scroll.getBoundingClientRect();
      const offsetY = e.clientY - scrollRect.top + scroll.scrollTop;
      const minute = yToMinute(offsetY, "floor");

      const state: DragState = { dayIndex, startMinute: minute, currentMinute: minute };
      dragRef.current = state;
      setDrag(state);

      const onMove = (me: MouseEvent) => {
        const y = me.clientY - scrollRect.top + scroll.scrollTop;
        const m = Math.max(DAY_START_HOUR * 60, Math.min(24 * 60, yToMinute(y)));
        const prev = dragRef.current;
        if (prev && m !== prev.currentMinute) {
          const next = { ...prev, currentMinute: m };
          dragRef.current = next;
          setDrag(next);
        }
      };

      const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        const final = dragRef.current;
        if (final) {
          let startMin = Math.min(final.startMinute, final.currentMinute);
          let endMin = Math.max(final.startMinute, final.currentMinute);
          if (endMin - startMin < MIN_DURATION) {
            endMin = startMin + MIN_DURATION;
            if (endMin > 24 * 60) {
              endMin = 24 * 60;
              startMin = endMin - MIN_DURATION;
            }
          }
          const day = days[final.dayIndex];
          const start = new Date(day);
          start.setHours(Math.floor(startMin / 60), startMin % 60, 0, 0);
          const end = new Date(day);
          end.setHours(Math.floor(endMin / 60), endMin % 60, 0, 0);
          onComplete(start, end);
        }
        dragRef.current = null;
        setDrag(null);
      };

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [days, onComplete],
  );

  const setColRef = useCallback(
    (index: number) => (el: HTMLElement | null) => {
      colRefs.current[index] = el;
    },
    [],
  );

  return { drag, scrollRef, setColRef, handleMouseDown };
}
