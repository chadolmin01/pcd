// 스타트업 평가 기준 Knowledge Base
// Draft-GitHub에서 통합된 VC 평가 기준 및 성공 사례

export const STARTUP_EVALUATION_CRITERIA = {
  // VC 투자 심사 기준
  vcCriteria: {
    market: {
      tam: '최소 $1B 이상 (유니콘 가능성)',
      growthRate: '연 20% 이상 성장 시장 선호',
      timing: '너무 빠르지도, 늦지도 않은 시장 진입',
    },
    team: {
      founderExpertise: '해당 분야 전문성 또는 실행력',
      teamComposition: '기술/비즈니스/제품 균형',
      cofounderRelation: '오랜 협업 경험 또는 상호 보완적',
    },
    product: {
      problemSolutionFit: '실존하는 문제를 해결하는가?',
      differentiation: '기존 솔루션 대비 10배 이상 개선?',
      techBarrier: '쉽게 복제 불가능한가?',
    },
    businessModel: {
      revenueClarity: '명확한 매출 구조',
      unitEconomics: 'LTV > CAC × 3',
      scalability: '마진이 개선되는 구조',
    },
    traction: {
      userGrowth: 'MoM 10% 이상',
      retention: '월간 리텐션 40% 이상',
      revenue: '초기 단계에서도 수익 발생 시 긍정적',
    },
  },

  // 레드플래그 (투자 회피 요인)
  redFlags: {
    idea: [
      '"모든 사람"이 타겟 고객',
      '명확한 문제 없이 "기술이 좋아서" 시작',
      '경쟁사가 너무 많거나, 아예 없음 (둘 다 위험)',
      '"첫 번째 무버"라는 주장 (대부분 착각)',
    ],
    market: [
      '시장 규모를 "전체 인구 × 가격"으로 계산',
      '"TAM은 크지만 우리가 1%만 차지해도..." (근거 없음)',
      '경쟁사를 과소평가 ("우리가 더 좋아요")',
    ],
    businessModel: [
      '"일단 사용자 모으고 나중에 수익화"',
      '광고 수익만 의존 (소규모 스타트업에 비현실적)',
      'B2B인데 영업 전략 없음',
    ],
  },

  // 좋은 스타트업 특징
  goodSignals: [
    '창업자가 타겟 고객이다',
    '친구 5명이 "이거 나오면 무조건 쓸게"',
    '기존 솔루션이 특정 측면에서 명확히 약함',
    '바이럴 가능성 (공유 = 사용)',
  ],

  // 투자 심사 시 자주 받는 질문
  investorQuestions: [
    { q: 'Why now?', desc: '왜 지금인가?' },
    { q: 'Why you?', desc: '왜 당신인가?' },
    { q: 'Defensibility', desc: '경쟁사가 똑같이 만들면?' },
    { q: 'Distribution', desc: '첫 100명 고객을 어떻게 확보할 건가?' },
    { q: 'Vision', desc: '5년 후 이 회사는 어떤 모습인가?' },
    { q: 'Risk', desc: '최악의 시나리오는?' },
    { q: 'Use of funds', desc: '투자금을 어디에 쓸 건가?' },
  ],

  // 단계별 검증 기준
  stageValidation: {
    preSeed: ['명확한 고객 페르소나', '검증 가능한 가설', 'MVP 또는 프로토타입', '초기 사용자 피드백'],
    seed: ['활성 사용자 1,000명 이상', '유료 전환 고객 존재', '월간 성장률 10% 이상', '팀 구성 완료'],
    seriesA: ['반복 가능한 성장 모델', '연 매출 $1M 이상', '단위 경제학 증명', '시장 확장 계획'],
  },
};

// 성공한 스타트업 사례 (Few-shot learning용)
export const SUCCESS_CASE_PATTERNS = {
  // 공통 패턴
  commonPatterns: {
    target: '"모든 사람" 아닌 구체적 페르소나',
    problem: '창업자가 직접 겪은 pain point',
    improvement: '기존 솔루션 대비 특정 측면에서 10배 압도적',
    networkEffect: '사용자가 늘수록 가치 증가',
    uxObsession: '기능보다 경험 우선',
  },

  // 차별화 전략 사례
  differentiationExamples: [
    { name: 'Notion', strategy: '유연성 (블록 시스템)', lesson: '"올인원"이지만 하나라도 제대로' },
    { name: 'Figma', strategy: '협업 (실시간)', lesson: '기술적 도전 → 강력한 진입 장벽' },
    { name: 'Superhuman', strategy: '속도 (키보드)', lesson: '극소수에게 완벽 > 모든 사람 대상' },
    { name: 'Linear', strategy: '디자인 (아름다움)', lesson: '기존 시장도 UX로 재정의 가능' },
    { name: 'Loom', strategy: '간편함 (원클릭)', lesson: '타이밍이 중요 + 사용 사례 확장' },
  ],

  // 수익화 패턴
  monetizationPatterns: {
    freemium: '개인 무료, 팀 유료 - 바이럴 성장 중시',
    premium: '극소수 타겟에 고가 전략 (Superhuman $30/월)',
    b2b: '기업 라이선스 + 교육기관 무료 (미래 사용자 확보)',
  },

  // 나쁜 징후
  badSignals: [
    '"모든 사람이 쓸 수 있어요"',
    '기존 솔루션이 "그냥 별로"',
    '차별점이 "더 좋은 UI"뿐',
    '사용자가 돈 낼 이유 불명확',
  ],
};

