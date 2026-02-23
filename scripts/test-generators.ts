import { writeFileSync } from 'fs';
import { generateLandingPage } from '../lib/generators/landing-page';
import { generatePitchDeck, generatePitchDeckHTML } from '../lib/generators/pitch-deck';
import { generateMvpBlueprint, generateMvpMarkdown } from '../lib/generators/mvp-blueprint';

// 샘플 BusinessPlanData
const sampleData = {
  basicInfo: {
    itemName: 'Draft AI',
    oneLiner: 'AI 멀티 페르소나를 활용한 스타트업 아이디어 검증 플랫폼',
    targetCustomer: '초기 창업자 및 예비 창업자',
    industry: 'AI/SaaS',
    fundingAmount: 5000,
  },
  sectionData: {
    problem: {
      market_status: '창업 시장에서 아이디어 검증 없이 사업을 시작하는 비율이 70%에 달하며, 이로 인한 실패율이 매우 높음',
      problem_definition: '전문 멘토링 비용이 높고 접근성이 낮아 초기 창업자들이 객관적인 피드백을 받기 어려움. 투자자, 개발자, 마케터 등 다양한 전문가 의견을 한 번에 듣기 어려움',
      development_necessity: 'AI 기술을 활용하여 저렴하고 즉각적인 아이디어 검증 서비스 제공 필요',
    },
    solution: {
      development_plan: 'CTO, CFO, 마케터, 디자이너, 법률 전문가 등 10개 멀티 페르소나 AI 시스템을 통해 다각도의 피드백 제공. 실시간 대화형 검증으로 아이디어를 점진적으로 발전',
      differentiation: '단순 챗봇이 아닌 전문가 관점별 구체적인 조언과 8개 카테고리 점수 기반 평가 시스템, 사업계획서 자동 생성, Word/PDF 내보내기 지원',
      competitiveness: '실시간 AI 응답, 한국어 특화, 정부 지원사업 템플릿 지원, 스코어카드 기반 객관적 평가',
    },
    scaleup: {
      business_model: 'Freemium 모델 - 기본 검증 무료, 상세 분석 및 문서 생성 유료 (월 29,000원), 엔터프라이즈 플랜 별도',
      market_size: 'TAM: 국내 창업 지원 시장 2조원, SAM: AI 기반 창업 지원 서비스 2000억원, SOM: 초기 타겟 시장 200억원',
      roadmap: '1단계: MVP 출시 및 PMF 검증 (완료), 2단계: 유료화 및 B2B 확장, 3단계: 글로벌 진출 (영어권)',
    },
    team: {
      founder: '10년 경력 풀스택 개발자, 스타트업 2회 창업 경험, AI/ML 전문성 보유',
      team_members: 'AI 엔지니어 1명 (NLP 전문), UX 디자이너 1명 (스타트업 경험), 비즈니스 매니저 1명',
      team_synergy: '기술-디자인-비즈니스 균형 잡힌 팀 구성으로 빠른 실행력 보유. 모두 스타트업 경험자',
    },
  },
  schedule: [
    { no: '1', content: 'MVP 개발', period: '2024.01-03', detail: '핵심 기능 개발 및 테스트' },
    { no: '2', content: '베타 테스트', period: '2024.04-05', detail: '100명 대상 베타 서비스' },
    { no: '3', content: '정식 출시', period: '2024.06', detail: '마케팅 및 정식 서비스 오픈' },
  ],
  budget: [
    { category: '인건비', detail: '개발자 2명 6개월', amount: '3,600만원' },
    { category: '클라우드', detail: 'AWS/Vercel 서버 비용', amount: '600만원' },
    { category: '마케팅', detail: '온라인 광고, 콘텐츠', amount: '800만원' },
  ],
  teamTable: [],
  partners: [],
  generatedAt: new Date().toISOString(),
  scorecard: {
    problemDefinition: { current: 12, max: 15 },
    solution: { current: 14, max: 15 },
    marketAnalysis: { current: 10, max: 15 },
    revenueModel: { current: 11, max: 15 },
    differentiation: { current: 8, max: 10 },
    logicalConsistency: { current: 9, max: 10 },
    feasibility: { current: 8, max: 10 },
    feedbackReflection: { current: 9, max: 10 },
    totalScore: 81,
  },
  validationScore: 81,
};

async function testGenerators() {
  console.log('🚀 생성기 테스트 시작...\n');

  // 1. 랜딩페이지 생성
  console.log('1️⃣ 랜딩페이지 생성 중...');
  const landingPage = generateLandingPage(sampleData as any);
  writeFileSync('test-output/landing-page.html', landingPage.html);
  console.log('   ✅ test-output/landing-page.html 생성 완료\n');

  // 2. 피치덱 생성
  console.log('2️⃣ 피치덱 생성 중...');
  const pitchDeck = generatePitchDeck(sampleData as any);
  const pitchDeckHTML = generatePitchDeckHTML(pitchDeck);
  writeFileSync('test-output/pitch-deck.html', pitchDeckHTML);
  writeFileSync('test-output/pitch-deck.json', JSON.stringify(pitchDeck, null, 2));
  console.log('   ✅ test-output/pitch-deck.html 생성 완료');
  console.log('   ✅ test-output/pitch-deck.json 생성 완료\n');

  // 3. MVP 블루프린트 생성
  console.log('3️⃣ MVP 블루프린트 생성 중...');
  const mvpBlueprint = generateMvpBlueprint(sampleData as any);
  const mvpMarkdown = generateMvpMarkdown(mvpBlueprint);
  writeFileSync('test-output/mvp-blueprint.md', mvpMarkdown);
  writeFileSync('test-output/mvp-blueprint.json', JSON.stringify(mvpBlueprint, null, 2));
  console.log('   ✅ test-output/mvp-blueprint.md 생성 완료');
  console.log('   ✅ test-output/mvp-blueprint.json 생성 완료\n');

  console.log('✨ 모든 테스트 완료!');
  console.log('   test-output/ 폴더에서 결과물을 확인하세요.');
}

// test-output 폴더 생성
import { mkdirSync, existsSync } from 'fs';
if (!existsSync('test-output')) {
  mkdirSync('test-output');
}

testGenerators().catch(console.error);
