/* eslint-disable react-hooks/set-state-in-effect -- Restore browser navigation after SSR hydration. */
"use client";
import Image from "next/image";
import { Component, useEffect, useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  Map,
  CalendarRange,
  GitBranch,
  Plane,
  Box,
  Wrench,
  Users,
  Fuel,
  Bell,
  History,
  SlidersHorizontal,
  Database,
  RotateCcw,
  Menu,
  X,
  Search,
  ShieldCheck,
  Activity,
  CircleHelp,
} from "lucide-react";
import { motion, MotionConfig } from "motion/react";
import { DemoProvider, useDemo } from "../domain/store";
import { metrics } from "../domain/engine";
import type { Role } from "../domain/types";
import { Dashboard } from "./dashboard";
import { Inspection, Fleet } from "./inspection";
import { MissionMap } from "./mission-map";
import { Replanning, Schedule } from "./operations";
import { Maintenance, Crew, Inventory } from "./resources";
import { Alerts, Audit, Scenarios, Sources } from "./control";
export type PageName =
  | "Dashboard"
  | "Mission Map"
  | "Schedule"
  | "Replanning"
  | "Aircraft"
  | "3D Inspection"
  | "Maintenance"
  | "Crew"
  | "Fuel & Inventory"
  | "Alerts"
  | "Audit History"
  | "Scenario Control"
  | "Sources & Status";
