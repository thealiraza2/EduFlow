"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type Mark = "P" | "A" | "L" | null;

const initial: { name: string; roll: string; mark: Mark }[] = [
  { name: "Ayesha Siddiqui", roll: "EF-0112", mark: "P" },
  { name: "Muhammad Hamza Tariq", roll: "EF-0118", mark: "P" },
  { name: "Zainab Rafiq", roll: "EF-0121", mark: "A" },
  { name: "Abdullah Khan", roll: "EF-0127", mark: null },
  { name: "Fatima Noor", roll: "EF-0131", mark: null },
];

const next: Record<string, Mark> = { null: "P", P: "A", A: "L", L: "P" };

function Tick() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden>
      <path
        d="M3.5 8.5l3 3 6-7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="24"
        className="animate-draw-tick"
      />
    </svg>
  );
}

/**
 * The signature moment (DESIGN.md §7): tapping a row marks attendance like a pen
 * on a register — a tick draws itself and the Present counter updates.
 * Demo data only; clearly labelled as a sample.
 */
export function RegisterPreview() {
  const [rows, setRows] = useState(initial);
  const present = rows.filter((r) => r.mark === "P").length;
  const marked = rows.filter((r) => r.mark !== null).length;

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface shadow-2">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold text-ink">Class 9-B · Physics</p>
          <p className="text-small text-ink-3">Sample register · tap a name to mark</p>
        </div>
        <p className="shrink-0 text-right">
          <span className="block text-[22px] font-semibold leading-none tabular-nums text-ink" aria-live="polite">
            {present}
            <span className="text-ink-3"> / {rows.length}</span>
          </span>
          <span className="text-[12px] font-medium text-ink-3">present</span>
        </p>
      </div>
      <ul>
        {rows.map((r, i) => (
          <li key={r.roll} className="border-b border-line last:border-0">
            <button
              type="button"
              onClick={() =>
                setRows((rs) => rs.map((x, j) => (j === i ? { ...x, mark: next[String(x.mark)] } : x)))
              }
              className="flex h-12 w-full items-center gap-3 px-4 text-left transition-colors hover:bg-canvas focus-visible:bg-canvas focus-visible:outline-none sm:px-5"
              aria-label={`${r.name}: ${r.mark === "P" ? "present" : r.mark === "A" ? "absent" : r.mark === "L" ? "on leave" : "not marked"}. Tap to change.`}
            >
              <span className="w-[60px] shrink-0 font-mono text-[12px] text-ink-3">{r.roll}</span>
              <span className="min-w-0 flex-1 truncate text-[15px] text-ink">{r.name}</span>
              <span
                key={String(r.mark)}
                className={cn(
                  "inline-flex h-7 min-w-[52px] items-center justify-center gap-1 rounded-sm px-2 text-[12px] font-semibold",
                  r.mark === "P" && "bg-status-success-bg text-status-success",
                  r.mark === "A" && "bg-status-danger-bg text-status-danger",
                  r.mark === "L" && "bg-status-info-bg text-status-info",
                  r.mark === null && "border border-dashed border-line-strong text-ink-3"
                )}
              >
                {r.mark === "P" && <Tick />}
                {r.mark ?? "—"}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between gap-3 bg-surface-sunken px-4 py-3 text-small text-ink-2 sm:px-5">
        <span>
          {marked} of {rows.length} marked
        </span>
        <button
          type="button"
          onClick={() => setRows((rs) => rs.map((x) => (x.mark === null ? { ...x, mark: "P" } : x)))}
          className="press rounded-md px-2 py-1 font-medium text-primary hover:bg-primary-tint focus-visible:outline-none focus-visible:shadow-focus"
        >
          Mark rest present
        </button>
      </div>
    </div>
  );
}
