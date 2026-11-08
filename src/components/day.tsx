import { createContext, useContext, useState, type ReactNode } from "react";
import { addDays, dayChip, isoDate, onDay } from "../lib/format";
import { useStore } from "../lib/store";

export const PLAN_DAYS = 7;

type DayState = [string, (day: string) => void];
const Ctx = createContext<DayState>(["", () => {}]);

export function DayProvider({ children }: { children: ReactNode }) {
  const state = useState(() => isoDate(new Date()));
  return <Ctx.Provider value={state}>{children}</Ctx.Provider>;
}

export function useDay(): DayState {
  const [day, setDay] = useContext(Ctx);
  const today = isoDate(new Date());
  return [!day || day < today ? today : day, setDay];
}

export function nextDays(n = PLAN_DAYS) {
  const today = isoDate(new Date());
  return Array.from({ length: n }, (_, i) => addDays(today, i));
}

export const isToday = (day: string) => day === isoDate(new Date());

export const cookLabel = (day: string) => (isToday(day) ? "Tohle uvaříme" : `Uvaříme ${onDay(day)}`);

export function DayChips({ labelledBy, onChange }: { labelledBy: string; onChange?: (day: string) => void }) {
  const store = useStore();
  const [day, setDay] = useDay();
  const planned = new Set(store.plan.map((c) => c.cooked_on));
  return (
    <div className="chips" role="group" aria-labelledby={labelledBy}>
      {nextDays().map((d) => (
        <button
          key={d}
          type="button"
          className="chip"
          aria-pressed={d === day}
          data-planned={planned.has(d) || undefined}
          onClick={() => {
            setDay(d);
            onChange?.(d);
          }}
        >
          {dayChip(d)}
          {planned.has(d) && <span className="sr-only">, už něco v plánu</span>}
        </button>
      ))}
    </div>
  );
}
