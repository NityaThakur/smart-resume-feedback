"use client";

import React, { useState } from "react";
import { ResumeAnalysis } from "@/types";
import { ScoreGauge } from "./ScoreGauge";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Sparkles,
  BookOpen,
  ShieldCheck,
  ArrowRight,
  UserCheck,
  Gauge,
  Shield,
  Target,
  AlertTriangle,
  TrendingUp,
  Award,
  ClipboardCheck,
  Copy,
  FileCheck,
} from "lucide-react";

interface DashboardProps {
  analysis: ResumeAnalysis;
  onReset: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ analysis, onReset }) => {
  const [copied, setCopied] = useState(false);
  const atsScore = analysis.ats_score ?? analysis.score;
  const overallScore = analysis.overall_score ?? analysis.score;
  const expScore = analysis.experience_relevance_score ?? overallScore;
  const domainGaps = analysis.domain_feature_gaps ?? [];
  const strengths = analysis.strengths ?? [];
  const sectionStatus = analysis.section_completeness ?? [];
  const redFlags = analysis.red_flags ?? [];

  const handleCopyReport = async () => {
    const report = [
      `Resume Intelligence Report - ${analysis.target_role}`,
      `ATS Score: ${atsScore} | Role Match: ${overallScore} | Experience Relevance: ${expScore}`,
      "",
      "Summary:",
      analysis.summary,
      "",
      strengths.length
        ? `Strengths:\n${strengths.map((s, i) => `${i + 1}. ${s}`).join("\n")}`
        : "",
      analysis.skills_found.length
        ? `Skills Found: ${analysis.skills_found.join(", ")}`
        : "",
      analysis.skills_missing.length
        ? `Skills to Add: ${analysis.skills_missing.join(", ")}`
        : "",
      "",
      "Actionable Suggestions:",
      analysis.actionable_suggestions
        .map((s, i) => `${i + 1}. ${s}`)
        .join("\n"),
    ]
      .filter(Boolean)
      .join("\n");
    await navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 fill-mode-both">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <Sparkles className="text-indigo-600 w-8 h-8" />
            Resume Intelligence Report
          </h2>
          <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
            <Gauge className="w-4 h-4 text-indigo-500" />
            LLM-powered analysis with ATS optimization and domain-specific
            insights.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleCopyReport}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-indigo-200 hover:text-indigo-600 transition-all shadow-sm"
          >
            {copied ? (
              <ClipboardCheck className="w-4 h-4 text-green-600" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            {copied ? "Copied!" : "Copy Report"}
          </button>
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-indigo-200 hover:text-indigo-600 transition-all shadow-sm"
          >
            Analyze New Draft
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Score Gauges & Summary */}
        <div className="lg:col-span-1 space-y-6">
          <div className="grid grid-cols-3 gap-3 text-center">
            <ScoreGauge score={atsScore} label="ATS" size="sm" />
            <ScoreGauge score={overallScore} label="Role Match" size="sm" />
            <ScoreGauge score={expScore} label="Experience" size="sm" />
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-500" />
              Executive Summary
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              {analysis.summary}
            </p>
            <div className="mt-3 text-xs text-gray-500">
              Target role:{" "}
              <span className="font-semibold text-gray-700">
                {analysis.target_role}
              </span>
            </div>
          </div>

          <div className="bg-indigo-900 p-6 rounded-2xl text-white">
            <div className="flex items-center gap-2 mb-3">
              <UserCheck className="w-5 h-5 text-indigo-300" />
              <h4 className="font-bold text-sm">Recruiter Perspective</h4>
            </div>
            <p className="text-xs text-indigo-100 leading-relaxed">
              Recruiters spend ~6 seconds on a resume. You are a{" "}
              <span className="font-bold text-indigo-300">
                {overallScore >= 80
                  ? "top-tier"
                  : overallScore >= 60
                    ? "competitive"
                    : "developing"}
              </span>{" "}
              candidate for this role.
            </p>
          </div>
        </div>

        {/* Skills & Domain Comparison */}
        <div className="lg:col-span-2 space-y-6">
          {strengths.length > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-emerald-100">
              <h3 className="font-bold flex items-center gap-2 text-emerald-800 mb-4">
                <Award className="w-5 h-5" />
                Key Strengths
              </h3>
              <ul className="space-y-2">
                {strengths.map((s, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-700">
                    <span className="text-emerald-600 font-bold">{i + 1}.</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {redFlags.length > 0 && (
            <div className="bg-rose-50 p-6 rounded-2xl border border-rose-200">
              <h3 className="font-bold flex items-center gap-2 text-rose-800 mb-4">
                <AlertTriangle className="w-5 h-5" />
                Items to Address
              </h3>
              <ul className="space-y-2">
                {redFlags.map((flag, i) => (
                  <li key={i} className="text-sm text-rose-800 flex gap-2">
                    <span className="text-rose-500">•</span>
                    <span>{flag}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {sectionStatus.length > 0 && (
            <div className="bg-white p-6 rounded-2xl border">
              <h3 className="font-bold flex items-center gap-2 text-slate-800 mb-4">
                <FileCheck className="w-5 h-5 text-indigo-500" />
                Section Completeness
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {sectionStatus.map((s, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-xl border ${
                      s.present
                        ? "bg-green-50 border-green-200"
                        : "bg-amber-50 border-amber-200"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {s.present ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-amber-600" />
                      )}
                      <span className="font-semibold text-gray-800">
                        {s.section}
                      </span>
                    </div>
                    {!s.present && s.recommendation && (
                      <p className="text-xs text-gray-600 mt-1 ml-6">
                        {s.recommendation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white p-8 rounded-2xl border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div>
                <h3 className="font-bold flex items-center gap-2 text-green-800">
                  <CheckCircle className="w-5 h-5" />
                  Technical Inventory
                </h3>
                <div className="flex flex-wrap gap-2 mt-4">
                  {analysis.skills_found.map((skill, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 bg-green-50 text-green-700 text-xs font-bold rounded-lg"
                    >
                      {skill}
                    </span>
                  ))}
                  {analysis.skills_found.length === 0 && (
                    <p className="text-xs text-gray-400">
                      No target-role keywords detected yet. Add specific tools
                      and technologies.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-bold flex items-center gap-2 text-rose-800">
                  <XCircle className="w-5 h-5" />
                  Competitive Gaps
                </h3>
                <div className="flex flex-wrap gap-2 mt-4">
                  {analysis.skills_missing.map((skill, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 bg-rose-50 text-rose-700 text-xs font-bold rounded-lg"
                    >
                      {skill}
                    </span>
                  ))}
                  {analysis.skills_missing.length === 0 && (
                    <p className="text-xs text-gray-400">
                      Great—no major gaps flagged for this role.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Domain Feature Comparison - NEW */}
          {domainGaps.length > 0 && (
            <div className="bg-white p-6 rounded-2xl border">
              <h3 className="font-bold flex items-center gap-2 text-slate-800 mb-4">
                <Target className="w-5 h-5 text-indigo-500" />
                Domain Feature Comparison
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                How your resume compares to typical requirements for{" "}
                {analysis.target_role}:
              </p>
              <div className="space-y-4">
                {domainGaps.map((gap, i) => (
                  <div
                    key={i}
                    className={`p-4 rounded-xl border ${
                      gap.status === "missing"
                        ? "bg-amber-50 border-amber-200"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-gray-800">
                        {gap.feature}
                      </span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          gap.importance === "high"
                            ? "bg-red-100 text-red-700"
                            : gap.importance === "medium"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {gap.importance}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-500" />
                      {gap.status === "missing"
                        ? "Missing"
                        : "Partially demonstrated"}
                    </p>
                    <p className="text-sm text-gray-700 mt-2">
                      {gap.suggestion}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grammar + Suggestions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border">
              <h3 className="font-bold flex items-center gap-2 text-amber-800 mb-4">
                <AlertCircle className="w-5 h-5" />
                Linguistic Clarity
              </h3>
              <ul className="space-y-4">
                {analysis.grammar_issues.map((item, i) => (
                  <li key={i}>
                    <p className="text-xs italic text-gray-400">
                      &quot;{item.sentence}&quot;
                    </p>
                    <p className="text-sm font-semibold text-amber-900">
                      {item.issue}
                    </p>
                  </li>
                ))}
                {analysis.grammar_issues.length === 0 && (
                  <li className="text-sm text-gray-500">
                    No grammar or clarity issues detected. Keep using concise
                    bullets.
                  </li>
                )}
              </ul>
            </div>

            <div className="bg-white p-6 rounded-2xl border">
              <h3 className="font-bold flex items-center gap-2 text-indigo-800 mb-4">
                <TrendingUp className="w-5 h-5" />
                Impactful Adjustments
              </h3>
              <ul className="space-y-3">
                {analysis.actionable_suggestions.map((tip, i) => (
                  <li key={i} className="text-sm text-gray-600">
                    {i + 1}. {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border">
            <h3 className="font-bold flex items-center gap-2 text-slate-800 mb-4">
              <Shield className="w-5 h-5 text-indigo-500" />
              ATS Optimization Tips
            </h3>
            <ul className="space-y-2">
              {analysis.ats_tips.map((tip, i) => (
                <li key={i} className="text-sm text-gray-600 flex gap-2">
                  <span className="text-indigo-500 font-semibold">
                    {i + 1}.
                  </span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white border p-5 rounded-2xl flex gap-4">
        <ShieldCheck className="w-5 h-5 text-indigo-600" />
        <p className="text-xs text-gray-500 italic">{analysis.ethical_note}</p>
      </div>
    </div>
  );
};
