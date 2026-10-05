"use client";
import { useState } from "react";
import {
  Wrench,
  Search,
  Clock,
  Package,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { useDemo } from "../domain/store";
import { activeMission, can, shortId } from "../domain/engine";
import { INSPECTION_SPECS } from "../domain/inspection-catalog";
import { Badge, Panel, Stamp, Empty } from "./ui-kit";
import { MaintenanceConsole } from "./maintenance-console";
export function Maintenance({
  initialWorkId,
  inspect,
}: {
  initialWorkId?: string;
  inspect: (id: string, component?: string) => void;
}) {
  const { state: s, role, setRole, act } = useDemo();
  const [selected, setSelected] = useState(
      initialWorkId ||
        s.workOrders.find((w) => w.stage === "CREATED")?.id ||
        s.workOrders[0]?.id,
    ),
    [filter, setFilter] = useState("OPEN"),
    [query, setQuery] = useState(""),
    [notes, setNotes] = useState<Record<string, string>>({});
  const list = s.workOrders.filter(
    (w) =>
      (filter === "ALL" ||
        (filter === "OPEN" ? w.stage !== "CLEARED" : w.stage === "CLEARED")) &&
      (w.id + " " + w.aircraftId + " " + w.task)
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const w = s.workOrders.find((w) => w.id === selected) || list[0],
    a = s.aircraft.find((a) => a.id === w?.aircraftId),
    c = a?.components.find((c) => c.id === w?.componentId),
    spare = s.inventory.find(
      (i) => i.id === w?.spareId && i.location === a?.location,
    );
  const ready =
    !!w?.inspectionOnly ||
    !!w?.reserved ||
    !!(spare && spare.quantity - spare.reserved > 0);
  const spec = c ? INSPECTION_SPECS[c.id] : null;
  return (
    <div className="maintenance-workspace">
      <div className="maintenance-summary">
        <div>
          <Wrench size={18} />
          <strong>
            {s.workOrders.filter((w) => w.stage !== "CLEARED").length}
          </strong>
          <span>Open work orders</span>
        </div>
        <div>
          <Clock size={18} />
          <strong>
            {s.workOrders.filter((w) => w.stage === "IN PROGRESS").length}
          </strong>
          <span>In maintenance</span>
        </div>
        <div>
          <ShieldCheck size={18} />
          <strong>
            {
              s.workOrders.filter(
                (w) => w.stage === "TASK COMPLETED" || w.stage === "VERIFIED",
              ).length
            }
          </strong>
          <span>Awaiting sign-off</span>
        </div>
        <div>
          <Package size={18} />
          <strong>
            {
              s.workOrders.filter(
                (w) =>
                  !w.inspectionOnly && !w.reserved && w.stage !== "CLEARED",
              ).length
            }
          </strong>
          <span>Parts bottlenecks</span>
        </div>
      </div>
      <div className="maintenance-layout">
        <aside className="work-queue">
          <div className="work-queue-title">
            <span>WORK QUEUE</span>
            <b>{list.length.toString().padStart(2, "0")}</b>
          </div>
          <label className="work-search">
            <Search size={15} />
            <input
              aria-label="Find work order"
              placeholder="Find aircraft or work order"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <div className="queue-filters">
            {["OPEN", "CLEARED", "ALL"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={filter === f ? "active" : ""}
              >
                {f}
              </button>
            ))}
          </div>
          {list.map((item) => (
            <button
              key={item.id}
              className={`queue-order ${item.id === w?.id ? "active" : ""}`}
              onClick={() => setSelected(item.id)}
            >
              <span>
                <b>{item.id}</b>
                <ChevronRight size={14} />
              </span>
              <strong>{shortId(item.aircraftId)}</strong>
              <small>
                {
                  s.aircraft
                    .find((a) => a.id === item.aircraftId)
                    ?.components.find((c) => c.id === item.componentId)?.name
                }
              </small>
              <Badge status={item.stage} />
            </button>
          ))}
          {!list.length && <Empty title="No matching work orders" />}
        </aside>
        <div className="work-detail">
          {w && a && c && spec ? (
            <>
              <MaintenanceConsole
                key={w.id + ":" + w.stage}
                id={w.id}
                aircraft={a.id}
                component={c.name}
                task={w.task}
                stage={w.stage}
                canEdit={can(role, "maintenance")}
                onEnable={() => setRole("MAINTENANCE OFFICER")}
                onInspect={() => inspect(a.id, c.id)}
                notes={notes[w.id] || ""}
                onNotes={(value) => setNotes({ ...notes, [w.id]: value })}
                blocked={
                  !ready
                    ? "Awaiting required spare delivery. This order cannot advance."
                    : undefined
                }
                clearance={
                  w.clearance
                    ? `${w.clearance.officer} · ${new Date(w.clearance.timestamp).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST`
                    : undefined
                }
                items={[
                  {
                    name: w.inspectionOnly
                      ? "Inspection-only work order"
                      : spare?.name || c.spare,
                    detail: w.inspectionOnly
                      ? "No replacement spare is required to begin inspection."
                      : `${w.stage === "CLEARED" ? "1 unit consumed" : w.reserved ? "1 unit reserved" : `${Math.max(0, (spare?.quantity || 0) - (spare?.reserved || 0))} unreserved units`} · ${s.locations.find((l) => l.id === a.location)?.name}`,
                    ready,
                  },
                  {
                    name: spec.equipment[0],
                    detail:
                      "Demo equipment checklist · availability must be verified by the officer",
                    ready: true,
                  },
                  {
                    name: `Estimated downtime · ${Math.floor(w.estimatedMinutes / 60)}h ${w.estimatedMinutes % 60}m`,
                    detail:
                      w.stage === "CLEARED"
                        ? "Clearance recorded; scheduling eligibility revalidated"
                        : "Aircraft stays unavailable until recorded clearance",
                    ready: true,
                  },
                ]}
                checks={
                  w.stage === "TASK COMPLETED"
                    ? [
                        "Functional verification result reviewed",
                        "Inspection findings resolved or escalated",
                        "Serviceability evidence recorded",
                      ]
                    : spec.points
                }
                onAdvance={() => {
                  if (
                    act({
                      type: "WORK",
                      workId: w.id,
                      actor: role,
                      notes:
                        notes[w.id]?.trim() ||
                        (w.stage === "CREATED"
                          ? "Maintenance started; work order and required resources acknowledged."
                          : ""),
                    })
                  )
                    setNotes({ ...notes, [w.id]: "" });
                }}
              />
              <div className="work-context">
                <Panel title="Operational impact">
                  <p>
                    {s.missions
                      .filter((m) => m.aircraftId === a.id && activeMission(m))
                      .map((m) => m.id)
                      .join(", ") || "No active mission assigned"}{" "}
                    ·{" "}
                    {w.stage === "CLEARED"
                      ? "Clearance recorded; scheduling constraints revalidated."
                      : "Aircraft withheld until maintenance clearance."}
                  </p>
                </Panel>
                <Panel title="Work order record">
                  <p>{w.notes}</p>
                  <p className="muted">
                    {w.officer} · <Stamp value={w.createdAt} />
                  </p>
                </Panel>
              </div>
            </>
          ) : (
            <Empty title="Select a maintenance work order" />
          )}
        </div>
      </div>
      <Panel title="Recorded maintenance history">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Recorded</th>
                <th>Aircraft / component</th>
                <th>Work performed</th>
                <th>Officer</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {s.maintenance.map((h) => (
                <tr key={h.id}>
                  <td>
                    <Stamp value={h.timestamp} />
                  </td>
                  <td>
                    {shortId(h.aircraftId)}
                    <small>{h.componentId}</small>
                  </td>
                  <td>{h.work}</td>
                  <td>{h.officer}</td>
                  <td>{h.result}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
