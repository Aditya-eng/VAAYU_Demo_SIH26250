export type ComponentStatus =
  "HEALTHY" | "INSPECTION REQUIRED" | "FAULT" | "UNKNOWN" | "STALE";
export type Role =
  | "OPERATIONS PLANNER"
  | "MAINTENANCE OFFICER"
  | "CREW COORDINATOR"
  | "OPERATIONS SUPERVISOR";
export type DataMode =
  "LIVE" | "IMPORTED" | "SIMULATED" | "STALE" | "UNAVAILABLE";
export interface Provenance {
  sourceName: string;
  sourceUrl: string;
  dataMode: DataMode;
  retrievedAt: string | null;
  updatedAt: string;
  isStale: boolean;
}
export interface AircraftComponent {
  id: string;
  name: string;
  status: ComponentStatus;
  severity: "None" | "Minor" | "Major" | "Critical";
  fault: string | null;
  faultAt: string | null;
  lastInspection: string | null;
  nextInspection: string;
  hours: number;
  cycles: number;
  updatedAt: string | null;
  task: string;
  spare: string;
  repairMinutes: number;
}
export interface Aircraft {
  id: string;
  type: "Atlas T20" | "Courier T12" | "Mercy M8" | "Saker F2" | "Kestrel F4";
  airframe: import("./airframes").AirframeId;
  location: string;
  maxPayloadKg: number;
  rangeKm: number;
  fuelPercent: number;
  readyMinute: number;
  inspectionDueMinute: number;
  turnaround: number;
  components: AircraftComponent[];
}
export interface CrewMember {
  id: string;
  name: string;
  role: string;
  qualifications: Aircraft["type"][];
  aircraftIds: string[];
  available: boolean;
  dutyMinutes: number;
  maxDutyMinutes: number;
  restCompleted: boolean;
  fitness: "READY" | "UNAVAILABLE" | "UNKNOWN";
  location: string;
}
export interface Mission {
  id: string;
  name: string;
  type: string;
  priority: 1 | 2 | 3 | 4;
  aircraftId: string | null;
  crewId: string | null;
  origin: string;
  destination: string;
  payloadKg: number;
  distanceKm: number;
  fuelLitres: number;
  start: number;
  originalStart: number;
  duration: number;
  latestStart: number;
  state: "PLANNED" | "IN PROGRESS" | "COMPLETED" | "CANCELLED";
  medical: boolean;
}
export type WorkStage =
  "CREATED" | "IN PROGRESS" | "TASK COMPLETED" | "VERIFIED" | "CLEARED";
export interface WorkOrder {
  id: string;
  aircraftId: string;
  componentId: string;
  stage: WorkStage;
  task: string;
  spareId: string;
  reserved: boolean;
  estimatedMinutes: number;
  createdAt: string;
  officer: string;
  notes: string;
  inspectionResult: string | null;
  inspectionOnly?: boolean;
  clearance: {
    officer: string;
    timestamp: string;
    workPerformed: string;
    inspectionResult: string;
    notes: string;
    previousStatus: string;
    newStatus: string;
  } | null;
}
export interface MaintenanceRecord {
  id: string;
  aircraftId: string;
  componentId: string;
  timestamp: string;
  officer: string;
  work: string;
  result: string;
}
export interface InventoryItem {
  id: string;
  name: string;
  location: string;
  quantity: number;
  reserved: number;
}
export interface Location {
  id: string;
  name: string;
  short: string;
  kind: "base" | "hub" | "medical" | "relief";
  x: number;
  y: number;
  fuelLitres: number;
}
export interface WeatherCondition extends Provenance {
  id: string;
  locationId: string;
  severity: "CLEAR" | "ADVISORY" | "SEVERE";
  visibilityKm: number;
  windKts: number;
  temperatureC: number;
  condition: string;
  start: number;
  end: number;
}
export interface Restriction extends Provenance {
  id: string;
  name: string;
  origin: string;
  destination: string;
  active: boolean;
  start: number;
  end: number;
  kind: string;
}
export interface AuditEvent {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  entity: string;
  previous: string;
  next: string;
  reason: string;
  missionId: string | null;
}
export interface Alert {
  id: string;
  severity: "CRITICAL" | "WARNING" | "INFO";
  title: string;
  detail: string;
  entity: string;
  resolved: boolean;
  acknowledged: boolean;
  timestamp: string;
}
export interface Alternative {
  aircraftId: string;
  crewId: string | null;
  start: number;
  feasible: boolean;
  violations: string[];
  delay: number;
  fuelLitres: number;
  score: number;
  explanation: string[];
}
export interface Metrics {
  total: number;
  available: number;
  assigned: number;
  maintenance: number;
  inspection: number;
  grounded: number;
  unknown: number;
  missions: number;
  feasible: number;
  conflicts: number;
  critical: number;
  delay: number;
  unmet: number;
  utilisation: number;
  crewUtilisation: number;
  fuel: number;
  completed: number;
  priorityProtected: number;
}
export interface ReplanProposal {
  id: string;
  trigger: string;
  missionId: string;
  previousAssignment: {
    aircraftId: string | null;
    crewId: string | null;
    start: number;
  };
  alternatives: Alternative[];
  selected: Alternative | null;
  beforeMetrics: Metrics;
  afterMetrics: Metrics | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  revision: number;
}
export interface UndoEntry {
  missionId: string;
  previous: Mission;
  applied: Mission;
}
export interface DemoState {
  schema: 2;
  revision: number;
  aircraft: Aircraft[];
  crew: CrewMember[];
  missions: Mission[];
  workOrders: WorkOrder[];
  maintenance: MaintenanceRecord[];
  inventory: InventoryItem[];
  locations: Location[];
  weather: WeatherCondition[];
  restrictions: Restriction[];
  alerts: Alert[];
  audit: AuditEvent[];
  proposal: ReplanProposal | null;
  undo: UndoEntry[];
  updatedAt: string;
}
export type Action =
  | { type: "RESET" }
  | {
      type: "FAULT";
      aircraftId: string;
      componentId: string;
      fault: string;
      severity: AircraftComponent["severity"];
      repairMinutes: number;
      actor: Role;
      demo?: boolean;
    }
  | { type: "WORK"; workId: string; actor: Role; notes: string }
  | {
      type: "OPEN_INSPECTION";
      aircraftId: string;
      componentId: string;
      actor: Role;
    }
  | {
      type: "CREW";
      crewId: string;
      available: boolean;
      actor: Role;
      demo?: boolean;
    }
  | { type: "WEATHER" | "AIRSPACE" | "URGENT"; actor: Role }
  | { type: "PROPOSE"; missionId: string; actor: Role }
  | { type: "SELECT"; aircraftId: string; actor: Role }
  | { type: "APPROVE" | "REJECT" | "CANCEL" | "UNDO"; actor: Role }
  | {
      type: "ASSIGN";
      missionId: string;
      aircraftId: string;
      crewId: string;
      start: number;
      actor: Role;
    }
  | { type: "ACK"; alertId: string; actor: Role };
