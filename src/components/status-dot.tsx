import React from "react";

export function StatusDot({ status }: { status: "running" | "idle" | "failed" | "completed" | "pending" | "success" | "error" }) {
  let colorClass = "bg-gray-500";
  if (status === "running") colorClass = "bg-emerald-500";
  if (status === "idle") colorClass = "bg-blue-500";
  if (status === "failed" || status === "error") colorClass = "bg-red-500";
  if (status === "completed" || status === "success") colorClass = "bg-gray-500";
  if (status === "pending") colorClass = "bg-amber-500";

  return (
    <span className={`inline-block w-2 h-2 rounded-full ${colorClass}`} />
  );
}

export function StatusBadge({ status }: { status: "running" | "idle" | "failed" | "completed" | "pending" | "success" | "error" }) {
  return (
    <div className="flex items-center gap-1.5 text-xs font-medium">
      <StatusDot status={status} />
      <span className="capitalize text-muted-foreground">{status}</span>
    </div>
  );
}
