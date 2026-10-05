import type {
  Aircraft,
  AircraftComponent,
  DemoState,
  Mission,
  Provenance,
} from "./types";
export const DEMO_DATE = "2026-10-02";
export const DEMO_NOW = 810;
export const COMPONENTS = [
  ["left-engine", "Left engine"],
  ["right-engine", "Right engine"],
  ["left-wing", "Left wing"],
  ["right-wing", "Right wing"],
  ["landing-gear", "Landing gear"],
  ["fuselage", "Fuselage"],
  ["avionics", "Avionics"],
  ["tail", "Tail / control surfaces"],
];
export const SOURCES = [
  {
    name: "Smart India Hackathon",
    url: "https://www.sih.gov.in/",
    mode: "UNAVAILABLE",
    description:
      "Problem context only. The complete official SIH26250 brief has not been independently verified.",
  },
  {
    name: "IMD Aviation Meteorological Services",
    url: "https://mausam.imd.gov.in/imd_latest/contents/meteorological-services-civil-aviation.php",
    mode: "SIMULATED",
    description:
      "Public reference context. All weather displayed in VAAYU is generated demo data.",
  },
  {
    name: "AAI Aeronautical Information Management",
    url: "https://aim-india.aai.aero/",
    mode: "SIMULATED",
    description:
      "Public reference context. No authorised live aeronautical feed is connected.",
  },
  {
    name: "AAI NOTAM summaries",
    url: "https://aim-india.aai.aero/notam-summaries",
    mode: "SIMULATED",
    description:
      "All restrictions are fictional, NOTAM-style examples. No real NOTAM ingestion.",
  },
];
export function provenance(kind: "weather" | "airspace"): Provenance {
  const s = SOURCES[kind === "weather" ? 1 : 3];
  return {
    sourceName: s.name,
    sourceUrl: s.url,
    dataMode: "SIMULATED",
    retrievedAt: null,
    updatedAt: "2026-10-02T13:30:00+05:30",
    isStale: false,
  };
}
export function createSeed(): DemoState {
  const stamp = "2026-10-02T13:30:00+05:30";
  const aircraft: Aircraft[] = Array.from({ length: 14 }, (_, i) => {
    const n = i + 1,
      id =
        n > 12
          ? `VAAYU-FJ-0${n - 12}`
          : n === 8
            ? "VAAYU-MED-01"
            : `VAAYU-TR-${String(n).padStart(2, "0")}`;
    const components: AircraftComponent[] = COMPONENTS.map(
      ([cid, name], j) => ({
        id: cid,
        name,
        status: "HEALTHY",
        severity: "None",
        fault: null,
        faultAt: null,
        lastInspection: "2026-09-22T10:00:00+05:30",
        nextInspection: "2026-10-03T08:00:00+05:30",
        hours: 820 + n * 121 + j * 14,
        cycles: 280 + n * 16,
        updatedAt: stamp,
        task: cid.includes("engine")
          ? "Inspect and replace EGT sensor assembly"
          : `Inspect and service ${name.toLowerCase()}`,
        spare: cid.includes("engine") ? "EGT" : "KIT",
        repairMinutes: 150,
      }),
    );
    if (n >= 9 && n <= 11)
      Object.assign(components[0], {
        status: "FAULT",
        severity: "Major",
        fault: "Scheduled component replacement",
        faultAt: stamp,
      });
    if (n === 12) {
      components[6].status = "UNKNOWN";
      components[6].lastInspection = null;
      components[6].updatedAt = null;
      components[7].status = "STALE";
      components[7].updatedAt = "2026-10-01T18:30:00+05:30";
    }
    if (n === 4) components[4].status = "INSPECTION REQUIRED";
    return {
      id,
      type:
        n === 13
          ? "Saker F2"
          : n === 14
            ? "Kestrel F4"
            : n === 8
              ? "Mercy M8"
              : n === 4
                ? "Courier T12"
                : "Atlas T20",
      airframe:
        n === 13
          ? "rafale"
          : n === 14
            ? "su35"
            : n === 8
              ? "b737"
              : n === 4 || n === 1
                ? "a320"
                : "a350",
      location: "alpha",
      maxPayloadKg: n > 12 ? 0 : n === 4 ? 12000 : n === 8 ? 8000 : 22000,
      rangeKm: n === 8 ? 1100 : 2300,
      fuelPercent: 85 - i * 2,
      readyMinute: n === 6 ? 887 : n === 7 ? 858 : 480,
      inspectionDueMinute: n === 4 ? 850 : 1800,
      turnaround: 45,
      components,
    };
  });
  const crew = Array.from({ length: 16 }, (_, i) => ({
    id: `CREW-${String(i + 1).padStart(2, "0")}`,
    name:
      [
        "Arin Mehta",
        "Tara Rao",
        "Kabir Sen",
        "Mira Das",
        "Dev Kapoor",
        "Nila Shah",
        "Rohan Iyer",
        "Zoya Bose",
        "Ishan Roy",
        "Avni Sethi",
        "Reva Nair",
        "Om Verma",
        "Aadi Khanna",
        "Lina Batra",
        "Neel Suri",
        "Riya Anand",
      ][i] + " · Demo",
    role:
      i < 12
        ? "Flight commander + certified flight team"
        : "Reserve flight team",
    qualifications: [aircraft[Math.min(i, 11)].type],
    aircraftIds: [aircraft[Math.min(i, 11)].id],
    available: i !== 4,
    dutyMinutes: 120 + (i % 4) * 35,
    maxDutyMinutes: 600,
    restCompleted: i !== 14,
    fitness: i === 4 ? ("UNAVAILABLE" as const) : ("READY" as const),
    location: "alpha",
  }));
  for (const [index, a] of aircraft.slice(12).entries())
    crew.push({
      ...crew[0],
      id: `CREW-${17 + index}`,
      name: `${index === 0 ? "Rin Vale" : "Ira Sen"} · Demo`,
      qualifications: [a.type],
      aircraftIds: [a.id],
      dutyMinutes: 90,
    });
  const mission = (
    id: string,
    n: number,
    start: number,
    duration: number,
    priority: 1 | 2 | 3 | 4,
    payload: number,
    destination: string,
    name: string,
    state: Mission["state"] = "PLANNED",
  ): Mission => ({
    id,
    name,
    type:
      priority === 1
        ? "Medical evacuation"
        : priority === 2
          ? "Disaster relief"
          : priority === 3
            ? "Food & water relief"
            : "Humanitarian logistics",
    priority,
    aircraftId: aircraft[n - 1].id,
    crewId: crew[n - 1].id,
    origin: "alpha",
    destination,
    payloadKg: payload,
    distanceKm: destination === "delta" ? 680 : 420,
    fuelLitres: destination === "delta" ? 4200 : 2800,
    start,
    originalStart: start,
    duration,
    latestStart: start + 120,
    state,
    medical: priority === 1,
  });
  const missions = [
    mission(
      "RLF-204",
      3,
      840,
      120,
      2,
      18000,
      "delta",
      "Critical relief supplies",
    ),
    mission(
      "MED-012",
      8,
      870,
      75,
      1,
      2400,
      "charlie",
      "Emergency medical evacuation",
    ),
    mission(
      "RLF-201",
      1,
      810,
      150,
      3,
      16500,
      "bravo",
      "Food & water distribution",
    ),
    mission(
      "LOG-108",
      2,
      825,
      135,
      4,
      15000,
      "echo",
      "Shelter kits & logistics",
    ),
    mission(
      "MED-009",
      8,
      480,
      75,
      1,
      2100,
      "charlie",
      "Patient transfer",
      "COMPLETED",
    ),
    mission(
      "RLF-198",
      3,
      510,
      90,
      2,
      17000,
      "delta",
      "Rapid response personnel",
      "COMPLETED",
    ),
    mission(
      "RLF-199",
      1,
      510,
      105,
      3,
      12000,
      "bravo",
      "Essential provisions",
      "COMPLETED",
    ),
    mission(
      "LOG-104",
      2,
      510,
      120,
      4,
      14500,
      "echo",
      "Relief hub replenishment",
      "COMPLETED",
    ),
    mission(
      "RLF-202",
      4,
      600,
      75,
      3,
      9000,
      "bravo",
      "Potable water transport",
      "COMPLETED",
    ),
    mission(
      "MED-014",
      8,
      1080,
      80,
      1,
      2200,
      "charlie",
      "Medical supply transport",
    ),
    mission(
      "RLF-208",
      1,
      1110,
      120,
      2,
      18000,
      "delta",
      "Disaster response teams",
    ),
    mission(
      "LOG-112",
      2,
      1120,
      110,
      4,
      14000,
      "echo",
      "Humanitarian logistics",
    ),
  ];
  const locations: DemoState["locations"] = [
    {
      id: "alpha",
      name: "Relief Base Alpha",
      short: "ALPHA",
      kind: "base",
      x: 23,
      y: 65,
      fuelLitres: 120000,
    },
    {
      id: "bravo",
      name: "Logistics Hub Bravo",
      short: "BRAVO",
      kind: "hub",
      x: 47,
      y: 27,
      fuelLitres: 42000,
    },
    {
      id: "charlie",
      name: "Medical Centre Charlie",
      short: "CHARLIE",
      kind: "medical",
      x: 73,
      y: 63,
      fuelLitres: 18000,
    },
    {
      id: "delta",
      name: "Relief Zone Delta",
      short: "DELTA",
      kind: "relief",
      x: 65,
      y: 19,
      fuelLitres: 10000,
    },
    {
      id: "echo",
      name: "Operations Base Echo",
      short: "ECHO",
      kind: "base",
      x: 84,
      y: 36,
      fuelLitres: 64000,
    },
  ];
  return {
    schema: 2,
    revision: 0,
    aircraft,
    crew,
    missions,
    locations,
    workOrders: [9, 10, 11].map((n, i) => ({
      id: `MX-${201 + i}`,
      aircraftId: aircraft[n - 1].id,
      componentId: "left-engine",
      stage: i === 0 ? "IN PROGRESS" : i === 1 ? "TASK COMPLETED" : "CREATED",
      task: "Scheduled EGT sensor replacement",
      spareId: "EGT",
      reserved: true,
      estimatedMinutes: 150,
      createdAt: stamp,
      officer: "Demo maintenance team",
      notes: "Scheduled servicing",
      inspectionResult: null,
      clearance: null,
    })),
    maintenance: Array.from({ length: 8 }, (_, i) => ({
      id: `HIST-${i + 1}`,
      aircraftId: aircraft[i].id,
      componentId: COMPONENTS[i][0],
      timestamp: "2026-09-22T10:00:00+05:30",
      officer: "Demo maintenance officer",
      work: "Routine inspection and functional test",
      result: "PASS",
    })),
    inventory: [
      {
        id: "EGT",
        name: "EGT sensor assembly",
        location: "alpha",
        quantity: 4,
        reserved: 3,
      },
      {
        id: "KIT",
        name: "Airframe service kit",
        location: "alpha",
        quantity: 8,
        reserved: 0,
      },
      {
        id: "TYRE",
        name: "Landing gear tyre",
        location: "alpha",
        quantity: 2,
        reserved: 0,
      },
      {
        id: "AVIONICS",
        name: "Avionics module",
        location: "bravo",
        quantity: 0,
        reserved: 0,
      },
    ],
    weather: locations.map((l, i) => ({
      ...provenance("weather"),
      id: `WX-${i + 1}`,
      locationId: l.id,
      severity: i === 3 ? "ADVISORY" : "CLEAR",
      visibilityKm: i === 3 ? 6 : 12,
      windKts: i === 3 ? 18 : 8 + i,
      temperatureC: 27 - i,
      condition: i === 3 ? "Light rain" : "Clear skies",
      start: 480,
      end: 1200,
    })),
    restrictions: [
      {
        ...provenance("airspace"),
        id: "DEMO-N-01",
        name: "Northern relief corridor closure",
        origin: "bravo",
        destination: "delta",
        active: true,
        start: 840,
        end: 1020,
        kind: "Temporary closure",
      },
      {
        ...provenance("airspace"),
        id: "DEMO-N-02",
        name: "Eastern altitude limitation",
        origin: "charlie",
        destination: "echo",
        active: true,
        start: 900,
        end: 1100,
        kind: "Route unavailable in demo",
      },
    ],
    alerts: [
      {
        id: "AL-STALE",
        severity: "WARNING",
        title: "Component information incomplete",
        detail:
          "TR-12 avionics unknown; tail record is 19 hours old. Aircraft withheld from scheduling.",
        entity: "VAAYU-TR-12",
        resolved: false,
        acknowledged: false,
        timestamp: stamp,
      },
      {
        id: "AL-INSP",
        severity: "WARNING",
        title: "Landing gear inspection due",
        detail: "TR-04 inspection expires at 14:10 IST.",
        entity: "VAAYU-TR-04",
        resolved: false,
        acknowledged: false,
        timestamp: stamp,
      },
    ],
    audit: Array.from({ length: 12 }, (_, i) => ({
      id: `AUD-SEED-${i}`,
      timestamp: `2026-10-02T${String(8 + Math.floor(i / 3)).padStart(2, "0")}:${String(i * 4).padStart(2, "0")}:00+05:30`,
      actor: i % 2 ? "Operations planner · Demo" : "System",
      action: i < 8 ? "MISSION SCHEDULED" : "PRE-FLIGHT VALIDATION",
      entity: missions[i].id,
      previous: "PLANNED",
      next: i < 8 ? "READY" : "CHECKED",
      reason: "Synthetic scenario initialisation",
      missionId: missions[i].id,
    })).reverse(),
    proposal: null,
    undo: [],
    updatedAt: stamp,
  };
}
