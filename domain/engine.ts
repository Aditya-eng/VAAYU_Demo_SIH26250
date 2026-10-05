import { airframeFor } from "./airframes";
import { createSeed, DEMO_NOW, COMPONENTS } from "./seed";
import type {
  Action,
  Aircraft,
  Alternative,
  DemoState,
  Metrics,
  Mission,
  Role,
  WorkStage,
} from "./types";
export const time = (minute: number) =>
  `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
export const shortId = (id: string | null) =>
  id?.replace("VAAYU-", "") ?? "Unassigned";
export const activeMission = (m: Mission) =>
  !["COMPLETED", "CANCELLED"].includes(m.state);
export function aircraftStatus(s: DemoState, a: Aircraft): string {
  if (a.components.some((c) => c.status === "FAULT")) return "GROUNDED";
  if (s.workOrders.some((w) => w.aircraftId === a.id && w.stage !== "CLEARED"))
    return "MAINTENANCE";
  if (
    COMPONENTS.some(([id]) => !a.components.some((c) => c.id === id)) ||
    a.components.some((c) => ["UNKNOWN", "STALE"].includes(c.status))
  )
    return "UNKNOWN";
  if (
    a.inspectionDueMinute <= DEMO_NOW ||
    a.components.some((c) => c.status === "INSPECTION REQUIRED")
  )
    return "INSPECTION DUE";
  if (
    s.missions.some(
      (m) =>
        m.aircraftId === a.id &&
        activeMission(m) &&
        m.start <= DEMO_NOW &&
        m.start + m.duration > DEMO_NOW,
    )
  )
    return "ASSIGNED";
  return "AVAILABLE";
}
const overlaps = (a: number, b: number, c: number, d: number) => a < d && c < b;
export function violations(
  s: DemoState,
  m: Mission,
  aId: string | null = m.aircraftId,
  cId: string | null = m.crewId,
  start = m.start,
): string[] {
  const a = s.aircraft.find((x) => x.id === aId),
    c = s.crew.find((x) => x.id === cId),
    out: string[] = [];
  if (!a) return ["No aircraft assigned"];
  if (airframeFor(a).family === "FIGHTER")
    out.push(
      "Fighter demonstration airframe: not configured for humanitarian cargo or medical transport",
    );
  const faults = a.components.filter((x) => x.status === "FAULT");
  if (faults.length)
    out.push(
      `Aircraft unavailable: active maintenance fault — ${faults.map((x) => x.name).join(", ")}`,
    );
  if (s.workOrders.some((w) => w.aircraftId === a.id && w.stage !== "CLEARED"))
    out.push("Maintenance clearance required");
  const absent = COMPONENTS.filter(
    ([id]) => !a.components.some((c) => c.id === id),
  );
  if (absent.length)
    out.push(
      `Unknown component data: missing ${absent.map(([, name]) => name).join(", ")}`,
    );
  const missing = a.components.filter(
    (x) => x.status === "UNKNOWN" || x.status === "STALE",
  );
  if (missing.length)
    out.push(
      `Unknown / stale component data: ${missing.map((x) => x.name).join(", ")}`,
    );
  if (a.location !== m.origin)
    out.push("Aircraft is not positioned at departure base");
  if (m.payloadKg > a.maxPayloadKg)
    out.push(
      `Payload insufficient: ${(m.payloadKg / 1000).toFixed(1)} t required / ${(a.maxPayloadKg / 1000).toFixed(1)} t capacity`,
    );
  if (m.medical && a.type !== "Mercy M8")
    out.push("Medical evacuation equipment not available");
  if (a.rangeKm < m.distanceKm * 1.2)
    out.push("Range insufficient including 20% route reserve");
  if (a.fuelPercent < 30) out.push("Aircraft fuel below minimum reserve");
  if (a.inspectionDueMinute < start + m.duration)
    out.push(
      `Inspection expires at ${time(a.inspectionDueMinute)} before mission completion`,
    );
  if (a.readyMinute > start)
    out.push(`Aircraft ready at ${time(a.readyMinute)}; departure too early`);
  if (start > m.latestStart || start < m.originalStart)
    out.push(
      `Departure outside mission window ${time(m.originalStart)}–${time(m.latestStart)}`,
    );
  if (!c) out.push("No crew assigned");
  else {
    if (!c.available || c.fitness !== "READY")
      out.push("Crew unavailable / not medically ready");
    if (!c.qualifications.includes(a.type) || !c.aircraftIds.includes(a.id))
      out.push("Crew not qualified for selected aircraft");
    if (!c.restCompleted) out.push("Required crew rest not completed");
    if (c.location !== m.origin)
      out.push("Crew is not positioned at departure base");
    const duty = s.missions
      .filter((x) => x.id !== m.id && activeMission(x) && x.crewId === c.id)
      .reduce((v, x) => v + x.duration, 0);
    if (c.dutyMinutes + duty + m.duration > c.maxDutyMinutes)
      out.push(
        `Crew duty limit exceeded: ${c.dutyMinutes + duty + m.duration - c.maxDutyMinutes} min`,
      );
  }
  for (const other of s.missions.filter(
    (x) => x.id !== m.id && x.state !== "CANCELLED",
  )) {
    if (
      other.aircraftId === a.id &&
      overlaps(
        start,
        start + m.duration + a.turnaround,
        other.start,
        other.start + other.duration + a.turnaround,
      )
    )
      out.push(
        `Aircraft / ${a.turnaround} min turnaround conflict with ${other.id}`,
      );
    if (
      c &&
      other.crewId === c.id &&
      overlaps(
        start,
        start + m.duration,
        other.start,
        other.start + other.duration,
      )
    )
      out.push(`Crew already assigned to ${other.id}`);
  }
  const origin = s.locations.find((x) => x.id === m.origin);
  const reserved = s.missions
    .filter(
      (x) =>
        x.id !== m.id &&
        activeMission(x) &&
        x.origin === m.origin &&
        x.aircraftId,
    )
    .reduce((v, x) => v + x.fuelLitres, 0);
  if (!origin || origin.fuelLitres - reserved < m.fuelLitres)
    out.push(
      `Fuel shortfall: ${m.fuelLitres.toLocaleString()} L required, ${Math.max(0, (origin?.fuelLitres ?? 0) - reserved).toLocaleString()} L unallocated`,
    );
  for (const loc of [m.origin, m.destination]) {
    const wx = s.weather.find((x) => x.locationId === loc);
    if (!wx || wx.isStale || wx.dataMode === "UNAVAILABLE")
      out.push(`Weather data unknown / stale at ${loc}`);
    else if (
      overlaps(start, start + m.duration, wx.start, wx.end) &&
      (wx.severity === "SEVERE" || wx.visibilityKm < 3 || wx.windKts > 35)
    )
      out.push(`Severe weather at ${loc}: ${wx.condition}`);
  }
  s.restrictions
    .filter(
      (r) =>
        r.active &&
        ((r.origin === m.origin && r.destination === m.destination) ||
          (r.origin === m.destination && r.destination === m.origin)) &&
        overlaps(start, start + m.duration, r.start, r.end),
    )
    .forEach((r) =>
      out.push(`Airspace restriction: ${r.name} until ${time(r.end)}`),
    );
  return [...new Set(out)];
}
export function missionStatus(s: DemoState, m: Mission): string {
  if (!activeMission(m)) return m.state;
  if (violations(s, m).length) return "CONFLICT";
  if (m.start > m.originalStart) return "DELAYED";
  return m.state === "IN PROGRESS" ? "IN PROGRESS" : "READY";
}
export function metrics(s: DemoState): Metrics {
  const active = s.missions.filter(activeMission),
    feasible = active.filter((m) => !violations(s, m).length),
    status = s.aircraft.map((a) => aircraftStatus(s, a));
  return {
    total: s.aircraft.length,
    available: status.filter((x) => x === "AVAILABLE").length,
    assigned: status.filter((x) => x === "ASSIGNED").length,
    maintenance: s.aircraft.filter((a) =>
      s.workOrders.some((w) => w.aircraftId === a.id && w.stage !== "CLEARED"),
    ).length,
    inspection: status.filter((x) => x === "INSPECTION DUE").length,
    grounded: status.filter((x) => x === "GROUNDED").length,
    unknown: status.filter((x) => x === "UNKNOWN").length,
    missions: s.missions.filter((m) => m.state !== "CANCELLED").length,
    feasible: feasible.length,
    conflicts: active.length - feasible.length,
    critical: s.alerts.filter((a) => a.severity === "CRITICAL" && !a.resolved)
      .length,
    delay: active.reduce(
      (v, m) => v + Math.max(0, m.start - m.originalStart),
      0,
    ),
    unmet: active.filter((m) => !m.aircraftId || violations(s, m).length)
      .length,
    utilisation: Math.round(
      (feasible.reduce((v, m) => v + m.duration, 0) /
        (Math.max(1, s.aircraft.length) * 720)) *
        100,
    ),
    crewUtilisation: Math.round(
      (new Set(feasible.map((m) => m.crewId)).size /
        Math.max(1, s.crew.length)) *
        100,
    ),
    fuel: feasible.reduce((v, m) => v + m.fuelLitres, 0),
    completed: s.missions.filter((m) => m.state === "COMPLETED").length,
    priorityProtected: feasible.filter((m) => m.priority <= 2).length,
  };
}
export function projected(
  s: DemoState,
  m: Mission,
  option: Alternative,
): DemoState {
  return {
    ...s,
    missions: s.missions.map((x) =>
      x.id === m.id
        ? {
            ...x,
            aircraftId: option.aircraftId,
            crewId: option.crewId,
            start: option.start,
          }
        : x,
    ),
  };
}
export function alternatives(s: DemoState, m: Mission): Alternative[] {
  return s.aircraft
    .map((a) => {
      const qualified = s.crew.filter(
        (c) =>
          c.aircraftIds.includes(a.id) && c.qualifications.includes(a.type),
      );
      const candidates = qualified.length ? qualified : [null];
      const departureTimes = new Set([
        Math.max(m.originalStart, DEMO_NOW, a.readyMinute),
        ...s.missions
          .filter(
            (x) =>
              x.id !== m.id && x.aircraftId === a.id && x.state !== "CANCELLED",
          )
          .map((x) => x.start + x.duration + a.turnaround),
        ...s.weather
          .filter(
            (x) =>
              x.severity === "SEVERE" &&
              [m.origin, m.destination].includes(x.locationId),
          )
          .map((x) => x.end),
        ...s.restrictions
          .filter(
            (x) =>
              x.active &&
              x.origin === m.origin &&
              x.destination === m.destination,
          )
          .map((x) => x.end),
      ]);
      const options: Alternative[] = [];
      for (const start of [...departureTimes].filter(
        (t) => t >= m.originalStart && t >= DEMO_NOW && t >= a.readyMinute,
      ))
        for (const c of candidates) {
          const errors = violations(s, m, a.id, c?.id ?? null, start),
            delay = start - m.originalStart;
          const workload = s.missions
            .filter(
              (x) => x.id !== m.id && x.aircraftId === a.id && activeMission(x),
            )
            .reduce((v, x) => v + x.duration, 0);
          const risk =
            a.components.filter((x) => x.status === "INSPECTION REQUIRED")
              .length * 20;
          const score =
            delay * (5 - m.priority) +
            m.fuelLitres / 1000 +
            workload / 60 +
            risk;
          options.push({
            aircraftId: a.id,
            crewId: c?.id ?? null,
            start,
            feasible: !errors.length,
            violations: errors,
            delay,
            fuelLitres: m.fuelLitres,
            score: Math.round(score * 10) / 10,
            explanation: [
              "Available during mission window",
              `Payload ${m.payloadKg / 1000} t within ${a.maxPayloadKg / 1000} t capacity`,
              "Qualified and rested crew available",
              "Base fuel allocation sufficient",
              "Inspection valid through landing",
              "Weather acceptable at both locations",
              "Route free of active restrictions",
              `Turnaround buffer of ${a.turnaround} min respected`,
            ],
          });
        }
      return options.sort(
        (x, y) => Number(y.feasible) - Number(x.feasible) || x.score - y.score,
      )[0];
    })
    .filter((x): x is Alternative => Boolean(x))
    .sort(
      (a, b) =>
        Number(b.feasible) - Number(a.feasible) ||
        a.score - b.score ||
        a.aircraftId.localeCompare(b.aircraftId),
    );
}
export function can(
  role: Role,
  capability: "maintenance" | "plan" | "crew" | "priority",
) {
  return capability === "maintenance"
    ? role === "MAINTENANCE OFFICER"
    : capability === "crew"
      ? role === "CREW COORDINATOR"
      : capability === "priority"
        ? role === "OPERATIONS SUPERVISOR"
        : role === "OPERATIONS PLANNER" || role === "OPERATIONS SUPERVISOR";
}
const requireRole = (
  role: Role,
  cap: "maintenance" | "plan" | "crew" | "priority",
) => {
  if (!can(role, cap))
    throw new Error(
      `Switch to ${cap === "maintenance" ? "Maintenance Officer" : cap === "crew" ? "Crew Coordinator" : cap === "priority" ? "Operations Supervisor" : "Operations Planner"} to perform this action.`,
    );
};
export function transition(current: DemoState, action: Action): DemoState {
  if (action.type === "RESET") return createSeed();
  const s = structuredClone(current),
    now = new Date().toISOString();
  const actor = action.actor;
  const uid = (prefix: string) =>
    `${prefix}-${s.revision + 1}-${s.audit.length}-${s.workOrders.length}`;
  const log = (
    actionName: string,
    entity: string,
    previous: string,
    next: string,
    reason: string,
    missionId: string | null = null,
    who: string = actor,
  ) =>
    s.audit.unshift({
      id: uid("AUD"),
      timestamp: now,
      actor: who,
      action: actionName,
      entity,
      previous,
      next,
      reason,
      missionId,
    });
  const notify = (
    id: string,
    severity: "CRITICAL" | "WARNING" | "INFO",
    title: string,
    detail: string,
    entity: string,
  ) => {
    const old = s.alerts.find((a) => a.id === id);
    if (old) {
      old.resolved = false;
      old.detail = detail;
    } else
      s.alerts.unshift({
        id,
        severity,
        title,
        detail,
        entity,
        resolved: false,
        acknowledged: false,
        timestamp: now,
      });
  };
  let operational = true;
  switch (action.type) {
    case "FAULT": {
      if (!action.demo) requireRole(actor, "maintenance");
      if (
        !action.fault.trim() ||
        action.repairMinutes < 1 ||
        !Number.isFinite(action.repairMinutes) ||
        action.severity === "None"
      )
        throw new Error(
          "Enter a fault description, severity and positive repair estimate.",
        );
      const a = s.aircraft.find((x) => x.id === action.aircraftId),
        c = a?.components.find((x) => x.id === action.componentId);
      if (!a || !c) throw new Error("Aircraft component not found");
      if (
        s.workOrders.some(
          (w) =>
            w.aircraftId === a.id &&
            w.componentId === c.id &&
            w.stage !== "CLEARED",
        )
      )
        throw new Error(
          "An open work order already exists for this component.",
        );
      const before = aircraftStatus(s, a),
        previous = c.status;
      Object.assign(c, {
        status: "FAULT",
        severity: action.severity,
        fault: action.fault.trim(),
        faultAt: now,
        updatedAt: now,
        repairMinutes: action.repairMinutes,
      });
      const spare = s.inventory.find(
          (i) => i.id === c.spare && i.location === a.location,
        ),
        reserved = !!spare && spare.quantity - spare.reserved > 0;
      if (reserved && spare) spare.reserved++;
      const wid = `MX-${204 + s.workOrders.length - 3}`;
      s.workOrders.unshift({
        id: wid,
        aircraftId: a.id,
        componentId: c.id,
        stage: "CREATED",
        task: c.task,
        spareId: c.spare,
        reserved,
        estimatedMinutes: action.repairMinutes + (reserved ? 0 : 240),
        createdAt: now,
        officer: actor,
        notes: action.fault,
        inspectionResult: null,
        clearance: null,
      });
      log(
        "FAULT RECORDED",
        `${a.id} / ${c.name}`,
        previous,
        "FAULT",
        action.fault,
      );
      log(
        "AIRCRAFT STATUS CHANGED",
        a.id,
        before,
        "UNAVAILABLE",
        `Active ${c.name} fault`,
        null,
        "System",
      );
      log(
        "WORK ORDER CREATED",
        wid,
        "NONE",
        "CREATED",
        reserved
          ? "Required spare reserved"
          : "Awaiting spare; 240 min supply delay",
        null,
        "System",
      );
      notify(
        `FAULT-${a.id}-${c.id}`,
        "CRITICAL",
        `${shortId(a.id)} unavailable`,
        `${c.name}: ${action.fault}. ${wid} requires maintenance clearance.`,
        a.id,
      );
      break;
    }
    case "OPEN_INSPECTION": {
      requireRole(actor, "maintenance");
      const a = s.aircraft.find((x) => x.id === action.aircraftId);
      const c = a?.components.find((x) => x.id === action.componentId);
      if (!a || !c) throw new Error("Aircraft component not found");
      if (
        s.workOrders.some(
          (w) =>
            w.aircraftId === a.id &&
            w.componentId === c.id &&
            w.stage !== "CLEARED",
        )
      )
        throw new Error("Open the existing work order for this component.");
      if (c.status === "FAULT")
        throw new Error("The fault requires its maintenance work order.");
      const wid = uid("MXI");
      const previous = c.status;
      c.status = "INSPECTION REQUIRED";
      s.workOrders.unshift({
        id: wid,
        aircraftId: a.id,
        componentId: c.id,
        stage: "CREATED",
        task: `Inspect ${c.name.toLowerCase()} and verify serviceability`,
        spareId: "",
        reserved: false,
        estimatedMinutes: 45,
        createdAt: now,
        officer: actor,
        notes:
          "Inspection requested; aircraft withheld pending recorded clearance.",
        inspectionResult: null,
        clearance: null,
        inspectionOnly: true,
      });
      log(
        "INSPECTION REQUESTED",
        `${a.id} / ${c.name}`,
        previous,
        "INSPECTION REQUIRED",
        "Inspection work order created",
      );
      notify(
        `INSPECTION-${a.id}-${c.id}`,
        "WARNING",
        `${shortId(a.id)} inspection opened`,
        `${c.name}: ${wid} requires verification and clearance.`,
        a.id,
      );
      break;
    }
    case "WORK": {
      requireRole(actor, "maintenance");
      const w = s.workOrders.find((x) => x.id === action.workId);
      if (!w) throw new Error("Work order not found");
      if (w.stage === "CLEARED")
        throw new Error("Work order is already cleared");
      if (!action.notes.trim())
        throw new Error(
          "Record work performed / verification notes before continuing.",
        );
      if (!w.reserved && !w.inspectionOnly) {
        const spare = s.inventory.find(
          (i) =>
            i.id === w.spareId &&
            i.location ===
              s.aircraft.find((a) => a.id === w.aircraftId)?.location,
        );
        if (!spare || spare.quantity - spare.reserved < 1)
          throw new Error(
            "Required spare unavailable at this base. Maintenance cannot proceed.",
          );
        spare.reserved++;
        w.reserved = true;
      }
      const stages: WorkStage[] = [
        "CREATED",
        "IN PROGRESS",
        "TASK COMPLETED",
        "VERIFIED",
        "CLEARED",
      ];
      const prev = w.stage;
      w.stage = stages[stages.indexOf(w.stage) + 1];
      w.notes = action.notes;
      w.officer = actor;
      if (w.stage === "VERIFIED") w.inspectionResult = "PASS — " + action.notes;
      if (w.stage === "CLEARED") {
        if (!w.inspectionResult)
          throw new Error(
            "Inspection verification is required before clearance",
          );
        const a = s.aircraft.find((x) => x.id === w.aircraftId)!,
          c = a.components.find((x) => x.id === w.componentId)!;
        w.clearance = {
          officer: actor,
          timestamp: now,
          workPerformed: w.task,
          inspectionResult: w.inspectionResult,
          notes: action.notes,
          previousStatus: c.status,
          newStatus: "HEALTHY",
        };
        Object.assign(c, {
          status: "HEALTHY",
          severity: "None",
          fault: null,
          lastInspection: now,
          updatedAt: now,
          nextInspection: new Date(
            Date.parse(now) + 24 * 60 * 60 * 1000,
          ).toISOString(),
        });
        if (
          w.inspectionOnly &&
          !a.components.some((x) => x.status !== "HEALTHY")
        )
          a.inspectionDueMinute = Math.max(a.inspectionDueMinute, 1440 + 480);
        const item = s.inventory.find(
          (i) => i.id === w.spareId && i.location === a.location,
        );
        if (item && !w.inspectionOnly) {
          item.quantity--;
          item.reserved--;
        }
        s.maintenance.unshift({
          id: uid("HIST"),
          aircraftId: a.id,
          componentId: c.id,
          timestamp: now,
          officer: actor,
          work: w.task,
          result: w.inspectionResult,
        });
        s.alerts
          .filter(
            (x) =>
              x.id === `FAULT-${a.id}-${c.id}` ||
              x.id === `INSPECTION-${a.id}-${c.id}`,
          )
          .forEach((x) => (x.resolved = true));
        log(
          "MAINTENANCE CLEARANCE",
          a.id,
          w.clearance.previousStatus,
          aircraftStatus(s, a),
          action.notes,
        );
      }
      log(
        w.stage === "CLEARED"
          ? "RETURN TO SERVICE CHECK"
          : "MAINTENANCE UPDATED",
        w.id,
        prev,
        w.stage,
        action.notes,
      );
      break;
    }
    case "CREW": {
      if (!action.demo) requireRole(actor, "crew");
      const c = s.crew.find((x) => x.id === action.crewId);
      if (!c) throw new Error("Crew not found");
      log(
        "CREW READINESS UPDATED",
        c.id,
        String(c.available),
        String(action.available),
        "Synthetic readiness change",
      );
      c.available = action.available;
      c.fitness = action.available ? "READY" : "UNAVAILABLE";
      break;
    }
    case "WEATHER": {
      const wx = s.weather.find((x) => x.locationId === "delta")!;
      Object.assign(wx, {
        severity: "SEVERE",
        visibilityKm: 1,
        windKts: 42,
        condition: "Thunderstorm / low visibility",
        end: 930,
        updatedAt: now,
      });
      notify(
        "WEATHER-DELTA",
        "WARNING",
        "Severe weather at Delta",
        "Simulated closure until 15:30 IST. Departures require revalidation.",
        "delta",
      );
      log(
        "WEATHER DISRUPTION",
        "delta",
        "ADVISORY",
        "SEVERE",
        "Simulated storm window to 15:30",
      );
      break;
    }
    case "AIRSPACE": {
      if (s.restrictions.some((r) => r.id === "DEMO-N-03"))
        throw new Error("The demo corridor restriction is already active.");
      s.restrictions.push({
        ...s.restrictions[0],
        id: "DEMO-N-03",
        name: "Alpha–Delta corridor closure",
        origin: "alpha",
        destination: "delta",
        start: 810,
        end: 900,
        updatedAt: now,
      });
      log(
        "AIRSPACE RESTRICTION",
        "DEMO-N-03",
        "OPEN",
        "CLOSED",
        "Simulated route closure until 15:00",
      );
      break;
    }
    case "URGENT": {
      if (s.missions.some((m) => m.id === "MED-URGENT"))
        throw new Error("Urgent medevac request already exists.");
      s.missions.push({
        ...s.missions.find((m) => m.id === "MED-012")!,
        id: "MED-URGENT",
        name: "Urgent evacuation request",
        aircraftId: null,
        crewId: null,
        start: 840,
        originalStart: 840,
        latestStart: 1050,
        duration: 60,
        payloadKg: 1800,
      });
      log(
        "URGENT REQUEST",
        "MED-URGENT",
        "NONE",
        "UNASSIGNED",
        "P1 emergency medical evacuation",
        "MED-URGENT",
      );
      break;
    }
    case "PROPOSE": {
      requireRole(actor, "plan");
      const m = s.missions.find((x) => x.id === action.missionId);
      if (!m || !activeMission(m)) throw new Error("Select an active mission");
      const opts = alternatives(s, m),
        selected = opts.find((x) => x.feasible) ?? null;
      s.proposal = {
        id: uid("RP"),
        trigger: violations(s, m).join("; ") || "Planner requested review",
        missionId: m.id,
        previousAssignment: {
          aircraftId: m.aircraftId,
          crewId: m.crewId,
          start: m.start,
        },
        alternatives: opts,
        selected,
        beforeMetrics: metrics(s),
        afterMetrics: selected ? metrics(projected(s, m, selected)) : null,
        status: "PENDING",
        revision: s.revision,
      };
      log(
        "REPLAN GENERATED",
        m.id,
        m.aircraftId ?? "UNASSIGNED",
        selected?.aircraftId ?? "NO FEASIBLE OPTION",
        "Hard constraints filtered; priority-weighted score ranked",
        m.id,
        "System",
      );
      operational = false;
      break;
    }
    case "SELECT": {
      requireRole(actor, "plan");
      const p = s.proposal;
      if (!p || p.status !== "PENDING")
        throw new Error("Generate a proposal first");
      const option = p.alternatives.find(
        (x) => x.aircraftId === action.aircraftId,
      );
      if (!option?.feasible)
        throw new Error(
          option?.violations.join("; ") || "Alternative not found",
        );
      p.selected = option;
      p.afterMetrics = metrics(
        projected(
          s,
          s.missions.find((m) => m.id === p.missionId)!,
          option,
        ),
      );
      log(
        "PROPOSAL MODIFIED",
        p.id,
        "RECOMMENDATION",
        option.aircraftId,
        "Manual selection of feasible alternative",
        p.missionId,
      );
      operational = false;
      break;
    }
    case "APPROVE": {
      requireRole(actor, "plan");
      const p = s.proposal;
      if (!p || p.status !== "PENDING" || !p.selected)
        throw new Error("No feasible pending proposal");
      if (p.revision !== s.revision)
        throw new Error(
          "Operational state changed. Generate a fresh proposal before approving.",
        );
      const m = s.missions.find((x) => x.id === p.missionId)!;
      if (m.priority === 1) requireRole(actor, "priority");
      const err = violations(
        s,
        m,
        p.selected.aircraftId,
        p.selected.crewId,
        p.selected.start,
      );
      if (err.length) throw new Error(err.join("; "));
      const before = structuredClone(m);
      Object.assign(m, {
        aircraftId: p.selected.aircraftId,
        crewId: p.selected.crewId,
        start: p.selected.start,
      });
      s.undo.push({
        missionId: m.id,
        previous: before,
        applied: structuredClone(m),
      });
      p.status = "APPROVED";
      log(
        "REPLAN APPROVED",
        m.id,
        before.aircraftId ?? "UNASSIGNED",
        m.aircraftId!,
        `Delay +${m.start - m.originalStart} min; approved by ${actor}`,
        m.id,
      );
      break;
    }
    case "ASSIGN": {
      requireRole(actor, "plan");
      const m = s.missions.find((x) => x.id === action.missionId);
      if (!m || !activeMission(m))
        throw new Error("Only active missions can be reassigned");
      if (m.priority === 1) requireRole(actor, "priority");
      const errors = violations(
        s,
        m,
        action.aircraftId,
        action.crewId,
        action.start,
      );
      if (errors.length) throw new Error(errors.join("; "));
      const prev = structuredClone(m);
      Object.assign(m, {
        aircraftId: action.aircraftId,
        crewId: action.crewId,
        start: action.start,
      });
      s.undo.push({
        missionId: m.id,
        previous: prev,
        applied: structuredClone(m),
      });
      log(
        "MANUAL ASSIGNMENT APPROVED",
        m.id,
        prev.aircraftId ?? "NONE",
        m.aircraftId!,
        "Hard constraints validated",
        m.id,
      );
      break;
    }
    case "REJECT":
    case "CANCEL": {
      requireRole(actor, "plan");
      if (s.proposal?.status !== "PENDING")
        throw new Error("No pending proposal");
      s.proposal.status = action.type === "REJECT" ? "REJECTED" : "CANCELLED";
      log(
        `REPLAN ${s.proposal.status}`,
        s.proposal.id,
        "PENDING",
        s.proposal.status,
        "Planner decision",
        s.proposal.missionId,
      );
      operational = false;
      break;
    }
    case "UNDO": {
      requireRole(actor, "plan");
      const entry = s.undo.at(-1);
      if (!entry) throw new Error("No schedule changes to undo");
      if (entry.previous.priority === 1) requireRole(actor, "priority");
      s.undo.pop();
      s.missions = s.missions.map((m) =>
        m.id === entry.missionId ? entry.previous : m,
      );
      s.proposal = null;
      log(
        "REPLAN UNDONE",
        entry.missionId,
        entry.applied.aircraftId ?? "NONE",
        entry.previous.aircraftId ?? "NONE",
        "Previous schedule restored; current constraints revalidated",
        entry.missionId,
      );
      break;
    }
    case "ACK": {
      const al = s.alerts.find((x) => x.id === action.alertId);
      if (al) {
        al.acknowledged = true;
        log(
          "ALERT ACKNOWLEDGED",
          al.id,
          "UNREAD",
          "ACKNOWLEDGED",
          "Acknowledgement does not resolve operational condition",
        );
      }
      operational = false;
      break;
    }
  }
  if (operational) s.revision++;
  for (const m of s.missions.filter(activeMission)) {
    const errors = violations(s, m),
      oldErrors = current.missions.some((x) => x.id === m.id)
        ? violations(
            current,
            current.missions.find((x) => x.id === m.id)!,
          )
        : [];
    if (errors.length) {
      notify(
        `CONFLICT-${m.id}`,
        "CRITICAL",
        `${m.id} assignment conflict`,
        errors.join(" · "),
        m.id,
      );
      if (!oldErrors.length)
        log(
          "MISSION CONFLICT",
          m.id,
          "READY",
          "CONFLICT",
          errors.join("; "),
          m.id,
          "System",
        );
    } else
      s.alerts
        .filter((a) => a.id === `CONFLICT-${m.id}`)
        .forEach((a) => (a.resolved = true));
  }
  s.updatedAt = now;
  return s;
}
