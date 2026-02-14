import base64
import logging
import re
import time
from io import BytesIO
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pypdf import PdfReader
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from services.resume_analyzer import (
    LLMResumeAnalysis,
    analyze_resume_with_llm,
)

# Load .env so GEMINI_API_KEY is available
load_dotenv(Path(__file__).resolve().parent / ".env")

# Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)

# Limits
MAX_TEXT_CHARS = 50_000
MAX_PDF_BASE64_BYTES = 6_000_000  # ~4.5MB decoded

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="Smart Resume Feedback API",
    description=(
        "Production-grade LLM-powered resume analysis with ATS score, "
        "domain-specific feature comparison, section completeness, and recruiter feedback."
    ),
    version="2.1.0",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

ETHICAL_NOTE = (
    "We never store resumes. Feedback is skill-based, avoids demographic bias, "
    "and is meant as guidance—not an automated hiring decision."
)


class GrammarIssue(BaseModel):
    sentence: str
    issue: str


class DomainFeatureGap(BaseModel):
    feature: str
    importance: str
    status: str
    suggestion: str


class SectionStatus(BaseModel):
    section: str
    present: bool
    recommendation: str


class ResumeRequest(BaseModel):
    text: str = Field(default="", description="Resume plain text. For PDFs, include pdf_base64.")
    job_role: Optional[str] = Field(
        None,
        description="Target job role for tailored analysis (e.g., Software Engineer).",
    )
    pdf_base64: Optional[str] = Field(None, description="Optional base64-encoded PDF.")


class ResumeAnalysis(BaseModel):
    score: int
    ats_score: int
    overall_score: int
    experience_relevance_score: int = 0
    summary: str
    strengths: list[str] = []
    skills_found: list[str]
    skills_missing: list[str]
    domain_feature_gaps: list[DomainFeatureGap] = []
    section_completeness: list[SectionStatus] = []
    red_flags: list[str] = []
    grammar_issues: list[GrammarIssue]
    actionable_suggestions: list[str]
    ats_tips: list[str]
    ethical_note: str
    target_role: str


def decode_pdf_to_text(pdf_base64: str) -> str:
    try:
        binary = base64.b64decode(pdf_base64)
        if len(binary) > MAX_PDF_BASE64_BYTES:
            raise HTTPException(
                status_code=400,
                detail=f"PDF too large. Maximum size is {MAX_PDF_BASE64_BYTES // 1_000_000}MB.",
            )
        reader = PdfReader(BytesIO(binary))
        pages = [page.extract_text() or "" for page in reader.pages]
        combined = "\n".join(pages)
        cleaned = re.sub(r"\s+", " ", combined).strip()
        return cleaned
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid PDF data") from exc


def clean_text(text: str) -> str:
    cleaned = text.replace("\x00", " ")
    return re.sub(r"\s+", " ", cleaned).strip()


def _to_api_response(llm_result: LLMResumeAnalysis, target_role: str) -> ResumeAnalysis:
    return ResumeAnalysis(
        score=llm_result.ats_score,
        ats_score=llm_result.ats_score,
        overall_score=llm_result.overall_score,
        experience_relevance_score=getattr(llm_result, "experience_relevance_score", llm_result.overall_score),
        summary=llm_result.summary,
        strengths=getattr(llm_result, "strengths", []) or [],
        skills_found=llm_result.skills_found,
        skills_missing=llm_result.skills_missing,
        domain_feature_gaps=[
            DomainFeatureGap(feature=g.feature, importance=g.importance, status=g.status, suggestion=g.suggestion)
            for g in llm_result.domain_feature_gaps
        ],
        section_completeness=[
            SectionStatus(section=s.section, present=s.present, recommendation=s.recommendation)
            for s in getattr(llm_result, "section_completeness", []) or []
        ],
        red_flags=getattr(llm_result, "red_flags", []) or [],
        grammar_issues=[GrammarIssue(sentence=g.sentence, issue=g.issue) for g in llm_result.grammar_issues],
        actionable_suggestions=llm_result.actionable_suggestions,
        ats_tips=llm_result.ats_tips,
        ethical_note=ETHICAL_NOTE,
        target_role=target_role,
    )


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "version": "2.1.0"}


@app.post("/analyze-resume", response_model=ResumeAnalysis)
@limiter.limit("10/minute")
async def analyze_resume(request: Request, payload: ResumeRequest) -> ResumeAnalysis:
    start = time.perf_counter()
    extracted_text = clean_text(payload.text or "")

    if payload.pdf_base64:
        pdf_text = decode_pdf_to_text(payload.pdf_base64)
        extracted_text = f"{extracted_text}\n{pdf_text}".strip()
        if not pdf_text:
            raise HTTPException(
                status_code=400,
                detail="Could not extract text from the PDF. Upload a text-based PDF or paste your resume.",
            )

    if not extracted_text:
        raise HTTPException(status_code=400, detail="Resume text is required for analysis.")

    if len(extracted_text) > MAX_TEXT_CHARS:
        raise HTTPException(
            status_code=400,
            detail=f"Resume text exceeds maximum length of {MAX_TEXT_CHARS:,} characters.",
        )

    target_role = (payload.job_role or "Software Engineer").strip()

    try:
        llm_result = analyze_resume_with_llm(extracted_text, target_role)
        result = _to_api_response(llm_result, target_role)
        elapsed = time.perf_counter() - start
        logger.info("Analysis completed", extra={"target_role": target_role, "elapsed_sec": round(elapsed, 2)})
        return result
    except ValueError as e:
        logger.warning("Analysis failed (config)", extra={"error": str(e)})
        raise HTTPException(status_code=503, detail=str(e))
    except RuntimeError as e:
        logger.error("Analysis failed", extra={"error": str(e)})
        raise HTTPException(status_code=500, detail=str(e))
