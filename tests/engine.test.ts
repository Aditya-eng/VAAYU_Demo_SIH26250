import test from "node:test";
import assert from "node:assert/strict";
import { createEmptyWorkspace } from "../domain/workspace";
import { migrateDemo } from "../domain/migration";
import { airframeFor } from "../domain/airframes";
import { createSeed } from "../domain/seed";
import {
  alternatives,
  aircraftStatus,
  metrics,
  missionStatus,
  transition,
  violations,
} from "../domain/engine";
import type { DemoState, Mission } from "../domain/types";
const hero = (s: DemoState) => s.missions.find((m) => m.id === "RLF-204")!;
const fault = (s: DemoState) =>
  transition(s, {
    type: "FAULT",
    aircraftId: "VAAYU-TR-03",
    componentId: "left-engine",
    fault: "EGT sensor anomaly",
    severity: "Major",
    repairMinutes: 150,
    actor: "MAINTENANCE OFFICER",
  });
const propose = (s: DemoState) =>
  transition(s, {
    type: "PROPOSE",
    missionId: "RLF-204",
    actor: "OPERATIONS PLANNER",
  });
const approve = (s: DemoState) =>
  transition(s, { type: "APPROVE", actor: "OPERATIONS PLANNER" });
test("baseline: all active missions feasible, population and explicit missing data", () => {
  const s = createSeed();
  assert.equal(s.aircraft.length, 14);
  assert.equal(s.aircraft.flatMap((a) => a.components).length, 112);
  assert.equal(s.crew.length, 18);
  assert.equal(metrics(s).conflicts, 0);
  assert.equal(aircraftStatus(s, s.aircraft[11]), "UNKNOWN");
  assert.equal(missionStatus(s, hero(s)), "READY");
});
test("hero chain: fault, ground, reserve, work order, conflict, alerts and audit", () => {
  const before = createSeed(),
    s = fault(before);
  assert.equal(before.aircraft[2].components[0].status, "HEALTHY");
  assert.equal(s.aircraft[2].components[0].status, "FAULT");
  assert.equal(aircraftStatus(s, s.aircraft[2]), "GROUNDED");
  assert.equal(metrics(s).available, metrics(before).available - 1);
  assert.equal(missionStatus(s, hero(s)), "CONFLICT");
  assert.equal(s.workOrders.length, 4);
  assert.equal(s.workOrders[0].estimatedMinutes, 150);
  assert.equal(s.inventory[0].reserved, 4);
  assert.equal(metrics(s).conflicts, 1);
  assert.ok(s.alerts.some((a) => a.entity === "RLF-204" && !a.resolved));
  for (const action of [
    "FAULT RECORDED",
    "AIRCRAFT STATUS CHANGED",
    "WORK ORDER CREATED",
    "MISSION CONFLICT",
  ])
    assert.ok(s.audit.some((a) => a.action === action));
});
test("deterministic alternatives: TR-07 +18, TR-06 +47, TR-04 payload, TR-05 crew", () => {
  const s = fault(createSeed()),
    opts = alternatives(s, hero(s));
  assert.equal(opts[0].aircraftId, "VAAYU-TR-07");
  assert.equal(opts[0].delay, 18);
  assert.equal(opts.find((a) => a.aircraftId === "VAAYU-TR-06")?.delay, 47);
  assert.ok(opts.find((a) => a.aircraftId === "VAAYU-TR-06")?.feasible);
  assert.ok(
    opts
      .find((a) => a.aircraftId === "VAAYU-TR-04")
      ?.violations.some((v) => v.includes("Payload")),
  );
  assert.ok(
    opts
      .find((a) => a.aircraftId === "VAAYU-TR-05")
      ?.violations.some((v) => v.includes("Crew unavailable")),
  );
  assert.deepEqual(opts, alternatives(s, hero(s)));
});
test("proposal is non-mutating and comparison metrics are computed", () => {
  const s = propose(fault(createSeed()));
  assert.equal(hero(s).aircraftId, "VAAYU-TR-03");
  assert.equal(s.proposal?.beforeMetrics.conflicts, 1);
  assert.equal(s.proposal?.afterMetrics?.conflicts, 0);
  assert.equal(s.proposal?.afterMetrics?.delay, 18);
  assert.equal(
    s.proposal?.afterMetrics?.feasible,
    s.proposal!.beforeMetrics.feasible + 1,
  );
  assert.ok(s.proposal!.afterMetrics!.fuel > s.proposal!.beforeMetrics.fuel);
});
test("approval updates plan, resolves mission alert, keeps aircraft fault open; undo retains audit", () => {
  let s = approve(propose(fault(createSeed())));
  assert.equal(hero(s).aircraftId, "VAAYU-TR-07");
  assert.equal(hero(s).crewId, "CREW-07");
  assert.equal(hero(s).start, 858);
  assert.equal(metrics(s).conflicts, 0);
  assert.ok(s.alerts.find((a) => a.id === "CONFLICT-RLF-204")?.resolved);
  assert.equal(
    s.alerts.find((a) => a.id === "FAULT-VAAYU-TR-03-left-engine")?.resolved,
    false,
  );
  const count = s.audit.length;
  s = transition(s, { type: "UNDO", actor: "OPERATIONS PLANNER" });
  assert.equal(hero(s).aircraftId, "VAAYU-TR-03");
  assert.equal(hero(s).start, 840);
  assert.equal(metrics(s).conflicts, 1);
  assert.ok(s.audit.length > count);
  assert.ok(s.audit.some((a) => a.action === "REPLAN APPROVED"));
  assert.ok(s.audit.some((a) => a.action === "REPLAN UNDONE"));
});
test("maintenance task completion and verification cannot clear without recorded clearance", () => {
  let s = approve(propose(fault(createSeed())));
  const wid = s.workOrders[0].id;
  for (const stage of ["IN PROGRESS", "TASK COMPLETED", "VERIFIED"]) {
    s = transition(s, {
      type: "WORK",
      workId: wid,
      actor: "MAINTENANCE OFFICER",
      notes: "Sensor replaced / functional test passed",
    });
    assert.equal(s.workOrders[0].stage, stage);
    assert.equal(aircraftStatus(s, s.aircraft[2]), "GROUNDED");
  }
  s = transition(s, {
    type: "WORK",
    workId: wid,
    actor: "MAINTENANCE OFFICER",
    notes: "Functional test passed. Released to service.",
  });
  assert.equal(s.workOrders[0].stage, "CLEARED");
  assert.ok(s.workOrders[0].clearance?.timestamp);
  assert.equal(s.workOrders[0].clearance?.previousStatus, "FAULT");
  assert.equal(aircraftStatus(s, s.aircraft[2]), "AVAILABLE");
  assert.equal(s.inventory[0].quantity, 3);
  assert.equal(s.inventory[0].reserved, 3);
  assert.ok(
    s.maintenance.some(
      (h) => h.aircraftId === "VAAYU-TR-03" && h.result.includes("PASS"),
    ),
  );
});
test("role gates and missing maintenance notes are enforced in the domain layer", () => {
  const s = createSeed();
  assert.throws(
    () =>
      transition(s, {
        type: "FAULT",
        aircraftId: s.aircraft[2].id,
        componentId: "left-engine",
        fault: "test",
        severity: "Major",
        repairMinutes: 150,
        actor: "OPERATIONS PLANNER",
      }),
    /Maintenance Officer/,
  );
  assert.throws(
    () =>
      transition(s, {
        type: "CREW",
        crewId: "CREW-03",
        available: false,
        actor: "MAINTENANCE OFFICER",
      }),
    /Crew Coordinator/,
  );
  const f = fault(s);
  assert.throws(
    () =>
      transition(f, {
        type: "WORK",
        workId: f.workOrders[0].id,
        actor: "MAINTENANCE OFFICER",
        notes: "",
      }),
    /Record work/,
  );
});
test("manual infeasible choices are blocked and a feasible alternative can be selected", () => {
  let s = propose(fault(createSeed()));
  assert.throws(
    () =>
      transition(s, {
        type: "SELECT",
        aircraftId: "VAAYU-TR-04",
        actor: "OPERATIONS PLANNER",
      }),
    /Payload/,
  );
  s = transition(s, {
    type: "SELECT",
    aircraftId: "VAAYU-TR-06",
    actor: "OPERATIONS PLANNER",
  });
  assert.equal(s.proposal?.afterMetrics?.delay, 47);
  s = approve(s);
  assert.equal(hero(s).aircraftId, "VAAYU-TR-06");
  assert.equal(hero(s).start, 887);
});
test("changed state invalidates old proposal and approval rechecks constraints", () => {
  let s = propose(fault(createSeed()));
  s = transition(s, {
    type: "CREW",
    crewId: "CREW-07",
    available: false,
    actor: "CREW COORDINATOR",
  });
  assert.throws(() => approve(s), /state changed/);
  s = propose(s);
  assert.equal(s.proposal?.selected?.aircraftId, "VAAYU-TR-06");
});
test("hard constraints: payload, qualification, duty, rest, inspection, fuel, range, unknown", () => {
  const s = createSeed(),
    m = hero(s);
  assert.ok(
    violations(s, m, "VAAYU-TR-04", "CREW-04").some((v) =>
      v.includes("Payload"),
    ),
  );
  assert.ok(
    violations(s, m, "VAAYU-TR-07", "CREW-03", 858).some((v) =>
      v.includes("not qualified"),
    ),
  );
  const a = s.aircraft[2],
    c = s.crew[2];
  c.dutyMinutes = 599;
  c.restCompleted = false;
  a.inspectionDueMinute = 900;
  a.rangeKm = 100;
  a.fuelPercent = 10;
  s.locations[0].fuelLitres = 100;
  a.components[6].status = "UNKNOWN";
  const err = violations(s, m);
  for (const text of [
    "duty limit",
    "rest",
    "Inspection",
    "Fuel shortfall",
    "Range",
    "fuel below",
    "Unknown",
  ])
    assert.ok(
      err.some((v) => v.includes(text)),
      text,
    );
});
test("weather and airspace cause conflicts and engine finds delayed windows", () => {
  let s = transition(createSeed(), {
    type: "WEATHER",
    actor: "OPERATIONS PLANNER",
  });
  assert.equal(missionStatus(s, hero(s)), "CONFLICT");
  assert.ok(
    (alternatives(s, hero(s)).find((a) => a.feasible)?.start ?? 0) >= 930,
  );
  s = transition(createSeed(), {
    type: "AIRSPACE",
    actor: "OPERATIONS PLANNER",
  });
  assert.ok(
    violations(s, hero(s)).some((v) => v.includes("Airspace restriction")),
  );
  assert.ok(
    (alternatives(s, hero(s)).find((a) => a.feasible)?.start ?? 0) >= 900,
  );
});
test("turnaround is a hard constraint even without overlapping flights", () => {
  const s = createSeed(),
    m: Mission = {
      ...hero(s),
      id: "NEW",
      aircraftId: "VAAYU-TR-01",
      crewId: "CREW-01",
      start: 970,
      originalStart: 970,
      latestStart: 1090,
      duration: 30,
    };
  assert.ok(violations(s, m).some((v) => v.includes("turnaround")));
});
test("P1 approval requires supervisor", () => {
  let s = transition(createSeed(), {
    type: "PROPOSE",
    missionId: "MED-012",
    actor: "OPERATIONS PLANNER",
  });
  assert.ok(s.proposal?.selected);
  assert.throws(() => approve(s), /Operations Supervisor/);
  s = transition(s, { type: "APPROVE", actor: "OPERATIONS SUPERVISOR" });
  assert.equal(s.proposal?.status, "APPROVED");
});
test("missing spare increases estimate and blocks work; duplicate fault cannot double reserve", () => {
  const base = createSeed();
  base.inventory[0].quantity = 3;
  const s = fault(base);
  assert.equal(s.workOrders[0].reserved, false);
  assert.equal(s.workOrders[0].estimatedMinutes, 390);
  assert.throws(
    () =>
      transition(s, {
        type: "WORK",
        workId: s.workOrders[0].id,
        actor: "MAINTENANCE OFFICER",
        notes: "Start repair",
      }),
    /spare unavailable/,
  );
  assert.throws(() => fault(s), /open work order/);
});
test("reset fully restores all seeded state after multiple disruptions and decisions", () => {
  let s = approve(propose(fault(createSeed())));
  s = transition(s, { type: "WEATHER", actor: "OPERATIONS PLANNER" });
  s = transition(s, { type: "AIRSPACE", actor: "OPERATIONS PLANNER" });
  s = transition(s, { type: "URGENT", actor: "OPERATIONS PLANNER" });
  s = transition(s, {
    type: "CREW",
    crewId: "CREW-03",
    available: false,
    actor: "CREW COORDINATOR",
  });
  assert.deepEqual(transition(s, { type: "RESET" }), createSeed());
});

