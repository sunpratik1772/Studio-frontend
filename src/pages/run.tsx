import { useEffect, useMemo, useRef, useState } from "react";
import {
  useRunAgentOnce,
  type AgentRunResult,
  type AgentRunStep,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import {
  ArrowUp,
  Sparkles,
  Wrench,
  CheckCircle2,
  Brain,
  ChevronDown,
  ChevronRight,
  Plus,
} from "lucide-react";

const SUGGESTIONS = [
  {
    label: "Define ClawStudio",
    prompt: "In one sentence, what is ClawStudio?",
  },
  {
    label: "What time is it?",
    prompt: "What is the current time in UTC and in America/New_York?",
  },
  {
    label: "Chained math + lookup",
    prompt:
      "Calculate the square root of 144, then raise 2 to that result, then look up what TypeScript is. Summarize all three findings in one paragraph.",
  },
  {
    label: "Notify the ops channel",
    prompt:
      "Look up what Replit is, calculate 25 * 4, then notify the #ops channel on Slack with a one-line summary.",
  },
];

interface ChatTurn {
  id: string;
  prompt: string;
  result: AgentRunResult | null;
  pending: boolean;
  error: string | null;
}

function nanoTurnId() {
  return `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

/** A single thinking row — model | tool_call | tool_result. */
function ThinkingStep({ step, index }: { step: AgentRunStep; index: number }) {
  const [open, setOpen] = useState(false);

  const meta = useMemo(() => {
    switch (step.type) {
      case "model":
        return { icon: Brain, color: "text-blue-500 dark:text-blue-400", label: "Reasoning" };
      case "tool_call":
        return { icon: Wrench, color: "text-violet-500 dark:text-violet-400", label: `Calling ${step.toolName}` };
      case "tool_result":
        return { icon: CheckCircle2, color: "text-emerald-500 dark:text-emerald-400", label: `Result from ${step.toolName}` };
      case "final":
        return { icon: Sparkles, color: "text-amber-500 dark:text-amber-400", label: "Final answer" };
    }
  }, [step]);

  if (!meta) return null;
  const Icon = meta.icon;

  // The final answer is rendered separately as the assistant bubble — skip it here.
  if (step.type === "final") return null;

  const expandable = step.text || step.toolArgs != null || step.toolResult != null;

  return (
    <div
      className="rise-in flex items-start gap-3 py-1.5 group"
      style={{ animationDelay: `${index * 60}ms` }}
      data-testid={`thinking-step-${index}`}
    >
      <div className={`mt-0.5 flex-shrink-0 ${meta.color}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <button
        type="button"
        onClick={() => expandable && setOpen((v) => !v)}
        className="flex-1 text-left"
        disabled={!expandable}
      >
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {expandable &&
            (open ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            ))}
          <span className={!expandable ? "pl-4" : ""}>{meta.label}</span>
          <span className="ml-auto font-mono text-[10px] opacity-60">{step.durationMs}ms</span>
        </div>
        {open && expandable && (
          <div className="mt-1.5 pl-4 space-y-1 rise-in">
            {step.text && (
              <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap">
                {step.text}
              </p>
            )}
            {step.toolArgs != null && (
              <pre className="text-[10px] font-mono bg-muted/60 border border-border rounded-md px-2 py-1.5 overflow-x-auto">
                {JSON.stringify(step.toolArgs, null, 2)}
              </pre>
            )}
            {step.toolResult != null && (
              <pre className="text-[10px] font-mono text-emerald-600 dark:text-emerald-300/90 bg-muted/60 border border-border rounded-md px-2 py-1.5 overflow-x-auto">
                {JSON.stringify(step.toolResult, null, 2)}
              </pre>
            )}
          </div>
        )}
      </button>
    </div>
  );
}

