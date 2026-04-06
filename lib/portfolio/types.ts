import { z } from 'zod';
import type { Scorecard, ScorecardCategory } from '@/components/idea-validator/types';

// ============================================
// Database Types
// ============================================

export interface IdeaCore {
  id: string;
  user_id: string;
  title: string;
  category: string;
  one_liner: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export type VersionStatus = 'draft' | 'in_progress' | 'submitted' | 'archived';
export type ValidationLevelType = 'sketch' | 'mvp' | 'defense';

export interface IdeaVersion {
  id: string;
  core_id: string;
  version_number: number;
  version_name: string;
  target_program_id: string | null;
  target_program_name: string | null;
  validation_level: ValidationLevelType | null;
  scorecard: VersionScorecard | null;
  total_score: number | null;
  chat_summary: string | null;
  key_feedback: string[];
  status: VersionStatus;
  forked_from: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

// Extended scorecard with teamComposition
export interface VersionScorecard extends Omit<Scorecard, 'totalScore'> {
  teamComposition: {
    current: number;
    max: number;
    filled: boolean;
  };
  totalScore: number;
}

export type SubmissionResult = 'pending' | 'document_pass' | 'final_pass' | 'rejected';

export interface IdeaSubmission {
  id: string;
  version_id: string;
  program_name: string;
  submitted_at: string;
  deadline: string | null;
  result: SubmissionResult | null;
  result_note: string | null;
  created_at: string;
}

export interface ProgramEligibility {
  program_id: string;
  program_name: string;
  min_company_age_months: number | null;
  max_company_age_months: number | null;
  requires_revenue: boolean;
  requires_incorporation: boolean;
  min_founder_age: number | null;
  max_founder_age: number | null;
  weights: Record<string, number> | null;
  threshold_scores: Record<string, number> | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// UI Types
// ============================================

export interface IdeaWithLatestVersion extends IdeaCore {
  latest_version: IdeaVersion | null;
  version_count: number;
}

export interface IdeaDetailWithVersions extends IdeaCore {
  versions: IdeaVersion[];
  submissions: IdeaSubmission[];
}

export interface GapAnalysisResult {
  category: ScorecardCategory | 'teamComposition';
  categoryName: string;
  current: number;
  target: number;
  gap: number;
  isBelowThreshold: boolean;
  recommendation: string;
}

export interface GapAnalysis {
  programId: string;
  programName: string;
  currentTotalScore: number;
  targetTotalScore: number;
  gaps: GapAnalysisResult[];
  overallGap: number;
  eligibilityIssues: string[];
  aiRecommendations: string[];
}

export interface VersionComparison {
  fromVersion: IdeaVersion;
  toVersion: IdeaVersion;
  scoreChanges: Array<{
    category: ScorecardCategory | 'teamComposition';
    from: number;
    to: number;
    delta: number;
  }>;
  improvements: string[];
}

// ============================================
// Tab Types for IdeaDetailView
// ============================================

export type IdeaDetailTab = 'current' | 'history' | 'analysis';

// ============================================
// Zod Schemas for validation
// ============================================

export const ideaCoreCreateSchema = z.object({
  title: z.string().min(1).max(200),
  category: z.string().min(1),
  one_liner: z.string().max(500).optional().nullable(),
});

export const ideaCoreUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  category: z.string().min(1).optional(),
  one_liner: z.string().max(500).optional().nullable(),
});

export const ideaVersionCreateSchema = z.object({
  core_id: z.string().uuid(),
  version_name: z.string().min(1).max(100),
  target_program_id: z.string().optional().nullable(),
  target_program_name: z.string().optional().nullable(),
  validation_level: z.enum(['sketch', 'mvp', 'defense']).optional().nullable(),
  scorecard: z.any().optional().nullable(), // Complex JSONB, validated separately
  total_score: z.number().int().min(0).max(100).optional().nullable(),
  chat_summary: z.string().max(50000).optional().nullable(),
  key_feedback: z.array(z.string()).max(20).optional().default([]),
  status: z.enum(['draft', 'in_progress', 'submitted', 'archived']).optional().default('draft'),
  forked_from: z.string().uuid().optional().nullable(),
});

export const ideaVersionUpdateSchema = z.object({
  version_name: z.string().min(1).max(100).optional(),
  target_program_id: z.string().optional().nullable(),
  target_program_name: z.string().optional().nullable(),
  validation_level: z.enum(['sketch', 'mvp', 'defense']).optional().nullable(),
  scorecard: z.any().optional().nullable(),
  total_score: z.number().int().min(0).max(100).optional().nullable(),
  chat_summary: z.string().max(50000).optional().nullable(),
  key_feedback: z.array(z.string()).max(20).optional(),
  status: z.enum(['draft', 'in_progress', 'submitted', 'archived']).optional(),
});

export const ideaSubmissionCreateSchema = z.object({
  version_id: z.string().uuid(),
  program_name: z.string().min(1),
  submitted_at: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format',
  }),
  deadline: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format',
  }).optional().nullable(),
  result: z.enum(['pending', 'document_pass', 'final_pass', 'rejected']).optional().nullable(),
  result_note: z.string().optional().nullable(),
});

