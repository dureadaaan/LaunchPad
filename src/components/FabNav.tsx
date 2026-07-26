import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Bookmark, CalendarDays, Compass, Plus, Sparkles, X } from "lucide-react";

const ITEMS = [
  { to: "/", label: "Opportunities", icon: Compass },
  { to: "/calendar", label: "Program Calendar", icon: CalendarDays },
  { to: "/saved", label: "Saved", icon: Bookmark },
  { to: "/match", label: "AI Match", icon: Sparkles },
] as const;

export function FabNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2 print:hidden">
      {open && (
        <nav className="mb-1 flex flex-col items-end gap-2">
          {ITEMS.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium shadow-lg hover:border-primary/40 hover:text-primary transition"
            >
              <Icon className="h-4 w-4 text-primary" />
              {label}
            </Link>
          ))}
        </nav>
      )}
      <button
        type="button"
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-xl grid place-items-center hover:bg-primary/90 transition"
      >
        {open ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </button>
    </div>
  );
}