function ThinkingBlock({ steps, pending }: { steps: AgentRunStep[]; pending: boolean }) {
  const visible = steps.filter((s) => s.type !== "final");
  const [collapsed, setCollapsed] = useState(false);

  if (visible.length === 0 && !pending) return null;

  return (
    <div className="border border-border rounded-xl bg-card/60 backdrop-blur-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-medium hover:bg-accent/40 transition-colors"
      >
        <Brain className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-foreground">
          {pending ? (
            <span className="inline-flex items-center gap-1.5">
              Thinking
              <span className="inline-flex gap-0.5 ml-1 text-foreground">
                <span className="think-dot" />
                <span className="think-dot" />
                <span className="think-dot" />
              </span>
            </span>
          ) : (
            <>Thought for {visible.length} step{visible.length === 1 ? "" : "s"}</>
          )}
        </span>
        <span className="ml-auto text-muted-foreground">
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </span>
      </button>
      {!collapsed && (
        <div className="px-4 pb-3 pt-1 border-t border-border">
          {visible.map((s, i) => (
            <ThinkingStep key={i} step={s} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function AssistantTurn({ turn }: { turn: ChatTurn }) {
  const finalAnswer =
    turn.result?.finalAnswer ??
    turn.result?.steps.find((s) => s.type === "final")?.text ??
    "";
  const steps = turn.result?.steps ?? [];

  return (
    <div className="space-y-3">
      {/* User message — right-aligned bubble */}
      <div className="flex justify-end rise-in">
        <div className="max-w-[80%] bg-accent text-accent-foreground rounded-2xl rounded-tr-md px-4 py-2.5 text-sm">
          {turn.prompt}
        </div>
      </div>

      {/* Assistant block */}
      <div className="flex gap-3 rise-in" style={{ animationDelay: "80ms" }}>
        <div className="flex-shrink-0 mt-1">
          <div className={`w-7 h-7 rounded-full bg-foreground text-background flex items-center justify-center ${turn.pending ? "thinking-ring" : ""}`}>
            <Sparkles className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="flex-1 min-w-0 space-y-3">
          <ThinkingBlock steps={steps} pending={turn.pending} />

          {turn.error && (
            <div className="text-sm text-destructive font-mono px-3 py-2 border border-destructive/40 rounded-md bg-destructive/5">
              {turn.error}
            </div>
          )}

          {finalAnswer && (
            <div className="rise-in">
              <p className="text-[15px] leading-relaxed text-foreground whitespace-pre-wrap">
                {finalAnswer}
                {turn.pending && <span className="caret" />}
              </p>
              {turn.result && (
                <div className="flex items-center gap-3 mt-2 text-[10px] font-mono text-muted-foreground">
                  <span>{turn.result.totalTokens.toLocaleString()} tok</span>
                  <span className="opacity-50">·</span>
                  <span>{turn.result.loops} loop{turn.result.loops === 1 ? "" : "s"}</span>
                  <span className="opacity-50">·</span>
                  <span>{turn.result.durationMs}ms</span>
                  <span className="opacity-50">·</span>
                  <span className={turn.result.status === "completed" ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}>
                    {turn.result.status}
                  </span>
                </div>
              )}
            </div>
          )}

          {turn.pending && !finalAnswer && (
            <p className="text-[15px] text-muted-foreground">
              <span className="caret" />
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Run() {
  const [input, setInput] = useState("");
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const mutation = useRunAgentOnce();

  // Always autoscroll to the bottom on new content.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [turns]);

  // Autosize the textarea up to ~200px.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [input]);

  const submit = (override?: string) => {
    const prompt = (override ?? input).trim();
    if (!prompt || mutation.isPending) return;

    const turnId = nanoTurnId();
    setTurns((prev) => [
      ...prev,
      { id: turnId, prompt, result: null, pending: true, error: null },
    ]);
    setInput("");

    mutation.mutate(
      { data: { prompt, model: "gemini-2.5-flash", maxSteps: 6 } },
      {
        onSuccess: (data) => {
          setTurns((prev) =>
            prev.map((t) =>
              t.id === turnId ? { ...t, result: data, pending: false } : t,
            ),
          );
        },
        onError: (err) => {
          setTurns((prev) =>
            prev.map((t) =>
              t.id === turnId
                ? { ...t, pending: false, error: (err as Error)?.message ?? "Run failed" }
                : t,
            ),
          );
        },
      },
    );
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const isEmpty = turns.length === 0;

  return (
    <div className="flex-1 flex flex-col h-full" data-testid="page-run">
      {/* Top bar — kept minimal so the page feels like a homepage. */}
      <div className="h-14 border-b border-border flex items-center px-6 flex-shrink-0">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="w-4 h-4 text-foreground" />
          <span>Agent</span>
          <span className="text-muted-foreground font-mono text-xs ml-2">gemini-2.5-flash</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto gap-1.5 text-xs"
          onClick={() => setTurns([])}
          disabled={mutation.isPending || turns.length === 0}
          data-testid="button-new-chat"
        >
          <Plus className="w-3.5 h-3.5" />
          New chat
        </Button>
      </div>

      {/* Scrollable content area. */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {isEmpty ? (
          /* Empty / homepage hero state — large centered greeting + suggestions. */
          <div className="min-h-full flex flex-col items-center justify-center px-6 py-16">
            <div className="w-full max-w-2xl text-center space-y-8 soft-fade">
              <div className="space-y-3">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-foreground text-background mx-auto">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h1 className="text-4xl font-semibold tracking-tight">
                  What can I help with?
                </h1>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Live Gemini orchestration with function calling. Ask anything — the agent picks the right tools.
                </p>
              </div>

              {/* Composer — large centered input on the homepage. */}
              <div className="w-full">
                <Composer
                  value={input}
                  onChange={setInput}
                  onSubmit={() => submit()}
                  onKeyDown={onKeyDown}
                  inputRef={inputRef}
                  pending={mutation.isPending}
                  large
                />
              </div>

              {/* Suggestion cards. */}
              <div className="grid grid-cols-2 gap-2 text-left">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={s.label}
                    type="button"
                    className="rise-in lift border border-border rounded-xl p-3 hover:border-foreground/30 transition-colors group bg-card/40"
                    style={{ animationDelay: `${120 + i * 60}ms` }}
                    onClick={() => submit(s.prompt)}
                    data-testid={`suggestion-${i}`}
                  >
                    <div className="text-sm font-medium text-foreground">{s.label}</div>
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.prompt}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Conversation thread. */
          <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
            {turns.map((t) => (
              <AssistantTurn key={t.id} turn={t} />
            ))}
          </div>
        )}
      </div>

      {/* Sticky bottom composer — only when there's a conversation. */}
      {!isEmpty && (
        <div className="border-t border-border bg-background/80 backdrop-blur-xl px-6 py-4 flex-shrink-0">
          <div className="max-w-3xl mx-auto">
            <Composer
              value={input}
              onChange={setInput}
              onSubmit={() => submit()}
              onKeyDown={onKeyDown}
              inputRef={inputRef}
              pending={mutation.isPending}
            />
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              Press <kbd className="px-1 py-0.5 rounded bg-muted font-mono">Enter</kbd> to send · <kbd className="px-1 py-0.5 rounded bg-muted font-mono">Shift+Enter</kbd> for newline
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

interface ComposerProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  pending: boolean;
  large?: boolean;
}

function Composer({ value, onChange, onSubmit, onKeyDown, inputRef, pending, large }: ComposerProps) {
  return (
    <div
      className={`relative border border-border rounded-2xl bg-card transition-shadow focus-within:border-foreground/30 focus-within:shadow-[0_0_0_4px_hsl(var(--accent))] ${
        large ? "p-3" : "p-2.5"
      }`}
    >
      <textarea
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        rows={1}
        placeholder="Ask anything…"
        disabled={pending}
        data-testid="input-prompt"
        className={`w-full resize-none bg-transparent outline-none placeholder:text-muted-foreground text-foreground ${
          large ? "text-base px-2 py-1.5 min-h-[52px]" : "text-sm px-1.5 py-1 min-h-[28px]"
        }`}
        style={{ maxHeight: 200 }}
      />
      <div className="flex items-center justify-end mt-1">
        <Button
          onClick={onSubmit}
          disabled={pending || !value.trim()}
          size="icon"
          data-testid="button-run"
          className="h-8 w-8 rounded-full"
          aria-label="Send"
        >
          {pending ? (
            <span className="inline-flex gap-0.5 text-background">
              <span className="think-dot" />
              <span className="think-dot" />
              <span className="think-dot" />
            </span>
          ) : (
            <ArrowUp className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
