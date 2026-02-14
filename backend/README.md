# Smart Resume Feedback API (FastAPI)

LLM-powered FastAPI backend for the Smart Resume Feedback System. Uses Google Gemini to analyze resumes with ATS score, domain-specific feature comparison, and actionable feedback.

## Quick start

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate  # On Windows; use `source .venv/bin/activate` on macOS/Linux
pip install -r requirements.txt
set GEMINI_API_KEY=your_key_here  # Required for LLM analysis. Get one at https://aistudio.google.com/app/apikey
uvicorn main:app --reload --port 8000
```

The service exposes:
- `GET /health` for health checks.
- `POST /analyze-resume` for LLM-based analysis.

## Request (POST /analyze-resume)
```json
{
  "text": "Plaintext resume body",
  "job_role": "Software Engineer",
  "pdf_base64": "optional-base64-pdf"
}
```

## Response (strict JSON)
```json
{
  "score": 78,
  "ats_score": 85,
  "overall_score": 78,
  "summary": "...",
  "skills_found": ["python", "react"],
  "skills_missing": ["docker"],
  "domain_feature_gaps": [{"feature": "Docker", "importance": "high", "status": "missing", "suggestion": "Add Docker experience in projects."}],
  "grammar_issues": [{"sentence": "...", "issue": "..."}],
  "actionable_suggestions": ["..."],
  "ats_tips": ["..."],
  "ethical_note": "...",
  "target_role": "Software Engineer"
}
```

## Notes
- Requires `GEMINI_API_KEY` or `GOOGLE_API_KEY` environment variable.
- CORS is open for local/demo use; tighten for production.
- No data is persisted; all processing is in-memory.
