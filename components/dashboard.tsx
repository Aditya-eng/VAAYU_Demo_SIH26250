"use client";
import {
  Plane,
  ShieldCheck,
  AlertTriangle,
  Box,
  Users,
  Fuel,
  CloudRain,
  Activity,
  Crosshair,
} from "lucide-react";
import { useDemo } from "../domain/store";
import {
  activeMission,
  aircraftStatus,
  metrics,
  missionStatus,
  shortId,
  time,
} from "../domain/engine";
import { Badge, Panel, Stat, LinkButton } from "./ui-kit";
import type { PageName } from "./shell";
import { MissionMap } from "./mission-map";
export function Dashboard({
  navigate,
  inspect,
}: {
  navigate: (p: PageName) => void;
  inspect: (id: string) => void;
}) {
  const { state: s, isDemo } = useDemo(),
    k = metrics(s),
    missions = s.missions.filter(activeMission).slice(0, 4);
  if (!isDemo)
    return (
      <>
        <div className="workspace-metrics">
          {[
            ["Aircraft", "No fleet connected"],
            ["Missions", "No assignments loaded"],
            ["Weather", "Feed unavailable"],
            ["Airspace", "Feed unavailable"],
          ].map(([title, description]) => (
            <div key={title}>
              <span>{title}</span>
              <strong>—</strong>
              <small>{description}</small>
            </div>
          ))}
        </div>
        <Panel
          title="Operational picture"
          sub="India and surrounding region · geographic reference"
          action={
            <LinkButton onClick={() => navigate("Mission Map")}>
              Expand map
            </LinkButton>
          }
          className="geographic-dashboard-panel"
        >
          <MissionMap compact />
        </Panel>
        <div className="workspace-status-row">
          <span>
            <ShieldCheck size={17} /> Clean operational workspace
          </span>
          <p>
            No sample flights, fictional hubs or generated weather are
            displayed.
          </p>
          <button
            className="text-btn"
            onClick={() => navigate("Sources & Status")}
          >
            Data status
          </button>
        </div>
      </>
    );
  return (
    <>
      <div className="kpi-grid">
        <Stat label="Total aircraft" value={k.total} suffix="in fleet" />
        <Stat
          label="Available"
          value={k.available}
          suffix="mission ready"
          accent="green"
        />
        <Stat label="Active assignments" value={k.assigned} suffix="aircraft" />
        <Stat
          label="Maintenance"
          value={k.maintenance}
          suffix="open work orders"
          accent="amber"
        />
        <Stat
          label="Mission conflicts"
          value={k.conflicts.toString().padStart(2, "0")}
          suffix="require attention"
          accent={k.conflicts ? "red" : ""}
        />
        <Stat
          label="Today's missions"
          value={k.missions}
          suffix={`${k.completed} completed`}
        />
      </div>
      <div className="dashboard-main">
        <Panel
          title="Operational picture"
          sub="Geographic reference · demo overlays"
          action={
            <LinkButton onClick={() => navigate("Mission Map")}>
              Open mission map
            </LinkButton>
          }
          className="map-panel"
        >
          <MissionMap compact onMission={() => navigate("Schedule")} />
          <div className="map-summary">
            <span>
              <Plane size={15} />
              {k.feasible} feasible missions
            </span>
            <span>
              <CloudRain size={15} />
              {s.weather.filter((w) => w.severity !== "CLEAR").length} weather
              advisories
            </span>
            <span>
              <Crosshair size={15} />
              {s.restrictions.filter((r) => r.active).length} restrictions
            </span>
          </div>
        </Panel>
        <Panel
          title="Fleet readiness"
          sub="Availability at demo time · 13:30 IST"
          className="readiness"
        >
          <div className="readiness-score">
            <div
              className="readiness-ring"
              style={
                {
                  "--ready": `${((k.available + k.assigned) / k.total) * 100}%`,
                } as React.CSSProperties
              }
            >
              <strong>
                {Math.round(((k.available + k.assigned) / k.total) * 100)}
                <small>%</small>
              </strong>
              <span>operational</span>
            </div>
            <div className="readiness-legend">
              {[
                ["Available", k.available, "green"],
                ["Assigned", k.assigned, "cyan"],
                ["Grounded", k.grounded, "red"],
                ["Inspection due", k.inspection, "amber"],
                ["Unknown / stale", k.unknown, "grey"],
              ].map(([name, count, color]) => (
                <div key={name}>
                  <i className={`dot ${color}`} />
                  <span>{name}</span>
                  <b>{count}</b>
                </div>
              ))}
            </div>
          </div>
          <div className="rule-divider" />
          <h3>Resource watch</h3>
          <button className="resource-row" onClick={() => navigate("Crew")}>
            <Users size={17} />
            <span>Crew ready</span>
            <b>
              {
                s.crew.filter(
                  (c) =>
                    c.available && c.restCompleted && c.fitness === "READY",
                ).length
              }
              /{s.crew.length}
            </b>
          </button>
          <button
            className="resource-row"
            onClick={() => navigate("Fuel & Inventory")}
          >
            <Fuel size={17} />
            <span>Alpha fuel unallocated</span>
            <b>
              {(
                (s.locations[0].fuelLitres -
                  s.missions
                    .filter(activeMission)
                    .reduce((v, m) => v + m.fuelLitres, 0)) /
                1000
              ).toFixed(1)}
              k L
            </b>
          </button>
          <button
            className="resource-row"
            onClick={() => navigate("Fuel & Inventory")}
          >
            <Box size={17} />
            <span>Unreserved EGT sensors</span>
            <b className="amber-text">
              {s.inventory[0].quantity - s.inventory[0].reserved} units
            </b>
          </button>
        </Panel>
      </div>
      <div className="dashboard-bottom">
        <Panel
          title="Mission readiness"
          sub="Upcoming departures · all times IST"
          action={
            <LinkButton onClick={() => navigate("Schedule")}>
              View schedule
            </LinkButton>
          }
        >
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Mission / purpose</th>
                  <th>Aircraft</th>
                  <th>Departure</th>
                  <th>Priority</th>
                  <th>Readiness</th>
                </tr>
              </thead>
              <tbody>
                {missions.map((m) => (
                  <tr
                    key={m.id}
                    onClick={() =>
                      navigate(
                        missionStatus(s, m) === "CONFLICT"
                          ? "Replanning"
                          : "Schedule",
                      )
                    }
                    className="clickable"
                  >
                    <td>
                      <strong>{m.id}</strong>
                      <small>{m.name}</small>
                    </td>
                    <td className="mono">{shortId(m.aircraftId)}</td>
                    <td className="mono">{time(m.start)}</td>
                    <td>
                      <span className={`priority p${m.priority}`}>
                        P{m.priority} ·{" "}
                        {
                          ["", "EMERGENCY", "CRITICAL", "HIGH", "ROUTINE"][
                            m.priority
                          ]
                        }
                      </span>
                    </td>
                    <td>
                      <Badge status={missionStatus(s, m)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel
          title="Attention centre"
          action={
            <LinkButton onClick={() => navigate("Alerts")}>
              All alerts
            </LinkButton>
          }
        >
          <div className="attention-list">
            {s.alerts
              .filter((a) => !a.resolved)
              .slice(0, 3)
              .map((a) => (
                <button
                  key={a.id}
                  onClick={() =>
                    navigate(
                      a.entity.startsWith("VAAYU")
                        ? "Maintenance"
                        : "Replanning",
                    )
                  }
                  className="attention-item"
                >
                  <span
                    className={`alert-icon ${a.severity === "CRITICAL" ? "bad" : "warn"}`}
                  >
                    <AlertTriangle size={17} />
                  </span>
                  <div>
                    <strong>{a.title}</strong>
                    <p>{a.detail}</p>
                  </div>
                </button>
              ))}
          </div>
        </Panel>
      </div>
      <Panel
        title="Aircraft at a glance"
        action={
          <LinkButton onClick={() => navigate("Aircraft")}>
            All {s.aircraft.length} aircraft
          </LinkButton>
        }
      >
        <div className="fleet-glance">
          {s.aircraft.slice(0, 4).map((a) => (
            <button
              className="mini-aircraft"
              key={a.id}
              onClick={() => inspect(a.id)}
            >
              <Plane size={29} />
              <div>
                <strong>{a.id}</strong>
                <span>
                  {a.type} · {a.maxPayloadKg / 1000} t capacity
                </span>
              </div>
              <Badge status={aircraftStatus(s, a)} />
            </button>
          ))}
        </div>
      </Panel>
      <div className="bottom-note">
        <ShieldCheck size={14} /> Decision support with human approval{" "}
        <span>•</span> <Activity size={14} /> All metrics derived from the
        shared demonstration state
      </div>
    </>
  );
}
