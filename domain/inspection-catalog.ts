import type { AircraftComponent } from "./types";
export interface InspectionSpec {
  zone: string;
  system: string;
  points: string[];
  equipment: string[];
  action: string;
}
export const INSPECTION_SPECS: Record<string, InspectionSpec> = {
  "left-engine": {
    zone: "ENG / PORT",
    system: "Propulsion · engine 1",
    points: [
      "EGT sensor condition and recorded readings",
      "Sensor harness and connector condition",
      "Nacelle, intake and visible fluid leakage",
    ],
    equipment: [
      "Diagnostic test set",
      "EGT sensor assembly",
      "Connector inspection kit",
    ],
    action: "Inspect sensor assembly and record a functional verification",
  },
  "right-engine": {
    zone: "ENG / STARBOARD",
    system: "Propulsion · engine 2",
    points: [
      "EGT sensor condition and recorded readings",
      "Sensor harness and connector condition",
      "Nacelle, intake and visible fluid leakage",
    ],
    equipment: [
      "Diagnostic test set",
      "EGT sensor assembly",
      "Connector inspection kit",
    ],
    action: "Inspect sensor assembly and record a functional verification",
  },
  "left-wing": {
    zone: "WNG / PORT",
    system: "Airframe · left wing",
    points: [
      "Leading-edge and surface condition",
      "Visible flap and aileron condition",
      "Panel fasteners and access covers",
    ],
    equipment: ["Airframe inspection kit", "Work platform"],
    action: "Record surface and control-surface inspection findings",
  },
  "right-wing": {
    zone: "WNG / STARBOARD",
    system: "Airframe · right wing",
    points: [
      "Leading-edge and surface condition",
      "Visible flap and aileron condition",
      "Panel fasteners and access covers",
    ],
    equipment: ["Airframe inspection kit", "Work platform"],
    action: "Record surface and control-surface inspection findings",
  },
  "landing-gear": {
    zone: "GEAR / LOWER",
    system: "Undercarriage",
    points: [
      "Tyres, wheels and visible brake condition",
      "Strut condition and leakage indications",
      "Recorded extension/retraction verification",
    ],
    equipment: ["Gear inspection kit", "Hydraulic seal kit"],
    action: "Inspect undercarriage and record verification",
  },
  fuselage: {
    zone: "BODY / CENTRE",
    system: "Airframe · fuselage",
    points: [
      "External skin and visible panel condition",
      "Doors, seals and access-panel condition",
      "Recorded structural inspection status",
    ],
    equipment: ["Airframe inspection kit", "Work platform"],
    action: "Document airframe findings and inspection result",
  },
  avionics: {
    zone: "AVN / FORWARD",
    system: "Electrical & avionics",
    points: [
      "Built-in test report availability",
      "Connector and harness condition",
      "Instrument and warning-system verification record",
    ],
    equipment: ["Avionics test set", "Avionics module"],
    action: "Review diagnostic results and record the verification",
  },
  tail: {
    zone: "EMP / AFT",
    system: "Empennage & flight controls",
    points: [
      "Stabiliser and control-surface condition",
      "Visible hinges, linkages and fairings",
      "Recorded control-system verification",
    ],
    equipment: ["Airframe inspection kit", "Control actuator"],
    action: "Inspect aft control surfaces and document verification",
  },
};
export function needsAttention(c: AircraftComponent) {
  return c.status !== "HEALTHY";
}
export function attentionReason(c: AircraftComponent) {
  return c.status === "FAULT"
    ? c.fault || "Active fault"
    : c.status === "INSPECTION REQUIRED"
      ? "Scheduled inspection required"
      : c.status === "UNKNOWN"
        ? "Inspection record missing"
        : c.status === "STALE"
          ? "Inspection record is stale"
          : "No open inspection finding";
}
