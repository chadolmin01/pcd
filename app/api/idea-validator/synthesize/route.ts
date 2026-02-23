import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { withRateLimit } from '@/lib/rate-limit';
import {
  BusinessPlanData,
  Scorecard,
  ChatMessage,
  createEmptyScorecard
} from '@/components/idea-validator/types';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('GEMINI_API_KEY is not configured');
}
const genAI = new GoogleGenerativeAI(apiKey || '');

// 파싱된 결과 타입 정의
interface ParsedBusinessPlan {
  basicInfo?: {
    itemName?: string;
    oneLiner?: string;
    targetCustomer?: string;
    industry?: string;
  };
  sectionData?: {
    problem?: { market_status?: string; problem_definition?: string; development_necessity?: string };
    solution?: { development_plan?: string; differentiation?: string; competitiveness?: string };
    scaleup?: { business_model?: string; market_size?: string; roadmap?: string };
    team?: { founder?: string; team_members?: string; team_synergy?: string };
  };
  schedule?: Array<{ no: string; content: string; period: string; detail: string }>;
  budget?: Array<{ category: string; detail: string; amount: string }>;
  teamTable?: Array<{ no: string; position: string; role: string; capability: string; status: string }>;
  partners?: Array<{ no: string; name: string; capability: string; plan: string; period: string }>;
}

interface SynthesizeRequest {
  originalIdea: string;
  conversationHistory: ChatMessage[];
  reflectedAdvice: string[];
  scorecard: Scorecard;
  ideaCategory?: string;
}

// 대화 히스토리를 구조화된 텍스트로 변환
function formatConversationForSynthesis(messages: ChatMessage[]): string {
  let formatted = '';

  for (const msg of messages) {
    if (msg.isUser && msg.text) {
      formatted += `[사용자 입력]\n${msg.text}\n\n`;
    } else if (msg.responses && msg.responses.length > 0) {
      formatted += `[전문가 피드백]\n`;
      for (const resp of msg.responses) {
        formatted += `- ${resp.name} (${resp.role}): ${resp.content}\n`;
        if (resp.perspectives && resp.perspectives.length > 0) {
          for (const p of resp.perspectives) {
            formatted += `  • [${p.perspectiveLabel}] ${p.content}\n`;
            if (p.isReflected && p.reflectedText) {
              formatted += `    → 사용자 결정: ${p.reflectedText}\n`;
            }
          }
        }
        if (resp.isReflected && resp.reflectedText) {
          formatted += `  → 사용자 결정: ${resp.reflectedText}\n`;
        }
      }
      formatted += '\n';
    }
  }

  return formatted;
}

// 반영된 조언들을 요약
function summarizeReflectedAdvice(advice: string[]): string {
  if (advice.length === 0) return '없음';
  return advice.map((a, i) => `${i + 1}. ${a}`).join('\n');
}

// 스코어카드 상태를 텍스트로
function scorecardToText(scorecard: Scorecard): string {
  const categories = [
    { key: 'problemDefinition', name: '문제 정의' },
    { key: 'solution', name: '솔루션' },
    { key: 'marketAnalysis', name: '시장 분석' },
    { key: 'revenueModel', name: '수익 모델' },
    { key: 'differentiation', name: '차별화' },
    { key: 'logicalConsistency', name: '논리 일관성' },
    { key: 'feasibility', name: '실현 가능성' },
    { key: 'feedbackReflection', name: '피드백 반영' },
  ];

  return categories.map(c => {
    const score = scorecard[c.key as keyof Scorecard] as { current: number; max: number };
    return `- ${c.name}: ${score.current}/${score.max}점`;
  }).join('\n');
}

