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
          "Year-at-a-glance timeline of major recurring programs: GSoC, Imagine Cup, Google STEP, Microsoft, Amazon SDE, Outreachy, MLH.",
      },
      { property: "og:title", content: "Program Calendar — InternPulse" },
      {
        property: "og:description",
        content:
          "See when the world's most popular student tech programs open, select, and finalize — mapped across the year.",
      },
    ],
  }),
});

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
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

const SEASONS: Record<string, number[]> = {
  spring: [3, 4, 5],
  summer: [6, 7, 8],
  fall: [9, 10, 11],
  autumn: [9, 10, 11],
  winter: [12, 1, 2],
};

// Type color palettes: [lightest, medium, darkest]
const TYPE_SHADES: Record<OppType, [string, string, string]> = {
  internship: ["bg-blue-100", "bg-blue-300", "bg-blue-500"],
  research: ["bg-purple-100", "bg-purple-300", "bg-purple-500"],
  hackathon: ["bg-pink-100", "bg-pink-300", "bg-pink-500"],
  conference: ["bg-teal-100", "bg-teal-300", "bg-teal-500"],
  workshop: ["bg-amber-100", "bg-amber-300", "bg-amber-500"],
};

const TYPE_TEXT: Record<OppType, string> = {
  internship: "text-blue-700",
  research: "text-purple-700",
  hackathon: "text-pink-700",
  conference: "text-teal-700",
  workshop: "text-amber-700",
};

function rangeMonths(a: number, b: number): number[] {
  // inclusive; supports wrap (e.g. Oct-Jan → 10,11,12,1)
  const out: number[] = [];
  let m = a;
  while (true) {
    out.push(m);
    if (m === b) break;
    m = m === 12 ? 1 : m + 1;
    if (out.length > 12) break;
  }
  return out;
}

function parseTimeline(text: string | null | undefined): number[] {
  if (!text) return [];
  const lower = text.toLowerCase();
  if (/(year-round|rolling|ongoing)/.test(lower)) {
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  }
  const months = new Set<number>();
  // Split on "/", ",", "and", "&"
  const segments = lower.split(/\/|,| and |&/);
  for (const seg of segments) {
    const s = seg.trim();
    if (!s) continue;
    // season word
    for (const [word, arr] of Object.entries(SEASONS)) {
      if (s.includes(word)) arr.forEach((m) => months.add(m));
    }
    // range like "mar-apr" or single "may"
    const rangeMatch = s.match(/([a-z]+)\s*(?:-|–|to)\s*([a-z]+)/);
    if (rangeMatch) {
      const a = MONTH_INDEX[rangeMatch[1]];
      const b = MONTH_INDEX[rangeMatch[2]];
      if (a && b) rangeMonths(a, b).forEach((m) => months.add(m));
      continue;
    }
    // single month tokens
    const tokens = s.match(/[a-z]+/g) ?? [];
    for (const t of tokens) {
      const idx = MONTH_INDEX[t];
      if (idx) months.add(idx);
    }
  }
  return [...months].sort((a, b) => a - b);
}

