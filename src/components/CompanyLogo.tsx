import { useEffect, useState } from "react";

const TINTS = [
  "bg-type-internship/15 text-type-internship",
  "bg-type-research/15 text-type-research",
  "bg-type-hackathon/15 text-type-hackathon",
  "bg-type-conference/15 text-type-conference",
  "bg-type-workshop/20 text-type-workshop",
];

export function CompanyLogo({
  organization,
  logoUrl,
  className = "",
}: {
  organization: string;
  logoUrl?: string | null;
  className?: string;
}) {
  const src = logoUrl?.trim() ? logoUrl.trim() : null;
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const letter = (organization?.trim()?.[0] ?? "?").toUpperCase();
  const tint = TINTS[(organization?.length ?? 0) % TINTS.length];

  if (!src || failed) {
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
      src={src}
      alt={`${organization} logo`}
      loading="lazy"
      width={40}
      height={40}
      onError={() => setFailed(true)}
      className={`h-10 w-10 shrink-0 rounded-[10px] object-contain bg-white p-1 ${className}`}
    />
  );
}
