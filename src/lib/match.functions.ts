import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type MatchResult = {
  opportunity_id: string;
  confidence_score: number;
  reason: string;
  note?: string;
};

export type MatchResponse = { matches: MatchResult[]; message?: string };

export const matchOpportunities = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        skills: z.string().trim().min(3).max(1500),
        level: z.enum(["beginner", "intermediate", "advanced"]),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<MatchResponse> => {
    const { runMatching } = await import("./match.server");
    return runMatching(data.skills, data.level);
  });
