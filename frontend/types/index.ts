export interface GrammarIssue {
  sentence: string;
  issue: string;
}

export interface DomainFeatureGap {
  feature: string;
  importance: string;
  status: string;
  suggestion: string;
}

export interface SectionStatus {
  section: string;
  present: boolean;
  recommendation: string;
}

export interface ResumeAnalysis {
  score: number;
  ats_score: number;
  overall_score: number;
  experience_relevance_score?: number;
  summary: string;
  strengths?: string[];
  skills_found: string[];
  skills_missing: string[];
  domain_feature_gaps: DomainFeatureGap[];
  section_completeness?: SectionStatus[];
  red_flags?: string[];
  grammar_issues: GrammarIssue[];
  actionable_suggestions: string[];
  ats_tips: string[];
  ethical_note: string;
  target_role: string;
}

export enum LoadingState {
  IDLE = "IDLE",
  LOADING = "LOADING",
  SUCCESS = "SUCCESS",
  ERROR = "ERROR",
}

export interface AttachedFile {
  name: string;
  base64: string;
  mimeType: string;
}

export interface AnalysisRequest {
  text: string;
  job_role?: string;
  pdf_base64?: string;
}
