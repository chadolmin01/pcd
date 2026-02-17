import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

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

function buildPrompt(idea: string, historyContext: string, personas: string[]) {
  const personaResponseTemplate = personas
    .map((p) => {
      const desc = PERSONA_DESCRIPTIONS[p];
      return `{
      "role": "${p}",
      "name": "${desc?.nameKo || p}",
      "content": "${desc?.nameKo || p} 관점의 피드백 (2-3문장)",
      "tone": "Analytical",
      "suggestedActions": ["구체적인 조언 1", "구체적인 조언 2"]
    }`;
    })
    .join(',\n    ');

  return `${historyContext}사용자 입력(결정사항): "${idea}"

위 입력을 바탕으로 ${personas.length}가지 관점(${personas.map(p => PERSONA_DESCRIPTIONS[p]?.nameKo || p).join(', ')})에서 분석하세요. 사용자가 내린 결정들을 통합하여 프로젝트를 발전시키고, 점수를 갱신하세요. 한국어로 말하세요.

반드시 다음 JSON 형식으로 응답하세요:
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
  }
}`;
}

export async function POST(request: NextRequest) {
  try {
    const { idea, conversationHistory = [], level = 'mvp', personas = ['Developer', 'Designer', 'VC'] } = await request.json();

    if (!idea || idea.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: '아이디어를 입력해주세요.' },
        { status: 400 }
      );
    }

    const historyContext = conversationHistory.length > 0
      ? `[이전 대화 및 결정 내역]:\n${conversationHistory.join('\n')}\n\n`
      : '';

    const prompt = buildPrompt(idea, historyContext, personas);

    const maxTokens = level === 'sketch' ? 1000 : 2500;
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

    return NextResponse.json({ success: true, result: parsed });
  } catch (error) {
    console.error('Analyze Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 }
    );
  }
}
