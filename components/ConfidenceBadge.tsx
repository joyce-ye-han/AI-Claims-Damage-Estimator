"use client";

import DetailBadge from "@/components/DetailBadge";
import { Confidence } from "@/lib/types";

function levelStyles(level: Confidence) {
  if (level === "high")
    return "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/80";
  if (level === "medium")
    return "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100/80";
  return "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100/80";
}

function formatLevel(level: Confidence) {
  return level.charAt(0).toUpperCase() + level.slice(1);
}

interface ConfidenceBadgeProps {
  title: string;
  level: Confidence;
  reason: string;
}

export default function ConfidenceBadge({
  title,
  level,
  reason,
}: ConfidenceBadgeProps) {
  const formattedLevel = formatLevel(level);

  return (
    <DetailBadge
      displayText={`Confidence: ${formattedLevel}`}
      detailTitle={title}
      reason={reason}
      ariaLabel={`${title} confidence: ${level}. Click for details.`}
      badgeClassName={levelStyles(level)}
      interaction="click"
    />
  );
}