export const POST = withRateLimit(async (request: NextRequest) => {
  try {
    const body: SynthesizeRequest = await request.json();
    const {
      originalIdea,
      conversationHistory,
      reflectedAdvice,
      scorecard,
      ideaCategory
    } = body;

    // 입력 검증
    if (!originalIdea || typeof originalIdea !== 'string' || originalIdea.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: '원본 아이디어가 필요합니다.' },
        { status: 400 }
      );
    }

    if (!conversationHistory || !Array.isArray(conversationHistory)) {
      return NextResponse.json(
        { success: false, error: '대화 히스토리가 필요합니다.' },
        { status: 400 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'AI 서비스가 설정되지 않았습니다.' },
        { status: 503 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const conversationText = formatConversationForSynthesis(conversationHistory);
    const reflectedText = summarizeReflectedAdvice(reflectedAdvice);
    const scorecardText = scorecardToText(scorecard || createEmptyScorecard());

    const prompt = `당신은 스타트업 사업계획서 작성 전문가입니다.
아래 아이디어 검증 대화 내역을 분석하여, 정부 지원사업 제출용 사업계획서 데이터를 JSON으로 생성해주세요.

## 원본 아이디어
${originalIdea}

## 산업 분류
${ideaCategory || '미분류'}

## 검증 대화 히스토리
${conversationText}

## 사용자가 반영한 핵심 결정사항
${reflectedText}

## 검증 스코어카드
${scorecardText}
총점: ${scorecard?.totalScore || 0}/100점

---

## 출력 JSON 형식 (반드시 이 구조를 따를 것)

\`\`\`json
{
  "basicInfo": {
    "itemName": "아이템명 (간결하게)",
    "oneLiner": "한 줄 설명 (30자 내외)",
    "targetCustomer": "타겟 고객 (예: 독거노인 및 그 가족, 지자체)",
    "industry": "산업코드 (bio_healthcare, fintech, edtech, logistics, ecommerce, saas, ai_ml, mobility, greentech, proptech, foodtech, entertainment, social, hr_recruiting, legaltech, insurtech, agtech, security, iot, other 중 하나)"
  },
  "sectionData": {
    "problem": {
      "market_status": "[시장 현황]\\n시장 규모, 성장률, 주요 트렌드를 구체적 수치와 함께 서술 (출처 포함)",
      "problem_definition": "[핵심 문제점]\\n타겟 고객이 겪는 구체적 문제, 기존 솔루션의 한계점을 데이터와 함께 서술",
      "development_necessity": "[개발 필요성]\\n기술적/사회적/시장적 관점에서 왜 이 솔루션이 필요한지 서술"
    },
    "solution": {
      "development_plan": "[솔루션 개요]\\n제품/서비스 설명, 작동 방식, 개발 로드맵, 현재 진행 상황",
      "differentiation": "[차별화 포인트]\\n경쟁사 대비 핵심 차별점 (기술, 비용, 사용성 등)",
      "competitiveness": "[경쟁력 분석]\\n경쟁사 비교, 핵심 기술 우위, 파트너십 현황"
    },
    "scaleup": {
      "business_model": "[수익 모델]\\nB2C/B2B/B2G 수익 구조, Unit Economics (CAC, LTV 등)",
      "market_size": "[시장 규모]\\nTAM/SAM/SOM 분석, 시장 점유 목표",
      "roadmap": "[사업화 로드맵]\\n단계별 목표와 KPI (1단계/2단계/3단계), 마일스톤"
    },
    "team": {
      "founder": "대표자 프로필 (학력, 경력, 핵심 성과, 창업 동기)",
      "team_members": "팀 구성원 소개 (역할, 경력, 담당 업무)",
      "team_synergy": "팀의 강점, 보완 계획"
    }
  },
  "schedule": [
    { "no": "1", "content": "개발 항목", "period": "25.03 ~ 25.05", "detail": "상세 내용" },
    { "no": "2", "content": "개발 항목", "period": "25.04 ~ 25.07", "detail": "상세 내용" }
  ],
  "budget": [
    { "category": "재료비", "detail": "서버 및 클라우드", "amount": "15000000" },
    { "category": "인건비", "detail": "개발자 인건비", "amount": "42000000" }
  ],
  "teamTable": [
    { "no": "1", "position": "대표이사", "role": "총괄", "capability": "경력 요약", "status": "완료('24.01)" }
  ],
  "partners": [
    { "no": "1", "name": "협력사명", "capability": "보유 역량", "plan": "협력 계획", "period": "25.06" }
  ]
}
\`\`\`

## 작성 지침

1. **데이터 기반**: 대화에서 언급된 구체적 내용을 최대한 활용
2. **사용자 결정 우선**: 사용자가 명시적으로 결정한 사항은 반드시 반영
3. **현실적 추정**: 언급되지 않은 부분은 산업 특성에 맞게 현실적으로 추정
4. **정부 지원사업 형식**: 예비창업패키지, 초기창업패키지 등 실제 제출 양식에 맞춤
5. **schedule**: 현재 시점 기준 10~12개월 로드맵 (최소 5개 항목)
6. **budget**: 현실적 비용 배분 (총합 1억원 내외)
7. **teamTable**: 대화에서 언급된 팀 구성 반영, 없으면 일반적 구성 제안
8. **partners**: 대화에서 언급된 파트너십 + 추가 제안

JSON만 출력하세요. 설명이나 마크다운 코드블록 없이 순수 JSON만 반환합니다.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // JSON 추출 (마크다운 코드블록 제거)
    let jsonStr = text;
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    } else {
      // 코드블록 없이 바로 JSON인 경우
      jsonStr = text.trim();
    }

    // JSON 파싱
    let parsed: ParsedBusinessPlan;
    try {
      parsed = JSON.parse(jsonStr) as ParsedBusinessPlan;
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      throw new Error('Failed to parse synthesis result');
    }

    // BusinessPlanData 형식으로 변환 (undefined 필드를 기본값으로 대체)
    const defaultBasicInfo = {
      itemName: originalIdea.slice(0, 20),
      oneLiner: originalIdea.slice(0, 50),
      targetCustomer: '일반 사용자',
      industry: ideaCategory || 'other'
    };

    const defaultSectionData = {
      problem: { market_status: '', problem_definition: '', development_necessity: '' },
      solution: { development_plan: '', differentiation: '', competitiveness: '' },
      scaleup: { business_model: '', market_size: '', roadmap: '' },
      team: { founder: '', team_members: '', team_synergy: '' }
    };

    const businessPlan: BusinessPlanData = {
      basicInfo: {
        itemName: parsed.basicInfo?.itemName || defaultBasicInfo.itemName,
        oneLiner: parsed.basicInfo?.oneLiner || defaultBasicInfo.oneLiner,
        targetCustomer: parsed.basicInfo?.targetCustomer || defaultBasicInfo.targetCustomer,
        industry: parsed.basicInfo?.industry || defaultBasicInfo.industry
      },
      sectionData: {
        problem: {
          market_status: parsed.sectionData?.problem?.market_status || '',
          problem_definition: parsed.sectionData?.problem?.problem_definition || '',
          development_necessity: parsed.sectionData?.problem?.development_necessity || ''
        },
        solution: {
          development_plan: parsed.sectionData?.solution?.development_plan || '',
          differentiation: parsed.sectionData?.solution?.differentiation || '',
          competitiveness: parsed.sectionData?.solution?.competitiveness || ''
        },
        scaleup: {
          business_model: parsed.sectionData?.scaleup?.business_model || '',
          market_size: parsed.sectionData?.scaleup?.market_size || '',
          roadmap: parsed.sectionData?.scaleup?.roadmap || ''
        },
        team: {
          founder: parsed.sectionData?.team?.founder || '',
          team_members: parsed.sectionData?.team?.team_members || '',
          team_synergy: parsed.sectionData?.team?.team_synergy || ''
        }
      },
      schedule: parsed.schedule || [],
      budget: parsed.budget || [],
      teamTable: parsed.teamTable || [],
      partners: parsed.partners || [],
      generatedAt: new Date().toISOString(),
      scorecard: scorecard || createEmptyScorecard(),
      validationScore: scorecard?.totalScore || 0
    };

    return NextResponse.json({
      success: true,
      result: businessPlan
    });

  } catch (error) {
    console.error('Synthesis error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Synthesis failed'
      },
      { status: 500 }
    );
  }
}, { isAI: true });
