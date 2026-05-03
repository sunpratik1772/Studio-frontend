import { Moon, Sun, Palette, Waves, Check } from "lucide-react";
import { useTheme, type Theme } from "./theme-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const THEMES: { id: Theme; label: string; icon: typeof Sun; swatch: string }[] = [
  { id: "dark", label: "Dark", icon: Moon, swatch: "bg-neutral-900 ring-neutral-700" },
  { id: "light", label: "Light", icon: Sun, swatch: "bg-white ring-neutral-300" },
  { id: "claude", label: "Claude — Warm", icon: Palette, swatch: "bg-[#F4EFE6] ring-[#D97757]" },
  { id: "turquoise", label: "Turquoise — Matte", icon: Waves, swatch: "bg-[#DDEFEE] ring-[#3FA6A0]" },
];

function ActiveIcon({ theme, className }: { theme: Theme; className?: string }) {
  const entry = THEMES.find((t) => t.id === theme) ?? THEMES[0]!;
  const Icon = entry.icon;
  return <Icon className={className} />;
}

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();

  if (compact) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Choose theme"
            data-testid="button-theme-toggle"
            className="h-8 w-8"
          >
            <ActiveIcon theme={theme} className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-medium">
            Theme
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {THEMES.map((t) => {
            const Icon = t.icon;
            const active = t.id === theme;
            return (
              <DropdownMenuItem
                key={t.id}
                onSelect={() => setTheme(t.id)}
                data-testid={`menu-theme-${t.id}`}
                className="gap-2 text-sm"
              >
                <span className={`w-3.5 h-3.5 rounded-full ring-2 ${t.swatch}`} />
                <Icon className="w-3.5 h-3.5" />
                <span className="flex-1">{t.label}</span>
                {active && <Check className="w-3.5 h-3.5 text-foreground" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Full sidebar variant — render the full picker inline (no dropdown nesting needed).
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          data-testid="button-theme-toggle"
          aria-label="Choose theme"
          className="flex w-full items-center gap-3 px-3 py-2 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors"
        >
          <ActiveIcon theme={theme} className="w-4 h-4" />
          <span className="flex-1 text-left">Theme</span>
          <span className="text-[10px] uppercase tracking-[0.12em] opacity-70">
            {THEMES.find((t) => t.id === theme)?.label}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-52">
        <DropdownMenuLabel className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-medium">
          Theme
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {THEMES.map((t) => {
          const Icon = t.icon;
          const active = t.id === theme;
          return (
            <DropdownMenuItem
              key={t.id}
              onSelect={() => setTheme(t.id)}
              data-testid={`menu-theme-${t.id}-full`}
              className="gap-2 text-sm"
            >
              <span className={`w-3.5 h-3.5 rounded-full ring-2 ${t.swatch}`} />
              <Icon className="w-3.5 h-3.5" />
              <span className="flex-1">{t.label}</span>
              {active && <Check className="w-3.5 h-3.5 text-foreground" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
