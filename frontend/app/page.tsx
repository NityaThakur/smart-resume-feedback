"use client";

import { useState } from "react";
import {
  Upload,
  FileText,
  Loader2,
  Sparkles,
  BrainCircuit,
  ShieldCheck,
  Target,
  Lightbulb,
  Users,
  Info,
  X,
  AlertCircle,
  FileCode,
  CheckCircle2,
  Lock,
  Shield,
  MousePointerClick,
} from "lucide-react";
import mammoth from "mammoth";

import { analyzeResume } from "@/services/geminiService";
import { ResumeAnalysis, LoadingState, AttachedFile } from "@/types";
import { Dashboard } from "@/components/dashboard";

export default function Page() {
  const [resumeText, setResumeText] = useState<string>("");
  const [jobRole, setJobRole] = useState<string>("");
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>(
    LoadingState.IDLE
  );
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState<boolean>(false);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(",")[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setAttachedFile(null);

    try {
      if (file.type === "application/pdf") {
        const base64 = await fileToBase64(file);
        setAttachedFile({
          name: file.name,
          base64,
          mimeType: file.type,
        });
        setResumeText("");
      } else if (
        file.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        file.name.endsWith(".docx")
      ) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        setResumeText(result.value);
        setAttachedFile({
          name: file.name,
          base64: "",
          mimeType: "text/plain",
        });
      } else if (file.type === "text/plain") {
        const text = await file.text();
        setResumeText(text);
        setAttachedFile({
          name: file.name,
          base64: "",
          mimeType: "text/plain",
        });
      } else {
        setError("Unsupported file format. Please upload PDF, DOCX, or TXT.");
      }
    } catch (err) {
      console.error(err);
      setError(
        "Failed to read file. Please try again or paste the text directly."
      );
    }

    e.target.value = "";
  };

  const handleAnalyze = async () => {
    if (!resumeText.trim() && !attachedFile) {
      alert("Please enter resume text or upload a document first.");
      return;
    }

    setLoadingState(LoadingState.LOADING);
    setError(null);

    try {
      const result = await analyzeResume(
        resumeText,
        jobRole,
        attachedFile?.mimeType === "application/pdf" ? attachedFile : null
      );
      setAnalysis(result);
      setLoadingState(LoadingState.SUCCESS);
    } catch (err: any) {
      console.error(err);
      const message =
        typeof err?.message === "string" && err.message.length > 0
          ? err.message
          : "An error occurred during analysis. Please ensure the backend is running and try again.";
      setError(message);
      setLoadingState(LoadingState.ERROR);
    }
  };

  const removeFile = () => {
    setAttachedFile(null);
    setResumeText("");
  };

  const reset = () => {
    setAnalysis(null);
    setLoadingState(LoadingState.IDLE);
    setResumeText("");
    setAttachedFile(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-900 font-sans">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto h-16 px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <BrainCircuit className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-indigo-600">ResuMate</h1>
          </div>

          <button
            onClick={() => setShowInfo(true)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600"
          >
            <Info className="w-4 h-4" />
            Project Insight
          </button>
        </div>
      </nav>

      {/* INFO MODAL */}
      {showInfo && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex gap-2 items-center">
                <Shield className="w-5 h-5 text-indigo-600" />
                <p className="font-bold text-gray-900">
                  How we handle your data
                </p>
              </div>
              <button onClick={() => setShowInfo(false)}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex gap-2 items-start">
                <Lock className="w-4 h-4 text-indigo-600 mt-0.5" />
                <span>No storage: resumes stay in session memory only.</span>
              </li>
              <li className="flex gap-2 items-start">
                <ShieldCheck className="w-4 h-4 text-indigo-600 mt-0.5" />
                <span>
                  Bias-aware: feedback is skill-based and role-focused.
                </span>
              </li>
              <li className="flex gap-2 items-start">
                <MousePointerClick className="w-4 h-4 text-indigo-600 mt-0.5" />
                <span>
                  DOCX parsing runs on-device; PDFs are processed server-side.
                </span>
              </li>
            </ul>
            <button
              onClick={() => setShowInfo(false)}
              className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* MAIN */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        {loadingState !== LoadingState.SUCCESS ? (
          <section className="space-y-12">
            {/* HERO */}
            <div className="text-center space-y-4 max-w-3xl mx-auto">
              <div className="inline-flex gap-2 px-3 py-1 bg-indigo-50 rounded-full text-indigo-700 text-sm font-semibold">
                <Sparkles className="w-4 h-4" />
                Advanced Resume Intelligence
              </div>

              <h2 className="text-4xl sm:text-6xl font-extrabold">
                Land More Interviews with{" "}
                <span className="text-indigo-600">Smart Optimization</span>
              </h2>
            </div>

            {/* INPUT CARD */}
            <div className="bg-white rounded-3xl shadow-xl p-8 space-y-6 max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Target role (tailors skills & ATS keywords)
                  </label>
                  <input
                    className="w-full px-3 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                    value={jobRole}
                    onChange={(e) => setJobRole(e.target.value)}
                    placeholder="e.g., Frontend Developer, Data Analyst"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Upload resume
                  </label>
                  <label className="inline-flex items-center gap-2 px-4 py-3 bg-indigo-50 text-indigo-700 rounded-xl cursor-pointer font-semibold justify-center border border-indigo-100 hover:bg-indigo-100">
                    <Upload className="w-4 h-4" />
                    Select PDF/DOCX/TXT
                    <input
                      type="file"
                      hidden
                      accept=".pdf,.docx,.txt"
                      onChange={handleFileChange}
                    />
                  </label>
                  <p className="text-[11px] text-gray-500">
                    DOCX parsed client-side; PDFs are base64 to backend for
                    extraction.
                  </p>
                </div>
              </div>

              {attachedFile ? (
                <div className="p-4 bg-indigo-50 rounded-xl flex justify-between items-center">
                  <span className="font-bold text-indigo-800">
                    {attachedFile.name}
                  </span>
                  <button onClick={removeFile}>
                    <X className="w-5 h-5 text-red-500" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Paste resume text (fallback)
                  </label>
                  <textarea
                    className="w-full h-64 p-4 border rounded-xl focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                    placeholder="Paste resume text here..."
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                  />
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-xl flex gap-2">
                  <AlertCircle className="w-5 h-5" />
                  {error}
                </div>
              )}

              <button
                onClick={handleAnalyze}
                disabled={loadingState === LoadingState.LOADING}
                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition disabled:opacity-80 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loadingState === LoadingState.LOADING ? (
                  <>
                    <Loader2 className="animate-spin w-5 h-5" />
                    <span>Analyzing with AI… (15–30 sec)</span>
                  </>
                ) : (
                  "Start Expert Analysis"
                )}
              </button>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                <div className="flex gap-2 items-start">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 mt-0.5" />
                  <p>
                    No storage. Processing is in-memory for this session only.
                  </p>
                </div>
                <div className="flex gap-2 items-start">
                  <Target className="w-4 h-4 text-indigo-600 mt-0.5" />
                  <p>
                    Tailored to your target role with skills found vs missing.
                  </p>
                </div>
                <div className="flex gap-2 items-start">
                  <Lightbulb className="w-4 h-4 text-indigo-600 mt-0.5" />
                  <p>Clear, actionable, recruiter-grade recommendations.</p>
                </div>
              </div>
            </div>

            {/* PILLARS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <div className="bg-white rounded-2xl shadow-sm p-6 space-y-3 border">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  Skills Match
                </div>
                <p className="text-sm text-gray-600">
                  We highlight skills you already show and the ones recruiters
                  expect.
                </p>
              </div>
              <div className="bg-white rounded-2xl shadow-sm p-6 space-y-3 border">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-sm font-semibold">
                  <FileCode className="w-4 h-4" />
                  ATS Ready
                </div>
                <p className="text-sm text-gray-600">
                  Clean structure, parsed sections, and keyword mapping to beat
                  ATS filters.
                </p>
              </div>
              <div className="bg-white rounded-2xl shadow-sm p-6 space-y-3 border">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-semibold">
                  <Users className="w-4 h-4" />
                  Recruiter Mindset
                </div>
                <p className="text-sm text-gray-600">
                  Feedback is written from a recruiter perspective: concise,
                  outcome-led, fair.
                </p>
              </div>
            </div>
          </section>
        ) : (
          <Dashboard analysis={analysis!} onReset={reset} />
        )}
      </main>
    </div>
  );
}