test("entirely absent component records never imply aircraft safety", () => {
  const s = createSeed();
  s.aircraft[2].components = s.aircraft[2].components.filter(
    (c) => c.id !== "avionics",
  );
  assert.equal(aircraftStatus(s, s.aircraft[2]), "UNKNOWN");
  assert.ok(violations(s, hero(s)).some((v) => v.includes("missing Avionics")));
});

test("inspection-only order exposes maintenance lifecycle without consuming a spare", () => {
  const before = createSeed();
  let s = transition(before, {
    type: "OPEN_INSPECTION",
    aircraftId: "VAAYU-TR-03",
    componentId: "left-wing",
    actor: "MAINTENANCE OFFICER",
  });
  const id = s.workOrders[0].id;
  assert.equal(s.workOrders[0].inspectionOnly, true);
  assert.equal(
    s.aircraft[2].components.find((c) => c.id === "left-wing")?.status,
    "INSPECTION REQUIRED",
  );
  assert.equal(aircraftStatus(s, s.aircraft[2]), "MAINTENANCE");
  assert.equal(missionStatus(s, hero(s)), "CONFLICT");
  assert.deepEqual(s.inventory, before.inventory);
  assert.throws(() =>
    transition(s, {
      type: "OPEN_INSPECTION",
      aircraftId: "VAAYU-TR-03",
      componentId: "left-wing",
      actor: "MAINTENANCE OFFICER",
    }),
  );
  for (const stage of [
    "IN PROGRESS",
    "TASK COMPLETED",
    "VERIFIED",
    "CLEARED",
  ]) {
    s = transition(s, {
      type: "WORK",
      workId: id,
      actor: "MAINTENANCE OFFICER",
      notes: "Synthetic inspection complete; visual and record checks passed.",
    });
    assert.equal(s.workOrders[0].stage, stage);
    if (stage !== "CLEARED")
      assert.equal(aircraftStatus(s, s.aircraft[2]), "MAINTENANCE");
  }
  assert.equal(aircraftStatus(s, s.aircraft[2]), "AVAILABLE");
  assert.equal(missionStatus(s, hero(s)), "READY");
  assert.deepEqual(s.inventory, before.inventory);
  assert.ok(s.workOrders[0].clearance);
  assert.equal(
    s.alerts.find((a) => a.id === "INSPECTION-VAAYU-TR-03-left-wing")?.resolved,
    true,
  );
  assert.ok(
    s.audit.some(
      (a) =>
        a.action === "MAINTENANCE CLEARANCE" &&
        a.previous === "INSPECTION REQUIRED",
    ),
  );
});
test("only maintenance role can open inspections and faulted components keep their fault order", () => {
  const s = createSeed();
  assert.throws(() =>
    transition(s, {
      type: "OPEN_INSPECTION",
      aircraftId: "VAAYU-TR-03",
      componentId: "left-wing",
      actor: "OPERATIONS PLANNER",
    }),
  );
  const f = fault(s);
  assert.throws(() =>
    transition(f, {
      type: "OPEN_INSPECTION",
      aircraftId: "VAAYU-TR-03",
      componentId: "left-engine",
      actor: "MAINTENANCE OFFICER",
    }),
  );
  assert.equal(f.aircraft[2].components[0].status, "FAULT");
});

