import { GoogleGenAI } from "@google/genai";

import { ANALYSIS_PROMPT } from "./prompt";
import {
  AnalysisResult,
  Confidence,
  ConfidenceDetail,
  DamageSeverity,
  TriageRecommendation,
} from "./types";

const MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.5-pro",
] as const;
const MAX_ATTEMPTS = 6;
const RETRY_DELAY_MS = 1000;

const CONFIDENCE_LEVELS: Confidence[] = ["high", "medium", "low"];
const DAMAGE_SEVERITIES: DamageSeverity[] = [
  "minor",
  "moderate",
  "severe",
  "unknown",
];
const TRIAGE_RECOMMENDATIONS: TriageRecommendation[] = [
  "Fast track",
  "Adjuster review",
  "Specialist review",
  "Potential total loss review",
  "Request more information",
];

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }
  return new GoogleGenAI({ apiKey });
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) return true;

  const message = error.message.toLowerCase();
  if (message.includes("gemini_api_key")) return false;

  return true;
}

function isTransientError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("503") ||
    message.includes("429") ||
    message.includes("504") ||
    message.includes("unavailable") ||
    message.includes("high demand") ||
    message.includes("rate limit") ||
    message.includes("resource exhausted") ||
    message.includes("quota") ||
    message.includes("timeout")
  );
}

function isModelNotFoundError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("404") ||
    message.includes("not found") ||
    message.includes("no longer available")
  );
}

function parseModelJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  const jsonText = fenced ? fenced[1].trim() : trimmed;
  return JSON.parse(jsonText);
}

function normalizeConfidence(level: unknown): Confidence | null {
  if (typeof level !== "string") return null;
  const normalized = level.trim().toLowerCase();
  return CONFIDENCE_LEVELS.includes(normalized as Confidence)
    ? (normalized as Confidence)
    : null;
}

function normalizeSeverity(value: unknown): DamageSeverity | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return DAMAGE_SEVERITIES.includes(normalized as DamageSeverity)
    ? (normalized as DamageSeverity)
    : null;
}

function normalizeTriage(value: unknown): TriageRecommendation | null {
  if (typeof value !== "string") return null;

  const normalized = value.trim().toLowerCase();
  const exact = TRIAGE_RECOMMENDATIONS.find(
    (option) => option.toLowerCase() === normalized,
  );
  if (exact) return exact;

  if (normalized.includes("fast track")) return "Fast track";
  if (normalized.includes("total loss")) return "Potential total loss review";
  if (normalized.includes("specialist")) return "Specialist review";
  if (normalized.includes("adjuster")) return "Adjuster review";
  if (
    normalized.includes("more information") ||
    normalized.includes("request more")
  ) {
    return "Request more information";
  }

  return null;
}

function normalizeConfidenceDetail(
  value: unknown,
  fallbackReason: string,
): ConfidenceDetail {
  if (!value || typeof value !== "object") {
    return { level: "low", reason: fallbackReason };
  }

  const detail = value as Partial<ConfidenceDetail>;
  const level = normalizeConfidence(detail.level) ?? "low";
  const reason =
    typeof detail.reason === "string" && detail.reason.trim()
      ? detail.reason.trim()
      : fallbackReason;

  return { level, reason };
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[$,]/g, ""));
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function normalizeAnalysisResult(data: unknown): AnalysisResult {
  if (!data || typeof data !== "object") {
    throw new Error("Model returned invalid JSON.");
  }

  const raw = data as Record<string, unknown>;
  const vehicle = (raw.vehicle ?? {}) as Record<string, unknown>;
  const damage = (raw.damage ?? {}) as Record<string, unknown>;
  const estimate = (raw.estimate ?? {}) as Record<string, unknown>;
  const agentNextSteps = (raw.agent_next_steps ?? {}) as Record<
    string,
    unknown
  >;

  const low = normalizeNumber(estimate.low);
  const high = normalizeNumber(estimate.high);
  if (low === null || high === null) {
    throw new Error("Model response has invalid estimate values.");
  }

  const severity = normalizeSeverity(damage.severity) ?? "unknown";
  const triage =
    normalizeTriage(agentNextSteps.triage_recommendation) ??
    "Adjuster review";

  const make =
    typeof vehicle.make === "string" && vehicle.make.trim()
      ? vehicle.make.trim()
      : "unknown";
  const model =
    typeof vehicle.model === "string" && vehicle.model.trim()
      ? vehicle.model.trim()
      : "unknown";
  const color =
    typeof vehicle.color === "string" && vehicle.color.trim()
      ? vehicle.color.trim()
      : "unknown";
  const summary =
    typeof damage.summary === "string" && damage.summary.trim()
      ? damage.summary.trim()
      : "Visible damage could not be summarized from this image.";
  const rationale =
    typeof estimate.rationale === "string" && estimate.rationale.trim()
      ? estimate.rationale.trim()
      : "Preliminary estimate based on visible damage only.";
  const triageReason =
    typeof agentNextSteps.triage_reason === "string" &&
    agentNextSteps.triage_reason.trim()
      ? agentNextSteps.triage_reason.trim()
      : "Route based on visible damage and available image detail.";

  return {
    vehicle: {
      make,
      model,
      color,
      confidence: normalizeConfidenceDetail(
        vehicle.confidence,
        "Vehicle identification confidence based on visible features in the photo.",
      ),
    },
    damage: {
      severity,
      summary,
      confidence: normalizeConfidenceDetail(
        damage.confidence,
        "Damage assessment confidence based on image clarity and visible damage.",
      ),
    },
    estimate: {
      low: Math.min(low, high),
      high: Math.max(low, high),
      currency: "USD",
      rationale,
      confidence: normalizeConfidenceDetail(
        estimate.confidence,
        "Estimate confidence reflects visible damage only and may change after inspection.",
      ),
    },
    agent_next_steps: {
      triage_recommendation: triage,
      triage_reason: triageReason,
      missing_information: normalizeStringArray(
        agentNextSteps.missing_information,
      ).slice(0, 4),
      next_best_actions: normalizeStringArray(
        agentNextSteps.next_best_actions,
      ).slice(0, 3),
    },
  };
}

async function callGemini(
  ai: GoogleGenAI,
  model: string,
  base64: string,
  mimeType: string,
): Promise<AnalysisResult> {
  const response = await ai.models.generateContent({
    model,
    contents: [
      { inlineData: { mimeType, data: base64 } },
      { text: ANALYSIS_PROMPT },
    ],
    config: {
      responseMimeType: "application/json",
      temperature: 0.2,
    },
  });

  const text = response.text?.trim();
  if (!text) {
    throw new Error("Model returned an empty response.");
  }

  return normalizeAnalysisResult(parseModelJson(text));
}

export async function analyzeImage(
  base64: string,
  mimeType: string,
): Promise<AnalysisResult> {
  const ai = getClient();
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const model = MODELS[attempt % MODELS.length];

    try {
      return await callGemini(ai, model, base64, mimeType);
    } catch (error) {
      lastError = error;
      console.error(
        `Gemini analysis attempt ${attempt + 1}/${MAX_ATTEMPTS} failed (${model}):`,
        error,
      );

      const isLastAttempt = attempt === MAX_ATTEMPTS - 1;
      if (isLastAttempt || !isRetryableError(error)) {
        break;
      }

      const delayMs = isTransientError(error)
        ? RETRY_DELAY_MS * (attempt + 1)
        : isModelNotFoundError(error)
          ? 0
          : RETRY_DELAY_MS;

      if (delayMs > 0) {
        await sleep(delayMs);
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Failed to analyze image.");
}
