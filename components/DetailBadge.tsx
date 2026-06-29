"use client";

import { useEffect, useId, useRef, useState } from "react";

interface DetailBadgeProps {
  displayText: string;
  detailTitle: string;
  reason: string;
  ariaLabel: string;
  badgeClassName: string;
  interaction?: "click" | "hover";
}

export default function DetailBadge({
  displayText,
  detailTitle,
  reason,
  ariaLabel,
  badgeClassName,
  interaction = "click",
}: DetailBadgeProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const popoverId = useId();

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function showPopover() {
    setOpen(true);
  }

  function hidePopover() {
    setOpen(false);
  }

  function togglePopover() {
    setOpen((current) => !current);
  }

  return (
    <div
      ref={containerRef}
      className="relative inline-flex"
      onMouseEnter={interaction === "hover" ? showPopover : undefined}
      onMouseLeave={interaction === "hover" ? hidePopover : undefined}
    >
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-controls={popoverId}
        onClick={togglePopover}
        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${badgeClassName}`}
      >
        <span>{displayText}</span>
        <svg
          className="h-3 w-3 shrink-0 opacity-60"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>

      {open && (
        <div
          id={popoverId}
          role="tooltip"
          className="absolute left-0 top-full z-20 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-lg"
        >
          <p className="text-xs font-semibold text-slate-800">{detailTitle}</p>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
            {reason}
          </p>
        </div>
      )}
    </div>
  );
}
