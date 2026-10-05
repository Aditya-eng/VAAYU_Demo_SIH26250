"use client";
import { useState } from "react";
import {
  CalendarDays,
  Undo2,
  WandSparkles,
  AlertTriangle,
  Check,
  ChevronRight,
  GitCompareArrows,
  ShieldCheck,
  Plane,
  SlidersHorizontal,
  X,
  Info,
} from "lucide-react";
import { useDemo } from "../domain/store";
import {
  activeMission,
  can,
  metrics,
  missionStatus,
  projected,
  shortId,
  time,
  violations,
} from "../domain/engine";
import type { Mission, Metrics } from "../domain/types";
import { Badge, Panel, Field, Empty } from "./ui-kit";
export function Schedule({ openReplan }: { openReplan: (id: string) => void }) {
  const { state: s, role, act } = useDemo(),
    [selected, setSelected] = useState("RLF-204"),
    [manual, setManual] = useState(false),
    [aircraft, setAircraft] = useState("VAAYU-TR-03"),
    [crew, setCrew] = useState("CREW-03"),
    [departure, setDeparture] = useState("14:00");
  const m = s.missions.find((x) => x.id === selected) ?? s.missions[0],
    errors = violations(s, m),
    [h, min] = departure.split(":").map(Number),
    start = h * 60 + min,
    manualErrors = violations(s, m, aircraft, crew, start);
  function modify(m: Mission) {
    setAircraft(m.aircraftId ?? s.aircraft[0].id);
    setCrew(m.crewId ?? s.crew[0].id);
    setDeparture(time(m.start));
    setManual(true);
  }
  return (
    <>
      <div className="toolbar">
        <div className="row">
          <CalendarDays size={19} />
          <strong>02 October 2026</strong>
          <Badge status="SIMULATED" />
        </div>
        <span className="muted">
          All times IST · 45 min turnaround enforced
        </span>
        <button
          className="btn"
          disabled={!s.undo.length || !can(role, "plan")}
          onClick={() => act({ type: "UNDO", actor: role })}
        >
          <Undo2 size={15} />
          Undo last change
        </button>
      </div>
      <Panel className="schedule-panel">
        <div className="timeline-scroll">
          <div className="timeline">
            <div className="timeline-head">
              <span>AIRCRAFT / DEMO FLEET</span>
              <div>
                {Array.from({ length: 8 }, (_, i) => (
                  <span key={i} style={{ left: `${(i * 100) / 7}%` }}>
                    {time(480 + i * 120)}
                  </span>
                ))}
              </div>
            </div>
            {s.aircraft.map((a) => (
              <div className="timeline-row" key={a.id}>
                <div className="timeline-aircraft">
                  <Plane size={16} />
                  <div>
                    <strong>{shortId(a.id)}</strong>
                    <small>{a.type}</small>
                  </div>
                </div>
                <div className="timeline-track">
                  <div
                    className="now-line"
                    style={{ left: `${((810 - 480) / 840) * 100}%` }}
                  />
                  {s.missions
                    .filter(
                      (m) => m.aircraftId === a.id && m.state !== "CANCELLED",
                    )
                    .map((m) => (
                      <button
                        key={m.id}
                        className={`mission-block ${missionStatus(s, m).toLowerCase().replaceAll(" ", "-")} ${selected === m.id ? "selected" : ""}`}
                        style={{
                          left: `${((m.start - 480) / 840) * 100}%`,
                          width: `${(m.duration / 840) * 100}%`,
                        }}
                        onClick={() => {
                          setSelected(m.id);
                          setManual(false);
                        }}
                        aria-label={`${m.id}, ${shortId(a.id)}, ${time(m.start)}, ${missionStatus(s, m)}`}
                      >
                        <strong>{m.id}</strong>
                        <span>
                          {time(m.start)} · P{m.priority}
                        </span>
                      </button>
                    ))}
                  {s.workOrders
                    .filter(
                      (w) => w.aircraftId === a.id && w.stage !== "CLEARED",
                    )
                    .map((w) => (
                      <div
                        key={w.id}
                        className="maintenance-block"
                        style={{
                          left: `${(330 / 840) * 100}%`,
                          width: `${(Math.min(w.estimatedMinutes, 450) / 840) * 100}%`,
                        }}
                      >
                        {w.id} · MAINTENANCE
                      </div>
                    ))}
                  {a.inspectionDueMinute < 1320 && (
                    <div
                      className="inspection-marker"
                      style={{
                        left: `${((a.inspectionDueMinute - 480) / 840) * 100}%`,
                      }}
                      title={`Inspection due ${time(a.inspectionDueMinute)}`}
                    >
                      !
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="timeline-legend">
          <span>
            <i className="dot cyan" />
            Ready / scheduled
          </span>
          <span>
            <i className="dot red" />
            Conflict
          </span>
          <span>
            <i className="dot amber" />
            Maintenance / inspection
          </span>
          <span>
            <i className="dot grey" />
            Completed
          </span>
          <span>│ Demo clock 13:30</span>
        </div>
      </Panel>
      <Panel
        title={`${m.id} · ${m.name}`}
        action={<Badge status={missionStatus(s, m)} />}
      >
        <div className="mission-detail-row">
          <div>
            <span>Assigned aircraft</span>
            <strong>{m.aircraftId ?? "Unassigned"}</strong>
          </div>
          <div>
            <span>Crew team</span>
            <strong>{m.crewId ?? "Unassigned"}</strong>
          </div>
          <div>
            <span>Payload / priority</span>
            <strong>
              {m.payloadKg / 1000} t / P{m.priority}
            </strong>
          </div>
          <div>
            <span>Departure / arrival</span>
            <strong>
              {time(m.start)} / {time(m.start + m.duration)}
            </strong>
          </div>
          <div>
            <span>Latest departure</span>
            <strong>{time(m.latestStart)} IST</strong>
          </div>
        </div>
        {activeMission(m) && errors.length > 0 && (
          <div className="callout danger">
            <AlertTriangle size={20} />
            <div>
              <strong>ASSIGNMENT INFEASIBLE</strong>
              {errors.map((x) => (
                <p key={x}>{x}</p>
              ))}
            </div>
          </div>
        )}
        {activeMission(m) && (
          <div className="row">
            <button
              className="btn primary"
              disabled={!can(role, "plan")}
              onClick={() => openReplan(m.id)}
            >
              <WandSparkles size={16} />
              Find alternatives
            </button>
            <button
              className="btn"
              disabled={!can(role, "plan")}
              onClick={() => modify(m)}
            >
              <SlidersHorizontal size={16} />
              Modify assignment
            </button>
            {m.priority === 1 && (
              <small className="muted">
                P1 changes require Operations Supervisor approval
              </small>
            )}
          </div>
        )}
        {manual && (
          <div className="manual-form">
            <h3>Manual assignment</h3>
            <div className="three-fields">
              <Field label="Aircraft">
                <select
                  value={aircraft}
                  onChange={(e) => {
                    setAircraft(e.target.value);
                    const c = s.crew.find((c) =>
                      c.aircraftIds.includes(e.target.value),
                    );
                    setCrew(c?.id ?? s.crew[0].id);
                  }}
                >
                  {s.aircraft.map((a) => (
                    <option key={a.id}>{a.id}</option>
                  ))}
                </select>
              </Field>
              <Field label="Crew">
                <select value={crew} onChange={(e) => setCrew(e.target.value)}>
                  {s.crew.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.id} · {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Departure (IST)">
                <input
                  type="time"
                  value={departure}
                  onChange={(e) => setDeparture(e.target.value)}
                  required
                />
              </Field>
            </div>
            {manualErrors.length ? (
              <div className="validation-errors">
                {manualErrors.map((x) => (
                  <p key={x}>
                    <X size={14} />
                    {x}
                  </p>
                ))}
              </div>
            ) : (
              <p className="success-line">
                <Check size={15} />
                All hard constraints satisfied
              </p>
            )}
            <div className="row">
              <button
                className="btn primary"
                disabled={!!manualErrors.length || !Number.isFinite(start)}
                onClick={() => {
                  if (
                    act({
                      type: "ASSIGN",
                      missionId: m.id,
                      aircraftId: aircraft,
                      crewId: crew,
                      start,
                      actor: role,
                    })
                  )
                    setManual(false);
                }}
              >
                Approve manual assignment
              </button>
              <button className="btn" onClick={() => setManual(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </Panel>
      <Panel title="Mission register">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Mission</th>
                <th>Purpose</th>
                <th>Aircraft</th>
                <th>Payload</th>
                <th>Departure</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {s.missions.map((m) => (
                <tr key={m.id}>
                  <td className="mono">{m.id}</td>
                  <td>{m.name}</td>
                  <td>{shortId(m.aircraftId)}</td>
                  <td>{m.payloadKg / 1000} t</td>
                  <td>{time(m.start)}</td>
                  <td>
                    <Badge status={missionStatus(s, m)} />
                  </td>
                  <td>
                    <button
                      className="text-btn"
                      onClick={() => {
                        setSelected(m.id);
                        setManual(false);
                      }}
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
const COMPARE: [keyof Metrics, string, string?][] = [
  ["conflicts", "Conflicted missions"],
  ["feasible", "Feasible active missions"],
  ["delay", "Total departure delay", " min"],
  ["unmet", "Unmet requests"],
  ["utilisation", "Aircraft time utilisation", "%"],
  ["crewUtilisation", "Crew teams allocated", "%"],
  ["fuel", "Feasible mission fuel", " L"],
  ["completed", "Already completed missions"],
  ["priorityProtected", "P1 / P2 missions protected"],
];
export function Replanning({ initialMission }: { initialMission: string }) {
  const { state: s, role, act } = useDemo(),
    [missionId, setMissionId] = useState(initialMission || "RLF-204"),
    [why, setWhy] = useState(true);
  const p = s.proposal,
    m =
      s.missions.find(
        (x) => x.id === (p?.status === "PENDING" ? p.missionId : missionId),
      ) ?? s.missions[0],
    selected = p?.selected;
  const before = metrics(s),
    after =
      p?.status === "PENDING" && selected
        ? metrics(
            projected(
              s,
              s.missions.find((x) => x.id === p.missionId)!,
              selected,
            ),
          )
        : p?.afterMetrics;
  const stale = p?.status === "PENDING" && p.revision !== s.revision;
  return (
    <>
      <div className="workflow-strip">
        {[
          "Detect disruption",
          "Check constraints",
          "Compare alternatives",
          "Human approval",
          "Apply plan",
        ].map((label, i) => (
          <div
            key={label}
            className={p?.status === "APPROVED" || (p && i < 3) ? "done" : ""}
          >
            <span>
              {p?.status === "APPROVED" || (p && i < 3) ? (
                <Check size={13} />
              ) : (
                i + 1
              )}
            </span>
            {label}
            {i < 4 && <ChevronRight size={15} />}
          </div>
        ))}
      </div>
      <div className="toolbar">
        <Field label="Mission to replan">
          <select
            value={missionId}
            onChange={(e) => setMissionId(e.target.value)}
          >
            {s.missions.filter(activeMission).map((x) => (
              <option key={x.id} value={x.id}>
                {x.id} · {x.name} · {missionStatus(s, x)}
              </option>
            ))}
          </select>
        </Field>
        <button
          className="btn primary"
          disabled={!can(role, "plan")}
          onClick={() => act({ type: "PROPOSE", missionId, actor: role })}
        >
          <WandSparkles size={17} />
          {p ? "Regenerate alternatives" : "Generate alternatives"}
        </button>
        <button
          className="btn"
          disabled={!s.undo.length || !can(role, "plan")}
          onClick={() => act({ type: "UNDO", actor: role })}
        >
          <Undo2 size={16} />
          Undo applied plan
        </button>
      </div>
      {!p ? (
        <Panel>
          <Empty
            title="Ready to find a better assignment"
            detail="Select a mission and generate alternatives. Every option is checked against aircraft, crew, fuel, maintenance, weather and airspace constraints."
          />
        </Panel>
      ) : (
        <>
          <div className="callout warning">
            <Info size={20} />
            <div>
              <strong>
                {p.missionId} · {p.trigger}
              </strong>
              <p>
                {stale
                  ? "Operational state has changed. Regenerate before approval."
                  : p.status === "APPROVED"
                    ? "Approved plan applied across schedule, fleet, dashboard and map."
                    : "Proposal only — current assignments remain in force until approved."}
              </p>
            </div>
            <Badge status={p.status} />
          </div>
          <div className="replan-layout">
            <div>
              <Panel
                title="Recommended assignment"
                sub="Deterministic constraint checks · lowest feasible score"
                action={<ShieldCheck size={21} />}
              >
                {selected ? (
                  <>
                    <div className="recommended">
                      <div className="recommend-icon">
                        <Plane size={31} />
                      </div>
                      <div>
                        <span className="eyebrow">
                          {selected.aircraftId ===
                          p.alternatives.find((a) => a.feasible)?.aircraftId
                            ? "LOWEST OPERATIONAL IMPACT"
                            : "MANUAL ALTERNATIVE"}
                        </span>
                        <h2>{selected.aircraftId}</h2>
                        <p>
                          {selected.crewId} · departure {time(selected.start)}{" "}
                          IST
                        </p>
                      </div>
                      <div className="delay-number">
                        +{selected.delay}
                        <span>minutes delay</span>
                      </div>
                    </div>
                    <button className="text-btn" onClick={() => setWhy(!why)}>
                      {why ? "Hide reasoning" : "Why this option?"}
                    </button>
                    {why && (
                      <div className="reason-grid">
                        {selected.explanation.map((x) => (
                          <div key={x}>
                            <Check size={15} />
                            {x}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="score-rule">
                      <strong>Score {selected.score}</strong>
                      <span>
                        Delay × (5 − priority) + fuel (kL) + existing workload
                        (hours) + inspection risk
                      </span>
                      <small>
                        Lower is better. Hard constraints are checked before
                        scoring. Scores compare assignments for this mission;
                        this is not a global fleet optimiser.
                      </small>
                    </div>
                  </>
                ) : (
                  <Empty
                    title="No feasible assignment found"
                    detail="All options violate at least one hard constraint. Resolve a constraint or adjust the mission window; approval is blocked."
                  />
                )}
              </Panel>
              <Panel
                title="Aircraft alternatives"
                sub="Each aircraft's earliest feasible option within the mission window"
              >
                <div className="alternatives">
                  {p.alternatives.map((a) => (
                    <div
                      className={`alternative ${selected?.aircraftId === a.aircraftId ? "selected" : ""}`}
                      key={a.aircraftId}
                    >
                      <div className="row between">
                        <strong>{shortId(a.aircraftId)}</strong>
                        <Badge status={a.feasible ? "READY" : "REJECTED"} />
                      </div>
                      {a.feasible ? (
                        <>
                          <p>
                            +{a.delay} min · {time(a.start)} departure · score{" "}
                            {a.score}
                          </p>
                          <p className="muted">
                            {a.crewId} · {a.fuelLitres.toLocaleString()} L fuel
                          </p>
                          <button
                            className="btn"
                            disabled={
                              p.status !== "PENDING" ||
                              !can(role, "plan") ||
                              stale
                            }
                            onClick={() =>
                              act({
                                type: "SELECT",
                                aircraftId: a.aircraftId,
                                actor: role,
                              })
                            }
                          >
                            {selected?.aircraftId === a.aircraftId
                              ? "Selected"
                              : "Modify: select this option"}
                          </button>
                        </>
                      ) : (
                        <ul>
                          {a.violations.map((v) => (
                            <li key={v}>{v}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
            <div>
              <Panel
                title="Before / after"
                sub="Calculated from the shared operational state"
                action={<GitCompareArrows size={20} />}
              >
                <table className="comparison">
                  <thead>
                    <tr>
                      <th>Metric</th>
                      <th>Current</th>
                      <th>Proposed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARE.map(([key, label, suffix]) => (
                      <tr key={key}>
                        <td>{label}</td>
                        <td>
                          {(p.status === "PENDING"
                            ? before[key]
                            : p.beforeMetrics[key]
                          ).toLocaleString()}
                          {suffix}
                        </td>
                        <td
                          className={
                            after && after[key] !== p.beforeMetrics[key]
                              ? "cyan-text"
                              : ""
                          }
                        >
                          {after
                            ? after[key].toLocaleString() + (suffix ?? "")
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="table-note">
                  Utilisation uses a 12-hour planning day. Completed flights are
                  historical; proposed flights are not counted as completed.
                </p>
              </Panel>
              <Panel title="Approval gate" className="approval-panel">
                <ShieldCheck size={30} />
                <h3>
                  {p.status === "APPROVED"
                    ? "Plan approved"
                    : "Human decision required"}
                </h3>
                <p>
                  {m.priority === 1
                    ? "P1 emergency: an Operations Supervisor must approve this change."
                    : "An Operations Planner or Supervisor must approve the replacement assignment."}
                </p>
                <div className="assignment-change">
                  <span>{shortId(p.previousAssignment.aircraftId)}</span>
                  <ChevronRight size={16} />
                  <strong>{shortId(selected?.aircraftId ?? null)}</strong>
                </div>
                <button
                  className="btn primary full"
                  disabled={
                    p.status !== "PENDING" ||
                    !selected ||
                    stale ||
                    !can(role, m.priority === 1 ? "priority" : "plan")
                  }
                  onClick={() => act({ type: "APPROVE", actor: role })}
                >
                  <Check size={17} />
                  Approve Replan
                </button>
                <div className="two-fields">
                  <button
                    className="btn"
                    disabled={p.status !== "PENDING" || !can(role, "plan")}
                    onClick={() => act({ type: "REJECT", actor: role })}
                  >
                    Reject
                  </button>
                  <button
                    className="btn"
                    disabled={p.status !== "PENDING" || !can(role, "plan")}
                    onClick={() => act({ type: "CANCEL", actor: role })}
                  >
                    Cancel
                  </button>
                </div>
                <small>
                  Every approval, rejection, modification and undo is recorded
                  in the audit history.
                </small>
              </Panel>
            </div>
          </div>
        </>
      )}
    </>
  );
}
