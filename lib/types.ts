export type Confidence = "high" | "medium" | "low";

export type DamageSeverity = "minor" | "moderate" | "severe" | "unknown";

export type TriageRecommendation =
  | "Fast track"
  | "Adjuster review"
  | "Specialist review"
  | "Potential total loss review"
  | "Request more information";

export interface ConfidenceDetail {
  level: Confidence;
  reason: string;
}

export interface AnalysisResult {
  vehicle: {
    make: string;
    model: string;
    color: string;
    confidence: ConfidenceDetail;
  };
  damage: {
    severity: DamageSeverity;
    summary: string;
    confidence: ConfidenceDetail;
  };
  estimate: {
    low: number;
    high: number;
    currency: "USD";
    rationale: string;
    confidence: ConfidenceDetail;
  };
  agent_next_steps: {
    triage_recommendation: TriageRecommendation;
    triage_reason: string;
    missing_information: string[];
    next_best_actions: string[];
  };
}

export interface NormalizedImage {
  base64: string;
  mimeType: string;
}
