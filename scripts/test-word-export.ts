import { writeFileSync } from 'fs';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  BorderStyle,
  WidthType,
  ShadingType,
  PageBreak,
  Header,
  Footer,
  PageNumber,
  TableLayoutType,
  VerticalAlign,
  convertInchesToTwip,
} from 'docx';

const STYLES = {
  primaryColor: '0052CC',
  textColor: '1a1a1a',
  grayColor: '666666',
  lightGray: 'f5f5f5',
  borderColor: 'dddddd',
};

// 샘플 데이터
const sampleData = {
  basicInfo: {
    itemName: 'Draft AI - 스타트업 아이디어 검증 플랫폼',
    oneLiner: 'AI 멀티 페르소나를 활용한 사업 아이디어 검증 서비스',
    targetCustomer: '초기 창업자 및 예비 창업자',
    industry: 'AI/SaaS',
    fundingAmount: 5000,
  },
  sectionData: {
    problem: {
      market_status: '창업 시장에서 아이디어 검증 없이 사업을 시작하는 비율이 70%에 달하며, 이로 인한 실패율이 매우 높음',
      problem_definition: '전문 멘토링 비용이 높고 접근성이 낮아 초기 창업자들이 객관적인 피드백을 받기 어려움',
      development_necessity: 'AI 기술을 활용하여 저렴하고 즉각적인 아이디어 검증 서비스 제공 필요',
    },
    solution: {
      development_plan: '멀티 페르소나 AI 시스템을 통해 CTO, CFO, 마케터 등 다양한 관점의 피드백 제공',
      differentiation: '단순 챗봇이 아닌, 전문가 관점별 구체적인 조언과 점수 기반 평가 시스템',
      competitiveness: '실시간 AI 응답, 한국어 특화, 사업계획서 자동 생성 기능',
    },
    scaleup: {
      business_model: 'Freemium 모델 - 기본 검증 무료, 상세 분석 및 문서 생성 유료',
      market_size: '국내 창업 지원 시장 2조원 중 AI 기반 서비스 타겟 시장 약 1000억원',
      roadmap: '1단계: MVP 출시 (완료) → 2단계: B2B 확장 → 3단계: 글로벌 진출',
    },
    team: {
      founder: '10년 경력 풀스택 개발자, 스타트업 2회 창업 경험',
      team_members: 'AI 엔지니어 1명, UX 디자이너 1명, 비즈니스 매니저 1명',
      team_synergy: '기술-디자인-비즈니스 균형 잡힌 팀 구성으로 빠른 실행력 보유',
    },
  },
  schedule: [
    { no: '1', content: 'MVP 개발', period: '2024.01-03', detail: '핵심 기능 개발 및 테스트' },
    { no: '2', content: '베타 테스트', period: '2024.04-05', detail: '100명 대상 베타 서비스' },
    { no: '3', content: '정식 출시', period: '2024.06', detail: '마케팅 및 정식 서비스 오픈' },
  ],
  budget: [
    { category: '인건비', detail: '개발자 2명 6개월', amount: '3,600만원' },
    { category: '클라우드', detail: 'AWS 서버 비용', amount: '600만원' },
    { category: '마케팅', detail: '온라인 광고', amount: '800만원' },
  ],
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

function createInfoTable(basicInfo: typeof sampleData.basicInfo): Table {
  const rows = [
    ['타겟 고객', basicInfo.targetCustomer || '-'],
    ['산업 분야', basicInfo.industry || '-'],
    ['희망 지원금', basicInfo.fundingAmount ? `${basicInfo.fundingAmount.toLocaleString()}만원` : '-'],
  ];

  return new Table({
    width: { size: 5000, type: WidthType.DXA },
    alignment: AlignmentType.CENTER,
    columnWidths: [1500, 3500], // 명시적 컬럼 너비
    rows: rows.map(
      ([label, value]) =>
        new TableRow({
          cantSplit: true,
          children: [
            new TableCell({
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: 'dddddd' },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              margins: { top: 80, bottom: 80 },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: label, size: 20, color: STYLES.grayColor })],
                }),
              ],
            }),
            new TableCell({
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: 'dddddd' },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              margins: { top: 80, bottom: 80 },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: value, size: 20, bold: true })],
                }),
              ],
            }),
          ],
        })
    ),
  });
}

