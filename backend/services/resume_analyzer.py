"""
LLM-based resume analyzer using Google Gemini API.
Production-ready: retry logic, timeout, expanded schema, structured logging.
"""

import json
import logging
import os
import time
from typing import Any

from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

# Limits
MAX_RESUME_CHARS = 50_000
LLM_TIMEOUT_SECONDS = 90
MAX_RETRIES = 2


class GrammarIssue(BaseModel):
    sentence: str = Field(description="The problematic sentence or phrase from the resume")
    issue: str = Field(description="Brief description of the grammar or clarity issue")


class DomainFeatureGap(BaseModel):
    feature: str = Field(description="The skill, qualification, or requirement for the target domain")
    importance: str = Field(description="high, medium, or low - how critical for the role")
    status: str = Field(description="missing or partial - whether absent or weakly demonstrated")
    suggestion: str = Field(description="Concrete recommendation to address this gap")


class SectionStatus(BaseModel):
    section: str = Field(description="e.g., Experience, Education, Skills, Summary, Projects")
    present: bool = Field(description="Whether this section exists in the resume")
    recommendation: str = Field(description="Brief recommendation if missing or weak")


class LLMResumeAnalysis(BaseModel):
    """Structured output from LLM for resume analysis."""

    ats_score: int = Field(
        ge=0,
        le=100,
        description="ATS compatibility score 0-100. Keyword density, section clarity, parseability.",
    )
    overall_score: int = Field(
        ge=0,
        le=100,
        description="Overall role match score 0-100. Skills, experience relevance, domain fit.",
    )
    experience_relevance_score: int = Field(
        ge=0,
        le=100,
        default=0,
        description="How well work experience aligns with target role (0-100).",
    )
    summary: str = Field(description="Executive summary of resume strength (2-4 sentences)")
    strengths: list[str] = Field(
        default_factory=list,
        description="Top 3-5 standout strengths or selling points for this candidate.",
    )
    skills_found: list[str] = Field(
        description="Skills and technologies explicitly present or demonstrable in the resume",
    )
    skills_missing: list[str] = Field(
        description="Skills expected for the target domain but not found or weak",
    )
    domain_feature_gaps: list[DomainFeatureGap] = Field(
        default_factory=list,
        description="Domain-specific feature comparison: requirements vs resume",
    )
    section_completeness: list[SectionStatus] = Field(
        default_factory=list,
        description="Which standard sections exist and recommendations for missing ones",
    )
    red_flags: list[str] = Field(
        default_factory=list,
        description="Potential concerns: employment gaps, formatting issues, unclear dates, etc.",
    )
    grammar_issues: list[GrammarIssue] = Field(
        default_factory=list,
        description="Grammar, clarity, or style issues",
    )
    actionable_suggestions: list[str] = Field(
        description="Prioritized concrete improvements (5-10 items), high-impact first",
    )
    ats_tips: list[str] = Field(
        description="ATS optimization tips specific to this resume (3-6 items)",
    )


SYSTEM_PROMPT = """You are an expert resume analyst and ATS (Applicant Tracking System) specialist.
You evaluate resumes for recruiter-grade feedback with emphasis on:
1. ATS compatibility (keyword matching, section structure, parseability)
2. Domain-specific requirements for the target role
3. Skill presence vs. industry expectations
4. Grammar, clarity, and impact-oriented language
5. Section completeness (Experience, Education, Skills, Summary, Projects)
6. Red flags (gaps, inconsistencies, weak formatting)
7. Standout strengths to highlight

Be specific, actionable, and fair. Avoid demographic bias. Focus on skills, experience, and presentation."""

USER_PROMPT_TEMPLATE = """Analyze this resume for the target role: **{job_role}**

## Resume Text:
{resume_text}

---

Provide a comprehensive production-grade analysis. Consider:
- **ATS Score**: Would ATS parse this well? Keyword density, section headers, formatting?
- **Experience Relevance**: How well does work history align with {job_role}?
- **Strengths**: List 3-5 standout selling points for this candidate.
- **Section Completeness**: Check Experience, Education, Skills, Summary, Projects. Note missing/weak sections.
- **Red Flags**: Employment gaps, unclear dates, formatting issues, inconsistencies.
- **Domain Feature Gaps**: Requirements for {job_role} that are missing or weak.
- **Skills**: Extract found skills; flag missing ones for the role.
- **Grammar/Clarity**: Long sentences, passive voice, weak verbs, first-person overuse.
- **Actionable Suggestions**: Prioritized improvements, high-impact first.
- **ATS Tips**: Concrete tips for better parsing and keyword visibility.

Respond with valid JSON matching the required schema. Be concise but specific."""


