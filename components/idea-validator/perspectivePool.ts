// 서브 관점 풀 정의
// AI가 아이디어 맥락에 맞는 관점을 동적으로 선택

export interface Perspective {
  id: string;
  label: string;
  labelEn: string;
  description: string;
}

export interface PerspectivePool {
  Developer: Perspective[];
  Designer: Perspective[];
  VC: Perspective[];
}

export const PERSPECTIVE_POOL: PerspectivePool = {
  Developer: [
    { id: 'security', label: '보안', labelEn: 'Security', description: '데이터 보호, 인증, 암호화' },
    { id: 'speed', label: '개발속도', labelEn: 'Dev Speed', description: '빠른 MVP 출시, 프로토타이핑' },
    { id: 'scalability', label: '확장성', labelEn: 'Scalability', description: '사용자 증가 대응, 아키텍처' },
    { id: 'data-structure', label: '데이터구조', labelEn: 'Data Structure', description: 'DB 설계, 데이터 모델링' },
    { id: 'infra-cost', label: '인프라비용', labelEn: 'Infra Cost', description: '서버 비용, 클라우드 최적화' },
    { id: 'api-design', label: 'API설계', labelEn: 'API Design', description: 'RESTful, GraphQL, 연동' },
    { id: 'realtime', label: '실시간처리', labelEn: 'Realtime', description: 'WebSocket, 푸시, 동기화' },
    { id: 'offline', label: '오프라인', labelEn: 'Offline', description: '오프라인 지원, 로컬 저장' },
    { id: 'ai-ml', label: 'AI/ML', labelEn: 'AI/ML', description: '머신러닝, 추천 시스템' },
    { id: 'location', label: '위치기반', labelEn: 'Location', description: 'GPS, 지도, 위치 정확도' },
    { id: 'integration', label: '외부연동', labelEn: 'Integration', description: '써드파티 API, 결제 연동' },
    { id: 'performance', label: '성능최적화', labelEn: 'Performance', description: '로딩 속도, 최적화' },
  ],
  Designer: [
    { id: 'usability', label: '사용성', labelEn: 'Usability', description: '직관적 인터페이스, 학습 곡선' },
    { id: 'aesthetics', label: '심미성', labelEn: 'Aesthetics', description: '비주얼 디자인, 브랜딩' },
    { id: 'accessibility', label: '접근성', labelEn: 'Accessibility', description: '장애인 접근성, 다양한 사용자' },
    { id: 'onboarding', label: '온보딩', labelEn: 'Onboarding', description: '첫 사용자 경험, 튜토리얼' },
    { id: 'gamification', label: '게이미피케이션', labelEn: 'Gamification', description: '동기부여, 보상 시스템' },
    { id: 'mobile-first', label: '모바일퍼스트', labelEn: 'Mobile First', description: '모바일 최적화 UX' },
    { id: 'simplicity', label: '단순화', labelEn: 'Simplicity', description: '기능 최소화, 핵심 집중' },
    { id: 'personalization', label: '개인화', labelEn: 'Personalization', description: '맞춤형 경험, 설정' },
    { id: 'emotional', label: '감성디자인', labelEn: 'Emotional', description: '감정적 연결, 브랜드 경험' },
    { id: 'consistency', label: '일관성', labelEn: 'Consistency', description: '디자인 시스템, 통일성' },
    { id: 'feedback', label: '피드백', labelEn: 'Feedback', description: '사용자 피드백, 반응' },
    { id: 'trust', label: '신뢰감', labelEn: 'Trust', description: '안정감, 전문성 전달' },
  ],
  VC: [
    { id: 'revenue', label: '수익모델', labelEn: 'Revenue', description: '수익화 전략, 가격 정책' },
    { id: 'market-size', label: '시장규모', labelEn: 'Market Size', description: 'TAM/SAM/SOM, 성장률' },
    { id: 'moat', label: '경쟁우위', labelEn: 'Moat', description: '진입장벽, 차별화 요소' },
    { id: 'unit-economics', label: '유닛이코노믹스', labelEn: 'Unit Economics', description: 'CAC, LTV, 마진' },
    { id: 'timing', label: '타이밍', labelEn: 'Timing', description: '시장 진입 시점, 트렌드' },
    { id: 'team', label: '팀역량', labelEn: 'Team', description: '창업팀 구성, 실행력' },
    { id: 'network-effect', label: '네트워크효과', labelEn: 'Network Effect', description: '사용자 증가에 따른 가치' },
    { id: 'retention', label: '리텐션', labelEn: 'Retention', description: '사용자 유지, 재방문' },
    { id: 'exit', label: '엑싯전략', labelEn: 'Exit Strategy', description: 'IPO, M&A 가능성' },
    { id: 'regulation', label: '규제환경', labelEn: 'Regulation', description: '법적 리스크, 인허가' },
    { id: 'global', label: '글로벌확장', labelEn: 'Global', description: '해외 시장 진출 가능성' },
    { id: 'viral', label: '바이럴', labelEn: 'Viral', description: '입소문, 자연 성장' },
  ],
};

// AI 프롬프트용 관점 목록 생성
export function getPerspectiveListForPrompt(): string {
  const lines: string[] = [];

  for (const [persona, perspectives] of Object.entries(PERSPECTIVE_POOL) as [string, Perspective[]][]) {
    const ids = perspectives.map((p: Perspective) => `${p.id}(${p.label})`).join(', ');
    lines.push(`- ${persona}: ${ids}`);
  }

  return lines.join('\n');
}

// ID로 관점 정보 가져오기
export function getPerspectiveById(persona: keyof PerspectivePool, id: string): Perspective | undefined {
  return PERSPECTIVE_POOL[persona].find((p: Perspective) => p.id === id);
}
