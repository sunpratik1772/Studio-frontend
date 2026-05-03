import { useState } from "react";
import { useListAgents, useGetAgentTrace } from "@workspace/api-client-react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusDot } from "@/components/status-dot";
import { format } from "date-fns";

export default function Trace() {
  const { data: agents } = useListAgents();
  const [selectedAgent, setSelectedAgent] = useState<string>("");

  const { data: trace } = useGetAgentTrace(selectedAgent, { query: { enabled: !!selectedAgent, queryKey: ["agentTrace", selectedAgent] } });

  const getRoleColor = (role: string) => {
    if (role === 'user') return 'text-blue-400 border-blue-400/30 bg-blue-400/10';
    if (role === 'assistant') return 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10';
    if (role === 'system') return 'text-slate-400 border-slate-400/30 bg-slate-400/10';
    if (role === 'tool') return 'text-amber-400 border-amber-400/30 bg-amber-400/10';
    return 'text-foreground border-border bg-muted';
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-border bg-card flex items-center gap-4 shrink-0">
        <div>
          <h1 className="text-lg font-bold tracking-tight">Trace Inspector</h1>
        </div>
        <div className="w-[300px] ml-auto">
          <Select value={selectedAgent} onValueChange={setSelectedAgent}>
            <SelectTrigger className="rounded-sm">
              <SelectValue placeholder="Select an agent session..." />
            </SelectTrigger>
            <SelectContent>
              {agents?.map(agent => (
                <SelectItem key={agent.id} value={agent.id}>
                  <div className="flex items-center gap-2">
                    <StatusDot status={agent.status} />
                    <span className="font-mono text-xs">{agent.id.slice(0,6)}</span>
                    <span className="truncate">{agent.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {selectedAgent ? (
          <PanelGroup direction="horizontal">
            <Panel defaultSize={40} minSize={25} className="flex flex-col bg-background">
              <div className="p-2 border-b border-border bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground shrink-0">
                Thread
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {trace?.messages?.map((msg, i) => (
                  <div key={msg.id || i} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-sm border ${getRoleColor(msg.role)}`}>
                        {msg.role}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {format(new Date(msg.timestamp), "HH:mm:ss.SSS")}
                      </span>
                    </div>
                    <div className="text-sm bg-card border border-border p-3 rounded-sm whitespace-pre-wrap font-sans">
                      {msg.content || (msg.toolCall ? <span className="text-muted-foreground italic">Tool call: {JSON.stringify(msg.toolCall)}</span> : '')}
                    </div>
                  </div>
                ))}
                {!trace?.messages?.length && (
                  <div className="text-center text-sm text-muted-foreground p-8">No messages in trace.</div>
                )}
              </div>
            </Panel>
            
            <PanelResizeHandle className="w-1 bg-border hover:bg-primary/50 transition-colors cursor-col-resize" />
            
            <Panel defaultSize={60} minSize={25} className="flex flex-col bg-[#0d1117]">
              <div className="p-2 border-b border-border bg-[#0d1117] text-xs font-semibold uppercase tracking-wider text-muted-foreground shrink-0 flex justify-between">
                <span>DAG / Thought Process</span>
                {trace && (
                  <span className="font-mono">{trace.durationMs}ms · {trace.totalTokens} tokens</span>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs">
                {trace?.dagSteps?.map((step, i) => (
                  <div key={step.stepId || i} className="border border-border/50 rounded-sm overflow-hidden bg-card/50">
                    <div className="px-3 py-1.5 bg-muted/30 border-b border-border/50 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <StatusDot status={step.status} />
                        <span className="text-primary font-semibold">{step.type}</span>
                        {step.toolName && <span className="text-amber-400">{step.toolName}</span>}
                      </div>
                      <div className="text-muted-foreground">
                        {step.durationMs}ms
                      </div>
                    </div>
                    <div className="p-3 space-y-2">
                      {step.input && (
                        <div>
                          <div className="text-muted-foreground mb-1 uppercase text-[10px]">Input</div>
                          <pre className="text-[11px] text-slate-300 overflow-x-auto">{JSON.stringify(step.input, null, 2)}</pre>
                        </div>
                      )}
                      {step.output && (
                        <div className="mt-2 pt-2 border-t border-border/50">
                          <div className="text-muted-foreground mb-1 uppercase text-[10px]">Output</div>
                          <pre className="text-[11px] text-emerald-400 overflow-x-auto">{JSON.stringify(step.output, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {!trace?.dagSteps?.length && (
                  <div className="text-center text-sm text-muted-foreground p-8">No DAG steps recorded.</div>
                )}
              </div>
            </Panel>
          </PanelGroup>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            Select an agent session to view its trace.
          </div>
        )}
      </div>
    </div>
  );
}
