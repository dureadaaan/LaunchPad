import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MapPin, ExternalLink, Bookmark, Sparkles } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/opportunity/$id")({
  component: OpportunityDetail,
  head: () => ({
    meta: [
      { title: "Opportunity — InternPulse" },
      {
        name: "description",
        content:
          "Full details for this opportunity — eligibility, deadline, and how to apply.",
      },
      { property: "og:title", content: "Opportunity — InternPulse" },
      {
        property: "og:description",
        content: "Full details for this opportunity on InternPulse.",
      },
    ],
  }),
});

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
  eligibility: string | null;
};

const TYPE_LABEL = {
  internship: "Internship",
  research: "Research",
  hackathon: "Hackathon",
  conference: "Conference",
  workshop: "Workshop",
} as const;

const TYPE_CLASSES = {
  internship: "bg-type-internship/15 text-type-internship border border-type-internship/25",
  research: "bg-type-research/15 text-type-research border border-type-research/25",
  hackathon: "bg-type-hackathon/15 text-type-hackathon border border-type-hackathon/25",
  conference: "bg-type-conference/15 text-type-conference border border-type-conference/25",
  workshop: "bg-type-workshop/20 text-type-workshop border border-type-workshop/30",
} as const;

const LOC_LABEL = {
  remote: "Remote",
  onsite_pk: "Onsite — Pakistan",
  onsite_global: "Onsite — Global",
} as const;

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

function Unavailable() {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-16 text-center">
        <h1 className="text-2xl font-bold">This opportunity is no longer available</h1>
        <p className="mt-2 text-muted-foreground">
          It may have been removed or its deadline has passed.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90"
        >
          <ArrowLeft className="h-4 w-4" /> Back to opportunities
        </Link>
      </div>
    </div>
  );
}

function OpportunityDetail() {
  const { id } = Route.useParams();
  const [saved, setSaved] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["opportunity", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("opportunities")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as Opportunity | null;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
          <div className="h-6 w-40 rounded bg-muted animate-pulse" />
          <div className="mt-6 h-10 w-3/4 rounded bg-muted animate-pulse" />
          <div className="mt-3 h-4 w-1/3 rounded bg-muted animate-pulse" />
          <div className="mt-8 h-40 rounded-xl bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !data) return <Unavailable />;

  const o = data;
  const d = daysUntil(o.deadline);
  if (d < 0) return <Unavailable />;

  const urgent = d <= 7;

  function handleSave() {
    if (saved) return;
    const email = window.prompt("Enter your email to save this opportunity:");
    if (!email) return;
    try {
      const key = "internpulse:saved";
      const raw = localStorage.getItem(key);
      const list = raw ? JSON.parse(raw) : [];
      list.push({ email, opportunityId: o.id, savedAt: new Date().toISOString() });
      localStorage.setItem(key, JSON.stringify(list));
      setSaved(true);
    } catch {
      setSaved(true);
    }
  }

  return (
    <div className="min-h-screen bg-background font-sans text-foreground pb-28 md:pb-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to opportunities
        </Link>

        <div className="mt-6 flex items-center gap-2 flex-wrap">
          <span
            className={
              "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold " +
              TYPE_CLASSES[o.type]
            }
          >
            {TYPE_LABEL[o.type]}
          </span>
          {o.pakistan_friendly && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-success/15 text-success border border-success/25">
              🇵🇰 Pakistan-friendly
            </span>
          )}
          {o.skill_level === "beginner" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-accent/20 text-accent border border-accent/30">
              <Sparkles className="h-3 w-3" /> Beginner-friendly
            </span>
          )}
        </div>

        <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
          {o.title}
        </h1>
        <p className="mt-1 text-muted-foreground">{o.organization}</p>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {LOC_LABEL[o.location_type]}
          </span>
          <span className="text-muted-foreground">
            {o.skill_level[0].toUpperCase() + o.skill_level.slice(1)}
          </span>
          <span className="text-muted-foreground">{o.paid ? "Paid" : "Unpaid"}</span>
          <span
            className={
              "font-semibold " + (urgent ? "text-urgent" : "text-muted-foreground")
            }
          >
            {deadlineLabel(o.deadline)}
          </span>
        </div>

        {/* Desktop apply CTA — prominent placement near top */}
        <div className="hidden md:flex mt-6 items-center gap-3">
          <a
            href={o.apply_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-6 py-3 text-base font-semibold shadow-sm hover:bg-primary/90 transition"
          >
            Apply Now <ExternalLink className="h-4 w-4" />
          </a>
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:border-primary/40"
          >
            <Bookmark className={"h-4 w-4 " + (saved ? "fill-primary text-primary" : "")} />
            {saved ? "Saved" : "Save"}
          </button>
        </div>

        <section className="mt-8">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Description
          </h2>
          <div className="text-foreground/90 whitespace-pre-line leading-relaxed">
            {o.description}
          </div>
        </section>

        {o.eligibility && o.eligibility.trim().length > 0 && (
          <section className="mt-8">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Eligibility Criteria
            </h2>
            <div className="text-muted-foreground whitespace-pre-line leading-relaxed">
              {o.eligibility}
            </div>
          </section>
        )}

        {o.tags && o.tags.length > 0 && (
          <section className="mt-8">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Tags
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {o.tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center rounded-full bg-muted text-muted-foreground px-2.5 py-1 text-xs lowercase"
                >
                  {t}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Desktop bottom save (keeps Save visible after long scroll too) */}
        <div className="hidden md:flex mt-10">
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:border-primary/40"
          >
            <Bookmark className={"h-4 w-4 " + (saved ? "fill-primary text-primary" : "")} />
            {saved ? "Saved" : "Save this opportunity"}
          </button>
        </div>
      </div>

      {/* Mobile sticky apply bar */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-border bg-background/95 backdrop-blur px-4 py-3 flex items-center gap-2">
        <a
          href={o.apply_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-3 text-sm font-semibold hover:bg-primary/90"
        >
          Apply Now <ExternalLink className="h-4 w-4" />
        </a>
        <button
          onClick={handleSave}
          aria-label="Save"
          className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-3 py-3 hover:border-primary/40"
        >
          <Bookmark className={"h-4 w-4 " + (saved ? "fill-primary text-primary" : "")} />
        </button>
      </div>
    </div>
  );
}