function createSectionTitle(title: string, addPageBreak = false): Paragraph {
  return new Paragraph({
    shading: { type: ShadingType.SOLID, color: STYLES.lightGray },
    border: { left: { style: BorderStyle.SINGLE, size: 24, color: STYLES.primaryColor } },
    spacing: { before: addPageBreak ? 0 : 240, after: 120 },
    keepNext: true,
    pageBreakBefore: addPageBreak,
    children: [new TextRun({ text: `  ${title}`, size: 28, bold: true })],
  });
}

function createField(label: string, value: string): Paragraph[] {
  return [
    new Paragraph({
      spacing: { before: 120 },
      border: { bottom: { style: BorderStyle.DOTTED, size: 1, color: STYLES.borderColor } },
      keepNext: true,
      children: [new TextRun({ text: label, size: 20, bold: true, color: STYLES.textColor })],
    }),
    new Paragraph({
      spacing: { before: 60, after: 120 },
      keepLines: true,
      children: [new TextRun({ text: value || '-', size: 20 })],
    }),
  ];
}

function createScheduleTable(schedule: typeof sampleData.schedule): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [
      new TableRow({
        tableHeader: true,
        cantSplit: true,
        children: ['No', '개발 내용', '기간', '상세 내용'].map(
          (text, idx) =>
            new TableCell({
              shading: { type: ShadingType.SOLID, color: STYLES.lightGray },
              width: { size: idx === 0 ? 8 : idx === 3 ? 40 : 26, type: WidthType.PERCENTAGE },
              verticalAlign: VerticalAlign.CENTER,
              children: [new Paragraph({ children: [new TextRun({ text, size: 18, bold: true })] })],
            })
        ),
      }),
      ...schedule.map(
        (item) =>
          new TableRow({
            cantSplit: true, // 행이 페이지 넘어가지 않도록
            children: [item.no, item.content, item.period, item.detail].map(
              (text, idx) =>
                new TableCell({
                  width: { size: idx === 0 ? 8 : idx === 3 ? 40 : 26, type: WidthType.PERCENTAGE },
                  verticalAlign: VerticalAlign.CENTER,
                  children: [new Paragraph({ children: [new TextRun({ text: text || '-', size: 18 })] })],
                })
            ),
          })
      ),
    ],
  });
}

function createBudgetTable(budget: typeof sampleData.budget): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [
      new TableRow({
        tableHeader: true,
        cantSplit: true,
        children: ['비용 항목', '상세 내용', '금액'].map(
          (text, idx) =>
            new TableCell({
              shading: { type: ShadingType.SOLID, color: STYLES.lightGray },
              width: { size: idx === 1 ? 50 : 25, type: WidthType.PERCENTAGE },
              verticalAlign: VerticalAlign.CENTER,
              children: [new Paragraph({ children: [new TextRun({ text, size: 18, bold: true })] })],
            })
        ),
      }),
      ...budget.map(
        (item) =>
          new TableRow({
            cantSplit: true,
            children: [item.category, item.detail, item.amount].map(
              (text, idx) =>
                new TableCell({
                  width: { size: idx === 1 ? 50 : 25, type: WidthType.PERCENTAGE },
                  verticalAlign: VerticalAlign.CENTER,
                  children: [new Paragraph({ children: [new TextRun({ text: text || '-', size: 18 })] })],
                })
            ),
          })
      ),
    ],
  });
}

function createScorecardTable(scorecard: typeof sampleData.scorecard): Table {
  const items: [string, { current: number; max: number }][] = [
    ['문제 정의', scorecard.problemDefinition],
    ['솔루션', scorecard.solution],
    ['시장 분석', scorecard.marketAnalysis],
    ['수익 모델', scorecard.revenueModel],
    ['차별화', scorecard.differentiation],
    ['논리 일관성', scorecard.logicalConsistency],
    ['실현 가능성', scorecard.feasibility],
    ['피드백 반영', scorecard.feedbackReflection],
  ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: items.map(
      ([label, score]) =>
        new TableRow({
          cantSplit: true,
          children: [
            new TableCell({
              shading: { type: ShadingType.SOLID, color: 'f9f9f9' },
              width: { size: 50, type: WidthType.PERCENTAGE },
              verticalAlign: VerticalAlign.CENTER,
              margins: { top: 40, bottom: 40, left: 100, right: 100 },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: label, size: 20, color: STYLES.grayColor })],
                }),
              ],
            }),
            new TableCell({
              shading: { type: ShadingType.SOLID, color: 'f9f9f9' },
              width: { size: 50, type: WidthType.PERCENTAGE },
              verticalAlign: VerticalAlign.CENTER,
              margins: { top: 40, bottom: 40, left: 100, right: 100 },
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [new TextRun({ text: `${score.current}/${score.max}`, size: 20, bold: true })],
                }),
              ],
            }),
          ],
        })
    ),
  });
}

