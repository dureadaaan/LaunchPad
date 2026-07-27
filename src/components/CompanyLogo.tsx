import { useState } from "react";

const DOMAIN_OVERRIDES: Record<string, string> = {
  "aws educate": "aws.amazon.com",
  aws: "aws.amazon.com",
  nasa: "nasa.gov",
  "google summer of code": "google.com",
  google: "google.com",
  microsoft: "microsoft.com",
  "imagine cup": "microsoft.com",
  amazon: "amazon.com",
  outreachy: "outreachy.org",
  "mlh fellowship": "mlh.io",
  mlh: "mlh.io",
  meta: "meta.com",
  ieee: "ieee.org",
  acm: "acm.org",
  github: "github.com",
  nvidia: "nvidia.com",
  intel: "intel.com",
  "hugging face": "huggingface.co",
  openai: "openai.com",
  kaggle: "kaggle.com",
  coursera: "coursera.org",
  udacity: "udacity.com",
};

const STOP_WORDS = new Set([
  "the",
  "inc",
  "llc",
  "ltd",
  "foundation",
  "institute",
  "university",
  "program",
  "programme",
  "fellowship",
  "internship",
  "labs",
  "lab",
  "of",
  "and",
  "for",
]);

export function guessDomain(organization: string) {
  const key = organization.trim().toLowerCase();
  if (DOMAIN_OVERRIDES[key]) return DOMAIN_OVERRIDES[key];
  for (const [name, domain] of Object.entries(DOMAIN_OVERRIDES)) {
    if (key.includes(name)) return domain;
  }
  const words = key
    .replace(/[^a-z0-9\s-]/g, "")
    .split(/[\s-]+/)
    .filter((w) => w && !STOP_WORDS.has(w));
  const base = (words[0] ?? key.replace(/[^a-z0-9]/g, "")) || "example";
  return `${base}.com`;
}

const TINTS = [
  "bg-type-internship/15 text-type-internship",
  "bg-type-research/15 text-type-research",
  "bg-type-hackathon/15 text-type-hackathon",
  "bg-type-conference/15 text-type-conference",
  "bg-type-workshop/20 text-type-workshop",
];

export function CompanyLogo({
  organization,
  className = "",
}: {
  organization: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const letter = (organization?.trim()?.[0] ?? "?").toUpperCase();
  const tint = TINTS[organization.length % TINTS.length];

  if (failed) {
    return (
      <div
        aria-hidden="true"
        className={`h-10 w-10 shrink-0 rounded-[10px] grid place-items-center text-sm font-bold ${tint} ${className}`}
      >
        {letter}
      </div>
    );
  }

  return (
    <img
      src={`https://logo.clearbit.com/${guessDomain(organization)}`}
      alt={`${organization} logo`}
      loading="lazy"
      width={40}
      height={40}
      onError={() => setFailed(true)}
      className={`h-10 w-10 shrink-0 rounded-[10px] object-contain bg-muted p-1 ${className}`}
    />
  );
}
