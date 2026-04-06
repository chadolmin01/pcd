import type { ScorecardCategory } from '@/components/idea-validator/types';
import type {
  IdeaVersion,
  VersionScorecard,
  GapAnalysis,
  GapAnalysisResult,
  VersionComparison,
  ProgramEligibility,
} from './types';
import { SCORECARD_CATEGORY_NAMES } from './types';

// ============================================
// Gap Analysis
// ============================================

/**
 * Calculate gap between current scorecard and target program requirements
 */
export function calculateGapAnalysis(
  version: IdeaVersion,
  programEligibility: ProgramEligibility
): GapAnalysis {
  const scorecard = version.scorecard as VersionScorecard | null;
  const weights = programEligibility.weights || {};
  const thresholds = programEligibility.threshold_scores || {};

  // All scorecard categories including teamComposition
  const allCategories: (ScorecardCategory | 'teamComposition')[] = [
    'problemDefinition',
    'solution',
    'marketAnalysis',
    'revenueModel',
    'differentiation',
    'logicalConsistency',
    'feasibility',
    'feedbackReflection',
    'teamComposition',
  ];

  const gaps: GapAnalysisResult[] = allCategories.map((category) => {
    const current = scorecard?.[category]?.current || 0;
    const max = scorecard?.[category]?.max || 15;
    const weight = weights[category] || 0;
    const threshold = thresholds[category] || 0;

    // Target is proportional to weight (weight represents % of total 100)
    // Convert weight to target score based on max score for category
    const target = Math.round((weight / 100) * max * 1.5); // 1.5x multiplier for competitive score

    return {
      category,
      categoryName: SCORECARD_CATEGORY_NAMES[category],
      current,
      target: Math.min(target, max),
      gap: target - current,
      isBelowThreshold: current < threshold,
      recommendation: generateCategoryRecommendation(category, current, target, threshold),
    };
  });

  // Filter to only categories with weight
  const relevantGaps = gaps.filter((g) => (weights[g.category] || 0) > 0);

  // Calculate overall metrics
  const currentTotal = scorecard?.totalScore || 0;
  const targetTotal = Math.min(
    relevantGaps.reduce((sum, g) => sum + g.target, 0),
    100
  );

  // Generate AI recommendations
  const aiRecommendations = generateAIRecommendations(relevantGaps);

  // Check eligibility issues (will be expanded in eligibility.ts)
  const eligibilityIssues: string[] = [];

  return {
    programId: programEligibility.program_id,
    programName: programEligibility.program_name,
    currentTotalScore: currentTotal,
    targetTotalScore: targetTotal,
    gaps: relevantGaps.sort((a, b) => b.gap - a.gap), // Sort by largest gap first
    overallGap: targetTotal - currentTotal,
    eligibilityIssues,
    aiRecommendations,
  };
}

/**
 * Generate recommendation for a specific category
 */
function generateCategoryRecommendation(
  category: ScorecardCategory | 'teamComposition',
  current: number,
  target: number,
  threshold: number
): string {
  if (current < threshold) {
    return `과락 위험: 최소 ${threshold}점 필요 (현재 ${current}점)`;
  }

  if (current >= target) {
    return '목표 달성!';
  }

  const gap = target - current;
  if (gap <= 2) {
    return '조금만 더 보강하면 목표 달성';
  }

  const recommendationMap: Record<ScorecardCategory | 'teamComposition', string> = {
    problemDefinition: '문제의 심각성과 시급성을 더 구체적으로 설명하세요',
    solution: '솔루션의 차별화된 기술적 접근을 강조하세요',
    marketAnalysis: 'TAM/SAM/SOM 시장 규모 데이터를 추가하세요',
    revenueModel: '수익화 전략과 유닛 이코노믹스를 구체화하세요',
    differentiation: '경쟁사 대비 명확한 차별점을 제시하세요',
    logicalConsistency: '문제-솔루션-시장-수익 간의 논리적 연결을 강화하세요',
    feasibility: '개발 로드맵과 필요 자원을 구체화하세요',
    feedbackReflection: '전문가 피드백을 반영한 개선 사항을 명시하세요',
    teamComposition: '팀 역량과 역할 분담을 구체적으로 설명하세요',
  };

  return recommendationMap[category];
}

