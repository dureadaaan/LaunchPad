import { createClient } from "@supabase/supabase-js";
import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import type { MatchResponse, MatchResult } from "./match.functions";
import type { Database } from "@/integrations/supabase/types";

function publicSupabase() {
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(process.env.SUPABASE_URL!, key, {
    auth: { persistSession: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

function clamp(n: unknown) {
  const v = typeof n === "number" ? Math.round(n) : Number.parseInt(String(n ?? 0), 10);
  if (!Number.isFinite(v)) return 0;
  return Math.min(100, Math.max(0, v));
}

function words(text: string, max: number) {
  const parts = String(text ?? "").trim().split(/\s+/);
  return parts.slice(0, max).join(" ");
}

export async function runMatching(
  skills: string,
  level: "beginner" | "intermediate" | "advanced",
): Promise<MatchResponse> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("AI is not configured yet.");

  const today = new Date().toISOString().slice(0, 10);
  const supabase = publicSupabase();
  const { data: rows, error } = await supabase
    .from("opportunities")
    .select(
      "id, title, type, skill_level, location_type, pakistan_friendly, paid, description, organization, deadline",
    )
    .or(`deadline.gte.${today},deadline.is.null`)
    .order("deadline", { ascending: true })
    .limit(80);

  if (error) throw new Error("Could not load opportunities.");
  const opportunities = rows ?? [];
  if (opportunities.length === 0) {
    return {
      matches: [],
      message: "No open opportunities right now — check back soon, new ones land regularly.",
    };
  }

  const validIds = new Set(opportunities.map((o) => o.id));

  const { SYSTEM_PROMPT } = await import("./match.prompt");
  const gateway = createLovableAiGatewayProvider(apiKey);

  const { text } = await generateText({
    model: gateway("google/gemini-3.5-flash"),
    system: SYSTEM_PROMPT,
    prompt: [
      `Student experience level: ${level}`,
      `Student skills / interests (free text): ${skills}`,
      "",
      "Currently active opportunities (JSON):",
      JSON.stringify(
        opportunities.map((o) => ({
          id: o.id,
          title: o.title,
          organization: o.organization,
          type: o.type,
          skill_level: o.skill_level,
          location_type: o.location_type,
          pakistan_friendly: o.pakistan_friendly,
          paid: o.paid,
          description: (o.description ?? "").slice(0, 400),
        })),
      ),
    ].join("\n"),
  });

  let parsed: unknown;
  try {
    const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
    parsed = JSON.parse(cleaned);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("The matcher returned an unreadable response.");
    parsed = JSON.parse(text.slice(start, end + 1));
  }

  const raw = parsed as { matches?: unknown[]; message?: unknown };
  const list = Array.isArray(raw?.matches) ? raw.matches : Array.isArray(parsed) ? (parsed as unknown[]) : [];

  const matches: MatchResult[] = list
    .map((m) => m as Record<string, unknown>)
    .filter((m) => typeof m?.opportunity_id === "string" && validIds.has(m.opportunity_id as string))
    .slice(0, 8)
    .map((m) => {
      const note = typeof m.note === "string" && m.note.trim() ? words(m.note, 15) : undefined;
      return {
        opportunity_id: m.opportunity_id as string,
        confidence_score: clamp(m.confidence_score),
        reason: words(typeof m.reason === "string" ? m.reason : "", 20),
        ...(note ? { note } : {}),
      };
    })
    .sort((a, b) => b.confidence_score - a.confidence_score);

  const message =
    typeof raw?.message === "string" && raw.message.trim()
      ? raw.message.trim()
      : matches.length === 0
        ? "Nothing quite matches yet — try broadening your interests or check back soon."
        : undefined;

  return { matches, ...(message ? { message } : {}) };
}
