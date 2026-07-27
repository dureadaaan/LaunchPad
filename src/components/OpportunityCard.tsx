import { Link } from "@tanstack/react-router";
import { MapPin, Sparkles, ExternalLink } from "lucide-react";

export type Opportunity = {
  id: string;
  title: string;
  organization: string;
  type: "internship" | "research" | "hackathon" | "conference" | "workshop";
  location_type: "remote" | "onsite_pk" | "onsite_global";
  pakistan_friendly: boolean;
  skill_level: "beginner" | "intermediate" | "advanced";
  paid: boolean;
  deadline: string | null;
  description: string;
  apply_url: string;
  tags?: string[];
  created_at?: string;
};

export type TypeKey = Opportunity["type"];
export type LocKey = Opportunity["location_type"];
export type LevelKey = Opportunity["skill_level"];

export const TYPE_LABEL: Record<TypeKey, string> = {
  internship: "Internship",
  research: "Research",
  hackathon: "Hackathon",
  conference: "Conference",
  workshop: "Workshop",
};

export const TYPE_CLASSES: Record<TypeKey, string> = {
  internship: "bg-type-internship/15 text-type-internship border border-type-internship/25",
  research: "bg-type-research/15 text-type-research border border-type-research/25",
  hackathon: "bg-type-hackathon/15 text-type-hackathon border border-type-hackathon/25",
  conference: "bg-type-conference/15 text-type-conference border border-type-conference/25",
  workshop: "bg-type-workshop/20 text-type-workshop border border-type-workshop/30",
};

export const LOC_LABEL: Record<LocKey, string> = {
  remote: "Remote",
  onsite_pk: "Onsite — Pakistan",
  onsite_global: "Onsite — Global",
};

export function daysUntil(dateStr: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + "T00:00:00");
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

export function deadlineLabel(dateStr: string) {
  const d = daysUntil(dateStr);
  if (d < 0) return "Closed";
  if (d === 0) return "Closes today";
  if (d === 1) return "1 day left";
  return `${d} days left`;
}

export function Meta({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-muted text-muted-foreground px-1.5 py-0.5 text-xs">
      {children}
    </span>
  );
}

export function OpportunityCard({
  o,
  score,
  reason,
  note,
}: {
  o: Opportunity;
  score?: number;
  reason?: string;
  note?: string;
}) {
  const d = o.deadline ? daysUntil(o.deadline) : null;
  const urgent = d !== null && d <= 7;
  const beginner = o.skill_level === "beginner";

  return (
    <article className="group relative flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition">
      <div className="flex items-center gap-2 overflow-hidden">
        <span
          className={
            "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap " +
            TYPE_CLASSES[o.type]
          }
        >
          {TYPE_LABEL[o.type]}
        </span>
        {typeof score === "number" && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/25 whitespace-nowrap">
            {score}% match
          </span>
        )}
        {o.pakistan_friendly && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-success/15 text-success border border-success/25 whitespace-nowrap">
            🇵🇰 PK
          </span>
        )}
        {beginner && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-accent/20 text-accent border border-accent/30 whitespace-nowrap">
            <Sparkles className="h-3 w-3" /> Beginner
          </span>
        )}
      </div>

      <div className="mt-3 flex items-start gap-3">
        <CompanyLogo organization={o.organization} />
        <div className="min-w-0">
          <h3 className="font-semibold text-base leading-snug line-clamp-2">
            <Link
              to="/opportunity/$id"
              params={{ id: o.id }}
              className="hover:text-primary transition-colors before:absolute before:inset-0"
            >
              {o.title}
            </Link>
          </h3>
          <p className="text-sm text-muted-foreground truncate">{o.organization}</p>
        </div>
      </div>

      {o.description && (
        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{o.description}</p>
      )}

      <div className="mt-3 flex items-center gap-1.5 overflow-hidden">
        <Meta>
          <MapPin className="h-3 w-3" />
          {LOC_LABEL[o.location_type]}
        </Meta>
        <Meta>{o.skill_level[0].toUpperCase() + o.skill_level.slice(1)}</Meta>
        <Meta>{o.paid ? "Paid" : "Unpaid"}</Meta>
      </div>


      {reason && <p className="mt-3 text-sm text-foreground/80 italic">{reason}</p>}

      {note && (
        <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-accent/10 border border-accent/30 px-3 py-2 text-sm font-medium text-accent">
          <Sparkles className="h-4 w-4 shrink-0" />
          <span>{note}</span>
        </p>
      )}

      <div className="mt-auto pt-4 flex items-center justify-between gap-3">
        <span
          className={"text-sm font-semibold " + (urgent ? "text-urgent" : "text-muted-foreground")}
        >
          {o.deadline ? deadlineLabel(o.deadline) : "Rolling / annual"}
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
