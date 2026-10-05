"use client";
import { airframeFor } from "../domain/airframes";
import type { Aircraft } from "../domain/types";
const COLORS: Record<string, string> = {
  HEALTHY: "#75b69d",
  "INSPECTION REQUIRED": "#d4a854",
  FAULT: "#e1857a",
  UNKNOWN: "#8192a1",
  STALE: "#8192a1",
};
const SHAPES: Record<string, string> = {
  fuselage:
    "M287 72 Q310 25 333 72 L338 323 Q333 365 310 402 Q287 365 282 323 Z",
  "left-wing": "M285 152 L66 250 L66 281 L285 230 Z",
  "right-wing": "M335 152 L554 250 L554 281 L335 230 Z",
  "left-engine": "M190 177 Q204 157 218 177 L218 241 Q204 253 190 241 Z",
  "right-engine": "M402 177 Q416 157 430 177 L430 241 Q416 253 402 241 Z",
  "landing-gear":
    "M276 279 L291 279 L291 323 L276 323 Z M329 279 L344 279 L344 323 L329 323 Z M303 112 L317 112 L317 132 L303 132 Z",
  avionics: "M293 80 Q310 57 327 80 L331 98 L289 98 Z",
  tail: "M299 330 L209 373 L209 390 L310 370 L411 390 L411 373 L321 330 Z",
};
const LABELS: Record<string, [number, number]> = {
  "left-engine": [147, 159],
  "right-engine": [468, 159],
  "left-wing": [105, 305],
  "right-wing": [515, 305],
  fuselage: [310, 232],
  avionics: [310, 35],
  "landing-gear": [310, 345],
  tail: [310, 429],
};
export default function AircraftSchematic({
  aircraft,
  selected,
  select,
}: {
  aircraft: Aircraft;
  selected: string;
  select: (id: string) => void;
}) {
  const fighter = airframeFor(aircraft).family === "FIGHTER";
  const delta = aircraft.airframe === "rafale";
  const shapes = fighter
    ? {
        ...SHAPES,
        fuselage:
          "M310 45 Q323 75 327 135 L338 295 L330 375 L290 375 L282 295 L293 135 Q297 75 310 45 Z",
        "left-wing": delta
          ? "M292 145 L135 305 L285 290 Z M294 128 L239 155 L238 174 L292 157 Z"
          : "M289 171 L134 263 L142 296 L286 260 Z",
        "right-wing": delta
          ? "M328 145 L485 305 L335 290 Z M326 128 L381 155 L382 174 L328 157 Z"
          : "M331 171 L486 263 L478 296 L334 260 Z",
        "left-engine": "M280 234 L302 234 L302 376 L277 376 Z",
        "right-engine": "M318 234 L340 234 L343 376 L318 376 Z",
        avionics: "M306 86 Q310 65 314 86 L321 135 L299 135 Z",
        tail: delta
          ? "M307 310 L313 310 L319 382 L301 382 Z"
          : "M277 304 L242 367 L280 357 L289 313 Z M343 304 L378 367 L340 357 L331 313 Z",
      }
    : SHAPES;
  const labels: Record<string, [number, number]> = fighter
    ? {
        ...LABELS,
        "left-engine": [197, 348],
        "right-engine": [423, 348],
        "landing-gear": [310, 399],
      }
    : LABELS;
  return (
    <svg
      className="aircraft-schematic"
      viewBox="0 0 620 460"
      role="group"
      aria-label="Selectable 2D aircraft schematic"
    >
      {[
        "fuselage",
        "left-wing",
        "right-wing",
        "left-engine",
        "right-engine",
        "landing-gear",
        "tail",
        "avionics",
      ].map((id) => {
        const c = aircraft.components.find((c) => c.id === id);
        if (!c) return null;
        const [x, y] = labels[id],
          symbol =
            c.status === "HEALTHY"
              ? "✓"
              : c.status === "FAULT"
                ? "×"
                : c.status === "UNKNOWN" || c.status === "STALE"
                  ? "?"
                  : "!";
        return (
          <g key={id}>
            <path
              d={shapes[id]}
              fill={COLORS[c.status]}
              fillOpacity={selected === id ? 0.6 : 0.22}
              stroke={selected === id ? "#5689b7" : COLORS[c.status]}
              strokeWidth={selected === id ? 2.5 : 1.5}
              onClick={() => select(id)}
              className="schematic-part"
            />
            <g
              role="button"
              tabIndex={0}
              aria-label={`${c.name}, ${c.status}`}
              onClick={() => select(id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  select(id);
                }
              }}
              className="schematic-part"
            >
              <rect
                x={x - 65}
                y={y - 14}
                width="130"
                height="27"
                rx="4"
                fill="#192329"
                stroke={selected === id ? "#b7d871" : "#405258"}
              />
              <text
                x={x}
                y={y + 4}
                textAnchor="middle"
                fill="#dce6e7"
                fontSize="12"
              >
                {symbol} {c.name.replace(" / control surfaces", "")}
              </text>
            </g>
          </g>
        );
      })}
    </svg>
  );
}