async function generateSampleDoc() {
  const { basicInfo, sectionData, schedule, budget, scorecard, validationScore } = sampleData;

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: 'Noto Sans KR', size: 22 },
          paragraph: { spacing: { line: 276 } }, // 1.15 줄간격
        },
      },
    },
    sections: [
      // 표지
      {
        properties: {
          page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: 'Draft', size: 18, color: 'CCCCCC', font: 'Arial', italics: true })],
              }),
            ],
          }),
        },
        children: [
          // 상단 여백 (세로 중앙 정렬용)
          new Paragraph({ spacing: { before: 2800 } }),
          // 뱃지 (테이블로 구현)
          new Table({
            alignment: AlignmentType.CENTER,
            width: { size: 2400, type: WidthType.DXA },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 12, color: STYLES.primaryColor },
                      bottom: { style: BorderStyle.SINGLE, size: 12, color: STYLES.primaryColor },
                      left: { style: BorderStyle.SINGLE, size: 12, color: STYLES.primaryColor },
                      right: { style: BorderStyle.SINGLE, size: 12, color: STYLES.primaryColor },
                    },
                    margins: { top: 80, bottom: 80, left: 200, right: 200 },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: 'AI 검증 사업계획서', size: 22, bold: true, color: STYLES.primaryColor })],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          new Paragraph({ spacing: { before: 300 } }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: basicInfo.itemName, size: 48, bold: true })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 80, after: 300 },
            children: [new TextRun({ text: basicInfo.oneLiner, size: 24, color: STYLES.grayColor })],
          }),
          createInfoTable(basicInfo),
          new Paragraph({ spacing: { before: 300 } }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: '검증 점수', size: 24, color: STYLES.grayColor })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: String(validationScore), size: 72, bold: true, color: STYLES.primaryColor })],
          }),
          new Paragraph({ children: [new PageBreak()] }),
        ],
      },
      // 본문
      {
        properties: {
          page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: basicInfo.itemName, size: 18, color: STYLES.grayColor })],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ children: [PageNumber.CURRENT], size: 18, color: STYLES.grayColor }),
                  new TextRun({ text: ' / ', size: 18, color: STYLES.grayColor }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: STYLES.grayColor }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: 'Draft', size: 18, color: 'CCCCCC', font: 'Arial', italics: true })],
              }),
            ],
          }),
        },
        children: [
          // 1. 문제 정의
          createSectionTitle('1. 문제 정의'),
          ...createField('시장 현황', sectionData.problem.market_status),
          ...createField('핵심 문제점', sectionData.problem.problem_definition),
          ...createField('개발 필요성', sectionData.problem.development_necessity),

          // 2. 솔루션
          createSectionTitle('2. 솔루션'),
          ...createField('개발 계획', sectionData.solution.development_plan),
          ...createField('차별화 포인트', sectionData.solution.differentiation),
          ...createField('경쟁력 분석', sectionData.solution.competitiveness),

          // 3. 스케일업 전략 (새 페이지)
          createSectionTitle('3. 스케일업 전략', true),
          ...createField('비즈니스 모델', sectionData.scaleup.business_model),
          ...createField('시장 규모', sectionData.scaleup.market_size),
          ...createField('사업화 로드맵', sectionData.scaleup.roadmap),

          // 4. 팀 구성
          createSectionTitle('4. 팀 구성'),
          ...createField('대표자 프로필', sectionData.team.founder),
          ...createField('팀 구성원', sectionData.team.team_members),
          ...createField('팀 시너지', sectionData.team.team_synergy),

          // 5. 추진 일정 (새 페이지)
          createSectionTitle('5. 추진 일정', true),
          createScheduleTable(schedule),

          // 6. 소요 예산
          new Paragraph({ spacing: { before: 400 } }),
          createSectionTitle('6. 소요 예산'),
          createBudgetTable(budget),

          // 7. AI 검증 스코어카드 (새 페이지)
          createSectionTitle('7. AI 검증 스코어카드', true),
          createScorecardTable(scorecard),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 400 },
            children: [new TextRun({ text: `총점: ${scorecard.totalScore}/100`, size: 32, bold: true, color: STYLES.primaryColor })],
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const filename = `sample_business_plan_${Date.now()}.docx`;
  writeFileSync(filename, buffer);
  console.log(`✅ ${filename} 생성 완료!`);
}

generateSampleDoc().catch(console.error);
