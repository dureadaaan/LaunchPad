import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MapPin, ExternalLink, Bookmark, BookmarkCheck, Sparkles, X, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/opportunity/$id")({
  component: OpportunityDetail,
  head: () => ({
    meta: [
      { title: "Opportunity — LaunchPad" },
      {
        name: "description",
        content:
          "Full details for this opportunity — eligibility, deadline, and how to apply.",
      },
      { property: "og:title", content: "Opportunity — LaunchPad" },
      {
        property: "og:description",
        content: "Full details for this opportunity on LaunchPad.",
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

const SAVED_KEY = "internpulse:saved";

type SavedEntry = { email: string; opportunityId: string; savedAt: string };

function readSaved(): SavedEntry[] {
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    return raw ? (JSON.parse(raw) as SavedEntry[]) : [];
  } catch {
    return [];
  }
}

function writeSaved(list: SavedEntry[]) {
  localStorage.setItem(SAVED_KEY, JSON.stringify(list));
}

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

function OpportunityDetail() {
  const { id } = Route.useParams();
  const [savedEmail, setSavedEmail] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);

  useEffect(() => {
    const list = readSaved();
    const existing = list.find((s) => s.opportunityId === id);
    if (existing) setSavedEmail(existing.email);
  }, [id]);

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
  const isSaved = savedEmail !== null;

  function openSaveDialog() {
    setEmailInput(savedEmail ?? "");
    setEmailError(null);
    setDialogOpen(true);
  }

  function confirmSave(e: React.FormEvent) {
    e.preventDefault();
    const email = emailInput.trim();
    if (!isValidEmail(email)) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    try {
      const list = readSaved().filter((s) => s.opportunityId !== o.id);
      list.push({ email, opportunityId: o.id, savedAt: new Date().toISOString() });
      writeSaved(list);
    } catch {
      // ignore storage errors
    }
    setSavedEmail(email);
    setDialogOpen(false);
    toast.success("Opportunity saved", {
      description: `We'll remember this under ${email}.`,
    });
  }

  function removeSaved() {
    try {
      const list = readSaved().filter((s) => s.opportunityId !== o.id);
      writeSaved(list);
    } catch {
      // ignore
    }
    setSavedEmail(null);
    setDialogOpen(false);
    toast("Removed from saved", {
      description: "This opportunity is no longer bookmarked.",
    });
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
            onClick={openSaveDialog}
            aria-pressed={isSaved}
            className={
              "inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition " +
              (isSaved
                ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/15"
                : "border-border bg-card hover:border-primary/40")
            }
          >
            {isSaved ? (
              <BookmarkCheck className="h-4 w-4 fill-primary/20 text-primary" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
            {isSaved ? "Saved" : "Save"}
          </button>
        </div>
        {isSaved && savedEmail && (
          <p className="hidden md:block mt-2 text-xs text-muted-foreground">
            Saved to <span className="font-medium text-foreground">{savedEmail}</span>.{" "}
            <button
              type="button"
              onClick={openSaveDialog}
              className="underline underline-offset-2 hover:text-foreground"
            >
              Manage
            </button>
          </p>
        )}

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
            onClick={openSaveDialog}
            aria-pressed={isSaved}
            className={
              "inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition " +
              (isSaved
                ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/15"
                : "border-border bg-card hover:border-primary/40")
            }
          >
            {isSaved ? (
              <BookmarkCheck className="h-4 w-4 fill-primary/20 text-primary" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
            {isSaved ? `Saved to ${savedEmail}` : "Save this opportunity"}
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
          onClick={openSaveDialog}
          aria-label={isSaved ? "Saved" : "Save"}
          aria-pressed={isSaved}
          className={
            "inline-flex items-center justify-center rounded-lg border px-3 py-3 transition " +
            (isSaved
              ? "border-primary/40 bg-primary/10 text-primary"
              : "border-border bg-card hover:border-primary/40")
          }
        >
          {isSaved ? (
            <BookmarkCheck className="h-4 w-4 fill-primary/20 text-primary" />
          ) : (
            <Bookmark className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Save dialog */}
      {dialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/40 backdrop-blur-sm px-4 pb-24 sm:pb-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="save-dialog-title"
          onClick={() => setDialogOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-card border border-border shadow-xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-primary/10 text-primary p-2">
                  <Bookmark className="h-5 w-5" />
                </div>
                <div>
                  <h3 id="save-dialog-title" className="text-base font-semibold">
                    {isSaved ? "Update saved opportunity" : "Save this opportunity"}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    We'll bookmark it under your email on this device.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDialogOpen(false)}
                aria-label="Close"
                className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={confirmSave} className="mt-5 space-y-3">
              <label className="block">
                <span className="text-xs font-medium text-muted-foreground">Email</span>
                <div className="mt-1 relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="email"
                    autoFocus
                    required
                    value={emailInput}
                    onChange={(e) => {
                      setEmailInput(e.target.value);
                      if (emailError) setEmailError(null);
                    }}
                    placeholder="you@university.edu.pk"
                    className={
                      "w-full rounded-lg border bg-background pl-9 pr-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-primary/30 " +
                      (emailError ? "border-urgent" : "border-border focus:border-primary/40")
                    }
                    aria-invalid={emailError ? true : undefined}
                    aria-describedby={emailError ? "save-email-error" : undefined}
                  />
                </div>
                {emailError && (
                  <p id="save-email-error" className="mt-1 text-xs text-urgent">
                    {emailError}
                  </p>
                )}
              </label>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                {isSaved && (
                  <button
                    type="button"
                    onClick={removeSaved}
                    className="mr-auto text-sm font-medium text-urgent hover:underline"
                  >
                    Remove
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setDialogOpen(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:bg-primary/90"
                >
                  {isSaved ? "Update" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
