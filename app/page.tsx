"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";

import ConfidenceBadge from "@/components/ConfidenceBadge";
import TriageRecommendationBadge from "@/components/TriageRecommendationBadge";
import { AnalysisResult, DamageSeverity } from "@/lib/types";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }

    setPreviewUrl(imageUrl.trim() || null);
  }, [file, imageUrl]);

  function handleFileChange(nextFile: File | null) {
    setFile(nextFile);
    if (nextFile) setImageUrl("");
    setError(null);
    setResult(null);
  }

  function handleUrlChange(nextUrl: string) {
    setImageUrl(nextUrl);
    if (nextUrl.trim()) setFile(null);
    setError(null);
    setResult(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const formData = new FormData();
      if (file) {
        formData.append("file", file);
      } else if (imageUrl.trim()) {
        formData.append("imageUrl", imageUrl.trim());
      } else {
        setError("Upload an image or paste an image URL.");
        return;
      }

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Analysis failed.");
      }

      setResult(data as AnalysisResult);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Analysis failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  const canAnalyze = Boolean(file || imageUrl.trim());

  return (
    <div className="app-bg relative min-h-full overflow-hidden">
      {/* Decorative orbs */}
      <div
        aria-hidden
        className="orb pointer-events-none absolute -left-16 top-24 h-52 w-52 rounded-full bg-pink-200/40 blur-3xl"
      />
      <div
        aria-hidden
        className="orb orb-delay pointer-events-none absolute -right-12 top-1/3 h-60 w-60 rounded-full bg-purple-200/35 blur-3xl"
      />
      <div
        aria-hidden
        className="orb pointer-events-none absolute bottom-20 left-1/3 h-44 w-44 rounded-full bg-blue-200/30 blur-3xl"
      />

      <main className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center lg:text-left">
          <p className="section-label mb-3">Claims assessment</p>
          <h1 className="text-4xl font-bold tracking-[-0.03em] text-slate-800 sm:text-[2.75rem] sm:leading-tight">
            AI Claims Damage Estimator
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-[15px] leading-relaxed font-normal text-slate-500 lg:mx-0">
            Upload a photo of vehicle damage or paste an image URL for a
            preliminary AI assessment.
          </p>
        </div>

        {/* Main glass container */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Input panel */}
            <section className="glass-card rounded-2xl p-6">
              <p className="section-label mb-2">Input</p>
              <h2 className="mb-1 text-xl font-semibold tracking-[-0.02em] text-slate-800">
                Submit damage photo
              </h2>
              <p className="mb-5 text-sm font-normal leading-relaxed text-slate-500">
                Choose a file or paste a public HTTPS image link.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="file"
                    className="mb-2 block text-sm font-medium tracking-[-0.01em] text-slate-700"
                  >
                    Upload image
                  </label>
                  <input
                    id="file"
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      handleFileChange(event.target.files?.[0] ?? null)
                    }
                    className="block w-full text-sm text-slate-600 file:mr-4 file:cursor-pointer file:rounded-full file:border-0 file:bg-gradient-to-r file:from-violet-600 file:to-fuchsia-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white file:shadow-md hover:file:opacity-90"
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="section-label bg-white px-3">or</span>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="imageUrl"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Image URL
                  </label>
                  <input
                    id="imageUrl"
                    type="url"
                    value={imageUrl}
                    onChange={(event) => handleUrlChange(event.target.value)}
                    placeholder="https://example.com/damaged-car.jpg"
                    className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
                  />
                </div>

                {previewUrl && (
                  <div>
                    <p className="mb-2 text-sm font-medium text-slate-700">
                      Preview
                    </p>
                    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white p-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={previewUrl}
                        alt="Selected vehicle damage preview"
                        className="max-h-64 w-full rounded-xl object-contain"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!canAnalyze || loading}
                  className="btn-gradient w-full rounded-full px-6 py-3 text-sm font-semibold tracking-[-0.01em] text-white disabled:cursor-not-allowed"
                >
                  {loading ? "Analyzing damage..." : "Analyze damage"}
                </button>

                {error && (
                  <div className="rounded-xl border border-rose-200/80 bg-rose-50/80 px-4 py-3 text-sm text-rose-700 backdrop-blur-sm">
                    {error}
                  </div>
                )}
              </form>
            </section>

            {/* Results panel */}
            <section className="glass-card rounded-2xl p-6">
              <p className="section-label mb-2">Results</p>
              <h2 className="mb-1 text-xl font-semibold tracking-[-0.02em] text-slate-800">
                Assessment results
              </h2>
              <p className="mb-5 text-sm font-normal leading-relaxed text-slate-500">
                Vehicle, estimate, and routing guidance at a glance.
              </p>

              {!result && !loading && (
                <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/60 text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-purple-50">
                    <svg
                      className="h-6 w-6 text-purple-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-slate-600">
                    Results will appear here
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Submit a photo to get started
                  </p>
                </div>
              )}

              {loading && (
                <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-2xl bg-white/60">
                  <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-purple-100 border-t-purple-500" />
                  <p className="text-sm font-medium text-slate-600">
                    Analyzing image with AI...
                  </p>
                </div>
              )}

              {result && (
                <div className="space-y-4">
                  <ResultSection title="Vehicle & Damage">
                    <p className="text-lg font-semibold tracking-[-0.02em] text-slate-800">
                      {result.vehicle.make} {result.vehicle.model}
                      <span className="font-normal text-slate-500">
                        {" "}
                        · {result.vehicle.color}
                      </span>
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">Vehicle</span>
                        <ConfidenceBadge
                          title="Vehicle identification"
                          level={result.vehicle.confidence.level}
                          reason={result.vehicle.confidence.reason}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">Damage</span>
                        <SeverityBadge severity={result.damage.severity} />
                        <ConfidenceBadge
                          title="Damage assessment"
                          level={result.damage.confidence.level}
                          reason={result.damage.confidence.reason}
                        />
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600">
                      {result.damage.summary}
                    </p>
                  </ResultSection>

                  <ResultSection title="Estimate">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <p className="text-2xl font-bold tracking-[-0.03em] text-slate-800">
                        ${result.estimate.low.toLocaleString()} – $
                        {result.estimate.high.toLocaleString()}{" "}
                        <span className="text-base font-semibold text-slate-500">
                          {result.estimate.currency}
                        </span>
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">Estimate</span>
                        <ConfidenceBadge
                          title="Repair estimate"
                          level={result.estimate.confidence.level}
                          reason={result.estimate.confidence.reason}
                        />
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">
                      {result.estimate.rationale}
                    </p>
                  </ResultSection>

                  <ResultSection title="Agent Next Steps">
                    <TriageRecommendationBadge
                      recommendation={
                        result.agent_next_steps.triage_recommendation
                      }
                      reason={result.agent_next_steps.triage_reason}
                    />
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-semibold text-slate-700">
                          Missing information
                        </p>
                        <ul className="mt-2 space-y-1.5">
                          {result.agent_next_steps.missing_information.map(
                            (item) => (
                              <li
                                key={item}
                                className="flex items-start gap-2 text-sm text-slate-600"
                              >
                                <span className="mt-0.5 text-slate-400">☐</span>
                                {item}
                              </li>
                            ),
                          )}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-700">
                          Next best actions
                        </p>
                        <ul className="mt-2 space-y-1.5">
                          {result.agent_next_steps.next_best_actions.map(
                            (action) => (
                              <li
                                key={action}
                                className="flex items-start gap-2 text-sm text-slate-600"
                              >
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
                                {action}
                              </li>
                            ),
                          )}
                        </ul>
                      </div>
                    </div>
                  </ResultSection>
                </div>
              )}
            </section>
          </div>
        </div>

        <footer className="glass-card mt-6 rounded-2xl px-5 py-4 text-center text-sm text-slate-500 sm:text-left">
          <span className="font-medium text-slate-700">Disclaimer:</span>{" "}
          Preliminary AI estimate only. Not a final claims decision. A licensed
          adjuster should review all damage before approval.
        </footer>
      </main>
    </div>
  );
}

function ResultSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white/70 p-4">
      <h3 className="text-sm font-semibold tracking-[-0.01em] text-slate-800">
        {title}
      </h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function formatSeverity(severity: DamageSeverity) {
  return severity.charAt(0).toUpperCase() + severity.slice(1);
}

function severityStyles(severity: DamageSeverity) {
  switch (severity) {
    case "minor":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "moderate":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "severe":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "unknown":
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
}

function SeverityBadge({ severity }: { severity: DamageSeverity }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${severityStyles(severity)}`}
    >
      {formatSeverity(severity)}
    </span>
  );
}
