import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Sparkles, ArrowLeft, ExternalLink, Wand2, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { matchOpportunities, type MatchResponse } from "@/lib/match.functions";

type Level = "beginner" | "intermediate" | "advanced";

type Opportunity = {
  id: string;
  title: string;
  organization: string;
  type: "internship" | "research" | "hackathon" | "conference" | "workshop";
  location_type: "remote" | "onsite_pk" | "onsite_global";
  pakistan_friendly: boolean;
  skill_level: Level;
  paid: boolean;
  deadline: string | null;
  apply_url: string;
};

const TYPE_LABEL: Record<Opportunity["type"], string> = {
  internship: "Internship",
  research: "Research",
  hackathon: "Hackathon",
  conference: "Conference",
  workshop: "Workshop",
};

const TYPE_CLASSES: Record<Opportunity["type"], string> = {
  internship: "bg-type-internship/15 text-type-internship border border-type-internship/25",
  research: "bg-type-research/15 text-type-research border border-type-research/25",
  hackathon: "bg-type-hackathon/15 text-type-hackathon border border-type-hackathon/25",
  conference: "bg-type-conference/15 text-type-conference border border-type-conference/25",
  workshop: "bg-type-workshop/20 text-type-workshop border border-type-workshop/30",
};

const LOC_LABEL: Record<Opportunity["location_type"], string> = {
  remote: "Remote",
  onsite_pk: "Onsite — Pakistan",
  onsite_global: "Onsite — Global",
};

export const Route = createFileRoute("/match")({
  component: MatchPage,
  head: () => ({
    meta: [
      { title: "Find Your Match — InternPulse" },
      {
        name: "description",
        content:
          "Describe your skills and experience level and get a ranked shortlist of internships, research roles, hackathons, and workshops that fit you.",
      },
      { property: "og:title", content: "Find Your Match — InternPulse" },
      {
        property: "og:description",
        content:
          "Personalised opportunity matching for Pakistani CS/IT students — beginner-friendly picks first.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function MatchPage() {
  const [skills, setSkills] = useState("");
  const [level, setLevel] = useState<Level>("beginner");
  const [result, setResult] = useState<MatchResponse | null>(null);

  const run = useServerFn(matchOpportunities);

  const { data: opps } = useQuery({
    queryKey: ["opportunities", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("opportunities")
        .select(
          "id, title, organization, type, location_type, pakistan_friendly, skill_level, paid, deadline, apply_url",
        );
      if (error) throw error;
      return (data ?? []) as Opportunity[];
    },
  });

  const byId = new Map((opps ?? []).map((o) => [o.id, o]));

  const mutation = useMutation({
    mutationFn: async () => (await run({ data: { skills, level } })) as MatchResponse,
    onSuccess: (data) => setResult(data),
  });

  const canSubmit = skills.trim().length >= 3 && !mutation.isPending;

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <header className="border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition"
          >
            <ArrowLeft className="h-4 w-4" /> Back to opportunities
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 text-accent border border-accent/25 px-3 py-1 text-xs font-semibold">
          <Sparkles className="h-3.5 w-3.5" /> Beginner-friendly first
        </div>
        <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight">
          Find your <span className="text-primary">best-fit opportunities</span>
        </h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Tell us what you're learning or interested in — we'll rank open opportunities by how well
          they fit you, and explain why.
        </p>

        <section className="mt-8 rounded-xl border border-border bg-card p-6">
          <label htmlFor="skills" className="block text-sm font-semibold">
            Your skills &amp; interests
          </label>
          <textarea
            id="skills"
            value={skills}
            onChange={(e) => setSkills(e.target.value.slice(0, 1500))}
            rows={4}
            placeholder="e.g. I just started learning Python and made a small calculator app. Interested in AI and web development."
            className="mt-2 w-full rounded-lg border border-border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring focus:border-ring"
          />
          <p className="mt-1 text-xs text-muted-foreground">{skills.length}/1500</p>

          <fieldset className="mt-5">
            <legend className="text-sm font-semibold">Experience level</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {(["beginner", "intermediate", "advanced"] as Level[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLevel(l)}
                  className={
                    "px-3 py-1.5 rounded-full text-sm font-medium border transition " +
                    (level === l
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground border-border hover:border-primary/40")
                  }
                >
                  {l[0].toUpperCase() + l.slice(1)}
                </button>
              ))}
            </div>
          </fieldset>

          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => mutation.mutate()}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold hover:bg-primary/90 disabled:opacity-50"
          >
            <Wand2 className="h-4 w-4" />
            {mutation.isPending ? "Matching…" : "Match me"}
          </button>

          {mutation.isError && (
            <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
              {friendlyError((mutation.error as Error)?.message)}
            </p>
          )}
        </section>

        {result && (
          <section className="mt-8">
            {result.message && (
              <div className="rounded-xl border border-accent/30 bg-accent/10 p-5 text-sm">
                {result.message}
              </div>
            )}

            {result.matches.length > 0 && (
              <>
                <h2 className="text-lg font-bold mt-2 mb-4">
                  {result.matches.length} matches for you
                </h2>
                <ul className="space-y-4">
                  {result.matches.map((m) => {
                    const o = byId.get(m.opportunity_id);
                    if (!o) return null;
                    return (
                      <li
                        key={m.opportunity_id}
                        className="rounded-xl border border-border bg-card p-5 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
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
                            </div>
                            <h3 className="mt-2 font-semibold leading-snug">
                              <Link
                                to="/opportunity/$id"
                                params={{ id: o.id }}
                                className="hover:text-primary transition-colors"
                              >
                                {o.title}
                              </Link>
                            </h3>
                            <p className="text-sm text-muted-foreground">{o.organization}</p>
                          </div>
                          <ScoreRing score={m.confidence_score} />
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
                          <Meta>
                            <MapPin className="h-3 w-3" />
                            {LOC_LABEL[o.location_type]}
                          </Meta>
                          <Meta>{o.skill_level[0].toUpperCase() + o.skill_level.slice(1)}</Meta>
                          <Meta>{o.paid ? "Paid" : "Unpaid"}</Meta>
                        </div>

                        <p className="mt-3 text-sm">{m.reason}</p>

                        {m.note && (
                          <p className="mt-2 inline-flex items-start gap-1.5 rounded-lg bg-accent/10 border border-accent/25 px-3 py-2 text-sm text-accent-foreground">
                            <Sparkles className="h-4 w-4 shrink-0 text-accent" />
                            <span>{m.note}</span>
                          </p>
                        )}

                        <div className="mt-4 flex items-center gap-3">
                          <a
                            href={o.apply_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-sm font-medium hover:bg-primary/90"
                          >
                            Apply Now <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                          <Link
                            to="/opportunity/$id"
                            params={{ id: o.id }}
                            className="text-sm font-medium text-muted-foreground hover:text-primary"
                          >
                            View details
                          </Link>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

function friendlyError(message?: string) {
  if (!message) return "Something went wrong while matching. Please try again.";
  if (message.includes("429")) return "Too many requests right now — please try again in a minute.";
  if (message.includes("402")) return "AI credits are exhausted. Please add credits to continue.";
  return "Something went wrong while matching. Please try again.";
}

function ScoreRing({ score }: { score: number }) {
  return (
    <div className="shrink-0 text-center">
      <div className="h-14 w-14 rounded-full border-4 border-primary/25 grid place-items-center">
        <span className="text-sm font-bold text-primary">{score}</span>
      </div>
      <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">fit</p>
    </div>
  );
}

function Meta({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-muted text-muted-foreground px-1.5 py-0.5">
      {children}
    </span>
  );
}