export const ideaSubmissionUpdateSchema = z.object({
  program_name: z.string().min(1).optional(),
  submitted_at: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format',
  }).optional(),
  deadline: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format',
  }).optional().nullable(),
  result: z.enum(['pending', 'document_pass', 'final_pass', 'rejected']).optional().nullable(),
  result_note: z.string().optional().nullable(),
});

// ============================================
// Request/Response Types
// ============================================

export type IdeaCoreCreateInput = z.infer<typeof ideaCoreCreateSchema>;
export type IdeaCoreUpdateInput = z.infer<typeof ideaCoreUpdateSchema>;
export type IdeaVersionCreateInput = z.infer<typeof ideaVersionCreateSchema>;
export type IdeaVersionUpdateInput = z.infer<typeof ideaVersionUpdateSchema>;
export type IdeaSubmissionCreateInput = z.infer<typeof ideaSubmissionCreateSchema>;
export type IdeaSubmissionUpdateInput = z.infer<typeof ideaSubmissionUpdateSchema>;

// Fork version request
export interface ForkVersionInput {
  source_version_id: string;
  new_version_name: string;
  target_program_id?: string | null;
  target_program_name?: string | null;
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================
// Constants
// ============================================

export const SCORECARD_CATEGORY_NAMES: Record<ScorecardCategory | 'teamComposition', string> = {
  problemDefinition: '문제 정의',
  solution: '솔루션',
  marketAnalysis: '시장 분석',
  revenueModel: '수익 모델',
  differentiation: '차별화',
  logicalConsistency: '논리 일관성',
  feasibility: '실현 가능성',
  feedbackReflection: '피드백 반영',
  teamComposition: '팀 구성',
};

export const VERSION_STATUS_LABELS: Record<VersionStatus, string> = {
  draft: 'Draft',
  in_progress: '진행중',
  submitted: '제출완료',
  archived: '보관',
};

export const VERSION_STATUS_ICONS: Record<VersionStatus, string> = {
  draft: '○',
  in_progress: '●',
  submitted: '✓',
  archived: '📁',
};

export const SUBMISSION_RESULT_LABELS: Record<SubmissionResult, string> = {
  pending: '심사중',
  document_pass: '서류합격',
  final_pass: '최종합격',
  rejected: '불합격',
};

export const SUBMISSION_RESULT_COLORS: Record<SubmissionResult, string> = {
  pending: 'text-yellow-600 bg-yellow-50',
  document_pass: 'text-blue-600 bg-blue-50',
  final_pass: 'text-green-600 bg-green-50',
  rejected: 'text-red-600 bg-red-50',
};
