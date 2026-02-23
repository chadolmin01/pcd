/**
 * MVP 블루프린트 생성기
 * BusinessPlanData를 기반으로 MVP 개발 가이드 생성
 * AI API 호출 없음 - 순수 템플릿 변환
 */

import { BusinessPlanData } from '@/components/idea-validator/types';

export interface MvpFeature {
  priority: 1 | 2 | 3;
  name: string;
  description: string;
  complexity: 'low' | 'medium' | 'high';
}

export interface TechStackRecommendation {
  category: string;
  recommended: string;
  alternatives: string[];
  reasoning: string;
}

export interface RoadmapPhase {
  phase: string;
  duration: string;
  tasks: string[];
  deliverables: string[];
}

export interface MvpBlueprintOutput {
  summary: string;
  coreFeatures: MvpFeature[];
  techStack: TechStackRecommendation[];
  roadmap: RoadmapPhase[];
  estimatedTimeline: string;
  keyMetrics: string[];
}

export function generateMvpBlueprint(data: BusinessPlanData): MvpBlueprintOutput {
  const { basicInfo, sectionData, schedule } = data;

  // 핵심 기능 추출
  const coreFeatures = extractCoreFeatures(sectionData.solution.development_plan, sectionData.solution.differentiation);

  // 산업별 기술 스택 추천
  const techStack = recommendTechStack(basicInfo.industry);

  // 로드맵 생성
  const roadmap = generateRoadmap(schedule, sectionData.scaleup.roadmap);

  // 핵심 지표 추출
  const keyMetrics = extractKeyMetrics(basicInfo.industry, sectionData.scaleup.business_model);

  return {
    summary: `${basicInfo.itemName}의 MVP는 ${basicInfo.targetCustomer}를 위한 핵심 기능에 집중합니다. ${coreFeatures.filter(f => f.priority === 1).length}개의 필수 기능을 우선 개발하고, 이후 점진적으로 확장합니다.`,
    coreFeatures,
    techStack,
    roadmap,
    estimatedTimeline: calculateTimeline(roadmap),
    keyMetrics,
  };
}

function extractCoreFeatures(developmentPlan: string, differentiation: string): MvpFeature[] {
  const features: MvpFeature[] = [];

  // 개발 계획에서 기능 추출
  const planParts = developmentPlan.split(/[.。\n,，]/).filter(p => p.trim().length > 5);

  planParts.slice(0, 3).forEach((part, index) => {
    features.push({
      priority: 1,
      name: extractFeatureName(part),
      description: part.trim(),
      complexity: index === 0 ? 'high' : 'medium',
    });
  });

  // 차별화 포인트에서 추가 기능 추출
  const diffParts = differentiation.split(/[.。\n]/).filter(p => p.trim().length > 5);

  diffParts.slice(0, 2).forEach((part) => {
    features.push({
      priority: 2,
      name: extractFeatureName(part),
      description: part.trim(),
      complexity: 'medium',
    });
  });

  // 기본 기능 추가
  features.push(
    { priority: 3, name: '사용자 인증', description: '회원가입, 로그인, 비밀번호 찾기', complexity: 'low' },
    { priority: 3, name: '관리자 대시보드', description: '기본 통계 및 사용자 관리', complexity: 'medium' },
  );

  return features;
}

function extractFeatureName(text: string): string {
  // 텍스트에서 핵심 키워드 추출
  const trimmed = text.trim();
  const words = trimmed.split(/\s+/);

  if (words.length <= 3) return trimmed;

  // 첫 몇 단어를 제목으로
  return words.slice(0, 3).join(' ');
}

function recommendTechStack(industry: string): TechStackRecommendation[] {
  const lowerIndustry = industry.toLowerCase();

  // 기본 스택
  const baseStack: TechStackRecommendation[] = [
    {
      category: '프론트엔드',
      recommended: 'Next.js + TypeScript',
      alternatives: ['React + Vite', 'Vue.js', 'Svelte'],
      reasoning: 'SEO, 성능 최적화, 풀스택 개발이 가능한 프레임워크',
    },
    {
      category: '스타일링',
      recommended: 'Tailwind CSS',
      alternatives: ['styled-components', 'CSS Modules', 'Chakra UI'],
      reasoning: '빠른 프로토타이핑과 일관된 디자인 시스템 구축',
    },
    {
      category: '백엔드',
      recommended: 'Next.js API Routes',
      alternatives: ['Express.js', 'Fastify', 'NestJS'],
      reasoning: '프론트엔드와 통합된 개발 환경으로 빠른 MVP 개발',
    },
    {
      category: '데이터베이스',
      recommended: 'Supabase (PostgreSQL)',
      alternatives: ['Firebase', 'PlanetScale', 'MongoDB'],
      reasoning: '실시간 기능, 인증, 스토리지가 포함된 올인원 솔루션',
    },
    {
      category: '배포',
      recommended: 'Vercel',
      alternatives: ['Netlify', 'Railway', 'AWS Amplify'],
      reasoning: 'Next.js 최적화, 자동 배포, 글로벌 CDN',
    },
  ];

  // 산업별 추가 스택
  if (lowerIndustry.includes('ai') || lowerIndustry.includes('인공지능')) {
    baseStack.push({
      category: 'AI/ML',
      recommended: 'OpenAI API / Claude API',
      alternatives: ['Hugging Face', 'Google AI', 'AWS Bedrock'],
      reasoning: '빠른 AI 기능 통합, 프로덕션 레벨 품질',
    });
  }

  if (lowerIndustry.includes('커머스') || lowerIndustry.includes('이커머스') || lowerIndustry.includes('쇼핑')) {
    baseStack.push({
      category: '결제',
      recommended: 'Toss Payments',
      alternatives: ['Stripe', 'PortOne', 'KakaoPay'],
      reasoning: '한국 시장에 최적화된 결제 시스템',
    });
  }

  if (lowerIndustry.includes('saas') || lowerIndustry.includes('b2b')) {
    baseStack.push({
      category: '인증',
      recommended: 'NextAuth.js',
      alternatives: ['Auth0', 'Clerk', 'Supabase Auth'],
      reasoning: 'SSO, 소셜 로그인, 팀 관리 기능',
    });
  }

  return baseStack;
}

