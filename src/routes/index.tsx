import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, MapPin, Sparkles, ExternalLink, Filter, X, Bookmark } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Opportunity = {
  id: string;
  title: string;
  organization: string;
  type: "internship" | "research" | "hackathon" | "conference" | "workshop";
  location_type: "remote" | "onsite_pk" | "onsite_global";
  pakistan_friendly: boolean;
  skill_level: "beginner" | "intermediate" | "advanced";
  paid: boolean;
  deadline: string;
  description: string;
  apply_url: string;
  tags: string[];
  created_at: string;
};

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "InternPulse — Live Opportunities for Pakistani Students" },
      {
        name: "description",
        content:
          "Internships, research, hackathons, conferences, and workshops — open right now, filterable, and Pakistan-friendly.",
      },
    ],
  }),
});

type TypeKey = Opportunity["type"];
type LocKey = Opportunity["location_type"];
type LevelKey = Opportunity["skill_level"];

const TYPE_LABEL: Record<TypeKey, string> = {
  internship: "Internship",
  research: "Research",
  hackathon: "Hackathon",
  conference: "Conference",
  workshop: "Workshop",
};

const TYPE_CLASSES: Record<TypeKey, string> = {
  internship: "bg-type-internship/15 text-type-internship border border-type-internship/25",
  research: "bg-type-research/15 text-type-research border border-type-research/25",
  hackathon: "bg-type-hackathon/15 text-type-hackathon border border-type-hackathon/25",
  conference: "bg-type-conference/15 text-type-conference border border-type-conference/25",
  workshop: "bg-type-workshop/20 text-type-workshop border border-type-workshop/30",
};

const LOC_LABEL: Record<LocKey, string> = {
  remote: "Remote",
  onsite_pk: "Onsite — Pakistan",
  onsite_global: "Onsite — Global",
};

function daysUntil(dateStr: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + "T00:00:00");
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

function deadlineLabel(dateStr: string) {
  const d = daysUntil(dateStr);
  if (d < 0) return "Closed";
  if (d === 0) return "Closes today";
  if (d === 1) return "1 day left";
  return `${d} days left`;
}

