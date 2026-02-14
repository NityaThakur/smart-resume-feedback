// import { AttachedFile, ResumeAnalysis } from "@/types";

// const API_BASE =
//   process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8000";

// export const analyzeResume = async (
//   resumeText: string,
//   jobRole: string,
//   attachedFile?: AttachedFile | null
// ): Promise<ResumeAnalysis> => {
//   const payload = {
//     text: resumeText || "",
//     job_role: jobRole,
//     pdf_base64:
//       attachedFile?.mimeType === "application/pdf" ? attachedFile.base64 : null, // ✅ MUST be null
//   };

//   const response = await fetch(`${API_BASE}/analyze-resume`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(payload),
//   });

//   if (!response.ok) {
//     let detail = "Analysis failed";
//     try {
//       const error = await response.json();
//       detail = error.detail || detail;
//     } catch {}
//     throw new Error(detail);
//   }

//   return response.json();
// };

import { AttachedFile, ResumeAnalysis } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

if (!API_BASE) {
  throw new Error("NEXT_PUBLIC_API_URL is not defined");
}

export const analyzeResume = async (
  resumeText: string,
  jobRole: string,
  attachedFile?: AttachedFile | null
): Promise<ResumeAnalysis> => {
  const payload = {
    text: resumeText || "",
    job_role: jobRole,
    pdf_base64:
      attachedFile?.mimeType === "application/pdf" ? attachedFile.base64 : null,
  };

  const response = await fetch(`${API_BASE}/analyze-resume`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let detail = "Analysis failed";
    try {
      const text = await response.text();
      const parsed = JSON.parse(text);
      detail = parsed.detail || parsed.message || detail;
    } catch {
      /* use default */
    }
    if (response.status === 429) {
      detail = "Too many requests. Please wait a minute and try again.";
    } else if (response.status === 503 && detail === "Analysis failed") {
      detail = "Service temporarily unavailable. Please try again.";
    }
    throw new Error(detail);
  }

  return response.json();
};