test("distinct airframes include two fighters with humanitarian assignment blocked", () => {
  const s = createSeed();
  assert.equal(new Set(s.aircraft.map((a) => a.airframe)).size, 5);
  const fighters = s.aircraft.filter(
    (a) => airframeFor(a).family === "FIGHTER",
  );
  assert.equal(fighters.length, 2);
  for (const a of fighters) {
    const crew = s.crew.find((c) => c.aircraftIds.includes(a.id))!;
    const m = { ...hero(s), aircraftId: a.id, crewId: crew.id, payloadKg: 0 };
    assert.ok(violations(s, m).some((v) => v.includes("not configured")));
    assert.equal(aircraftStatus(s, a), "AVAILABLE");
  }
  assert.ok(
    alternatives(fault(s), hero(s))
      .filter((a) => fighters.some((f) => f.id === a.aircraftId))
      .every((a) => !a.feasible),
  );
});
test("saved v1 scenarios gain airframes without losing faults, assignments or audit", () => {
  const original = fault(createSeed());
  const legacy = JSON.parse(JSON.stringify(original));
  legacy.schema = 1;
  legacy.aircraft = legacy.aircraft.slice(0, 12);
  legacy.crew = legacy.crew.slice(0, 16);
  legacy.aircraft.forEach((a: { airframe?: string }) => delete a.airframe);
  const migrated = migrateDemo(legacy);
  assert.equal(migrated.aircraft.length, 14);
  assert.equal(migrated.crew.length, 18);
  assert.equal(migrated.aircraft[2].components[0].status, "FAULT");
  assert.deepEqual(migrated.workOrders, original.workOrders);
  assert.deepEqual(migrated.missions, original.missions);
  assert.deepEqual(migrated.audit, original.audit);
  assert.equal(migrated.revision, original.revision + 1);
  assert.deepEqual(migrateDemo(migrated), migrated);
});
test("fighter fault enters the shared maintenance workflow without changing cargo assignments", () => {
  const before = createSeed();
  const s = transition(before, {
    type: "FAULT",
    aircraftId: "VAAYU-FJ-01",
    componentId: "left-engine",
    fault: "Synthetic EGT anomaly",
    severity: "Major",
    repairMinutes: 150,
    actor: "MAINTENANCE OFFICER",
  });
  assert.equal(aircraftStatus(s, s.aircraft[12]), "GROUNDED");
  assert.equal(s.workOrders[0].aircraftId, "VAAYU-FJ-01");
  assert.deepEqual(s.missions, before.missions);
  assert.equal(metrics(s).available, metrics(before).available - 1);
});

test("clean workspace contains no synthetic operational records and finite metrics", () => {
  const empty = createEmptyWorkspace();
  for (const records of [
    empty.aircraft,
    empty.crew,
    empty.missions,
    empty.locations,
    empty.weather,
    empty.restrictions,
    empty.workOrders,
    empty.maintenance,
    empty.inventory,
    empty.alerts,
    empty.audit,
    empty.undo,
  ])
    assert.equal(records.length, 0);
  assert.equal(empty.proposal, null);
  for (const value of Object.values(metrics(empty))) assert.equal(value, 0);
  assert.equal(createSeed().aircraft.length, 14);
});
