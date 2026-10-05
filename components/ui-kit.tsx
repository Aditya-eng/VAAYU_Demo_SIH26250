import {
  Check,
  AlertTriangle,
  CircleHelp,
  XCircle,
  Clock3,
  ArrowUpRight,
} from "lucide-react";
import type { ReactNode } from "react";
export function Badge({ status }: { status: string }) {
  const good = [
    "AVAILABLE",
    "HEALTHY",
    "READY",
    "COMPLETED",
    "CLEARED",
    "PASS",
    "CLEAR",
    "APPROVED",
    "VERIFIED",
  ].includes(status);
  const bad = [
    "FAULT",
    "GROUNDED",
    "CONFLICT",
    "CRITICAL",
    "SEVERE",
    "UNAVAILABLE",
    "REJECTED",
  ].includes(status);
  const warn = [
    "INSPECTION REQUIRED",
    "INSPECTION DUE",
    "DELAYED",
    "WARNING",
    "ADVISORY",
    "MAINTENANCE",
    "IN PROGRESS",
    "PENDING",
    "TASK COMPLETED",
  ].includes(status);
  const Icon = good
    ? Check
    : bad
      ? XCircle
      : warn
        ? AlertTriangle
        : ["UNKNOWN", "STALE"].includes(status)
          ? CircleHelp
          : Clock3;
  return (
    <span
      className={`badge ${good ? "good" : bad ? "bad" : warn ? "warn" : "neutral"}`}
    >
      <Icon size={12} />
      {status}
    </span>
  );
}
export function Panel({
  title,
  sub,
  action,
  children,
  className = "",
}: {
  title?: string;
  sub?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      {title && (
        <div className="panel-head">
          <div>
            <h2>{title}</h2>
            {sub && <p>{sub}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
export function Empty({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="empty">
      <Check size={28} />
      <strong>{title}</strong>
      {detail && <p>{detail}</p>}
    </div>
  );
}
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
export function Stat({
  label,
  value,
  suffix,
  accent = "",
}: {
  label: string;
  value: ReactNode;
  suffix?: string;
  accent?: string;
}) {
  return (
    <div className={`stat ${accent}`}>
      <span>{label}</span>
      <strong>
        {value}
        <small>{suffix}</small>
      </strong>
    </div>
  );
}
export function LinkButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button className="text-btn" onClick={onClick}>
      {children}
      <ArrowUpRight size={15} />
    </button>
  );
}
export function Stamp({ value }: { value: string | null }) {
  return (
    <span>
      {value
        ? new Date(value).toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }) + " IST"
        : "No record"}
    </span>
  );
}