function earliestUpcomingMonth(months: number[], currentMonth: number): number {
  if (months.length === 0) return 99;
  const upcoming = months.filter((m) => m >= currentMonth);
  if (upcoming.length) return upcoming[0] - currentMonth;
  return 12 - currentMonth + months[0];
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
  const currentMonth = new Date().getMonth() + 1; // 1..12

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  const rows = useMemo(() => {
    return (data ?? []).map((o) => ({
      opp: o,
      startMonths: parseTimeline(o.timeline_start),
      selectionMonths: parseTimeline(o.timeline_selection),
      endMonths: parseTimeline(o.timeline_end),
    }));
  }, [data]);

  const mobileSorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      const all = (r: typeof a) =>
        [...r.startMonths, ...r.selectionMonths, ...r.endMonths];
      return earliestUpcomingMonth(all(a), currentMonth) - earliestUpcomingMonth(all(b), currentMonth);
    });
  }, [rows, currentMonth]);

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
            A year-at-a-glance view of the world's most-tracked student tech programs. Shading shows when
            applications open, when selection happens, and when results land.
          </p>
        </div>

        {/* Legend */}
        <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-[#6B7280]">
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-6 rounded-sm bg-blue-100 border border-blue-200" />
            <span>Applications open</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-6 rounded-sm bg-blue-300" />
            <span>Selection</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-6 rounded-sm bg-blue-500" />
            <span>Results / final</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-6 rounded-sm bg-[#4F46E5]/15 border border-[#4F46E5]/40" />
            <span>Current month</span>
          </div>
        </div>

        {isLoading && (
          <div className="rounded-xl border border-border bg-white p-8 text-sm text-[#6B7280]">Loading…</div>
        )}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-sm text-red-700">
            Couldn't load calendar. Please try again.
          </div>
        )}

        {!isLoading && !error && rows.length === 0 && (
          <div className="rounded-xl border border-border bg-white p-8 text-sm text-[#6B7280]">
            No featured programs yet.
          </div>
        )}

        {!isLoading && !error && rows.length > 0 && (
          <>
            {/* Desktop grid */}
            <div className="hidden md:block rounded-xl border border-border bg-white overflow-hidden">
              {/* Header row */}
              <div
                className="grid text-xs font-semibold text-[#111827] bg-[#F9FAFB] border-b border-border"
                style={{ gridTemplateColumns: "220px repeat(12, minmax(0, 1fr))" }}
              >
                <div className="px-4 py-3">Program</div>
                {MONTHS.map((m, i) => {
                  const isCurrent = i + 1 === currentMonth;
                  return (
                    <div
                      key={m}
                      className={`px-2 py-3 text-center ${isCurrent ? "bg-[#4F46E5]/10 text-[#4F46E5]" : ""}`}
                    >
                      {m}
                    </div>
                  );
                })}
              </div>

              {/* Program rows */}
              {rows.map(({ opp, startMonths, selectionMonths, endMonths }) => (
                <button
                  key={opp.id}
                  onClick={() => setSelected(opp)}
                  className="w-full grid items-stretch text-left border-b border-border last:border-b-0 hover:bg-[#F9FAFB] transition"
                  style={{ gridTemplateColumns: "220px repeat(12, minmax(0, 1fr))" }}
                >
                  <div className="px-4 py-4 flex flex-col justify-center">
                    <span className="text-sm font-semibold text-[#111827] leading-tight">{opp.title}</span>
                    <span className={`text-[10px] uppercase tracking-wide mt-0.5 ${TYPE_TEXT[opp.type]}`}>
                      {opp.type}
                    </span>
                  </div>
                  {MONTHS.map((_, i) => {
                    const monthNum = i + 1;
                    const isCurrent = monthNum === currentMonth;
                    const inEnd = endMonths.includes(monthNum);
                    const inSel = selectionMonths.includes(monthNum);
                    const inStart = startMonths.includes(monthNum);
                    const [light, mid, dark] = TYPE_SHADES[opp.type];
                    const cls = inEnd ? dark : inSel ? mid : inStart ? light : "";
                    return (
                      <div
                        key={i}
                        className={`relative min-h-[42px] border-l border-border/60 ${cls} ${
                          isCurrent && !cls ? "bg-[#4F46E5]/5" : ""
                        } ${isCurrent ? "ring-1 ring-inset ring-[#4F46E5]/30" : ""}`}
                      />
                    );
                  })}
                </button>
              ))}
            </div>

            {/* Mobile stacked list */}
            <div className="md:hidden space-y-3">
              {mobileSorted.map(({ opp }) => (
                <button
                  key={opp.id}
                  onClick={() => setSelected(opp)}
                  className="w-full text-left rounded-xl border border-border bg-white p-4 hover:border-primary/40 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-semibold text-[#111827] leading-tight">{opp.title}</h3>
                    <span className={`text-[10px] uppercase tracking-wide ${TYPE_TEXT[opp.type]}`}>
                      {opp.type}
                    </span>
                  </div>
                  <dl className="mt-3 space-y-1.5 text-xs">
                    <div className="flex gap-2">
                      <dt className="text-[#6B7280] w-24 shrink-0">Applications</dt>
                      <dd className="text-[#111827]">{opp.timeline_start || "—"}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="text-[#6B7280] w-24 shrink-0">Selection</dt>
                      <dd className="text-[#111827]">{opp.timeline_selection || "—"}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="text-[#6B7280] w-24 shrink-0">Results</dt>
                      <dd className="text-[#111827]">{opp.timeline_end || "—"}</dd>
                    </div>
                  </dl>
                </button>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Modal */}
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
              <div>
                <h2 className="text-lg font-bold text-[#111827] leading-tight">{selected.title}</h2>
                <span className={`text-[10px] uppercase tracking-wide ${TYPE_TEXT[selected.type]}`}>
                  {selected.type}
                </span>
              </div>
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
