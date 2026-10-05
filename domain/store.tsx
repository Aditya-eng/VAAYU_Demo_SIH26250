/* eslint-disable react-hooks/set-state-in-effect -- Hydrate and persist explicitly device-local demo state after SSR. */
"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { createEmptyWorkspace } from "./workspace";
import { createSeed } from "./seed";
import { migrateDemo } from "./migration";
import { transition } from "./engine";
import type { Action, DemoState, Role } from "./types";
const EMPTY_WORKSPACE = createEmptyWorkspace();
const MODE_KEY = "vaayu-workspace-mode-v2";
const KEY = "vaayu-demo-v1";
interface Store {
  state: DemoState;
  isDemo: boolean;
  setDemoMode: (enabled: boolean) => void;
  role: Role;
  setRole: (r: Role) => void;
  act: (a: Action) => boolean;
  loaded: boolean;
  message: string;
  clearMessage: () => void;
  persistence: string;
}
const Context = createContext<Store | null>(null);
export function DemoProvider({ children }: { children: ReactNode }) {
  const [isDemo, setIsDemo] = useState(false);
  const [state, setState] = useState(createSeed),
    [role, setRole] = useState<Role>("OPERATIONS PLANNER"),
    [loaded, setLoaded] = useState(false),
    [message, setMessage] = useState(""),
    [persistence, setPersistence] = useState("Workspace loading");
  useEffect(() => {
    try {
      setIsDemo(localStorage.getItem(MODE_KEY) === "demo");
      const saved = localStorage.getItem(KEY);
      if (saved) {
        setState(migrateDemo(JSON.parse(saved)));
      }
      setPersistence("Saved on this device");
    } catch {
      setIsDemo(false);
      setMessage(
        "Saved demo could not be loaded. The clean workspace remains available.",
      );
      setPersistence("Storage unavailable · session only");
    }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      setPersistence("Saved on this device");
    } catch {
      setPersistence("Storage unavailable · session only");
    }
  }, [state, loaded]);
  function setDemoMode(enabled: boolean) {
    setIsDemo(enabled);
    try {
      localStorage.setItem(MODE_KEY, enabled ? "demo" : "workspace");
    } catch {
      setPersistence("Session only");
    }
    setMessage(
      enabled
        ? "Demo loaded. All operational records are synthetic."
        : "Clean workspace. Demo records are hidden and retained separately.",
    );
  }
  function act(action: Action) {
    if (!isDemo) {
      setMessage(
        "Load the demo from Scenario Control to try operational workflows.",
      );
      return false;
    }
    try {
      const next = transition(state, action);
      setState(next);
      setMessage(
        action.type === "RESET"
          ? "Demo reset. Original aircraft, missions and resources restored."
          : action.type === "FAULT"
            ? "Fault recorded. Aircraft grounded, work order created and missions revalidated."
            : action.type === "APPROVE"
              ? "Replan approved. Assignment updated across all views."
              : action.type === "UNDO"
                ? "Previous schedule restored. Audit history retained."
                : action.type === "WORK"
                  ? next.workOrders.find((w) => w.id === action.workId)
                      ?.stage === "CLEARED"
                    ? "Maintenance clearance recorded. Aircraft eligibility revalidated."
                    : "Maintenance stage recorded. Clearance is required for return to service."
                  : "Change recorded. All operational views are up to date.",
      );
      return true;
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "The action could not be completed.",
      );
      return false;
    }
  }
  return (
    <Context.Provider
      value={{
        state: isDemo ? state : EMPTY_WORKSPACE,
        isDemo,
        setDemoMode,
        role,
        setRole,
        act,
        loaded,
        message,
        clearMessage: () => setMessage(""),
        persistence,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useDemo() {
  const c = useContext(Context);
  if (!c) throw new Error("DemoProvider required");
  return c;
}
