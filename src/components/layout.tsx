import type { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Terminal, Activity, Box, Search, List, Sparkles } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/dashboard", label: "Gateway Dashboard", icon: Activity },
    { href: "/run", label: "Run Agent", icon: Sparkles },
    { href: "/skills", label: "Skills Matrix", icon: Box },
    { href: "/trace", label: "Trace Inspector", icon: Search },
    { href: "/logs", label: "Memory Logs", icon: List },
  ];

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans">
      <aside className="w-60 border-r border-border bg-sidebar/80 backdrop-blur-xl text-sidebar-foreground flex flex-col">
        <div className="px-4 h-14 border-b border-border flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-foreground text-background flex items-center justify-center">
              <Terminal className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-sm tracking-tight">ClawStudio</span>
          </div>
          <ThemeToggle compact />
        </div>
        <nav className="flex-1 overflow-y-auto py-3 flex flex-col gap-0.5 px-2">
          <div className="px-2 pt-2 pb-1 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Platform
          </div>
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-2.5 px-2.5 py-1.5 text-sm rounded-md transition-all duration-150 ${
                  isActive
                    ? "bg-accent text-accent-foreground font-medium shadow-[inset_0_0_0_1px_hsl(var(--border))]"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                }`}
              >
                <item.icon className={`w-4 h-4 transition-colors ${isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-2 border-t border-border">
          <ThemeToggle />
        </div>
      </aside>
      <main className="flex-1 overflow-hidden bg-background relative flex flex-col">
        {children}
      </main>
    </div>
  );
}