// 시스템 프롬프트용 Knowledge Base 문자열 생성
export function getKnowledgeBaseForPrompt(persona: string): string {
  const base = `
[스타트업 평가 Knowledge Base]

**VC 투자 심사 핵심 기준:**
- 시장: TAM $1B+, 연 성장률 20%+
- 유닛 이코노믹스: LTV > CAC × 3
- 트랙션: MoM 성장 10%+, 리텐션 40%+
- 차별화: 기존 대비 10배 개선

**레드플래그 (즉시 지적):**
- "모든 사람"이 타겟 → 타겟 좁히도록 유도
- "경쟁사 없음" 주장 → 간접 경쟁사 찾아주기
- "1%만 차지해도" → 근거 없는 시장 추정 경고
- "나중에 수익화" → 수익 모델 즉시 질문

**성공 패턴 (Few-shot):**
- Notion: 하나라도 제대로 → 점진 확장
- Figma: 기술 장벽 = 진입 장벽
- Superhuman: 극소수 완벽 > 다수 평범
- Linear: UX로 기존 시장 재정의

**투자자가 반드시 묻는 질문:**
1. Why now? (왜 지금?)
2. Why you? (왜 당신?)
3. 경쟁사가 복제하면?
4. 첫 100명 어떻게?
`;

  // 페르소나별 추가 컨텍스트
  const personaSpecific: Record<string, string> = {
    VC: `
**VC 전용 심화:**
- Pre-Seed: 고객 페르소나 + MVP + 초기 피드백
- Seed: 활성 1,000명 + 유료 전환 + MoM 10%
- Series A: 반복 성장 + $1M ARR + 확장 계획

**엑싯 관점:**
- M&A 가능성: 대기업이 인수할 이유?
- IPO 경로: 시장 규모 충분한가?`,

    Developer: `
**기술 평가 기준:**
- 복제 난이도: 6개월 내 복제 가능하면 기술 장벽 약함
- 확장성: 사용자 10배 증가 시 아키텍처 대응?
- 기술 부채: MVP 빠르게 vs 장기 유지보수

**성공 사례 기술:**
- Figma: 브라우저에서 네이티브급 성능 (WebGL)
- Linear: 오프라인 퍼스트 + 실시간 동기화`,

    Designer: `
**UX 평가 기준:**
- 첫 사용 5분 내 핵심 가치 경험 가능?
- 경쟁사 대비 사용성 10배 개선점?
- 타겟 사용자의 멘탈 모델과 일치?

**성공 사례 UX:**
- Notion: 블록 시스템 = 레고 조합 직관성
- Loom: 원클릭 녹화 = 10초 내 시작`,

    CFO: `
**재무 평가 기준:**
- 번레이트: 월 지출 vs 런웨이
- CAC Payback: 고객 획득 비용 회수 기간
- 그로스 마진: 매출 대비 마진율

**수익화 패턴:**
- Freemium: 무료 → 유료 전환율 2-5%
- B2B SaaS: 연간 계약 선호 (현금흐름)`,

    Marketer: `
**GTM 평가 기준:**
- 바이럴 계수: k > 1 이면 자연 성장
- CAC: 채널별 고객 획득 비용
- 첫 100명: 스케일 전 수동 확보 전략

**성공 사례 GTM:**
- Notion: 템플릿 커뮤니티 (UGC)
- Figma: 교육기관 무료 → 졸업 후 유료`,
  };

  return base + (personaSpecific[persona] || '');
}

// 전체 Knowledge Base를 시스템 프롬프트에 삽입할 문자열
export function getFullKnowledgeBase(): string {
  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 스타트업 평가 Knowledge Base (실제 VC/공모전 기준)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**[1] 투자 심사 핵심 기준**
- 시장(TAM): 최소 $1B 이상, 연 성장률 20%+
- 팀: 기술/비즈니스/제품 균형, 창업자 도메인 전문성
- 제품: 실존 문제 해결, 기존 대비 10배 개선, 복제 장벽
- 비즈니스: LTV > CAC × 3, 확장 시 마진 개선
- 트랙션: MoM 10%+, 리텐션 40%+

**[2] 레드플래그 (발견 시 즉시 지적)**
아이디어:
- "모든 사람" 타겟 → 니치 좁히도록 유도
- "경쟁사 없음" → 간접 경쟁사 분석 요청
- "첫 번째 무버" → 대부분 착각임을 지적

시장 분석:
- "전체 인구 × 가격" 계산 → 바텀업 추정 요청
- "1%만 차지해도" → 근거 없음 경고

수익 모델:
- "나중에 수익화" → 즉시 모델 질문
- "광고로 수익" → 소규모에 비현실적 지적
- "B2B인데 영업 전략 없음" → 첫 고객 확보 질문

**[3] 성공 스타트업 패턴**
공통점:
- 명확한 니치 타겟 (모든 사람 X)
- 창업자가 직접 겪은 문제
- 특정 측면 10배 압도적 개선
- 네트워크 효과 구조
- 기능보다 UX 집착

차별화 사례:
- Notion: 유연성 (블록) → 하나 제대로 후 확장
- Figma: 협업 (실시간) → 기술 장벽 = 경쟁 장벽
- Superhuman: 속도 → 극소수 완벽 > 다수 평범
- Linear: 디자인 → UX로 기존 시장 재정의
- Loom: 간편함 → 타이밍 + 사용 사례 확장

**[4] 투자자 필수 질문**
1. Why now? - 왜 지금이 적기인가?
2. Why you? - 왜 이 팀이 해야 하는가?
3. Defensibility - 경쟁사가 복제하면?
4. Distribution - 첫 100명 어떻게 확보?
5. Vision - 5년 후 회사 모습?
6. Risk - 최악의 시나리오?
7. Use of funds - 투자금 사용 계획?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
}