function generateRoadmap(schedule: BusinessPlanData['schedule'], _roadmapText: string): RoadmapPhase[] {
  // 스케줄 데이터가 있으면 활용
  if (schedule.length > 0) {
    return schedule.map((item, index) => ({
      phase: `Phase ${index + 1}: ${item.content}`,
      duration: item.period,
      tasks: item.detail.split(/[,，.。]/).filter(t => t.trim()).slice(0, 4),
      deliverables: [`${item.content} 완료`],
    }));
  }

  // 기본 로드맵
  return [
    {
      phase: 'Phase 1: MVP 핵심 기능',
      duration: '4-6주',
      tasks: [
        '핵심 기능 개발',
        '기본 UI/UX 구현',
        '사용자 인증 시스템',
        '기본 데이터베이스 설계',
      ],
      deliverables: ['동작하는 MVP', '테스트 가능한 프로토타입'],
    },
    {
      phase: 'Phase 2: 베타 테스트',
      duration: '2-4주',
      tasks: [
        '초기 사용자 온보딩',
        '피드백 수집 시스템',
        '버그 수정 및 안정화',
        '성능 최적화',
      ],
      deliverables: ['베타 버전', '사용자 피드백 리포트'],
    },
    {
      phase: 'Phase 3: 정식 출시',
      duration: '2-4주',
      tasks: [
        '결제 시스템 연동',
        '마케팅 페이지 제작',
        '분석 도구 설정',
        '고객 지원 체계 구축',
      ],
      deliverables: ['정식 서비스', '마케팅 랜딩페이지'],
    },
  ];
}

function calculateTimeline(roadmap: RoadmapPhase[]): string {
  // 간단한 기간 계산
  const totalWeeks = roadmap.reduce((acc, phase) => {
    const match = phase.duration.match(/(\d+)/);
    return acc + (match ? parseInt(match[1]) : 4);
  }, 0);

  if (totalWeeks <= 8) return '약 2개월';
  if (totalWeeks <= 12) return '약 3개월';
  if (totalWeeks <= 16) return '약 4개월';
  return `약 ${Math.ceil(totalWeeks / 4)}개월`;
}

function extractKeyMetrics(industry: string, businessModel: string): string[] {
  const baseMetrics = [
    'DAU/MAU (일간/월간 활성 사용자)',
    'Retention Rate (재방문율)',
    'NPS (순추천지수)',
  ];

  const lowerIndustry = industry.toLowerCase();
  const lowerBM = businessModel.toLowerCase();

  if (lowerBM.includes('구독') || lowerBM.includes('subscription')) {
    baseMetrics.push('MRR (월간 반복 수익)');
    baseMetrics.push('Churn Rate (이탈률)');
  }

  if (lowerBM.includes('거래') || lowerBM.includes('커머스')) {
    baseMetrics.push('GMV (총 거래액)');
    baseMetrics.push('Take Rate (수수료율)');
  }

  if (lowerIndustry.includes('saas') || lowerIndustry.includes('b2b')) {
    baseMetrics.push('CAC (고객 획득 비용)');
    baseMetrics.push('LTV (고객 생애 가치)');
  }

  return baseMetrics.slice(0, 6);
}

// MVP 블루프린트 마크다운 생성
export function generateMvpMarkdown(blueprint: MvpBlueprintOutput): string {
  return `# MVP 블루프린트

## 📋 개요
${blueprint.summary}

**예상 개발 기간:** ${blueprint.estimatedTimeline}

---

## 🎯 핵심 기능 (우선순위별)

### P1 - 필수 기능 (Must Have)
${blueprint.coreFeatures.filter(f => f.priority === 1).map(f => `- **${f.name}**: ${f.description} (복잡도: ${f.complexity})`).join('\n')}

### P2 - 중요 기능 (Should Have)
${blueprint.coreFeatures.filter(f => f.priority === 2).map(f => `- **${f.name}**: ${f.description} (복잡도: ${f.complexity})`).join('\n')}

### P3 - 부가 기능 (Nice to Have)
${blueprint.coreFeatures.filter(f => f.priority === 3).map(f => `- **${f.name}**: ${f.description} (복잡도: ${f.complexity})`).join('\n')}

---

## 🛠 추천 기술 스택

${blueprint.techStack.map(tech => `### ${tech.category}
- **추천:** ${tech.recommended}
- **대안:** ${tech.alternatives.join(', ')}
- **이유:** ${tech.reasoning}
`).join('\n')}

---

## 📅 개발 로드맵

${blueprint.roadmap.map(phase => `### ${phase.phase}
**기간:** ${phase.duration}

**할 일:**
${phase.tasks.map(t => `- ${t}`).join('\n')}

**산출물:**
${phase.deliverables.map(d => `- ${d}`).join('\n')}
`).join('\n')}

---

## 📊 핵심 지표 (KPIs)

${blueprint.keyMetrics.map(m => `- ${m}`).join('\n')}

---

*Generated by Draft AI*
`;
}
