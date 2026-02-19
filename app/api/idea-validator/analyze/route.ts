import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { withRateLimit } from '@/src/lib/rate-limit';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// 스코어카드 카테고리 정의
interface CategoryScore {
  current: number;
  max: number;
  filled: boolean;
}

interface Scorecard {
  problemDefinition: CategoryScore;
  solution: CategoryScore;
  marketAnalysis: CategoryScore;
  revenueModel: CategoryScore;
  differentiation: CategoryScore;
  logicalConsistency: CategoryScore;
  feasibility: CategoryScore;
  feedbackReflection: CategoryScore;
  totalScore: number;
}

const CATEGORY_INFO: Record<string, { nameKo: string; max: number }> = {
  problemDefinition: { nameKo: '문제 정의', max: 15 },
  solution: { nameKo: '솔루션', max: 15 },
  marketAnalysis: { nameKo: '시장 분석', max: 10 },
  revenueModel: { nameKo: '수익 모델', max: 10 },
  differentiation: { nameKo: '차별화', max: 10 },
  logicalConsistency: { nameKo: '논리 일관성', max: 15 },
  feasibility: { nameKo: '실현 가능성', max: 15 },
  feedbackReflection: { nameKo: '피드백 반영', max: 10 },
};

// 페르소나별 설명 및 역할
const PERSONA_DESCRIPTIONS: Record<string, { nameKo: string; role: string; focus: string }> = {
  Developer: {
    nameKo: '개발자',
    role: '기술 전문가',
    focus: '기술적 실현 가능성, 아키텍처 설계, 개발 비용, 기술 스택, 개발 기간을 검토합니다.',
  },
  Designer: {
    nameKo: '디자이너',
    role: 'UX/UI 전문가',
    focus: '사용자 경험, UI 디자인, 브랜드 일관성, 사용성, 접근성을 검토합니다.',
  },
  VC: {
    nameKo: '투자자',
    role: '벤처 캐피탈리스트',
    focus: '시장성, 수익 모델, 성장 잠재력, 경쟁 우위, 투자 매력도를 검토합니다.',
  },
  Marketer: {
    nameKo: '마케터',
    role: '마케팅 전문가',
    focus: 'GTM 전략, 고객 획득 비용(CAC), 브랜딩, 마케팅 채널, 바이럴 가능성을 검토합니다.',
  },
  Legal: {
    nameKo: '법률 전문가',
    role: '법률 고문',
    focus: '규제 준수, 개인정보보호, 지적재산권, 법적 리스크, 컴플라이언스를 검토합니다.',
  },
  PM: {
    nameKo: '프로덕트 매니저',
    role: 'PM',
    focus: '제품 로드맵, 기능 우선순위, 사용자 니즈, 제품-시장 적합성(PMF)을 검토합니다.',
  },
  CTO: {
    nameKo: 'CTO',
    role: '기술 임원',
    focus: '기술 전략, 시스템 확장성, 보안, 기술 부채, 팀 구성을 검토합니다.',
  },
  CFO: {
    nameKo: 'CFO',
    role: '재무 임원',
    focus: '재무 모델, 번레이트, 수익성, 자금 조달, 재무 리스크를 검토합니다.',
  },
  EndUser: {
    nameKo: '최종 사용자',
    role: '타겟 고객',
    focus: '실제 사용 편의성, 문제 해결 여부, 가격 적정성, 구매 의향을 검토합니다.',
  },
  Operations: {
    nameKo: '운영 전문가',
    role: '운영 담당자',
    focus: '운영 효율성, 프로세스 최적화, 확장 가능성, 고객 지원 체계를 검토합니다.',
  },
};

