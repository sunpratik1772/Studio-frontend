import React, { useState } from "react";
import { useListLogs } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { ChevronDown, ChevronRight, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export default function Logs() {
  const [filterType, setFilterType] = useState<string>("all");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const { data: logs } = useListLogs({
    type: filterType !== "all" ? filterType as any : undefined,
    limit: 100
  });

  const toggleRow = (id: string) => {
    const next = new Set(expandedRows);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedRows(next);
  };

  const getLevelColor = (level: string) => {
    if (level === 'error') return 'text-red-500 font-bold';
    if (level === 'warn') return 'text-yellow-500 font-medium';
    if (level === 'info') return 'text-slate-300';
    if (level === 'debug') return 'text-slate-500';
    return 'text-foreground';
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-6">
      <div className="mb-6 flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Memory Logs</h1>
          <p className="text-sm text-muted-foreground mt-1">System-wide log stream and memory events.</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px] rounded-sm h-9 bg-card">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="memory">Memory</SelectItem>
              <SelectItem value="trace">Trace</SelectItem>
              <SelectItem value="tool_call">Tool Call</SelectItem>
              <SelectItem value="webhook">Webhook</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 overflow-hidden border border-border rounded-sm bg-card flex flex-col">
        <div className="overflow-auto flex-1">
          <Table>
            <TableHeader className="bg-muted sticky top-0 z-10">
              <TableRow className="hover:bg-muted">
                <TableHead className="w-8"></TableHead>
                <TableHead className="w-32 text-xs font-semibold uppercase">Timestamp</TableHead>
                <TableHead className="w-24 text-xs font-semibold uppercase">Level</TableHead>
                <TableHead className="w-32 text-xs font-semibold uppercase">Type</TableHead>
                <TableHead className="w-32 text-xs font-semibold uppercase">Agent/Tool</TableHead>
                <TableHead className="text-xs font-semibold uppercase">Message</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs?.map(log => {
                const isExpanded = expandedRows.has(log.id);
                return (
                  <React.Fragment key={log.id}>
                    <TableRow className="py-1 h-9 cursor-pointer group" onClick={() => toggleRow(log.id)}>
                      <TableCell className="p-1 pl-3">
                        {log.payload && Object.keys(log.payload).length > 0 ? (
                          isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        ) : null}
                      </TableCell>
                      <TableCell className="p-1 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                        {format(new Date(log.timestamp), "MM-dd HH:mm:ss.SSS")}
                      </TableCell>
                      <TableCell className={`p-1 text-xs uppercase tracking-wider ${getLevelColor(log.level)}`}>
                        {log.level}
                      </TableCell>
                      <TableCell className="p-1 text-xs text-muted-foreground">
                        {log.type}
                      </TableCell>
                      <TableCell className="p-1">
                        <div className="font-mono text-[11px] text-primary truncate max-w-[120px]">
                          {log.toolName || log.agentId?.slice(0,8) || '-'}
                        </div>
                      </TableCell>
                      <TableCell className="p-1 text-xs font-mono truncate max-w-[500px]">
                        {log.message}
                      </TableCell>
                    </TableRow>
                    {isExpanded && log.payload && (
                      <TableRow className="bg-muted/30 border-0 hover:bg-muted/30">
                        <TableCell colSpan={6} className="p-0 border-0">
                          <div className="p-4 pl-12 bg-black/40 text-[11px] font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap">
                            {JSON.stringify(log.payload, null, 2)}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
              {!logs?.length && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No logs found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
