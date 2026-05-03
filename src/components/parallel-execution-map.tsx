import { useState } from "react";
import { useFanOutTasks } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Zap } from "lucide-react";

type NodeState = "queued" | "running" | "completed" | "failed";

interface NodeView {
  index: number;
  state: NodeState;
  durationMs?: number;
  taskId?: string;
}

const STATE_STYLES: Record<NodeState, string> = {
  queued: "border-border bg-muted/40 text-muted-foreground",
  running:
    "border-amber-500/40 bg-amber-500/10 text-amber-500 dark:text-amber-300 running-shimmer",
  completed:
    "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
  failed: "border-destructive/50 bg-destructive/10 text-destructive",
};

const STATE_LABEL: Record<NodeState, string> = {
  queued: "QUEUED",
  running: "RUNNING",
  completed: "DONE",
  failed: "FAILED",
};

export function ParallelExecutionMap() {
  const [taskCount, setTaskCount] = useState(8);
  const [duration, setDuration] = useState(2000);
  const [nodes, setNodes] = useState<NodeView[]>([]);
  const [metrics, setMetrics] = useState<{
    wallMs: number;
    totalDurationMs: number;
    startSpreadMs: number;
    speedupFactor: number;
  } | null>(null);

  const fanOut = useFanOutTasks();

  const trigger = async () => {
    setMetrics(null);
    // Phase 1: render N nodes as queued, then transition to running on next tick
    const initial: NodeView[] = Array.from({ length: taskCount }, (_, i) => ({
      index: i,
      state: "queued",
    }));
    setNodes(initial);

    // Tiny delay so the queued state is visible, then mark all running.
    await new Promise((r) => setTimeout(r, 80));
    setNodes((prev) => prev.map((n) => ({ ...n, state: "running" })));

    const t0 = performance.now();
    try {
      const res = await fanOut.mutateAsync({
        data: { task_count: taskCount, mock_duration_ms: duration },
      });
      const wallMs = Math.round(performance.now() - t0);

      setNodes(
        res.tasks.map((t) => ({
          index: t.index,
          state: t.status === "completed" ? "completed" : "failed",
          durationMs: t.durationMs,
          taskId: t.taskId,
        })),
      );
      setMetrics({
        wallMs,
        totalDurationMs: res.totalDurationMs,
        startSpreadMs: res.startSpreadMs,
        speedupFactor: res.speedupFactor,
      });
    } catch {
      setNodes((prev) => prev.map((n) => ({ ...n, state: "failed" })));
    }
  };

  const isRunning = fanOut.isPending;

  return (
    <Card className="rounded-xl lift" data-testid="parallel-execution-map">
      <CardHeader className="py-3 px-4 border-b border-border flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          Parallel Execution Map
        </CardTitle>
        <div className="text-xs text-muted-foreground">
          Promise.all fan-out · proves N-ary concurrency
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Tasks (N)
            </label>
            <Input
              type="number"
              min={1}
              max={50}
              value={taskCount}
              onChange={(e) =>
                setTaskCount(Math.max(1, Math.min(50, Number(e.target.value) || 1)))
              }
              disabled={isRunning}
              className="w-24 font-mono"
              data-testid="input-task-count"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Mock duration (ms)
            </label>
            <Input
              type="number"
              min={100}
              max={10000}
              step={100}
              value={duration}
              onChange={(e) =>
                setDuration(Math.max(100, Math.min(10000, Number(e.target.value) || 100)))
              }
              disabled={isRunning}
              className="w-32 font-mono"
              data-testid="input-mock-duration"
            />
          </div>
          <Button
            onClick={trigger}
            disabled={isRunning}
            className="font-semibold"
            data-testid="button-trigger-fanout"
          >
            {isRunning ? "Running..." : "Trigger Fan-Out"}
          </Button>
          {metrics && (
            <div className="flex gap-4 text-xs ml-auto font-mono" data-testid="fanout-metrics">
              <span>
                <span className="text-muted-foreground">wall:</span>{" "}
                <span className="text-foreground">{metrics.wallMs}ms</span>
              </span>
              <span>
                <span className="text-muted-foreground">server:</span>{" "}
                <span className="text-foreground">{metrics.totalDurationMs}ms</span>
              </span>
              <span>
                <span className="text-muted-foreground">spread:</span>{" "}
                <span className="text-foreground">{metrics.startSpreadMs}ms</span>
              </span>
              <span>
                <span className="text-muted-foreground">speedup:</span>{" "}
                <span className="text-emerald-300">{metrics.speedupFactor.toFixed(2)}x</span>
              </span>
            </div>
          )}
        </div>

        {nodes.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-8 border border-dashed border-border rounded-sm">
            Trigger a fan-out to visualize N parallel tasks.
          </div>
        ) : (
          <div
            className="grid gap-2"
            style={{
              gridTemplateColumns: `repeat(auto-fill, minmax(110px, 1fr))`,
            }}
          >
            {nodes.map((n) => (
              <div
                key={n.index}
                className={`border rounded-md p-2 transition-all duration-200 ${STATE_STYLES[n.state]}`}
                data-testid={`node-${n.index}`}
              >
                <div className="text-[10px] font-mono opacity-70">
                  TASK #{n.index.toString().padStart(2, "0")}
                </div>
                <div className="text-xs font-semibold mt-1">{STATE_LABEL[n.state]}</div>
                {n.durationMs !== undefined && (
                  <div className="text-[10px] font-mono opacity-70 mt-1">
                    {n.durationMs}ms
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