function getAnalyzeSystemInstruction(level: string, personas: string[]) {
  const personaDescriptions = personas
    .map((p, idx) => {
      const desc = PERSONA_DESCRIPTIONS[p];
      if (!desc) return '';
      return `${idx + 1}. "${desc.nameKo}" (${p}): ${desc.focus}`;
    })
    .filter(Boolean)
    .join('\n      ');

  const baseInstruction = `당신은 "Draft." 스타트업 아이디어 검증 엔진입니다. 사용자가 아이디어를 입력하면 선택된 ${personas.length}가지 페르소나로 응답합니다. 한국어로 응답하십시오.

선택된 페르소나:
      ${personaDescriptions}`;

  if (level === 'sketch') {
    return `${baseInstruction}

    **[Level 1: 아이디어 스케치 단계]**
    - 목표: 창업자가 아이디어를 구체화하도록 돕고 동기를 부여합니다.
    - 태도: 친절하고, 협력적이며, 이해하기 쉬운 언어를 사용하세요.
    - 제약: 답변을 짧고 명료하게(3문장 이내) 유지하세요. 어려운 전문 용어 사용을 지양하세요.`;
  } else if (level === 'investor') {
    return `${baseInstruction}

    **[Level 3: 투자자 방어(Hardcore) 단계]**
    - 목표: 창업자의 논리를 극한까지 검증하고 약점을 파고듭니다.
    - 태도: 매우 냉소적이고, 비판적이며, 전문적인 용어를 사용하세요. 봐주지 마세요.
    - 제약: 창업자가 논리적으로 방어하지 못하면 점수를 낮게 책정하세요.`;
  } else {
    return `${baseInstruction}

    **[Level 2: MVP 빌딩 단계]**
    - 목표: 현실적인 제품 출시를 위해 불필요한 기능을 덜어냅니다.
    - 태도: 논리적이고, 현실적이며, 실무 중심적입니다.
    - 제약: 현실적인 제약을 근거로 피드백을 제공하세요.`;
  }
}

function buildScorecardStatus(scorecard: Scorecard | null): string {
  if (!scorecard) {
    return `[현재 스코어카드 - 새 세션]
모든 카테고리가 0점입니다. 사용자의 아이디어를 분석하여 해당하는 카테고리에 점수를 부여하세요.

카테고리별 최대 점수:
- problemDefinition (문제 정의): 0/15
- solution (솔루션): 0/15
- marketAnalysis (시장 분석): 0/10
- revenueModel (수익 모델): 0/10
- differentiation (차별화): 0/10
- logicalConsistency (논리 일관성): 0/15
- feasibility (실현 가능성): 0/15
- feedbackReflection (피드백 반영): 0/10
총점: 0/100`;
  }

  const categories = [
    'problemDefinition', 'solution', 'marketAnalysis', 'revenueModel',
    'differentiation', 'logicalConsistency', 'feasibility', 'feedbackReflection'
  ] as const;

  const emptyCategories = categories.filter(cat => !scorecard[cat].filled);
  const filledCategories = categories.filter(cat => scorecard[cat].filled);

  const statusLines = categories.map(cat => {
    const info = CATEGORY_INFO[cat];
    const score = scorecard[cat];
    const status = score.filled ? '[O]' : '[ ]';
    return `${status} ${info.nameKo}: ${score.current}/${score.max}`;
  }).join('\n');

  return `[현재 스코어카드]
${statusLines}
총점: ${scorecard.totalScore}/100

${emptyCategories.length > 0 ? `[빈 카테고리 - 자연스럽게 이 방향으로 질문을 유도하세요]
${emptyCategories.map(cat => CATEGORY_INFO[cat].nameKo).join(', ')}` : '[모든 카테고리 채워짐]'}

${filledCategories.length > 0 ? `[이미 채워진 카테고리]
${filledCategories.map(cat => `${CATEGORY_INFO[cat].nameKo}: ${scorecard[cat].current}점`).join(', ')}` : ''}`;
}

