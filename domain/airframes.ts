import type { Aircraft } from "./types";
export type AirframeId = "a320" | "a350" | "b737" | "rafale" | "su35";
export interface AirframeSpec {
  id: AirframeId;
  name: string;
  family: "TRANSPORT" | "MEDICAL" | "FIGHTER";
  description: string;
  path: string;
  author: string;
  source: string;
  lowDetailPath?: string;
  rotation: [number, number, number];
}
const AMV = "https://github.com/amvlab/aircraft-models";
export const AIRFRAMES: Record<AirframeId, AirframeSpec> = {
  a320: {
    id: "a320",
    name: "A320 reference",
    family: "TRANSPORT",
    description: "Narrow-body transport · underwing twin engines",
    path: "/models/A320_nologo.glb",
    author: "amvlab",
    source: AMV,
    rotation: [0, Math.PI / 2, 0],
  },
  a350: {
    id: "a350",
    name: "A350 reference",
    family: "TRANSPORT",
    description: "Wide-body transport · long swept wings",
    path: "/models/A350_nologo.glb",
    author: "amvlab",
    source: AMV,
    rotation: [0, Math.PI / 2, 0],
  },
  b737: {
    id: "b737",
    name: "B737 reference",
    family: "MEDICAL",
    description: "Medical transport reference · compact swept-wing jet",
    path: "/models/B737_nologo.glb",
    author: "amvlab",
    source: AMV,
    rotation: [0, Math.PI / 2, 0],
  },
  rafale: {
    id: "rafale",
    name: "Rafale reference",
    family: "FIGHTER",
    description: "Canard-delta fighter · twin engines",
    path: "/models/rafale.glb",
    author: "andertan",
    source:
      "https://sketchfab.com/3d-models/dassault-rafale-fabb8472bc2e413282c80406b13ff1a7",
    rotation: [0, -Math.PI / 2, 0],
  },
  su35: {
    id: "su35",
    name: "Su-35 reference",
    family: "FIGHTER",
    description: "Swept-wing fighter · twin fins and engines",
    path: "/models/su35.glb",
    author: "Muhamad Mirza Arrafi",
    source:
      "https://sketchfab.com/3d-models/sukhoi-su-35-fighter-jet-ec06a0fefc3c44489aafbe9ed129b97d",
    lowDetailPath: "/models/su35-low.glb",
    rotation: [0, 0, 0],
  },
};
export function airframeFor(
  a: Pick<Aircraft, "id" | "type" | "airframe">,
): AirframeSpec {
  return AIRFRAMES[
    a.airframe ||
      (a.type === "Mercy M8"
        ? "b737"
        : a.type === "Courier T12"
          ? "a320"
          : "a350")
  ];
}
