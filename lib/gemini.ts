import { GoogleGenAI } from "@google/genai";

import { ANALYSIS_PROMPT } from "./prompt";
import {
  AnalysisResult,
  Confidence,
  ConfidenceDetail,
  DamageSeverity,
  TriageRecommendation,
} from "./types";

const MODELS = ["gemini-2.5-flash", "gemini-2.0-flash"] as const;
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

function isConfidence(value: unknown): value is Confidence {
  return (
    typeof value === "string" &&
    CONFIDENCE_LEVELS.includes(value as Confidence)
  );
}

function isDamageSeverity(value: unknown): value is DamageSeverity {
  return (
    typeof value === "string" &&
    DAMAGE_SEVERITIES.includes(value as DamageSeverity)
  );
}

function isTriageRecommendation(
  value: unknown,
): value is TriageRecommendation {
  return (
    typeof value === "string" &&
    TRIAGE_RECOMMENDATIONS.includes(value as TriageRecommendation)
  );
}

function validateConfidenceDetail(
  value: unknown,
  fieldName: string,
): ConfidenceDetail {
  if (!value || typeof value !== "object") {
    throw new Error(`Model response is missing ${fieldName}.`);
  }

  const detail = value as Partial<ConfidenceDetail>;

  if (!isConfidence(detail.level) || typeof detail.reason !== "string") {
    throw new Error(`Model response has invalid ${fieldName}.`);
  }

  return {
    level: detail.level,
    reason: detail.reason,
  };
}

function validateStringArray(value: unknown, fieldName: string): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(`Model response has invalid ${fieldName}.`);
  }
  return value;
}

function validateAnalysisResult(data: unknown): AnalysisResult {
  if (!data || typeof data !== "object") {
    throw new Error("Model returned invalid JSON.");
  }

  const result = data as Partial<AnalysisResult>;

  if (
    !result.vehicle ||
    !result.damage ||
    !result.estimate ||
    !result.agent_next_steps
  ) {
    throw new Error("Model response is missing required fields.");
  }

  if (
    typeof result.vehicle.make !== "string" ||
    typeof result.vehicle.model !== "string" ||
    typeof result.vehicle.color !== "string" ||
    !isDamageSeverity(result.damage.severity) ||
    typeof result.damage.summary !== "string" ||
    typeof result.estimate.low !== "number" ||
    typeof result.estimate.high !== "number" ||
    result.estimate.currency !== "USD" ||
    typeof result.estimate.rationale !== "string" ||
    !isTriageRecommendation(result.agent_next_steps.triage_recommendation) ||
    typeof result.agent_next_steps.triage_reason !== "string"
  ) {
    throw new Error("Model response has invalid field values.");
  }

  return {
    vehicle: {
      make: result.vehicle.make,
      model: result.vehicle.model,
      color: result.vehicle.color,
      confidence: validateConfidenceDetail(
        result.vehicle.confidence,
        "vehicle.confidence",
      ),
    },
    damage: {
      severity: result.damage.severity,
      summary: result.damage.summary,
      confidence: validateConfidenceDetail(
        result.damage.confidence,
        "damage.confidence",
      ),
    },
    estimate: {
      low: result.estimate.low,
      high: result.estimate.high,
      currency: "USD",
      rationale: result.estimate.rationale,
      confidence: validateConfidenceDetail(
        result.estimate.confidence,
        "estimate.confidence",
      ),
    },
    agent_next_steps: {
      triage_recommendation: result.agent_next_steps.triage_recommendation,
      triage_reason: result.agent_next_steps.triage_reason,
      missing_information: validateStringArray(
        result.agent_next_steps.missing_information,
        "agent_next_steps.missing_information",
      ).slice(0, 4),
      next_best_actions: validateStringArray(
        result.agent_next_steps.next_best_actions,
        "agent_next_steps.next_best_actions",
      ).slice(0, 3),
    },
  };
}

export async function analyzeImage(
  base64: string,
  mimeType: string,
): Promise<AnalysisResult> {
  const ai = getClient();
  let lastError: unknown;

  for (const model of MODELS) {
    try {
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

      const text = response.text;
      if (!text) {
        throw new Error("Model returned an empty response.");
      }

      return validateAnalysisResult(JSON.parse(text));
    } catch (error) {
      lastError = error;
      const message =
        error instanceof Error ? error.message.toLowerCase() : "";
      const isModelUnavailable =
        message.includes("not found") ||
        message.includes("404") ||
        message.includes("does not exist");

      if (!isModelUnavailable || model === MODELS[MODELS.length - 1]) {
        break;
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Failed to analyze image.");
}
