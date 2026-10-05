"use client";
import { Users, Fuel, Package, AlertTriangle } from "lucide-react";
import { useDemo } from "../domain/store";
import { activeMission, can, shortId, time } from "../domain/engine";
import { Badge, Panel } from "./ui-kit";
export { Maintenance } from "./maintenance-workspace";
export function Crew() {
  const { state: s, role, act } = useDemo();
  return (
    <>
      <div className="callout">
        <Users size={20} />
        <p>
          Fictional crew teams. Each record represents a qualified flight team
          led by the named synthetic commander. Readiness changes immediately
          revalidate assigned missions.
        </p>
      </div>
      <Panel
        title="Crew readiness"
        sub="Qualification, duty allowance and rest are hard scheduling constraints"
      >
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Crew / commander</th>
                <th>Qualification</th>
                <th>Assigned missions</th>
                <th>Duty allowance</th>
                <th>Rest / fitness</th>
                <th>Availability</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {s.crew.map((c) => {
                const missions = s.missions.filter(
                    (m) => activeMission(m) && m.crewId === c.id,
                  ),
                  duty =
                    c.dutyMinutes +
                    missions.reduce((v, m) => v + m.duration, 0);
                return (
                  <tr key={c.id}>
                    <td>
                      <strong>{c.id}</strong>
                      <small>{c.name}</small>
                    </td>
                    <td>
                      {c.qualifications.join(", ")}
                      <small>{c.aircraftIds.map(shortId).join(", ")}</small>
                    </td>
                    <td>
                      {missions
                        .map((m) => `${m.id} ${time(m.start)}`)
                        .join(", ") || "Reserve / no assignment"}
                    </td>
                    <td>
                      <strong>
                        {(duty / 60).toFixed(1)} / {c.maxDutyMinutes / 60} h
                      </strong>
                      <div className="progress">
                        <i
                          style={{
                            width: `${(duty / c.maxDutyMinutes) * 100}%`,
                          }}
                        />
                      </div>
                      <small>
                        {Math.max(0, c.maxDutyMinutes - duty)} min remaining
                      </small>
                    </td>
                    <td>
                      {c.restCompleted ? "Rest completed" : "Rest incomplete"}
                      <small>{c.fitness}</small>
                    </td>
                    <td>
                      <Badge
                        status={
                          c.available &&
                          c.restCompleted &&
                          c.fitness === "READY"
                            ? "READY"
                            : "UNAVAILABLE"
                        }
                      />
                    </td>
                    <td>
                      <button
                        className="btn small"
                        disabled={!can(role, "crew")}
                        onClick={() =>
                          act({
                            type: "CREW",
                            crewId: c.id,
                            available: !c.available,
                            actor: role,
                          })
                        }
                      >
                        Mark {c.available ? "unavailable" : "available"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
      {!can(role, "crew") && (
        <p className="permission-note">
          View as Crew Coordinator to manage availability. Qualification and
          duty limits remain enforced.
        </p>
      )}
    </>
  );
}
export function Inventory() {
  const { state: s } = useDemo();
  return (
    <>
      <div className="inventory-layout">
        <Panel
          title="Base fuel allocation"
          sub="Synthetic litres · allocation derived from scheduled missions"
          action={<Fuel size={20} />}
        >
          <div className="fuel-list">
            {s.locations.map((l) => {
              const required = s.missions
                .filter(
                  (m) => activeMission(m) && m.aircraftId && m.origin === l.id,
                )
                .reduce((v, m) => v + m.fuelLitres, 0);
              return (
                <div className="fuel-base" key={l.id}>
                  <div className="row between">
                    <strong>{l.name}</strong>
                    <Badge
                      status={
                        required > l.fuelLitres ? "CONFLICT" : "AVAILABLE"
                      }
                    />
                  </div>
                  <div className="fuel-number">
                    {(l.fuelLitres / 1000).toFixed(1)}
                    <span>k L available</span>
                  </div>
                  <div className="progress">
                    <i
                      style={{
                        width: `${Math.min(100, (required / l.fuelLitres) * 100)}%`,
                      }}
                    />
                  </div>
                  <div className="row between muted">
                    <span>{required.toLocaleString()} L allocated</span>
                    <span>
                      {(l.fuelLitres - required).toLocaleString()} L unallocated
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
        <div>
          <Panel
            title="Maintenance inventory"
            sub="Reservations occur when faults create work orders"
            action={<Package size={20} />}
          >
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Stock</th>
                    <th>Reserved</th>
                    <th>Free</th>
                  </tr>
                </thead>
                <tbody>
                  {s.inventory.map((i) => (
                    <tr key={i.id}>
                      <td>
                        <strong>{i.name}</strong>
                        <small>
                          {s.locations.find((l) => l.id === i.location)?.name}
                        </small>
                      </td>
                      <td>{i.quantity}</td>
                      <td>{i.reserved}</td>
                      <td
                        className={
                          i.quantity - i.reserved <= 1 ? "amber-text" : ""
                        }
                      >
                        {i.quantity - i.reserved}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
          <Panel title="Resource bottlenecks">
            <div className="attention-list">
              {s.inventory
                .filter((i) => i.quantity - i.reserved <= 1)
                .map((i) => (
                  <div className="attention-item" key={i.id}>
                    <AlertTriangle size={19} className="amber-text" />
                    <div>
                      <strong>{i.name}</strong>
                      <p>
                        {i.quantity - i.reserved} unreserved units at{" "}
                        {i.location}. A blocked repair includes an additional 4h
                        synthetic supply delay.
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </Panel>
          <Panel title="Fuel demand by active mission">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Mission</th>
                    <th>Aircraft</th>
                    <th>Fuel</th>
                  </tr>
                </thead>
                <tbody>
                  {s.missions.filter(activeMission).map((m) => (
                    <tr key={m.id}>
                      <td>{m.id}</td>
                      <td>{shortId(m.aircraftId)}</td>
                      <td>{m.fuelLitres.toLocaleString()} L</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
