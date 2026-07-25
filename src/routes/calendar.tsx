import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Bookmark, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type OppType = "internship" | "research" | "hackathon" | "conference" | "workshop";

type FeaturedOpp = {
  id: string;
  title: string;
  type: OppType;
  apply_url: string;
  timeline_start: string | null;
  timeline_selection: string | null;
  timeline_end: string | null;
};

export const Route = createFileRoute("/calendar")({
  component: CalendarPage,
  head: () => ({
    meta: [
      { title: "Program Calendar — InternPulse" },
      {
        name: "description",
        content:
          "Year-at-a-glance grid of major recurring student tech programs — GSoC, Imagine Cup, Google STEP, Microsoft, Amazon SDE, Outreachy, MLH — organized by month.",
      },
      { property: "og:title", content: "Program Calendar — InternPulse" },
      {
        property: "og:description",
        content:
          "See which student tech programs open each month across the year.",
      },
    ],
  }),
});

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const MONTH_INDEX: Record<string, number> = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

const SEASONS: Record<string, number> = {
  spring: 3,
  summer: 6,
  fall: 9,
  autumn: 9,
  winter: 12,
};

const TYPE_DOT: Record<OppType, string> = {
  internship: "bg-blue-500",
  research: "bg-purple-500",
  hackathon: "bg-pink-500",
  conference: "bg-teal-500",
  workshop: "bg-amber-500",
};

function firstMonth(text: string | null | undefined): number | null {
  if (!text) return null;
  const lower = text.toLowerCase();
  if (/(year-round|rolling|ongoing)/.test(lower)) return 1;
  // Season first-mention
  for (const [word, m] of Object.entries(SEASONS)) {
    if (lower.includes(word)) {
      // find token position to compare with month token position later
      // simpler: pick the earliest between explicit month token and season
    }
  }
  // Find first month token
  const tokens = lower.match(/[a-z]+/g) ?? [];
  for (const t of tokens) {
    if (MONTH_INDEX[t]) return MONTH_INDEX[t];
    if (SEASONS[t]) return SEASONS[t];
  }
  return null;
}

function CalendarPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["opportunities", "featured_calendar"],
    queryFn: async (): Promise<FeaturedOpp[]> => {
      const { data, error } = await supabase
        .from("opportunities")
        .select("id, title, type, apply_url, timeline_start, timeline_selection, timeline_end")
        .eq("featured_calendar", true)
        .order("title");
      if (error) throw error;
      return (data ?? []) as FeaturedOpp[];
    },
  });

  const [selected, setSelected] = useState<FeaturedOpp | null>(null);
  const currentMonth = new Date().getMonth() + 1;

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  const byMonth = useMemo(() => {
    const map: Record<number, FeaturedOpp[]> = {};
    for (let i = 1; i <= 12; i++) map[i] = [];
    for (const o of data ?? []) {
      const m = firstMonth(o.timeline_start);
      if (m) map[m].push(o);
    }
    return map;
  }, [data]);

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <header className="border-b border-border bg-white/80 backdrop-blur sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-[#111827] hover:text-primary">
            <ArrowLeft className="h-4 w-4" />
            InternPulse
          </Link>
          <nav className="flex items-center gap-2">
            <Link
              to="/saved"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium hover:border-primary/40 hover:text-primary transition"
            >
              <Bookmark className="h-4 w-4" />
              Saved
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#111827]">
            Program Calendar
          </h1>
          <p className="mt-2 text-sm text-[#6B7280] max-w-2xl">
            A year-at-a-glance view of the world's most-tracked student tech programs, organized by the month their applications open.
          </p>
        </div>

        {isLoading && (
          <div className="rounded-xl border border-border bg-white p-8 text-sm text-[#6B7280]">Loading…</div>
        )}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-sm text-red-700">
            Couldn't load calendar. Please try again.
          </div>
        )}

        {!isLoading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {MONTHS.map((name, i) => {
              const m = i + 1;
              const isCurrent = m === currentMonth;
              const items = byMonth[m] ?? [];
              return (
                <div
                  key={name}
                  className={`rounded-xl bg-white shadow-sm border p-4 min-h-[160px] flex flex-col ${
                    isCurrent
                      ? "border-[#4F46E5] ring-1 ring-[#4F46E5]/30 bg-[#4F46E5]/[0.03]"
                      : "border-border"
                  }`}
                >
                  <div className="flex items-baseline justify-between mb-3">
                    <h2 className={`text-sm font-bold ${isCurrent ? "text-[#4F46E5]" : "text-[#111827]"}`}>
                      {name}
                    </h2>
                    {isCurrent && (
                      <span className="text-[10px] uppercase tracking-wide font-semibold text-[#4F46E5]">
                        This month
                      </span>
                    )}
                  </div>
                  <ul className="space-y-1.5">
                    {items.map((opp) => (
                      <li key={opp.id}>
                        <button
                          onClick={() => setSelected(opp)}
                          className="w-full text-left flex items-center gap-2 rounded-md px-1.5 py-1 -mx-1.5 hover:bg-[#F9FAFB] transition"
                        >
                          <span
                            className={`inline-block h-2 w-2 shrink-0 rounded-full ${TYPE_DOT[opp.type]}`}
                            aria-hidden
                          />
                          <span className="text-sm text-[#111827] leading-tight truncate">
                            {opp.title}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-bold text-[#111827] leading-tight flex items-center gap-2">
                <span className={`inline-block h-2.5 w-2.5 rounded-full ${TYPE_DOT[selected.type]}`} />
                {selected.title}
              </h2>
              <button
                onClick={() => setSelected(null)}
                className="text-[#6B7280] hover:text-[#111827] text-xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <dl className="mt-5 space-y-2 text-sm">
              <div className="flex gap-2">
                <dt className="text-[#6B7280] w-28 shrink-0">Applications:</dt>
                <dd className="text-[#111827]">{selected.timeline_start || "—"}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-[#6B7280] w-28 shrink-0">Selection:</dt>
                <dd className="text-[#111827]">{selected.timeline_selection || "—"}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-[#6B7280] w-28 shrink-0">Results:</dt>
                <dd className="text-[#111827]">{selected.timeline_end || "—"}</dd>
              </div>
            </dl>
            <a
              href={selected.apply_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#4F46E5] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#4338CA] transition"
            >
              Apply
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