/**
 * Generate AI recommendations based on gap analysis
 */
function generateAIRecommendations(gaps: GapAnalysisResult[]): string[] {
  const recommendations: string[] = [];

  // Priority 1: Below threshold (과락 위험)
  const belowThreshold = gaps.filter((g) => g.isBelowThreshold);
  if (belowThreshold.length > 0) {
    recommendations.push(
      `긴급 보강 필요: ${belowThreshold.map((g) => g.categoryName).join(', ')} (과락 기준 미달)`
    );
  }

  // Priority 2: Largest gaps
  const largestGaps = gaps.filter((g) => g.gap > 3 && !g.isBelowThreshold).slice(0, 3);
  largestGaps.forEach((g) => {
    recommendations.push(`${g.categoryName}: ${g.recommendation}`);
  });

  // Priority 3: Almost there
  const almostThere = gaps.filter((g) => g.gap > 0 && g.gap <= 2);
  if (almostThere.length > 0) {
    recommendations.push(
      `조금만 더: ${almostThere.map((g) => g.categoryName).join(', ')} (목표 근접)`
    );
  }

  return recommendations.slice(0, 5); // Max 5 recommendations
}

// ============================================
// Version Comparison
// ============================================

/**
 * Compare two versions and calculate score changes
 */
export function compareVersions(
  fromVersion: IdeaVersion,
  toVersion: IdeaVersion
): VersionComparison {
  const fromScorecard = fromVersion.scorecard as VersionScorecard | null;
  const toScorecard = toVersion.scorecard as VersionScorecard | null;

  const allCategories: (ScorecardCategory | 'teamComposition')[] = [
    'problemDefinition',
    'solution',
    'marketAnalysis',
    'revenueModel',
    'differentiation',
    'logicalConsistency',
    'feasibility',
    'feedbackReflection',
    'teamComposition',
  ];

  const scoreChanges = allCategories.map((category) => {
    const from = fromScorecard?.[category]?.current || 0;
    const to = toScorecard?.[category]?.current || 0;
    return {
      category,
      from,
      to,
      delta: to - from,
    };
  });

  // Generate improvement descriptions
  const improvements = scoreChanges
    .filter((c) => c.delta > 0)
    .map((c) => {
      const categoryName = SCORECARD_CATEGORY_NAMES[c.category];
      return `${categoryName} +${c.delta}점 (${c.from}→${c.to})`;
    });

  return {
    fromVersion,
    toVersion,
    scoreChanges: scoreChanges.filter((c) => c.delta !== 0),
    improvements,
  };
}

// ============================================
// Score Utilities
// ============================================

/**
 * Calculate total score from scorecard
 */
export function calculateTotalScore(scorecard: VersionScorecard | null): number {
  if (!scorecard) return 0;

  const categories: (ScorecardCategory | 'teamComposition')[] = [
    'problemDefinition',
    'solution',
    'marketAnalysis',
    'revenueModel',
    'differentiation',
    'logicalConsistency',
    'feasibility',
    'feedbackReflection',
    'teamComposition',
  ];

  return categories.reduce((total, cat) => {
    return total + (scorecard[cat]?.current || 0);
  }, 0);
}

/**
 * Get score grade (A~F) based on total score
 */
export function getScoreGrade(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

/**
 * Get score color class based on score
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
}

/**
 * Get score background color class
 */
export function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-green-50 border-green-200';
  if (score >= 60) return 'bg-yellow-50 border-yellow-200';
  return 'bg-red-50 border-red-200';
}
