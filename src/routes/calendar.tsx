import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CompanyLogo } from "@/components/CompanyLogo";
import { TopBar } from "@/components/TopBar";

type OppType = "internship" | "research" | "hackathon" | "conference" | "workshop";

type FeaturedOpp = {
  id: string;
  title: string;
  organization: string;
  logo_url: string | null;
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
      { title: "Program Calendar — LaunchPad" },
      {
        name: "description",
        content:
          "Year-at-a-glance grid of major recurring student tech programs — GSoC, Imagine Cup, Google STEP, Microsoft, Amazon SDE, Outreachy, MLH — organized by month.",
      },
      { property: "og:title", content: "Program Calendar — LaunchPad" },
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


// Soft pastel pill for each program row
const TYPE_PILL: Record<OppType, string> = {
  internship: "bg-blue-100/70 text-blue-900",
  research: "bg-purple-100/70 text-purple-900",
  hackathon: "bg-pink-100/70 text-pink-900",
  conference: "bg-teal-100/70 text-teal-900",
  workshop: "bg-amber-100/70 text-amber-900",
};

// Soft pastel wash for card background based on dominant type
const TYPE_CARD_BG: Record<OppType, string> = {
  internship: "bg-blue-50",
  research: "bg-purple-50",
  hackathon: "bg-pink-50",
  conference: "bg-teal-50",
  workshop: "bg-amber-50",
};

function firstMonth(text: string | null | undefined): number | null {
  if (!text) return null;
  const lower = text.toLowerCase();
  if (/(year-round|rolling|ongoing)/.test(lower)) return 1;
  const tokens = lower.match(/[a-z]+/g) ?? [];
  for (const t of tokens) {
    if (MONTH_INDEX[t]) return MONTH_INDEX[t];
    if (SEASONS[t]) return SEASONS[t];
  }
  return null;
}

function dominantType(items: FeaturedOpp[]): OppType | null {
  if (items.length === 0) return null;
  const counts: Record<string, number> = {};
  for (const o of items) counts[o.type] = (counts[o.type] ?? 0) + 1;
  let best: OppType = items[0].type;
  let bestN = 0;
  for (const [t, n] of Object.entries(counts)) {
    if (n > bestN) {
      bestN = n;
      best = t as OppType;
    }
  }
  return best;
}

function CalendarPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["opportunities", "featured_calendar"],
    queryFn: async (): Promise<FeaturedOpp[]> => {
      const { data, error } = await supabase
        .from("opportunities")
        .select("id, title, organization, logo_url, type, apply_url, timeline_start, timeline_selection, timeline_end")
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

  const MAX_VISIBLE = 3;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF9F0] via-[#F9FAFB] to-[#F9FAFB]">
      <TopBar />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#111827] flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-[#F59E0B]" />
            Program Calendar
          </h1>
          <p className="mt-2 text-sm text-[#6B7280] max-w-2xl">
            A friendly year-at-a-glance view of the world's most-loved student tech programs, sorted by the month applications open. ✨
          </p>
        </div>

        {isLoading && (
          <div className="rounded-2xl bg-white p-8 text-sm text-[#6B7280] shadow-[0_4px_20px_-8px_rgba(0,0,0,0.08)]">Loading…</div>
        )}
        {error && (
          <div className="rounded-2xl bg-red-50 p-8 text-sm text-red-700 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.08)]">
            Couldn't load calendar. Please try again.
          </div>
        )}

        {!isLoading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {MONTHS.map((name, i) => {
              const m = i + 1;
              const isCurrent = m === currentMonth;
              const items = byMonth[m] ?? [];
              const dom = dominantType(items);
              const bgClass = isCurrent
                ? "bg-gradient-to-br from-[#EEF2FF] to-[#E0E7FF]"
                : dom
                ? TYPE_CARD_BG[dom]
                : "bg-[#FFFBF3]";
              const visible = items.slice(0, MAX_VISIBLE);
              const extra = items.length - visible.length;

              return (
                <div
                  key={name}
                  className={`relative rounded-[20px] p-4 h-[250px] flex flex-col transition-transform hover:-translate-y-0.5 ${bgClass} ${
                    isCurrent
                      ? "shadow-[0_10px_30px_-8px_rgba(79,70,229,0.35)] ring-2 ring-[#4F46E5]/40"
                      : "shadow-[0_6px_20px_-10px_rgba(17,24,39,0.25)]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h2 className={`text-base font-extrabold tracking-tight ${isCurrent ? "text-[#4338CA]" : "text-[#111827]"}`}>
                      {name}
                    </h2>
                    {isCurrent && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#4F46E5] px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                        ✨ This month!
                      </span>
                    )}
                  </div>

                  {items.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center px-2">
                      <div className="text-2xl mb-1 opacity-60">🌱</div>
                      <p className="text-xs text-[#9CA3AF] font-medium">
                        Nothing yet — check back!
                      </p>
                    </div>
                  ) : (
                    <ul className="space-y-1.5 overflow-hidden">
                      {visible.map((opp) => (
                        <li key={opp.id}>
                          <button
                            onClick={() => setSelected(opp)}
                            className={`w-full text-left flex items-center gap-2 rounded-2xl px-2 py-1 transition hover:brightness-95 ${TYPE_PILL[opp.type]}`}
                          >
                            <CompanyLogo
                              organization={opp.organization}
                              logoUrl={opp.logo_url}
                            />
                            <span className="text-xs font-semibold leading-tight truncate">
                              {opp.title}
                            </span>
                          </button>
                        </li>
                      ))}
                      {extra > 0 && (
                        <li className="pt-0.5 pl-2 text-[11px] font-semibold text-[#6B7280]">
                          +{extra} more
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/50 backdrop-blur-sm p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-extrabold text-[#111827] leading-tight flex items-center gap-3">
                <CompanyLogo
                  organization={selected.organization}
                  logoUrl={selected.logo_url}
                />
                <span>{selected.title}</span>
              </h2>
              <button
                onClick={() => setSelected(null)}
                className="rounded-full w-8 h-8 flex items-center justify-center text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827] text-xl leading-none transition"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="rounded-xl bg-[#F9FAFB] p-3">
                <dt className="text-[11px] uppercase tracking-wide font-bold text-[#6B7280]">Applications</dt>
                <dd className="text-[#111827] mt-0.5 font-medium">{selected.timeline_start || "—"}</dd>
              </div>
              <div className="rounded-xl bg-[#F9FAFB] p-3">
                <dt className="text-[11px] uppercase tracking-wide font-bold text-[#6B7280]">Selection</dt>
                <dd className="text-[#111827] mt-0.5 font-medium">{selected.timeline_selection || "—"}</dd>
              </div>
              <div className="rounded-xl bg-[#F9FAFB] p-3">
                <dt className="text-[11px] uppercase tracking-wide font-bold text-[#6B7280]">Results</dt>
                <dd className="text-[#111827] mt-0.5 font-medium">{selected.timeline_end || "—"}</dd>
              </div>
            </dl>
            <a
              href={selected.apply_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#4F46E5] to-[#6366F1] px-4 py-3 text-sm font-bold text-white shadow-[0_8px_20px_-6px_rgba(79,70,229,0.5)] hover:brightness-105 transition"
            >
              Apply Now
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
