import type { ProgramEligibility } from './types';

// ============================================
// Eligibility Check Types
// ============================================

export interface CompanyInfo {
  incorporationDate?: Date | null;
  hasRevenue?: boolean;
  isIncorporated?: boolean;
}

export interface FounderInfo {
  birthDate?: Date | null;
  age?: number;
}

export interface EligibilityCheckResult {
  isEligible: boolean;
  issues: EligibilityIssue[];
  warnings: EligibilityWarning[];
}

export interface EligibilityIssue {
  code: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface EligibilityWarning {
  code: string;
  message: string;
}

// ============================================
// Eligibility Check Functions
// ============================================

/**
 * Check if a company/founder meets program eligibility requirements
 */
export function checkProgramEligibility(
  program: ProgramEligibility,
  companyInfo?: CompanyInfo,
  founderInfo?: FounderInfo
): EligibilityCheckResult {
  const issues: EligibilityIssue[] = [];
  const warnings: EligibilityWarning[] = [];

  // 1. Company age check
  if (program.min_company_age_months !== null || program.max_company_age_months !== null) {
    if (!companyInfo?.incorporationDate) {
      warnings.push({
        code: 'COMPANY_AGE_UNKNOWN',
        message: '법인 설립일을 입력하면 자격요건을 정확히 확인할 수 있습니다',
      });
    } else {
      const ageMonths = calculateCompanyAgeMonths(companyInfo.incorporationDate);

      if (program.min_company_age_months !== null && ageMonths < program.min_company_age_months) {
        issues.push({
          code: 'COMPANY_TOO_YOUNG',
          message: `법인 설립 후 최소 ${program.min_company_age_months}개월 필요 (현재 ${ageMonths}개월)`,
          severity: 'error',
        });
      }

      if (program.max_company_age_months !== null && ageMonths > program.max_company_age_months) {
        issues.push({
          code: 'COMPANY_TOO_OLD',
          message: `법인 설립 후 ${program.max_company_age_months}개월 이내만 지원 가능 (현재 ${ageMonths}개월)`,
          severity: 'error',
        });
      }
    }
  }

  // 2. Revenue requirement
  if (program.requires_revenue) {
    if (companyInfo?.hasRevenue === undefined) {
      warnings.push({
        code: 'REVENUE_UNKNOWN',
        message: '매출 여부를 확인하면 자격요건을 정확히 확인할 수 있습니다',
      });
    } else if (!companyInfo.hasRevenue) {
      issues.push({
        code: 'NO_REVENUE',
        message: '이 프로그램은 매출 실적이 있는 기업만 지원 가능합니다',
        severity: 'error',
      });
    }
  }

  // 3. Incorporation requirement
  if (program.requires_incorporation) {
    if (companyInfo?.isIncorporated === undefined) {
      warnings.push({
        code: 'INCORPORATION_UNKNOWN',
        message: '법인 등록 여부를 확인하면 자격요건을 정확히 확인할 수 있습니다',
      });
    } else if (!companyInfo.isIncorporated) {
      issues.push({
        code: 'NOT_INCORPORATED',
        message: '이 프로그램은 법인 사업자만 지원 가능합니다',
        severity: 'error',
      });
    }
  }

  // 4. Founder age check
  if (program.min_founder_age !== null || program.max_founder_age !== null) {
    const founderAge = founderInfo?.age ?? (founderInfo?.birthDate ? calculateAge(founderInfo.birthDate) : null);

    if (founderAge === null) {
      warnings.push({
        code: 'FOUNDER_AGE_UNKNOWN',
        message: '대표자 나이를 입력하면 자격요건을 정확히 확인할 수 있습니다',
      });
    } else {
      if (program.min_founder_age !== null && founderAge < program.min_founder_age) {
        issues.push({
          code: 'FOUNDER_TOO_YOUNG',
          message: `대표자 나이 ${program.min_founder_age}세 이상 필요 (현재 ${founderAge}세)`,
          severity: 'error',
        });
      }

      if (program.max_founder_age !== null && founderAge > program.max_founder_age) {
        issues.push({
          code: 'FOUNDER_TOO_OLD',
          message: `대표자 나이 ${program.max_founder_age}세 이하만 지원 가능 (현재 ${founderAge}세)`,
          severity: 'error',
        });
      }
    }
  }

  return {
    isEligible: issues.filter((i) => i.severity === 'error').length === 0,
    issues,
    warnings,
  };
}

/**
 * Calculate company age in months from incorporation date
 */
function calculateCompanyAgeMonths(incorporationDate: Date): number {
  const now = new Date();
  const yearDiff = now.getFullYear() - incorporationDate.getFullYear();
  const monthDiff = now.getMonth() - incorporationDate.getMonth();
  return yearDiff * 12 + monthDiff;
}

/**
 * Calculate age from birth date
 */
function calculateAge(birthDate: Date): number {
  const now = new Date();
  let age = now.getFullYear() - birthDate.getFullYear();
  const monthDiff = now.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

// ============================================
// Program Recommendation
// ============================================

/**
 * Recommend programs based on company/founder info
 */
export function recommendPrograms(
  programs: ProgramEligibility[],
  companyInfo?: CompanyInfo,
  founderInfo?: FounderInfo
): Array<{
  program: ProgramEligibility;
  eligibility: EligibilityCheckResult;
  matchScore: number;
}> {
  return programs
    .map((program) => {
      const eligibility = checkProgramEligibility(program, companyInfo, founderInfo);

      // Calculate match score (0-100)
      let matchScore = 100;
      matchScore -= eligibility.issues.filter((i) => i.severity === 'error').length * 50;
      matchScore -= eligibility.issues.filter((i) => i.severity === 'warning').length * 10;
      matchScore -= eligibility.warnings.length * 5;
      matchScore = Math.max(0, matchScore);

      return {
        program,
        eligibility,
        matchScore,
      };
    })
    .sort((a, b) => {
      // Sort by eligibility first, then by match score
      if (a.eligibility.isEligible !== b.eligibility.isEligible) {
        return a.eligibility.isEligible ? -1 : 1;
      }
      return b.matchScore - a.matchScore;
    });
}

// ============================================
// Score Threshold Check
// ============================================

export interface ThresholdCheckResult {
  passed: boolean;
  failingCategories: Array<{
    category: string;
    current: number;
    threshold: number;
  }>;
}

/**
 * Check if scorecard meets program's minimum threshold requirements
 */
export function checkScoreThresholds(
  scorecard: Record<string, { current: number; max: number }> | null,
  thresholds: Record<string, number> | null
): ThresholdCheckResult {
  if (!thresholds) {
    return { passed: true, failingCategories: [] };
  }

  const failingCategories: ThresholdCheckResult['failingCategories'] = [];

  for (const [category, threshold] of Object.entries(thresholds)) {
    const current = scorecard?.[category]?.current || 0;
    if (current < threshold) {
      failingCategories.push({
        category,
        current,
        threshold,
      });
    }
  }

  return {
    passed: failingCategories.length === 0,
    failingCategories,
  };
}
