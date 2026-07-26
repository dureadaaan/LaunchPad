import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Sparkles, ArrowLeft, Wand2, Loader2 } from "lucide-react";
import { OpportunityCard } from "@/components/OpportunityCard";
import { matchOpportunities, type MatchResponse } from "@/lib/match.functions";

type Level = "beginner" | "intermediate" | "advanced";

export const Route = createFileRoute("/match")({
  component: MatchPage,
  head: () => ({
    meta: [
      { title: "AI Match — InternPulse" },
      {
        name: "description",
        content:
          "Describe your skills and experience level and get a ranked shortlist of internships, research roles, hackathons, and workshops that fit you.",
      },
      { property: "og:title", content: "AI Match — InternPulse" },
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

  const mutation = useMutation({
    mutationFn: async () => (await run({ data: { skills: skills.trim(), level } })) as MatchResponse,
    onSuccess: (data) => setResult(data),
  });

  const canSubmit = skills.trim().length >= 3 && !mutation.isPending;

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <header className="border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition"
          >
            <ArrowLeft className="h-4 w-4" /> Back to opportunities
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
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

        <form
          className="mt-8 rounded-xl border border-border bg-card p-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (canSubmit) mutation.mutate();
          }}
        >
          <label htmlFor="skills" className="block text-sm font-semibold">
            Describe your skills and interests
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

          <div className="mt-5 max-w-xs">
            <label htmlFor="level" className="block text-sm font-semibold">
              Experience level
            </label>
            <select
              id="level"
              value={level}
              onChange={(e) => setLevel(e.target.value as Level)}
              className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring focus:border-ring"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold hover:bg-primary/90 disabled:opacity-50"
          >
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="h-4 w-4" />
            )}
            {mutation.isPending ? "Finding matches…" : "Find Matches"}
          </button>

          {mutation.isError && (
            <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
              Something went wrong while matching. Please try again.
            </p>
          )}
        </form>

        {mutation.isPending && (
          <section className="mt-8 rounded-xl border border-border bg-card p-8 text-center">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
            <p className="mt-3 font-semibold">Reading through open opportunities for you…</p>
            <p className="mt-1 text-sm text-muted-foreground">
              This usually takes a few seconds. We're picking the ones that fit you best.
            </p>
          </section>
        )}

        {!mutation.isPending && result?.error && (
          <section className="mt-8 rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-sm">
            {result.error}
          </section>
        )}

        {!mutation.isPending && result && !result.error && (
          <section className="mt-8">
            {result.matches.length === 0 ? (
              <div className="rounded-xl border border-accent/30 bg-accent/10 p-8 text-center">
                <Sparkles className="mx-auto h-6 w-6 text-accent" />
                <p className="mt-3 font-semibold">No strong matches yet</p>
                <p className="mt-1 text-sm text-accent">
                  {result.message ??
                    "Nothing quite matches yet — try broadening your interests or check back soon."}
                </p>
              </div>
            ) : (
              <>
                {result.message && (
                  <div className="rounded-xl border border-accent/30 bg-accent/10 p-4 text-sm text-accent mb-4">
                    {result.message}
                  </div>
                )}
                <h2 className="text-lg font-bold mb-4">
                  {result.matches.length} {result.matches.length === 1 ? "match" : "matches"} for you
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.matches.map((m) => (
                    <OpportunityCard
                      key={m.opportunity_id}
                      o={m.opportunity}
                      score={m.confidence_score}
                      reason={m.reason}
                      note={m.note}
                    />
                  ))}
                </div>
              </>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