const NAV = [
  { group: "OVERVIEW", items: [{ name: "Dashboard", icon: LayoutDashboard }] },
  {
    group: "OPERATIONS",
    items: [
      { name: "Mission Map", icon: Map },
      { name: "Schedule", icon: CalendarRange },
      { name: "Replanning", icon: GitBranch },
    ],
  },
  {
    group: "FLEET",
    items: [
      { name: "Aircraft", icon: Plane },
      { name: "3D Inspection", icon: Box },
      { name: "Maintenance", icon: Wrench },
    ],
  },
  {
    group: "RESOURCES",
    items: [
      { name: "Crew", icon: Users },
      { name: "Fuel & Inventory", icon: Fuel },
    ],
  },
  {
    group: "CONTROL",
    items: [
      { name: "Alerts", icon: Bell },
      { name: "Audit History", icon: History },
    ],
  },
  {
    group: "DEMONSTRATION",
    items: [
      { name: "Scenario Control", icon: SlidersHorizontal },
      { name: "Sources & Status", icon: Database },
    ],
  },
];
const DESCRIPTIONS: Record<PageName, string> = {
  Dashboard: "Aircraft, assignments and resources for today’s operations.",
  "Mission Map": "Geographic context, routes and operational layers.",
  Schedule: "Coordinate aircraft, crews and mission windows.",
  Replanning:
    "Resolve disruptions with transparent, constraint-checked alternatives.",
  Aircraft: "Inspect fleet readiness and component condition.",
  "3D Inspection": "Inspect components and review their maintenance records.",
  Maintenance: "Track the complete fault-to-clearance lifecycle.",
  Crew: "Qualified, rested and ready for the next assignment.",
  "Fuel & Inventory":
    "Understand supply constraints before they affect a mission.",
  Alerts: "Operational exceptions that need your attention.",
  "Audit History": "Every decision, change and clearance in one place.",
  "Scenario Control": "Introduce a disruption. Watch the whole system respond.",
  "Sources & Status": "Reference sources and demonstration data status.",
};
function Workspace() {
  const {
      state: s,
      isDemo,
      setDemoMode,
      role,
      setRole,
      loaded,
      message,
      clearMessage,
      persistence,
      act,
    } = useDemo(),
    [page, setPage] = useState<PageName>("Dashboard"),
    [aircraftId, setAircraftId] = useState("VAAYU-TR-03"),
    [missionId, setMissionId] = useState("RLF-204"),
    [inspectionComponent, setInspectionComponent] = useState("left-engine"),
    [workId, setWorkId] = useState<string | undefined>(),
    [menu, setMenu] = useState(false),
    [search, setSearch] = useState(false),
    [query, setQuery] = useState("");
  const k = metrics(s);
  function navigate(p: PageName) {
    setPage(p);
    setMenu(false);
    window.history.replaceState(null, "", `#${encodeURIComponent(p)}`);
    window.scrollTo({ top: 0 });
  }
  useEffect(() => {
    const name = decodeURIComponent(window.location.hash.slice(1));
    if (NAV.some((g) => g.items.some((i) => i.name === name)))
      setPage(name as PageName);
  }, []);
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(clearMessage, 8500);
    return () => clearTimeout(timer);
  }, [message, clearMessage]);
  function inspect(id: string, component = "left-engine") {
    setInspectionComponent(component);
    setAircraftId(id);
    navigate("3D Inspection");
  }
  function openReplan(id: string) {
    setMissionId(id);
    if (role === "OPERATIONS PLANNER" || role === "OPERATIONS SUPERVISOR")
      act({ type: "PROPOSE", missionId: id, actor: role });
    navigate("Replanning");
  }
  return (
    <div className="app">
      <a className="skip-link" href="#main-content">
        Skip navigation
      </a>
      {menu && (
        <button
          className="sidebar-scrim"
          aria-label="Close navigation"
          onClick={() => setMenu(false)}
        />
      )}
      <aside className={`sidebar ${menu ? "open" : ""}`}>
        <button
          className="brand"
          onClick={() => navigate("Dashboard")}
          aria-label="VAAYU dashboard"
        >
          <span className="brand-symbol">
            <Image
              src="/vaayu-mark.svg"
              width={38}
              height={38}
              alt=""
              unoptimized
            />
          </span>
          <span>
            <b>VAAYU</b>
            <small>AIR OPERATIONS</small>
          </span>
        </button>
        <div className="workspace-tag">
          <span className="dot cyan" /> PLANNING WORKSPACE <span>01</span>
        </div>
        <nav aria-label="Main navigation">
          {NAV.map((group) => (
            <div className="nav-group" key={group.group}>
              <span className="nav-label">{group.group}</span>
              {group.items.map((item) => (
                <button
                  key={item.name}
                  className={page === item.name ? "active" : ""}
                  onClick={() => navigate(item.name as PageName)}
                  aria-current={page === item.name ? "page" : undefined}
                >
                  <item.icon size={17} />
                  <span>{item.name}</span>
                  {item.name === "Alerts" &&
                    s.alerts.filter((a) => !a.resolved).length > 0 && (
                      <b className="nav-count">
                        {s.alerts.filter((a) => !a.resolved).length}
                      </b>
                    )}
                  {item.name === "Replanning" && k.conflicts > 0 && (
                    <b className="nav-count red">{k.conflicts}</b>
                  )}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div>
            <ShieldCheck size={17} />
            <span>
              Human-in-the-loop<small>Every replan needs approval</small>
            </span>
          </div>
          <button onClick={() => setDemoMode(!isDemo)}>
            <RotateCcw size={15} />
            {isDemo ? "Leave demo" : "Load demo"}
          </button>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="row">
            <button
              className="icon-btn menu-btn"
              aria-label="Open navigation"
              onClick={() => setMenu(!menu)}
            >
              <Menu size={21} />
            </button>
            <span className="breadcrumb">
              Workspace <span>/</span> <b>{page}</b>
            </span>
          </div>
          <div className="topbar-actions">
            <button className="search-trigger" onClick={() => setSearch(true)}>
              <Search size={16} />
              <span>Find aircraft or mission</span>
            </button>
            <span className="system-status">
              <span className="dot green" />
              {isDemo ? "DEMO" : "WORKSPACE"}
            </span>
            <button
              className="icon-btn notifications"
              aria-label="View alerts"
              onClick={() => navigate("Alerts")}
            >
              <Bell size={19} />
              {k.critical > 0 && <i />}
            </button>
            <div className="role-control">
              <span className="avatar">
                {role === "MAINTENANCE OFFICER"
                  ? "MO"
                  : role === "CREW COORDINATOR"
                    ? "CC"
                    : role === "OPERATIONS SUPERVISOR"
                      ? "OS"
                      : "OP"}
              </span>
              <label>
                <span>VIEW AS ROLE</span>
                <select
                  aria-label="View as role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                >
                  {[
                    "OPERATIONS PLANNER",
                    "MAINTENANCE OFFICER",
                    "CREW COORDINATOR",
                    "OPERATIONS SUPERVISOR",
                  ].map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </header>
        <div className="demo-banner">
          <ShieldCheck size={13} />
          <span>
            {isDemo
              ? "DEMO MODE · SYNTHETIC OPERATIONAL DATA"
              : "GEOGRAPHIC WORKSPACE · NO OPERATIONAL FEED CONNECTED"}
          </span>
          <button onClick={() => navigate("Sources & Status")}>
            Sources & status <CircleHelp size={13} />
          </button>
        </div>
        <main id="main-content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                {page === "Dashboard"
                  ? "MISSION CONTROL / OVERVIEW"
                  : "VAAYU / " + page.toUpperCase()}
              </div>
              <h1>
                {page === "Dashboard"
                  ? "Operations overview"
                  : page === "3D Inspection"
                    ? "Aircraft inspection"
                    : page === "Replanning"
                      ? "Replanning"
                      : page}
              </h1>
              <p>{DESCRIPTIONS[page]}</p>
            </div>
            <div className="heading-meta">
              <span>
                {isDemo ? (
                  <>
                    02 OCT 2026 <b>13:30 IST</b>
                  </>
                ) : (
                  "INDIA / REGIONAL OVERVIEW"
                )}
              </span>
              <small>
                <Activity size={13} />
                {persistence}
              </small>
            </div>
          </div>
          {!loaded ? (
            <div className="loading-state">
              <Activity size={26} />
              <h2>Loading your workspace…</h2>
              <p>Preparing aircraft, resources and operational constraints.</p>
            </div>
          ) : (
            <MotionConfig reducedMotion="user">
              <motion.div
                key={page}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18 }}
              >
                {!isDemo &&
                !["Dashboard", "Mission Map", "Sources & Status"].includes(
                  page,
                ) ? (
                  <div className="workspace-empty-panel">
                    <Activity size={28} />
                    <h2>
                      {page === "Scenario Control"
                        ? "Explore the demo when you need it"
                        : "No operational records loaded"}
                    </h2>
                    <p>
                      {page === "Scenario Control"
                        ? "The optional sample scenario includes aircraft inspection, maintenance clearance and approved replanning. All demo records are synthetic."
                        : "This workspace has no connected aircraft, mission or maintenance feed. Sample records stay out of your operational picture."}
                    </p>
                    <button
                      className="btn primary"
                      onClick={() => setDemoMode(true)}
                    >
                      Load demo scenario
                    </button>
                    <button
                      className="text-btn"
                      onClick={() => navigate("Mission Map")}
                    >
                      Open geographic map
                    </button>
                  </div>
                ) : (
                  <>
                    {page === "Dashboard" && (
                      <Dashboard navigate={navigate} inspect={inspect} />
                    )}{" "}
                    {page === "Aircraft" && <Fleet inspect={inspect} />}{" "}
                    {page === "3D Inspection" && (
                      <Inspection
                        initialComponent={inspectionComponent}
                        aircraftId={aircraftId}
                        setAircraftId={setAircraftId}
                        openMaintenance={(id) => {
                          setWorkId(id);
                          navigate("Maintenance");
                        }}
                      />
                    )}{" "}
                    {page === "Mission Map" && <MissionMap />}{" "}
                    {page === "Schedule" && (
                      <Schedule openReplan={openReplan} />
                    )}{" "}
                    {page === "Replanning" && (
                      <Replanning initialMission={missionId} />
                    )}{" "}
                    {page === "Maintenance" && (
                      <Maintenance initialWorkId={workId} inspect={inspect} />
                    )}{" "}
                    {page === "Crew" && <Crew />}{" "}
                    {page === "Fuel & Inventory" && <Inventory />}{" "}
                    {page === "Alerts" && <Alerts />}{" "}
                    {page === "Audit History" && <Audit />}{" "}
                    {page === "Scenario Control" && (
                      <Scenarios
                        inspect={() => inspect("VAAYU-TR-03")}
                        replan={() => openReplan("RLF-204")}
                      />
                    )}{" "}
                    {page === "Sources & Status" && <Sources />}
                  </>
                )}
              </motion.div>
            </MotionConfig>
          )}
          <footer>
            <span>
              VAAYU <span className="muted">/</span> Air operations planning
            </span>
            <span>Geographic context · Humanitarian planning</span>
          </footer>
        </main>
      </div>
      {message && (
        <div className="toast" role="status">
          <Activity size={18} />
          <p>{message}</p>
          <button
            className="icon-btn"
            aria-label="Dismiss notification"
            onClick={clearMessage}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {search && (
        <div className="modal-backdrop" onClick={() => setSearch(false)}>
          <section
            className="search-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Find aircraft or mission"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="row">
              <Search size={21} />
              <input
                autoFocus
                placeholder="Aircraft ID, mission ID or purpose…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setSearch(false);
                }}
              />
              <button
                className="icon-btn"
                aria-label="Close search"
                onClick={() => setSearch(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="search-results">
              {s.aircraft
                .filter((a) =>
                  (a.id + " " + a.type)
                    .toLowerCase()
                    .includes(query.toLowerCase()),
                )
                .slice(0, 5)
                .map((a) => (
                  <button
                    key={a.id}
                    onClick={() => {
                      inspect(a.id);
                      setSearch(false);
                    }}
                  >
                    <Plane size={17} />
                    <strong>{a.id}</strong>
                    <span>{a.type}</span>
                  </button>
                ))}
              {s.missions
                .filter((m) =>
                  (m.id + " " + m.name)
                    .toLowerCase()
                    .includes(query.toLowerCase()),
                )
                .slice(0, 5)
                .map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      openReplan(m.id);
                      setSearch(false);
                    }}
                  >
                    <CalendarRange size={17} />
                    <strong>{m.id}</strong>
                    <span>{m.name}</span>
                  </button>
                ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
class AppBoundary extends Component<
  { children: ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    if (this.state.error)
      return (
        <div className="fatal-error">
          <h1>Workspace could not be displayed</h1>
          <p>
            Your saved demonstration may be incompatible. Reset the local
            scenario to recover.
          </p>
          <button
            className="btn primary"
            onClick={() => {
              localStorage.removeItem("vaayu-demo-v1");
              window.location.reload();
            }}
          >
            Reset saved demo & reload
          </button>
        </div>
      );
    return this.props.children;
  }
}
export default function App() {
  return (
    <AppBoundary>
      <DemoProvider>
        <Workspace />
      </DemoProvider>
    </AppBoundary>
  );
}
