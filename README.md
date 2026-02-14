## Smart Resume Feedback System

Full-stack hackathon solution: Next.js (App Router) + Tailwind frontend, FastAPI backend. Provides recruiter-grade, ethical, and ATS-aware resume feedback without storing data.

### Backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate  # Windows; or source .venv/bin/activate on macOS/Linux
pip install -r requirements.txt
set GEMINI_API_KEY=your_key_here  # Windows; or export GEMINI_API_KEY=... on macOS/Linux
uvicorn main:app --reload --port 8000
```
Get a free Gemini API key at [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey).

### Frontend
```bash
cd frontend
npm install
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev
```
Visit http://localhost:3000.

### API contract (POST /analyze-resume)
Request:
```json
{
  "text": "resume plaintext",
  "job_role": "Software Engineer",
  "pdf_base64": "optional pdf base64"
}
```
Response:
```json
{
  "score": 82,
  "ats_score": 85,
  "overall_score": 82,
  "summary": "...",
  "skills_found": ["python", "react"],
  "skills_missing": ["docker"],
  "domain_feature_gaps": [{"feature": "...", "importance": "high", "status": "missing", "suggestion": "..."}],
  "grammar_issues": [{"sentence": "...", "issue": "..."}],
  "actionable_suggestions": ["..."],
  "ats_tips": ["..."],
  "ethical_note": "...",
  "target_role": "Software Engineer"
}
```

### Principles
- **LLM-powered**: Uses Google Gemini for ATS score, domain feature comparison, and actionable feedback.
- No storage: processing is in-memory; PDFs decoded and dropped.
- Ethical AI: skill-based, bias-aware feedback, clear UI disclaimer.
- Client-side DOCX parsing (mammoth); PDFs parsed server-side.
- Accessible UX with loading/error states and manual paste fallback.
