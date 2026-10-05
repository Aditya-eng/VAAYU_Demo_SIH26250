import { createSeed } from "./seed";
import type { DemoState } from "./types";

export function createEmptyWorkspace(): DemoState {
  return {
    ...createSeed(),
    aircraft: [],
    crew: [],
    missions: [],
    locations: [],
    inventory: [],
    weather: [],
    restrictions: [],
    workOrders: [],
    maintenance: [],
    alerts: [],
    audit: [],
    proposal: null,
    undo: [],
  };
}
