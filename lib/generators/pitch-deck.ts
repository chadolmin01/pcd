/**
 * 피치덱 생성기
 * BusinessPlanData를 기반으로 피치덱 슬라이드 구조 생성
 * AI API 호출 없음 - 순수 템플릿 변환
 */

import { BusinessPlanData } from '@/components/idea-validator/types';

export interface PitchSlide {
  number: number;
  type: 'cover' | 'problem' | 'solution' | 'product' | 'market' | 'business' | 'traction' | 'team' | 'ask' | 'contact';
  title: string;
  content: string[];
  speakerNotes?: string;
  visualSuggestion?: string;
}

export interface PitchDeckOutput {
  title: string;
  subtitle: string;
  slides: PitchSlide[];
  totalSlides: number;
}

export function generatePitchDeck(data: BusinessPlanData): PitchDeckOutput {
  const { basicInfo, sectionData, scorecard, validationScore } = data;

  const slides: PitchSlide[] = [
    // 1. 표지
    {
      number: 1,
      type: 'cover',
      title: basicInfo.itemName,
      content: [
        basicInfo.oneLiner,
        `타겟: ${basicInfo.targetCustomer}`,
        basicInfo.industry,
      ],
      speakerNotes: '안녕하세요, 오늘 소개해드릴 서비스는...',
      visualSuggestion: '로고 + 제품 목업 이미지',
    },

    // 2. 문제 정의
    {
      number: 2,
      type: 'problem',
      title: '해결하려는 문제',
      content: [
        `시장 현황: ${summarize(sectionData.problem.market_status, 100)}`,
        `핵심 문제: ${summarize(sectionData.problem.problem_definition, 150)}`,
      ],
      speakerNotes: '현재 시장에서 고객들이 겪고 있는 문제는...',
      visualSuggestion: '문제를 시각화하는 아이콘 또는 통계 차트',
    },

    // 3. 솔루션
    {
      number: 3,
      type: 'solution',
      title: '우리의 솔루션',
      content: [
        summarize(sectionData.solution.development_plan, 200),
      ],
      speakerNotes: '이 문제를 해결하기 위해 우리가 만든 솔루션은...',
      visualSuggestion: '제품 스크린샷 또는 서비스 플로우 다이어그램',
    },

    // 4. 제품/서비스
    {
      number: 4,
      type: 'product',
      title: '차별화 포인트',
      content: splitIntoBullets(sectionData.solution.differentiation),
      speakerNotes: '경쟁사와 비교했을 때 우리만의 차별점은...',
      visualSuggestion: '경쟁사 비교 테이블 또는 기능 하이라이트',
    },

    // 5. 시장 규모
    {
      number: 5,
      type: 'market',
      title: '시장 기회',
      content: splitIntoBullets(sectionData.scaleup.market_size),
      speakerNotes: 'TAM, SAM, SOM 관점에서 시장 규모를 설명하면...',
      visualSuggestion: '시장 규모 원형 차트 (TAM > SAM > SOM)',
    },

    // 6. 비즈니스 모델
    {
      number: 6,
      type: 'business',
      title: '비즈니스 모델',
      content: splitIntoBullets(sectionData.scaleup.business_model),
      speakerNotes: '우리의 수익 모델은...',
      visualSuggestion: '수익 구조 플로우 다이어그램',
    },

    // 7. 로드맵
    {
      number: 7,
      type: 'traction',
      title: '사업화 로드맵',
      content: splitIntoBullets(sectionData.scaleup.roadmap),
      speakerNotes: '향후 계획과 마일스톤은...',
      visualSuggestion: '타임라인 형식의 로드맵',
    },

    // 8. 팀 소개
    {
      number: 8,
      type: 'team',
      title: '팀 소개',
      content: [
        `대표: ${summarize(sectionData.team.founder, 100)}`,
        `팀 구성: ${summarize(sectionData.team.team_members, 100)}`,
        `시너지: ${summarize(sectionData.team.team_synergy, 100)}`,
      ],
      speakerNotes: '우리 팀이 이 문제를 해결할 수 있는 이유는...',
      visualSuggestion: '팀 멤버 사진 + 역할/경력 요약',
    },

    // 9. Ask (투자 요청)
    {
      number: 9,
      type: 'ask',
      title: '투자 제안',
      content: [
        basicInfo.fundingAmount ? `희망 투자금: ${basicInfo.fundingAmount.toLocaleString()}만원` : '시드 투자 유치 희망',
        `AI 검증 점수: ${validationScore}/100`,
        `주요 강점:`,
        ...getTopScores(scorecard),
      ],
      speakerNotes: '저희가 요청드리는 투자 규모와 사용 계획은...',
      visualSuggestion: '투자금 사용 계획 파이 차트',
    },

    // 10. 연락처
    {
      number: 10,
      type: 'contact',
      title: '감사합니다',
      content: [
        basicInfo.itemName,
        basicInfo.oneLiner,
        '문의: contact@example.com',
      ],
      speakerNotes: '질문 있으시면 말씀해주세요.',
      visualSuggestion: 'QR 코드 + 연락처 정보',
    },
  ];

  return {
    title: basicInfo.itemName,
    subtitle: basicInfo.oneLiner,
    slides,
    totalSlides: slides.length,
  };
}

