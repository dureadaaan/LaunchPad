import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Bookmark, MapPin, ExternalLink, Trash2, Mail, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { TopBar } from "@/components/TopBar";

export const Route = createFileRoute("/saved")({
  component: SavedPage,
  head: () => ({
    meta: [
      { title: "Saved Opportunities — LaunchPad" },
      {
        name: "description",
        content:
          "View all the opportunities you've saved on LaunchPad and jump back to their details.",
      },
      { property: "og:title", content: "Saved Opportunities — LaunchPad" },
      {
        property: "og:description",
        content: "Your bookmarked internships, hackathons, and more on LaunchPad.",
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

const SAVED_KEY = "internpulse:saved";
const EMAIL_KEY = "internpulse:saved:email";

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

function SavedPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [entries, setEntries] = useState<SavedEntry[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(EMAIL_KEY);
      if (stored) {
        setEmail(stored);
        setEmailInput(stored);
      }
      setEntries(readSaved());
    } catch {
      // ignore
    }
  }, []);

  const savedIds = email
    ? entries.filter((e) => e.email.toLowerCase() === email.toLowerCase()).map((e) => e.opportunityId)
    : [];

  const { data, isLoading } = useQuery({
    queryKey: ["saved-opportunities", savedIds.sort().join(",")],
    queryFn: async () => {
      if (savedIds.length === 0) return [] as Opportunity[];
      const { data, error } = await supabase
        .from("opportunities")
        .select("*")
        .in("id", savedIds);
      if (error) throw error;
      return (data ?? []) as Opportunity[];
    },
    enabled: email !== null,
  });

  function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    const v = emailInput.trim();
    if (!isValidEmail(v)) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    setEmailError(null);
    try {
      localStorage.setItem(EMAIL_KEY, v);
    } catch {
      // ignore
    }
    setEmail(v);
  }

  function changeEmail() {
    setEmail(null);
    try {
      localStorage.removeItem(EMAIL_KEY);
    } catch {
      // ignore
    }
  }

  function removeSaved(oppId: string, title: string) {
    const next = readSaved().filter(
      (s) => !(s.opportunityId === oppId && s.email.toLowerCase() === email?.toLowerCase()),
    );
    writeSaved(next);
    setEntries(next);
    toast("Removed from saved", { description: title });
  }

  // Sort by soonest deadline (active first, then closed)
  const items = (data ?? []).slice().sort((a, b) => {
    const da = daysUntil(a.deadline);
    const db = daysUntil(b.deadline);
    const aClosed = da < 0 ? 1 : 0;
    const bClosed = db < 0 ? 1 : 0;
    if (aClosed !== bClosed) return aClosed - bClosed;
    return da - db;
  });

  return (
    <div className="min-h-screen font-sans text-foreground" style={{ background: "linear-gradient(180deg, #EEF2FF 0%, #F5F3FF 100%)" }}>
      <TopBar />
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
        <div className=" flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight flex items-center gap-2">
              <Bookmark className="h-7 w-7 text-primary" />
              Saved Opportunities
            </h1>
            <p className="mt-1 text-muted-foreground">
              Everything you've bookmarked to your email on this device.
            </p>
          </div>
          {email && (
            <div className="text-sm text-muted-foreground">
              Viewing saves for{" "}
              <span className="font-medium text-foreground">{email}</span>{" "}
              <button
                type="button"
                onClick={changeEmail}
                className="ml-1 underline underline-offset-2 hover:text-foreground"
              >
                Change
              </button>
            </div>
          )}
        </div>

        {!email && (
          <form
            onSubmit={submitEmail}
            className="mt-8 max-w-md rounded-2xl border border-border bg-card p-6"
          >
            <label className="block">
              <span className="text-sm font-medium">Enter your email to view saved opportunities</span>
              <div className="mt-2 relative">
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
                />
              </div>
              {emailError && <p className="mt-1 text-xs text-urgent">{emailError}</p>}
            </label>
            <button
              type="submit"
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:bg-primary/90"
            >
              View saved
            </button>
          </form>
        )}

        {email && isLoading && (
          <div className="mt-8 grid gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        )}

        {email && !isLoading && items.length === 0 && (
          <div className="mt-8 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 text-primary grid place-items-center">
              <Bookmark className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-lg font-semibold">No saved opportunities yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Browse the feed and tap the bookmark on any opportunity to save it under this email.
            </p>
            <Link
              to="/"
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90"
            >
              Explore opportunities
            </Link>
          </div>
        )}

        {email && !isLoading && items.length > 0 && (
          <ul className="mt-8 grid gap-4">
            {items.map((o) => {
              const d = daysUntil(o.deadline);
              const urgent = d >= 0 && d <= 7;
              const closed = d < 0;
              return (
                <li
                  key={o.id}
                  className="group relative rounded-2xl border border-border bg-card p-5 hover:border-primary/40 transition"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
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
                        {o.skill_level === "beginner" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-accent/20 text-accent border border-accent/30">
                            <Sparkles className="h-3 w-3" /> Beginner
                          </span>
                        )}
                      </div>
                      <Link
                        to="/opportunity/$id"
                        params={{ id: o.id }}
                        className="mt-2 block text-lg font-bold tracking-tight hover:text-primary transition"
                      >
                        {o.title}
                      </Link>
                      <p className="text-sm text-muted-foreground">{o.organization}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          {LOC_LABEL[o.location_type]}
                        </span>
                        <span className="text-muted-foreground capitalize">{o.skill_level}</span>
                        <span className="text-muted-foreground">{o.paid ? "Paid" : "Unpaid"}</span>
                        <span
                          className={
                            "font-semibold " +
                            (closed
                              ? "text-muted-foreground line-through"
                              : urgent
                                ? "text-urgent"
                                : "text-foreground")
                          }
                        >
                          {deadlineLabel(o.deadline)}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSaved(o.id, o.title)}
                      aria-label="Remove from saved"
                      className="relative z-10 shrink-0 inline-flex items-center justify-center rounded-lg border border-border p-2 text-muted-foreground hover:text-urgent hover:border-urgent/40 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <Link
                      to="/opportunity/$id"
                      params={{ id: o.id }}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-sm font-semibold hover:bg-primary/90"
                    >
                      View details
                    </Link>
                    {!closed && (
                      <a
                        href={o.apply_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium hover:border-primary/40 hover:text-primary transition"
                      >
                        Apply <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
