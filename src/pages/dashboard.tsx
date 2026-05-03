import { useGetAgentSummary, useListAgents, useListChannelConfigs, useGetTokenMetrics } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-dot";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { ParallelExecutionMap } from "@/components/parallel-execution-map";

export default function Dashboard() {
  const { data: summary } = useGetAgentSummary();
  const { data: agents } = useListAgents();
  const { data: channels } = useListChannelConfigs();
  const { data: tokenMetrics } = useGetTokenMetrics({ period: "24h" });

  const stats = [
    { label: "Active Agents", value: summary?.running ?? 0, sub: `/ ${summary?.total ?? 0} total registered` },
    { label: "Failed Loops", value: summary?.failed ?? 0, sub: "Requires intervention", danger: true },
    { label: "Total Tokens (24h)", value: (summary?.totalTokensUsed ?? 0).toLocaleString(), sub: "Prompt + Completion" },
    { label: "Active Channels", value: summary?.activeChannels ?? 0, sub: "Webhooks connected" },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-3xl font-semibold tracking-tight">Gateway Dashboard</h1>
        <p className="text-sm text-muted-foreground">Real-time overview of agent orchestration.</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="rounded-xl lift surface-sheen">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-[11px] text-muted-foreground uppercase tracking-[0.14em] font-medium">{s.label}</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className={`text-3xl font-semibold tracking-tight ${s.danger ? "text-destructive" : ""}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ParallelExecutionMap />

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <Card className="rounded-xl h-[320px] flex flex-col lift">
            <CardHeader className="py-3 px-4 border-b border-border">
              <CardTitle className="text-sm font-semibold tracking-tight">Token Usage</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-4">
              {tokenMetrics && tokenMetrics.dataPoints && tokenMetrics.dataPoints.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={tokenMetrics.dataPoints}>
                    <defs>
                      <linearGradient id="colorPrompt" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorComp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={(t) => format(new Date(t), "HH:mm")} 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => v >= 1000 ? `${v/1000}k` : v}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "var(--radius)", color: "hsl(var(--foreground))" }}
                      itemStyle={{ color: "hsl(var(--foreground))" }}
                      labelStyle={{ color: "hsl(var(--muted-foreground))", marginBottom: "4px" }}
                      labelFormatter={(t) => format(new Date(t), "MMM d, HH:mm")}
                    />
                    <Area type="monotone" dataKey="promptTokens" stackId="1" stroke="hsl(var(--chart-1))" fill="url(#colorPrompt)" />
                    <Area type="monotone" dataKey="completionTokens" stackId="1" stroke="hsl(var(--chart-2))" fill="url(#colorComp)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No token metrics available</div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-xl lift">
            <CardHeader className="py-3 px-4 border-b border-border">
              <CardTitle className="text-sm font-semibold tracking-tight">Active Agent Loops</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {agents?.map(agent => (
                  <div key={agent.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{agent.name}</span>
                        <StatusBadge status={agent.status} />
                      </div>
                      <div className="text-xs text-muted-foreground flex gap-3">
                        <span className="font-mono">ID: {agent.id.slice(0,8)}</span>
                        <span>Model: {agent.model}</span>
                        <span>Channel: {agent.channel || 'None'}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm">{agent.tokensUsed.toLocaleString()} <span className="text-xs text-muted-foreground">tokens</span></div>
                      <div className="text-xs text-muted-foreground mt-1">{agent.loopCount} loops</div>
                    </div>
                  </div>
                ))}
                {!agents?.length && (
                  <div className="p-8 text-center text-sm text-muted-foreground">No agents found.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-1">
          <Card className="rounded-xl h-full flex flex-col lift">
            <CardHeader className="py-3 px-4 border-b border-border">
              <CardTitle className="text-sm font-semibold tracking-tight">Channel Webhooks</CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-y-auto">
              <div className="divide-y divide-border">
                {channels?.map(ch => (
                  <div key={ch.id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${ch.enabled ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
                        <span className="font-medium text-sm uppercase">{ch.channel}</span>
                      </div>
                      <span className="text-xs font-mono text-muted-foreground">{ch.eventsReceived} events</span>
                    </div>
                    <div className="text-xs text-muted-foreground truncate font-mono bg-muted p-1.5 rounded-sm">
                      {ch.webhookUrl || 'No webhook URL'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Last event: {ch.lastEvent ? format(new Date(ch.lastEvent), "MMM d, HH:mm:ss") : 'Never'}
                    </div>
                  </div>
                ))}
                {!channels?.length && (
                  <div className="p-8 text-center text-sm text-muted-foreground">No channels configured.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
