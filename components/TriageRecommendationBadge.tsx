"use client";

import DetailBadge from "@/components/DetailBadge";
import { TriageRecommendation } from "@/lib/types";

function triageStyles(recommendation: TriageRecommendation) {
  switch (recommendation) {
    case "Fast track":
      return "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100/80";
    case "Adjuster review":
      return "bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100/80";
    case "Specialist review":
      return "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100/80";
    case "Potential total loss review":
      return "bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100/80";
    case "Request more information":
      return "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200/80";
  }
}

interface TriageRecommendationBadgeProps {
  recommendation: TriageRecommendation;
  reason: string;
}

export default function TriageRecommendationBadge({
  recommendation,
  reason,
}: TriageRecommendationBadgeProps) {
  return (
    <DetailBadge
      displayText={`Triage Recommendation: ${recommendation.toLowerCase()}`}
      detailTitle="Triage recommendation"
      reason={reason}
      ariaLabel={`Triage recommendation: ${recommendation}. Hover or click for details.`}
      badgeClassName={triageStyles(recommendation)}
      interaction="hover"
    />
  );
}
