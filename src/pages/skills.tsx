import { useListSkills, useUpdateSkill } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";

export default function Skills() {
  const { data: skills, refetch } = useListSkills();
  const updateSkill = useUpdateSkill();

  const handlePolicyChange = (id: string, policy: any) => {
    updateSkill.mutate({ id, data: { executionPolicy: policy } }, {
      onSuccess: () => refetch()
    });
  };

  const handleEnabledChange = (id: string, enabled: boolean) => {
    updateSkill.mutate({ id, data: { enabled } }, {
      onSuccess: () => refetch()
    });
  };

  const getPolicyColor = (policy: string) => {
    if (policy === 'auto') return 'text-cyan-400';
    if (policy === 'manual') return 'text-amber-400';
    if (policy === 'restricted') return 'text-orange-400';
    return 'text-muted-foreground';
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-6">
      <div className="mb-6 flex justify-between items-end shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">MCP / Skills Matrix</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage registered tools and execution policies.</p>
        </div>
      </div>

      <div className="flex-1 overflow-hidden border border-border rounded-sm bg-card">
        <div className="overflow-auto h-full">
          <Table>
            <TableHeader className="bg-muted sticky top-0 z-10">
              <TableRow className="hover:bg-muted">
                <TableHead className="w-12 text-xs font-semibold uppercase">En</TableHead>
                <TableHead className="text-xs font-semibold uppercase">Skill</TableHead>
                <TableHead className="text-xs font-semibold uppercase">Category</TableHead>
                <TableHead className="text-xs font-semibold uppercase w-40">Policy</TableHead>
                <TableHead className="text-xs font-semibold uppercase text-right">Calls</TableHead>
                <TableHead className="text-xs font-semibold uppercase text-right">Avg Latency</TableHead>
                <TableHead className="text-xs font-semibold uppercase text-right">Last Called</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {skills?.map(skill => (
                <TableRow key={skill.id} className="py-1.5 h-10 group">
                  <TableCell className="py-1">
                    <Switch 
                      checked={skill.enabled} 
                      onCheckedChange={(val) => handleEnabledChange(skill.id, val)}
                    />
                  </TableCell>
                  <TableCell className="py-1">
                    <div className="font-mono text-sm">{skill.name}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-xs">{skill.description}</div>
                  </TableCell>
                  <TableCell className="py-1 text-sm text-muted-foreground">
                    {skill.category}
                  </TableCell>
                  <TableCell className="py-1">
                    <Select value={skill.executionPolicy} onValueChange={(val) => handlePolicyChange(skill.id, val)}>
                      <SelectTrigger className="h-7 text-xs border-border bg-background rounded-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto"><span className="text-cyan-400">Auto</span></SelectItem>
                        <SelectItem value="manual"><span className="text-amber-400">Manual</span></SelectItem>
                        <SelectItem value="restricted"><span className="text-orange-400">Restricted</span></SelectItem>
                        <SelectItem value="disabled"><span className="text-muted-foreground">Disabled</span></SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="py-1 text-right font-mono text-sm">
                    {skill.callCount.toLocaleString()}
                  </TableCell>
                  <TableCell className="py-1 text-right font-mono text-sm">
                    {skill.avgLatencyMs ? `${skill.avgLatencyMs}ms` : '-'}
                  </TableCell>
                  <TableCell className="py-1 text-right text-xs text-muted-foreground">
                    {skill.lastCalled ? format(new Date(skill.lastCalled), "MMM d, HH:mm") : 'Never'}
                  </TableCell>
                </TableRow>
              ))}
              {!skills?.length && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No skills registered.
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