// 페르소나별 3가지 관점 정의
const PERSONA_PERSPECTIVES: Record<string, { id: string; label: string }[]> = {
  Developer: [
    { id: 'security', label: '보안 중심' },
    { id: 'speed', label: '개발 속도' },
    { id: 'scalability', label: '확장성' },
  ],
  Designer: [
    { id: 'simplicity', label: '단순함' },
    { id: 'delight', label: '감성 경험' },
    { id: 'accessibility', label: '접근성' },
  ],
  VC: [
    { id: 'growth', label: '성장성' },
    { id: 'profitability', label: '수익성' },
    { id: 'defensibility', label: '진입장벽' },
  ],
  Marketer: [
    { id: 'viral', label: '바이럴' },
    { id: 'brand', label: '브랜딩' },
    { id: 'acquisition', label: '고객 획득' },
  ],
  Legal: [
    { id: 'compliance', label: '규제 준수' },
    { id: 'ip', label: '지적재산권' },
    { id: 'liability', label: '책임 제한' },
  ],
  PM: [
    { id: 'mvp', label: 'MVP 집중' },
    { id: 'metrics', label: '지표 중심' },
    { id: 'iteration', label: '빠른 반복' },
  ],
  CTO: [
    { id: 'architecture', label: '아키텍처' },
    { id: 'team', label: '팀 빌딩' },
    { id: 'techdebt', label: '기술 부채' },
  ],
  CFO: [
    { id: 'cashflow', label: '현금 흐름' },
    { id: 'fundraising', label: '자금 조달' },
    { id: 'uniteconomics', label: '유닛 이코노믹스' },
  ],
  EndUser: [
    { id: 'convenience', label: '편의성' },
    { id: 'value', label: '가치 인식' },
    { id: 'habit', label: '습관 형성' },
  ],
  Operations: [
    { id: 'efficiency', label: '효율성' },
    { id: 'support', label: '고객 지원' },
    { id: 'process', label: '프로세스' },
  ],
};

function buildPrompt(idea: string, historyContext: string, personas: string[], scorecard: Scorecard | null) {
  const personaResponseTemplate = personas
    .map((p) => {
      const desc = PERSONA_DESCRIPTIONS[p];
      const perspectives = PERSONA_PERSPECTIVES[p] || [
        { id: 'option_1', label: '관점1' },
        { id: 'option_2', label: '관점2' },
        { id: 'option_3', label: '관점3' },
      ];

      const perspectivesTemplate = perspectives.map((persp, idx) => `{
          "perspectiveId": "${persp.id}",
          "perspectiveLabel": "${persp.label}",
          "content": "${persp.label} 관점에서의 구체적인 조언 (2-3문장)",
          "suggestedActions": ["이 관점의 실행 방안 1", "이 관점의 실행 방안 2"]
        }`).join(',\n        ');

      return `{
      "role": "${p}",
      "name": "${desc?.nameKo || p}",
      "content": "${desc?.nameKo || p} 관점의 핵심 피드백 요약 (1문장)",
      "tone": "Analytical",
      "suggestedActions": [],
      "perspectives": [
        ${perspectivesTemplate}
      ]
    }`;
    })
    .join(',\n    ');

  const scorecardStatus = buildScorecardStatus(scorecard);

  return `${historyContext}
${scorecardStatus}

사용자 입력(결정사항): "${idea}"

위 입력을 바탕으로 ${personas.length}가지 관점(${personas.map(p => PERSONA_DESCRIPTIONS[p]?.nameKo || p).join(', ')})에서 분석하세요.

**중요: 각 페르소나별 3가지 perspectives 필수**
- 각 페르소나(Developer, Designer, VC 등)는 반드시 3가지 서로 다른 관점(perspectives)을 제시해야 합니다
- 각 관점은 서로 다른 접근 방식을 제안해야 합니다 (예: Developer → 보안 vs 속도 vs 확장성)
- 사용자는 이 3가지 중 하나를 선택하여 결정을 내립니다
- perspectives 배열에 정확히 3개의 항목이 있어야 합니다

**스코어카드 채점 규칙:**
1. 사용자의 응답 내용을 분석하여 해당 카테고리에 점수를 부여하세요
2. 점수는 절대 감소하지 않습니다 (증가만 가능)
3. 각 카테고리의 최대 점수를 초과할 수 없습니다
4. 빈 카테고리([ ])가 있다면, 해당 영역을 탐색하는 질문을 자연스럽게 유도하세요
5. categoryUpdates에 이번 턴에서 변동된 점수만 기록하세요 (delta는 증가분만)

**카테고리별 채점 기준:**
- problemDefinition: 문제가 명확하고 구체적인가? (고객 페인포인트, 문제의 심각성)
- solution: 해결책이 구체적인가? (기능, 기술 스택, 구현 방법)
- marketAnalysis: 시장과 경쟁 환경을 파악했는가? (TAM/SAM, 경쟁사)
- revenueModel: 수익화 전략이 현실적인가? (가격, 과금 모델)
- differentiation: 차별화 포인트가 명확한가? (경쟁 우위)
- logicalConsistency: 전체 논리가 일관성 있는가?
- feasibility: 실현 가능한가? (기술, 자원, 시간)
- feedbackReflection: 전문가 조언을 수용하고 개선했는가?

한국어로 응답하세요. 반드시 다음 JSON 형식으로 응답하세요:
{
  "responses": [
    ${personaResponseTemplate}
  ],
  "metrics": {
    "score": 75,
    "developerScore": 70,
    "designerScore": 80,
    "vcScore": 75,
    "keyRisks": ["주요 리스크 1", "주요 리스크 2"],
    "keyStrengths": ["강점 1", "강점 2"],
    "summary": "전체 요약 (1문장)"
  },
  "scorecard": {
    "problemDefinition": { "current": 8, "max": 15, "filled": true },
    "solution": { "current": 5, "max": 15, "filled": true },
    "marketAnalysis": { "current": 0, "max": 10, "filled": false },
    "revenueModel": { "current": 0, "max": 10, "filled": false },
    "differentiation": { "current": 0, "max": 10, "filled": false },
    "logicalConsistency": { "current": 3, "max": 15, "filled": true },
    "feasibility": { "current": 0, "max": 15, "filled": false },
    "feedbackReflection": { "current": 0, "max": 10, "filled": false },
    "totalScore": 16
  },
  "categoryUpdates": [
    { "category": "problemDefinition", "delta": 5, "reason": "고객 페인포인트를 구체화함" },
    { "category": "solution", "delta": 3, "reason": "기술 스택 결정" }
  ]
}`;
}

