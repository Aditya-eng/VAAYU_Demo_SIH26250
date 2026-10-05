"use client";
import { lazy, Suspense, useState } from "react";
import { Tabs as TabsPrimitive } from "radix-ui";
import {
  Box,
  RotateCcw,
  Crosshair,
  Tag,
  Layers,
  AlertTriangle,
  Wrench,
  Search,
  ShieldCheck,
  Clock,
  Package,
  ChevronRight,
} from "lucide-react";
import { useDemo } from "../domain/store";
import {
  activeMission,
  aircraftStatus,
  can,
  shortId,
  time,
} from "../domain/engine";
import {
  INSPECTION_SPECS,
  needsAttention,
  attentionReason,
} from "../domain/inspection-catalog";
import { AIRFRAMES, airframeFor } from "../domain/airframes";
import { AirframeSilhouette } from "./airframe-silhouette";
import { Badge, Panel, Field, Stamp } from "./ui-kit";
import AircraftSchematic from "./aircraft-schematic";
import type { AircraftComponent } from "../domain/types";
const SourcedAircraft = lazy(() => import("./sourced-aircraft"));
const SoftwareAircraft = lazy(() => import("./software-aircraft"));
export function Inspection({
  aircraftId,
  setAircraftId,
  openMaintenance,
  initialComponent,
}: {
  initialComponent?: string;
  aircraftId: string;
  setAircraftId: (id: string) => void;
  openMaintenance: (workId?: string) => void;
}) {
  const { state: s, role, setRole, act } = useDemo();
  const a = s.aircraft.find((x) => x.id === aircraftId) || s.aircraft[2];
  const [selected, setSelected] = useState(initialComponent || "left-engine"),
    [mode, setMode] = useState<"3D" | "2D">("3D"),
    [explode, setExplode] = useState(false),
    [labels, setLabels] = useState(true),
    [overlay, setOverlay] = useState(true),
    [focus, setFocus] = useState(0),
    [reset, setReset] = useState(0),
    [allIssues, setAllIssues] = useState(false),
    [faultForm, setFaultForm] = useState(false),
    [fault, setFault] = useState("EGT sensor anomaly"),
    [severity, setSeverity] = useState<AircraftComponent["severity"]>("Major"),
    [repair, setRepair] = useState(150);
  const c = a.components.find((x) => x.id === selected) || a.components[0],
    spec = INSPECTION_SPECS[c.id],
    w = s.workOrders.find(
      (x) =>
        x.aircraftId === a.id &&
        x.componentId === c.id &&
        x.stage !== "CLEARED",
    );
  const issues = s.aircraft.flatMap((plane) =>
      plane.components
        .filter(needsAttention)
        .map((component) => ({ plane, component })),
    ),
    attention = a.components.filter(needsAttention);
  const affected = s.missions.filter(
    (m) => m.aircraftId === a.id && activeMission(m),
  );
  function select(id: string) {
    setSelected(id);
    setFaultForm(false);
  }
  function openInspection() {
    if (
      act({
        type: "OPEN_INSPECTION",
        aircraftId: a.id,
        componentId: c.id,
        actor: role,
      })
    )
      openMaintenance();
  }
  const airframe = airframeFor(a);
  const viewProps = {
    aircraft: a,
    selected: c.id,
    select,
    explode,
    labels,
    overlay,
    focus,
    reset,
  };
  return (
    <div className="inspection-workspace">
      <div className="airframe-selector" aria-label="Airframe collection">
        {Object.values(AIRFRAMES).map((model) => {
          const plane = s.aircraft.find((x) => x.airframe === model.id);
          return plane ? (
            <button
              key={model.id}
              className={airframe.id === model.id ? "active" : ""}
              onClick={() => {
                setAircraftId(plane.id);
                setExplode(false);
              }}
              aria-pressed={airframe.id === model.id}
            >
              <AirframeSilhouette model={model.id} />
              <span>
                <small>{model.family}</small>
                <strong>{model.name.replace(" reference", "")}</strong>
                <em>{plane.id}</em>
              </span>
            </button>
          ) : null;
        })}
      </div>
      <div className="airframe-command">
        <div>
          <span className="eyebrow">AIRCRAFT / COMPONENT READINESS</span>
          <div className="row">
            <select
              aria-label="Aircraft to inspect"
              value={a.id}
              onChange={(e) => {
                setAircraftId(e.target.value);
                select("left-engine");
              }}
            >
              {s.aircraft.map((x) => (
                <option key={x.id}>{x.id}</option>
              ))}
            </select>
            <Badge status={aircraftStatus(s, a)} />
          </div>
        </div>
        <div className="inspection-count">
          <b>{attention.length.toString().padStart(2, "0")}</b>
          <span>
            components require
            <br />
            attention
          </span>
        </div>
        <div className="inspection-count">
          <b>{affected.length.toString().padStart(2, "0")}</b>
          <span>
            active mission
            <br />
            assignments
          </span>
        </div>
        <button className="btn" onClick={() => openMaintenance(w?.id)}>
          <Wrench size={16} />
          Maintenance workspace
        </button>
      </div>
      <div className="airframe-workspace">
        <aside className="component-queue">
          <div className="work-queue-title">
            <span>INSPECTION REGISTER</span>
            <b>08</b>
          </div>
          <div className="queue-filters">
            <button
              className={!allIssues ? "active" : ""}
              onClick={() => setAllIssues(false)}
            >
              This aircraft
            </button>
            <button
              className={allIssues ? "active" : ""}
              onClick={() => setAllIssues(true)}
            >
              Fleet issues · {issues.length}
            </button>
          </div>
          {allIssues
            ? issues.map(({ plane, component }) => (
                <button
                  key={plane.id + component.id}
                  className={`component-row ${a.id === plane.id && c.id === component.id ? "active" : ""}`}
                  onClick={() => {
                    setAircraftId(plane.id);
                    select(component.id);
                  }}
                >
                  <span>
                    <b>{shortId(plane.id)}</b>
                    <ChevronRight size={12} />
                  </span>
                  <strong>{component.name}</strong>
                  <Badge status={component.status} />
                </button>
              ))
            : a.components.map((part, i) => (
                <button
                  key={part.id}
                  className={`component-row ${c.id === part.id ? "active" : ""}`}
                  onClick={() => select(part.id)}
                  aria-pressed={c.id === part.id}
                >
                  <span>
                    <b>{String(i + 1).padStart(2, "0")}</b>
                    {INSPECTION_SPECS[part.id].zone}
                  </span>
                  <strong>{part.name}</strong>
                  <Badge status={part.status} />
                </button>
              ))}
        </aside>
        <section className="airframe-view">
          <div className="airframe-view-heading">
            <div>
              <span className="eyebrow">
                {explode ? "COMPONENT ASSEMBLY" : "AIRFRAME REFERENCE"}
              </span>
              <h2>
                {shortId(a.id)} <span>/ {a.type}</span>
              </h2>
            </div>
            <div className="segmented">
              <button
                className={mode === "3D" ? "active" : ""}
                onClick={() => setMode("3D")}
              >
                3D INSPECTION
              </button>
              <button
                className={mode === "2D" ? "active" : ""}
                onClick={() => setMode("2D")}
              >
                2D SYSTEMS
              </button>
            </div>
          </div>
          <div
            className={`aircraft-canvas ${mode === "2D" ? "system-mode" : ""}`}
          >
            <div className="airframe-ruler">
              <span>PORT</span>
              <span>INSPECTION ZONES / {labels ? "VISIBLE" : "HIDDEN"}</span>
              <span>STARBOARD</span>
            </div>
            {mode === "2D" ? (
              <AircraftSchematic aircraft={a} selected={c.id} select={select} />
            ) : (
              <Suspense
                fallback={
                  <div className="empty">Loading aircraft geometry…</div>
                }
              >
                {explode ? (
                  <SoftwareAircraft {...viewProps} />
                ) : (
                  <SourcedAircraft key={airframe.id} {...viewProps} />
                )}
              </Suspense>
            )}
            <div className="zone-caption">
              <span>
                {String(a.components.indexOf(c) + 1).padStart(2, "0")} /{" "}
                {spec.zone}
              </span>
              <strong>{c.name}</strong>
              <Badge status={c.status} />
            </div>
          </div>
          <div className="stage-tools">
            <button
              onClick={() => setFocus((v) => v + 1)}
              disabled={mode === "2D"}
            >
              <Crosshair size={15} />
              Focus zone
            </button>
            <button
              onClick={() => setReset((v) => v + 1)}
              disabled={mode === "2D"}
            >
              <RotateCcw size={15} />
              Reset
            </button>
            <button
              className={labels ? "selected" : ""}
              onClick={() => setLabels(!labels)}
              disabled={mode === "2D"}
            >
              <Tag size={15} />
              Markers
            </button>
            <button
              className={overlay ? "selected" : ""}
              onClick={() => setOverlay(!overlay)}
              disabled={mode === "2D"}
            >
              <Layers size={15} />
              Inspection overlay
            </button>
            <button
              className={explode ? "selected" : ""}
              onClick={() => setExplode(!explode)}
              disabled={mode === "2D"}
            >
              <Box size={15} />
              {explode ? "Airframe model" : "Exploded view"}
            </button>
          </div>
          <div className="asset-caption">
            {explode ? (
              "Illustrative component assembly · not an exploded manufacturer drawing."
            ) : (
              <>
                {airframe.name} by{" "}
                <a href={airframe.source} target="_blank" rel="noreferrer">
                  {airframe.author}
                </a>{" "}
                · CC BY 4.0 · representative airframe
              </>
            )}
            <span>
              {airframe.description} · Zones and all condition records are
              simulated.{" "}
              {airframe.family === "FIGHTER"
                ? "Fighter inspection demo; not configured for relief transport."
                : ""}
            </span>
          </div>
          <TabsPrimitive.Root className="inspection-tabs" defaultValue="scope">
            <TabsPrimitive.List aria-label="Component information">
              {[
                ["scope", "Inspection points"],
                ["records", "Records"],
                ["impact", "Mission impact"],
              ].map(([value, label]) => (
                <TabsPrimitive.Trigger key={value} value={value}>
                  {label}
                </TabsPrimitive.Trigger>
              ))}
            </TabsPrimitive.List>
            <TabsPrimitive.Content value="scope">
              <div className="scope-heading">
                <span>{spec.system}</span>
                <b>{spec.points.length} inspection points</b>
              </div>
              {spec.points.map((p, i) => (
                <div className="scope-point" key={p}>
                  <b>0{i + 1}</b>
                  <span>{p}</span>
                  <span className="scope-state">
                    {needsAttention(c) ? "REVIEW REQUIRED" : "CHECK RECORDED"}
                  </span>
                </div>
              ))}
              <p className="task-disclaimer">
                Generic demonstration scope. Not an approved maintenance
                procedure or real inspection result.
              </p>
            </TabsPrimitive.Content>
            <TabsPrimitive.Content value="records">
              <dl className="component-details">
                <div>
                  <dt>Last inspection</dt>
                  <dd>
                    <Stamp value={c.lastInspection} />
                  </dd>
                </div>
                <div>
                  <dt>Next inspection</dt>
                  <dd>
                    <Stamp value={c.nextInspection} />
                  </dd>
                </div>
                <div>
                  <dt>Hours / cycles</dt>
                  <dd>
                    {c.hours.toLocaleString()} h / {c.cycles}
                  </dd>
                </div>
                <div>
                  <dt>Data status</dt>
                  <dd>
                    {c.updatedAt
                      ? c.status === "STALE"
                        ? "STALE · 19h"
                        : "SIMULATED"
                      : "UNKNOWN"}
                  </dd>
                </div>
              </dl>
              {s.maintenance
                .filter((h) => h.aircraftId === a.id && h.componentId === c.id)
                .map((h) => (
                  <div className="record-item" key={h.id}>
                    <b>{h.result}</b>
                    <p>{h.work}</p>
                    <small>
                      {h.officer} · <Stamp value={h.timestamp} />
                    </small>
                  </div>
                ))}
            </TabsPrimitive.Content>
            <TabsPrimitive.Content value="impact">
              {affected.length ? (
                affected.map((m) => (
                  <div key={m.id} className="scope-point">
                    <b>{m.id}</b>
                    <span>{m.name}</span>
                    <span>
                      {time(m.start)} · {m.payloadKg / 1000} t
                    </span>
                  </div>
                ))
              ) : (
                <p>No active assignments for this aircraft.</p>
              )}
            </TabsPrimitive.Content>
          </TabsPrimitive.Root>
        </section>
        <aside className="inspection-task">
          <div className="task-heading">
            <span className="eyebrow">SELECTED COMPONENT</span>
            <h2>{c.name}</h2>
            <Badge status={c.status} />
          </div>
          <div
            className={`task-finding ${needsAttention(c) ? "attention" : ""}`}
          >
            <AlertTriangle size={17} />
            <div>
              <b>{attentionReason(c)}</b>
              <small>
                {w
                  ? `${w.id} · ${w.stage}`
                  : c.status === "HEALTHY"
                    ? "You can request an inspection or record a new finding."
                    : "Review the inspection scope before creating a work order."}
              </small>
            </div>
          </div>
          <div className="task-section">
            <h3>
              <Wrench size={15} />
              Required action
            </h3>
            <p>{c.status === "FAULT" ? c.task : spec.action}</p>
          </div>
          <div className="task-section">
            <h3>
              <Package size={15} />
              Resources & equipment
            </h3>
            {spec.equipment.map((item) => (
              <div className="equipment-item" key={item}>
                <span>{item}</span>
                <small>
                  {s.inventory.find(
                    (i) =>
                      i.name.toLowerCase() === item.toLowerCase() &&
                      i.location === a.location,
                  )
                    ? `${s.inventory.find((i) => i.name.toLowerCase() === item.toLowerCase() && i.location === a.location)!.quantity} in stock`
                    : "Officer check"}
                </small>
              </div>
            ))}
          </div>
          <div className="task-section task-duration">
            <Clock size={16} />
            <span>Estimated work window</span>
            <b>
              {c.status === "FAULT"
                ? `${Math.floor(c.repairMinutes / 60)}h ${c.repairMinutes % 60}m`
                : "45m"}
            </b>
          </div>
          {!can(role, "maintenance") && (
            <div className="inspection-role">
              <span>Record findings as a Maintenance Officer.</span>
              <button onClick={() => setRole("MAINTENANCE OFFICER")}>
                Enable maintenance controls
              </button>
            </div>
          )}
          {w ? (
            <button
              className="btn primary full"
              onClick={() => openMaintenance(w.id)}
            >
              <Wrench size={16} />
              {w.stage === "CREATED"
                ? "Open & start maintenance"
                : "Continue work order"}{" "}
              · {w.id}
            </button>
          ) : (
            <button
              className="btn primary full"
              disabled={!can(role, "maintenance")}
              onClick={openInspection}
            >
              <ShieldCheck size={16} />
              Create inspection work order
            </button>
          )}
          <button
            className="btn full"
            disabled={!can(role, "maintenance") || !!w}
            onClick={() => setFaultForm(!faultForm)}
          >
            <AlertTriangle size={15} />
            Record component fault
          </button>
          {faultForm && (
            <form
              className="fault-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (
                  act({
                    type: "FAULT",
                    aircraftId: a.id,
                    componentId: c.id,
                    fault,
                    severity,
                    repairMinutes: repair,
                    actor: role,
                  })
                )
                  setFaultForm(false);
              }}
            >
              <Field label="Recorded finding">
                <textarea
                  required
                  value={fault}
                  onChange={(e) => setFault(e.target.value)}
                />
              </Field>
              <Field label="Severity">
                <select
                  value={severity}
                  onChange={(e) =>
                    setSeverity(e.target.value as AircraftComponent["severity"])
                  }
                >
                  {["Minor", "Major", "Critical"].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </Field>
              <Field label="Estimated repair · minutes">
                <input
                  type="number"
                  min="1"
                  max="1440"
                  required
                  value={repair}
                  onChange={(e) => setRepair(Number(e.target.value))}
                />
              </Field>
              <button className="btn danger-btn full" type="submit">
                Record fault & ground aircraft
              </button>
            </form>
          )}
          <p className="task-disclaimer">
            Maintenance clearance is required before return to service. Status
            changes update scheduling and mission conflicts.
          </p>
        </aside>
      </div>
    </div>
  );
}
export function Fleet({ inspect }: { inspect: (id: string) => void }) {
  const { state: s } = useDemo(),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState("ALL"),
    [family, setFamily] = useState("ALL");
  const list = s.aircraft.filter(
    (a) =>
      (a.id + " " + a.type).toLowerCase().includes(query.toLowerCase()) &&
      (filter === "ALL" || aircraftStatus(s, a) === filter) &&
      (family === "ALL" || airframeFor(a).family === family),
  );
  return (
    <>
      <div className="fleet-families">
        {["ALL", "TRANSPORT", "MEDICAL", "FIGHTER"].map((f) => (
          <button
            key={f}
            onClick={() => setFamily(f)}
            className={f === family ? "active" : ""}
          >
            {f === "ALL"
              ? "All aircraft"
              : f === "FIGHTER"
                ? "Fighter jets"
                : f === "MEDICAL"
                  ? "Medical"
                  : "Transport"}
            <b>
              {
                s.aircraft.filter(
                  (a) => f === "ALL" || airframeFor(a).family === f,
                ).length
              }
            </b>
          </button>
        ))}
      </div>
      <div className="toolbar">
        <label className="search">
          <Search size={17} />
          <input
            placeholder="Search aircraft or type"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <select
          aria-label="Fleet status"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          {[
            "ALL",
            "AVAILABLE",
            "ASSIGNED",
            "GROUNDED",
            "INSPECTION DUE",
            "UNKNOWN",
          ].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <span className="muted">{list.length} aircraft</span>
      </div>
      <div className="fleet-grid">
        {list.map((a) => (
          <Panel key={a.id} className="aircraft-card">
            <div className="row between">
              <span className="aircraft-type">{a.type}</span>
              <Badge status={aircraftStatus(s, a)} />
            </div>
            <div className="aircraft-card-symbol">
              <AirframeSilhouette model={airframeFor(a).id} />
              <span>
                {airframeFor(a).name}
                <small>{airframeFor(a).description}</small>
              </span>
            </div>
            <h2>{a.id}</h2>
            <p className="muted">Relief Base Alpha · Fictional aircraft</p>
            <div className="aircraft-specs">
              <div>
                <span>Payload</span>
                <b>
                  {airframeFor(a).family === "FIGHTER"
                    ? "Not configured"
                    : `${a.maxPayloadKg / 1000} t`}
                </b>
              </div>
              <div>
                <span>Fuel</span>
                <b>{a.fuelPercent}%</b>
              </div>
              <div>
                <span>Range</span>
                <b>{a.rangeKm} km</b>
              </div>
            </div>
            <div className="component-health-bars">
              {a.components.map((c) => (
                <span
                  key={c.id}
                  title={`${c.name}: ${c.status}`}
                  className={c.status.toLowerCase().replaceAll(" ", "-")}
                />
              ))}
            </div>
            <div className="row between">
              <span className="muted">
                {a.components.filter((c) => c.status === "HEALTHY").length}/8
                systems healthy
              </span>
              <button className="btn primary" onClick={() => inspect(a.id)}>
                <Box size={15} />
                Inspect aircraft
              </button>
            </div>
          </Panel>
        ))}
      </div>
      {!list.length && (
        <div className="empty">No aircraft match these filters.</div>
      )}
    </>
  );
}