function Index() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["opportunities"],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from("opportunities")
        .select("*")
        .gte("deadline", today)
        .order("deadline", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Opportunity[];
    },
  });

  const [query, setQuery] = useState("");
  const [types, setTypes] = useState<Set<TypeKey>>(new Set());
  const [locs, setLocs] = useState<Set<LocKey>>(new Set());
  const [levels, setLevels] = useState<Set<LevelKey>>(new Set());
  const [paidFilter, setPaidFilter] = useState<"any" | "paid" | "unpaid">("any");
  const [deadlineWindow, setDeadlineWindow] = useState<"any" | "7" | "30">("any");

  function toggle<T>(set: Set<T>, val: T, setter: (s: Set<T>) => void) {
    const next = new Set(set);
    next.has(val) ? next.delete(val) : next.add(val);
    setter(next);
  }

  const filtered = useMemo(() => {
    const list = data ?? [];
    const q = query.trim().toLowerCase();
    return list.filter((o) => {
      if (q) {
        const hay = `${o.title} ${o.organization} ${o.description} ${o.tags.join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (types.size && !types.has(o.type)) return false;
      if (locs.size && !locs.has(o.location_type)) return false;
      if (levels.size && !levels.has(o.skill_level)) return false;
      if (paidFilter === "paid" && !o.paid) return false;
      if (paidFilter === "unpaid" && o.paid) return false;
      if (deadlineWindow !== "any") {
        const d = daysUntil(o.deadline);
        if (d > Number(deadlineWindow)) return false;
      }
      return true;
    });
  }, [data, query, types, locs, levels, paidFilter, deadlineWindow]);

  const activeFilterCount =
    types.size +
    locs.size +
    levels.size +
    (paidFilter !== "any" ? 1 : 0) +
    (deadlineWindow !== "any" ? 1 : 0);

  function clearAll() {
    setQuery("");
    setTypes(new Set());
    setLocs(new Set());
    setLevels(new Set());
    setPaidFilter("any");
    setDeadlineWindow("any");
  }

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur sticky top-0 z-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground grid place-items-center font-bold">
              iP
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight leading-none">InternPulse</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Live opportunities for Pakistani students
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="h-4 w-4 text-accent" />
              <span>Beginner-friendly picks welcome</span>
            </div>
            <Link
              to="/calendar"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium hover:border-primary/40 hover:text-primary transition"
            >
              Calendar
            </Link>
            <Link
              to="/saved"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium hover:border-primary/40 hover:text-primary transition"
            >
              <Bookmark className="h-4 w-4" />
              Saved
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero + search */}
        <section className="mb-8">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Find what's <span className="text-primary">open right now</span>.
          </h2>
          <p className="mt-2 text-muted-foreground max-w-2xl">
            Curated internships, research positions, hackathons, conferences, and workshops —
            with clear tags for Pakistan-friendly and beginner-level opportunities.
          </p>

          <div className="mt-6 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, organization, or tag…"
              className="w-full h-12 pl-12 pr-4 rounded-xl border border-border bg-card shadow-sm outline-none focus:ring-2 focus:ring-ring focus:border-ring"
            />
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
          {/* Filters */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold">Filters</h3>
                  {activeFilterCount > 0 && (
                    <span className="text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5">
                      {activeFilterCount}
                    </span>
                  )}
                </div>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearAll}
                    className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                  >
                    <X className="h-3 w-3" /> Clear
                  </button>
                )}
              </div>

              <FilterGroup title="Type">
                {(Object.keys(TYPE_LABEL) as TypeKey[]).map((t) => (
                  <Chip
                    key={t}
                    active={types.has(t)}
                    onClick={() => toggle(types, t, setTypes)}
                  >
                    {TYPE_LABEL[t]}
                  </Chip>
                ))}
              </FilterGroup>

              <FilterGroup title="Location">
                {(Object.keys(LOC_LABEL) as LocKey[]).map((l) => (
                  <Chip
                    key={l}
                    active={locs.has(l)}
                    onClick={() => toggle(locs, l, setLocs)}
                  >
                    {LOC_LABEL[l]}
                  </Chip>
                ))}
              </FilterGroup>

              <FilterGroup title="Skill level">
                {(["beginner", "intermediate", "advanced"] as LevelKey[]).map((l) => (
                  <Chip
                    key={l}
                    active={levels.has(l)}
                    onClick={() => toggle(levels, l, setLevels)}
                  >
                    {l[0].toUpperCase() + l.slice(1)}
                  </Chip>
                ))}
              </FilterGroup>

              <FilterGroup title="Paid">
                {(["any", "paid", "unpaid"] as const).map((p) => (
                  <Chip
                    key={p}
                    active={paidFilter === p}
                    onClick={() => setPaidFilter(p)}
                  >
                    {p[0].toUpperCase() + p.slice(1)}
                  </Chip>
                ))}
              </FilterGroup>

              <FilterGroup title="Deadline within">
                {([
                  ["any", "Any time"],
                  ["7", "Next 7 days"],
                  ["30", "Next 30 days"],
                ] as const).map(([v, label]) => (
                  <Chip
                    key={v}
                    active={deadlineWindow === v}
                    onClick={() => setDeadlineWindow(v)}
                  >
                    {label}
                  </Chip>
                ))}
              </FilterGroup>
            </div>
          </aside>

          {/* Grid */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {isLoading
                  ? "Loading opportunities…"
                  : `${filtered.length} ${filtered.length === 1 ? "opportunity" : "opportunities"}`}
              </p>
            </div>

            {error && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm">
                Couldn't load opportunities. Please refresh in a moment.
              </div>
            )}

            {!isLoading && !error && filtered.length === 0 && (
              <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
                <p className="font-semibold">No matches yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Try clearing a filter or broadening your search.
                </p>
                <button
                  onClick={clearAll}
                  className="mt-4 inline-flex items-center rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90"
                >
                  Clear filters
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {isLoading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-56 rounded-xl border border-border bg-card animate-pulse"
                  />
                ))}

              {filtered.map((o) => (
                <Card key={o.id} o={o} />
              ))}
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t border-border mt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 text-xs text-muted-foreground">
          Built for CS/IT students across Pakistan. Deadlines refreshed regularly.
        </div>
      </footer>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5 last:mb-0">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
        {title}
      </h4>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "px-2.5 py-1 rounded-full text-xs font-medium border transition " +
        (active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-background text-foreground border-border hover:border-primary/40")
      }
    >
      {children}
    </button>
  );
}

function Card({ o }: { o: Opportunity }) {
  const d = daysUntil(o.deadline);
  const urgent = d <= 7;
  const beginner = o.skill_level === "beginner";

  return (
    <article className="group relative flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition">
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className={
            "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold " +
            TYPE_CLASSES[o.type]
          }
        >
          {TYPE_LABEL[o.type]}
        </span>
        {o.pakistan_friendly && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-success/15 text-success border border-success/25">
            🇵🇰 Pakistan-friendly
          </span>
        )}
        {beginner && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-accent/20 text-accent border border-accent/30">
            <Sparkles className="h-3 w-3" /> Beginner-friendly
          </span>
        )}
      </div>

      <h3 className="mt-3 font-semibold text-base leading-snug line-clamp-2">
        <Link
          to="/opportunity/$id"
          params={{ id: o.id }}
          className="hover:text-primary transition-colors before:absolute before:inset-0"
        >
          {o.title}
        </Link>
      </h3>
      <p className="text-sm text-muted-foreground">{o.organization}</p>

      {o.description && (
        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{o.description}</p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <Meta>
          <MapPin className="h-3 w-3" />
          {LOC_LABEL[o.location_type]}
        </Meta>
        <Meta>{o.skill_level[0].toUpperCase() + o.skill_level.slice(1)}</Meta>
        <Meta>{o.paid ? "Paid" : "Unpaid"}</Meta>
      </div>

      <div className="mt-auto pt-4 flex items-center justify-between gap-3">
        <span
          className={
            "text-sm font-semibold " + (urgent ? "text-urgent" : "text-muted-foreground")
          }
        >
          {deadlineLabel(o.deadline)}
        </span>
        <a
          href={o.apply_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="relative z-10 inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-sm font-medium hover:bg-primary/90"
        >
          Apply Now <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </article>
  );
}

function Meta({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-muted text-muted-foreground px-1.5 py-0.5 text-xs">
      {children}
    </span>
  );
}