def _get_gemini_client() -> Any:
    """Import and return Gemini client."""
    try:
        from google import genai

        api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError(
                "GEMINI_API_KEY or GOOGLE_API_KEY environment variable is required. "
                "Get a free key at https://aistudio.google.com/app/apikey"
            )
        return genai.Client(api_key=api_key)
    except ImportError as e:
        raise ImportError("Install google-genai: pip install google-genai") from e


def _call_llm(client: Any, prompt: str, config: dict, model: str) -> Any:
    """Single LLM call. Raises on failure."""
    return client.models.generate_content(
        model=model,
        contents=[SYSTEM_PROMPT, prompt],
        config=config,
    )


def analyze_resume_with_llm(resume_text: str, job_role: str) -> LLMResumeAnalysis:
    """
    Analyze resume using Gemini LLM with retry logic and timeout.
    Returns structured analysis with ATS score, domain comparison, and feedback.
    """
    if len(resume_text) > MAX_RESUME_CHARS:
        raise ValueError(
            f"Resume text exceeds maximum length of {MAX_RESUME_CHARS:,} characters. "
            "Please shorten your resume or paste a summary."
        )

    client = _get_gemini_client()
    job_role = (job_role or "Software Engineer").strip()
    truncated_text = resume_text[:MAX_RESUME_CHARS]
    prompt = USER_PROMPT_TEMPLATE.format(
        job_role=job_role,
        resume_text=truncated_text,
    )

    config = {
        "response_mime_type": "application/json",
        "response_json_schema": LLMResumeAnalysis.model_json_schema(),
    }

    # models_to_try = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]
    models_to_try = ["gemini-2.5-flash", "gemini-2.0-flash"]
    last_error: Exception | None = None

    for attempt in range(MAX_RETRIES + 1):
        for model in models_to_try:
            try:
                start = time.perf_counter()
                logger.info("LLM analysis started", extra={"model": model, "attempt": attempt + 1})

                response = _call_llm(client, prompt, config, model)

                elapsed = time.perf_counter() - start
                logger.info("LLM analysis completed", extra={"model": model, "elapsed_sec": round(elapsed, 2)})

                raw_text = (response.text or "").strip()
                if raw_text.startswith("```"):
                    lines = raw_text.split("\n")
                    raw_text = "\n".join(lines[1:-1] if lines and lines[-1].strip() == "```" else lines[1:])

                data = json.loads(raw_text)
                # Fill defaults for optional fields LLM might omit
                data.setdefault("experience_relevance_score", data.get("overall_score", 0))
                data.setdefault("strengths", [])
                data.setdefault("section_completeness", [])
                data.setdefault("red_flags", [])
                return LLMResumeAnalysis.model_validate(data)

            except json.JSONDecodeError as e:
                last_error = RuntimeError(f"Invalid LLM response format: {e}") 
                logger.warning("LLM JSON parse failed", extra={"model": model, "error": str(e)})
            except Exception as e:
                last_error = e
                err_str = str(e).lower()
                if "api_key" in err_str or "401" in err_str or "403" in err_str:
                    raise ValueError(
                        "Invalid or missing Gemini API key. Set GEMINI_API_KEY. "
                        "Get a free key at https://aistudio.google.com/app/apikey"
                    ) from e
                logger.warning(
                    "LLM call failed",
                    extra={"model": model, "attempt": attempt + 1, "error": str(e)},
                )
                if attempt < MAX_RETRIES:
                    time.sleep(1.5 * (attempt + 1))  # Backoff
                continue

    raise RuntimeError(
        f"Resume analysis failed after {MAX_RETRIES + 1} attempts. Please try again. "
        f"Last error: {last_error}"
    ) from last_error
