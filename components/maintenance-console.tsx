"use client";
import { useState } from "react";
import "./maintenance-console.css";
export interface ConsoleProps {
  id: string;
  aircraft: string;
  component: string;
  task: string;
  stage: string;
  items: { name: string; detail: string; ready: boolean }[];
  checks: string[];
  notes: string;
  onNotes: (v: string) => void;
  onAdvance: () => void;
  onEnable: () => void;
  onInspect: () => void;
  canEdit: boolean;
  blocked?: string;
  clearance?: string;
}
const STEPS = [
  "CREATED",
  "IN PROGRESS",
  "TASK COMPLETED",
  "VERIFIED",
  "CLEARED",
];
export function MaintenanceConsole(p: ConsoleProps) {
  const [checked, setChecked] = useState<string[]>([]);
  const index = STEPS.indexOf(p.stage);
  const requiresChecks = index === 1 || index === 2;
  const label =
    index === 0
      ? "Start maintenance"
      : index === 1
        ? "Complete maintenance task"
        : index === 2
          ? "Record passed verification"
          : "Issue maintenance clearance";
  const ready = !requiresChecks || p.checks.every((x) => checked.includes(x));
  return (
    <section className="mx-console">
      <header className="mx-heading">
        <div>
          <span className="mx-kicker">MAINTENANCE / {p.id}</span>
          <h2>{p.component}</h2>
          <p>
            {p.aircraft} <span>·</span> {p.task}
          </p>
        </div>
        <span className="mx-status">{p.stage}</span>
      </header>
      <ol className="mx-steps">
        {["Open", "Maintenance", "Verification", "Clearance", "In service"].map(
          (s, i) => (
            <li key={s} className={i <= index ? "done" : ""}>
              <b>{i < index ? "✓" : `0${i + 1}`}</b>
              <span>{s}</span>
            </li>
          ),
        )}
      </ol>
      <div className="mx-body">
        <div>
          <div className="mx-section-heading">
            <span>01</span>
            <h3>Required resources</h3>
          </div>
          <div className="mx-resources">
            {p.items.map((item) => (
              <div key={item.name}>
                <span className={item.ready ? "mx-ok" : "mx-warn"}>
                  {item.ready ? "✓" : "!"}
                </span>
                <div>
                  <strong>{item.name}</strong>
                  <small>{item.detail}</small>
                </div>
              </div>
            ))}
          </div>
          <div className="mx-section-heading">
            <span>02</span>
            <h3>
              {index === 2 ? "Verification checklist" : "Inspection scope"}
            </h3>
          </div>
          <div className="mx-checks">
            {p.checks.map((c, i) => (
              <label key={c}>
                <input
                  type="checkbox"
                  checked={index >= 3 || checked.includes(c)}
                  disabled={!p.canEdit || index >= 3}
                  onChange={(e) =>
                    setChecked(
                      e.target.checked
                        ? [...checked, c]
                        : checked.filter((x) => x !== c),
                    )
                  }
                />
                <span>
                  <b>{String(i + 1).padStart(2, "0")}</b>
                  {c}
                </span>
              </label>
            ))}
          </div>
          <p className="mx-disclaimer">
            Synthetic task scope for this demonstration. Use approved aircraft
            documentation for real maintenance.
          </p>
        </div>
        <aside className="mx-action">
          <div className="mx-section-heading">
            <span>03</span>
            <h3>Next action</h3>
          </div>
          {index === 4 ? (
            <div className="mx-cleared">
              <b>✓ Clearance recorded</b>
              <p>{p.clearance}</p>
            </div>
          ) : (
            <>
              {!p.canEdit ? (
                <div className="mx-role">
                  <strong>Maintenance role required</strong>
                  <p>
                    You’re viewing a demo role. Enable the Maintenance Officer
                    controls to record work.
                  </p>
                  <button type="button" onClick={p.onEnable}>
                    Use Maintenance Officer role
                  </button>
                </div>
              ) : (
                <p className="mx-role-ready">
                  ✓ Maintenance Officer controls enabled
                </p>
              )}
              <label className="mx-notes">
                {index === 0
                  ? "Start note"
                  : index === 2
                    ? "Verification result"
                    : index === 3
                      ? "Clearance statement"
                      : "Work performed"}
                <textarea
                  value={p.notes}
                  onChange={(e) => p.onNotes(e.target.value)}
                  placeholder={
                    index === 0
                      ? "A start note is recorded automatically. Add details if needed."
                      : "Describe the work or verification performed…"
                  }
                />
              </label>
              {p.blocked && <p className="mx-blocked">{p.blocked}</p>}
              {p.canEdit && requiresChecks && !ready && (
                <p className="mx-hint">
                  Complete the {p.checks.length} checks before advancing.
                </p>
              )}
              {p.canEdit && index > 0 && !p.notes.trim() && (
                <p className="mx-hint">Add a recorded note to continue.</p>
              )}
              <button
                className="mx-primary"
                disabled={
                  !p.canEdit ||
                  !!p.blocked ||
                  !ready ||
                  (index > 0 && !p.notes.trim())
                }
                onClick={() => {
                  p.onAdvance();
                  setChecked([]);
                }}
              >
                {label}
              </button>
              <p className="mx-lock">
                Aircraft remains unavailable until verification and clearance
                are recorded.
              </p>
            </>
          )}
          <button className="mx-secondary" onClick={p.onInspect}>
            Locate component on aircraft
          </button>
        </aside>
      </div>
    </section>
  );
}
