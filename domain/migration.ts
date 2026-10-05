import { createSeed } from "./seed";
import type { DemoState } from "./types";
export function migrateDemo(value: unknown): DemoState {
  const s = value as DemoState;
  if (
    !s ||
    ![1, 2].includes(s.schema) ||
    !Array.isArray(s.aircraft) ||
    s.aircraft.length < 12 ||
    !Array.isArray(s.missions) ||
    !Array.isArray(s.audit) ||
    !Array.isArray(s.crew)
  )
    throw new Error("Invalid saved demo");
  const next = structuredClone(s),
    seed = createSeed();
  for (const a of next.aircraft)
    a.airframe ||= seed.aircraft.find((x) => x.id === a.id)?.airframe || "a320";
  for (const a of seed.aircraft.slice(12))
    if (!next.aircraft.some((x) => x.id === a.id)) next.aircraft.push(a);
  for (const c of seed.crew.slice(16))
    if (!next.crew.some((x) => x.id === c.id)) next.crew.push(c);
  if (next.schema !== 2) {
    next.revision++;
  }
  next.schema = 2;
  return next;
}