// withRateLimit HOF 적용 - AI 엔드포인트로 더 엄격한 제한
export const POST = withRateLimit(async (request: NextRequest) => {
  try {
    const {
      idea,
      conversationHistory = [],
      level = 'mvp',
      personas = ['Developer', 'Designer', 'VC'],
      currentScorecard = null
    } = await request.json();

    if (!idea || idea.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: '아이디어를 입력해주세요.' },
        { status: 400 }
      );
    }

    const historyContext = conversationHistory.length > 0
      ? `[이전 대화 및 결정 내역]:\n${conversationHistory.join('\n')}\n\n`
      : '';

    const prompt = buildPrompt(idea, historyContext, personas, currentScorecard);

    // 스코어카드 포함으로 토큰 증가
    const maxTokens = level === 'sketch' ? 1500 : 3000;
    const temperature = level === 'sketch' ? 0.9 : 0.7;

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: getAnalyzeSystemInstruction(level, personas),
      generationConfig: {
        responseMimeType: 'application/json',
        maxOutputTokens: maxTokens,
        temperature: temperature,
      }
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(text);

    // 스코어카드 점수 감소 방지 로직 (서버 측)
    if (parsed.scorecard && currentScorecard) {
      const categories = [
        'problemDefinition', 'solution', 'marketAnalysis', 'revenueModel',
        'differentiation', 'logicalConsistency', 'feasibility', 'feedbackReflection'
      ] as const;

      let recalculatedTotal = 0;
      for (const cat of categories) {
        // 점수 감소 방지: 기존 점수보다 낮으면 기존 점수 유지
        if (parsed.scorecard[cat].current < currentScorecard[cat].current) {
          parsed.scorecard[cat].current = currentScorecard[cat].current;
        }
        // filled 상태 유지: 한번 채워지면 계속 filled
        if (currentScorecard[cat].filled) {
          parsed.scorecard[cat].filled = true;
        }
        recalculatedTotal += parsed.scorecard[cat].current;
      }
      parsed.scorecard.totalScore = recalculatedTotal;
    }

    return NextResponse.json({ success: true, result: parsed });
  } catch (error) {
    console.error('Analyze Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 }
    );
  }
}, { isAI: true });