// 헬퍼 함수들
function summarize(text: string, maxLength: number): string {
  if (!text) return '-';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

function splitIntoBullets(text: string): string[] {
  if (!text) return ['-'];

  // 줄바꿈, 마침표, 쉼표로 분리
  const parts = text.split(/[.。\n]/)
    .map(p => p.trim())
    .filter(p => p.length > 5);

  if (parts.length === 0) return [text];
  return parts.slice(0, 4); // 최대 4개
}

function getTopScores(scorecard: BusinessPlanData['scorecard']): string[] {
  const categories = [
    { key: 'problemDefinition', label: '문제 정의', score: scorecard.problemDefinition },
    { key: 'solution', label: '솔루션', score: scorecard.solution },
    { key: 'marketAnalysis', label: '시장 분석', score: scorecard.marketAnalysis },
    { key: 'revenueModel', label: '수익 모델', score: scorecard.revenueModel },
    { key: 'differentiation', label: '차별화', score: scorecard.differentiation },
    { key: 'feasibility', label: '실현 가능성', score: scorecard.feasibility },
  ];

  // 점수가 높은 상위 3개 반환
  return categories
    .sort((a, b) => (b.score.current / b.score.max) - (a.score.current / a.score.max))
    .slice(0, 3)
    .map(c => `${c.label}: ${c.score.current}/${c.score.max}점`);
}

// 피치덱 HTML 미리보기 생성
export function generatePitchDeckHTML(deck: PitchDeckOutput): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${deck.title} - 피치덱</title>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Noto Sans KR', sans-serif; background: #f5f5f5; }
    .deck { max-width: 1000px; margin: 40px auto; }
    .slide {
      background: white;
      aspect-ratio: 16/9;
      margin-bottom: 24px;
      padding: 60px;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      display: flex;
      flex-direction: column;
      position: relative;
    }
    .slide-number {
      position: absolute;
      bottom: 20px;
      right: 30px;
      font-size: 14px;
      color: #999;
    }
    .slide h2 {
      font-size: 2.5rem;
      margin-bottom: 40px;
      color: #1a1a1a;
    }
    .slide.cover {
      background: linear-gradient(135deg, #0052CC 0%, #4C9AFF 100%);
      color: white;
      justify-content: center;
      align-items: center;
      text-align: center;
    }
    .slide.cover h2 { font-size: 3rem; color: white; }
    .slide ul {
      list-style: none;
      font-size: 1.4rem;
      line-height: 2;
    }
    .slide ul li::before {
      content: "→ ";
      color: #0052CC;
      font-weight: bold;
    }
    .speaker-notes {
      margin-top: auto;
      padding-top: 20px;
      border-top: 1px dashed #ddd;
      font-size: 0.9rem;
      color: #666;
      font-style: italic;
    }
  </style>
</head>
<body>
  <div class="deck">
${deck.slides.map(slide => `    <div class="slide ${slide.type}">
      <h2>${slide.title}</h2>
      <ul>
${slide.content.map(c => `        <li>${c}</li>`).join('\n')}
      </ul>
      ${slide.speakerNotes ? `<div class="speaker-notes">🎤 ${slide.speakerNotes}</div>` : ''}
      <span class="slide-number">${slide.number} / ${deck.totalSlides}</span>
    </div>`).join('\n')}
  </div>
</body>
</html>`;
}
