import { NextRequest, NextResponse } from 'next/server';
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
} from 'docx';
import { BusinessPlanData } from '@/components/idea-validator/types';

// 스타일 상수
const STYLES = {
  primaryColor: '0052CC',
  textColor: '1a1a1a',
  grayColor: '666666',
  lightGray: 'f5f5f5',
  borderColor: 'dddddd',
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { data } = body as { data: BusinessPlanData };

    if (!data) {
      return NextResponse.json(
        { error: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      );
    }

    const doc = generateBusinessPlanDocx(data);
    const buffer = await Packer.toBuffer(doc);

    const fileName = `사업계획서_${data.basicInfo.itemName || 'draft'}.docx`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Word Export error:', error);
    return NextResponse.json(
      { error: 'Word 문서 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

function generateBusinessPlanDocx(data: BusinessPlanData): Document {
  const { basicInfo, sectionData, schedule, budget, scorecard, validationScore } = data;

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Noto Sans KR',
            size: 22, // 11pt
          },
          paragraph: {
            spacing: { line: 360 }, // 1.5 줄간격
          },
        },
      },
      paragraphStyles: [
        {
          id: 'Title',
          name: 'Title',
          basedOn: 'Normal',
          next: 'Normal',
          run: {
            size: 56, // 28pt
            bold: true,
            color: STYLES.textColor,
          },
          paragraph: {
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          },
        },
        {
          id: 'Heading1',
          name: 'Heading 1',
          basedOn: 'Normal',
          next: 'Normal',
          run: {
            size: 28, // 14pt
            bold: true,
            color: STYLES.textColor,
          },
          paragraph: {
            spacing: { before: 400, after: 200 },
          },
        },
        {
          id: 'Heading2',
          name: 'Heading 2',
          basedOn: 'Normal',
          next: 'Normal',
          run: {
            size: 24, // 12pt
            bold: true,
            color: STYLES.grayColor,
          },
          paragraph: {
            spacing: { before: 200, after: 100 },
          },
        },
      ],
    },
    sections: [
      // 표지 섹션
      {
        properties: {
          page: {
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children: [
          // 상단 여백
          new Paragraph({ spacing: { before: 2000 } }),

          // 뱃지
          new Paragraph({
            alignment: AlignmentType.CENTER,
            border: {
              top: { style: BorderStyle.SINGLE, size: 12, color: STYLES.primaryColor },
              bottom: { style: BorderStyle.SINGLE, size: 12, color: STYLES.primaryColor },
              left: { style: BorderStyle.SINGLE, size: 12, color: STYLES.primaryColor },
              right: { style: BorderStyle.SINGLE, size: 12, color: STYLES.primaryColor },
            },
            children: [
              new TextRun({
                text: 'AI 검증 사업계획서',
                size: 22,
                bold: true,
                color: STYLES.primaryColor,
              }),
            ],
          }),

          new Paragraph({ spacing: { before: 600 } }),

          // 제목
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: basicInfo.itemName || '사업계획서',
                size: 56,
                bold: true,
              }),
            ],
          }),

          // 부제목
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 800 },
            children: [
              new TextRun({
                text: basicInfo.oneLiner || '',
                size: 28,
                color: STYLES.grayColor,
              }),
            ],
          }),

          // 기본 정보 테이블
          createInfoTable(basicInfo),

          new Paragraph({ spacing: { before: 800 } }),

          // 검증 점수
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: '검증 점수',
                size: 28,
                color: STYLES.grayColor,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: String(validationScore),
                size: 96,
                bold: true,
                color: STYLES.primaryColor,
              }),
            ],
          }),

          // 페이지 나누기
          new Paragraph({
            children: [new PageBreak()],
          }),
        ],
      },

      // 본문 섹션
      {
        properties: {
          page: {
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: basicInfo.itemName || '사업계획서',
                    size: 18,
                    color: STYLES.grayColor,
                  }),
                ],
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
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 18,
                    color: STYLES.grayColor,
                  }),
                  new TextRun({
                    text: ' / ',
                    size: 18,
                    color: STYLES.grayColor,
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 18,
                    color: STYLES.grayColor,
                  }),
                ],
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

          new Paragraph({ spacing: { before: 400 } }),

          // 2. 솔루션
          createSectionTitle('2. 솔루션'),
          ...createField('개발 계획', sectionData.solution.development_plan),
          ...createField('차별화 포인트', sectionData.solution.differentiation),
          ...createField('경쟁력 분석', sectionData.solution.competitiveness),

          new Paragraph({ spacing: { before: 400 } }),

          // 3. 스케일업 전략
          createSectionTitle('3. 스케일업 전략'),
          ...createField('비즈니스 모델', sectionData.scaleup.business_model),
          ...createField('시장 규모', sectionData.scaleup.market_size),
          ...createField('사업화 로드맵', sectionData.scaleup.roadmap),

          new Paragraph({ spacing: { before: 400 } }),

          // 4. 팀 구성
          createSectionTitle('4. 팀 구성'),
          ...createField('대표자 프로필', sectionData.team.founder),
          ...createField('팀 구성원', sectionData.team.team_members),
          ...createField('팀 시너지', sectionData.team.team_synergy),

          new Paragraph({ spacing: { before: 400 } }),

          // 5. 추진 일정
          ...(schedule.length > 0
            ? [
                createSectionTitle('5. 추진 일정'),
                createScheduleTable(schedule),
                new Paragraph({ spacing: { before: 400 } }),
              ]
            : []),

          // 6. 소요 예산
          ...(budget.length > 0
            ? [
                createSectionTitle('6. 소요 예산'),
                createBudgetTable(budget),
                new Paragraph({ spacing: { before: 400 } }),
              ]
            : []),

          // 7. AI 검증 스코어카드
          createSectionTitle('7. AI 검증 스코어카드'),
          createScorecardTable(scorecard),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 400 },
            children: [
              new TextRun({
                text: `총점: ${scorecard.totalScore}/100`,
                size: 28,
                bold: true,
              }),
            ],
          }),
        ],
      },
    ],
  });

  return doc;
}

function createInfoTable(basicInfo: BusinessPlanData['basicInfo']): Table {
  const rows = [
    ['타겟 고객', basicInfo.targetCustomer || '-'],
    ['산업 분야', basicInfo.industry || '-'],
    ['희망 지원금', basicInfo.fundingAmount ? `${basicInfo.fundingAmount.toLocaleString()}만원` : '-'],
  ];

  return new Table({
    width: { size: 5000, type: WidthType.DXA },
    alignment: AlignmentType.CENTER,
    rows: rows.map(
      ([label, value]) =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: 2000, type: WidthType.DXA },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: 'eeeeee' },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: label,
                      size: 20,
                      color: STYLES.grayColor,
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 3000, type: WidthType.DXA },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: 'eeeeee' },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: value,
                      size: 20,
                      bold: true,
                    }),
                  ],
                }),
              ],
            }),
          ],
        })
    ),
  });
}

function createSectionTitle(title: string): Paragraph {
  return new Paragraph({
    shading: {
      type: ShadingType.SOLID,
      color: STYLES.lightGray,
    },
    border: {
      left: { style: BorderStyle.SINGLE, size: 24, color: STYLES.primaryColor },
    },
    spacing: { before: 400, after: 200 },
    children: [
      new TextRun({
        text: `  ${title}`,
        size: 28,
        bold: true,
      }),
    ],
  });
}

function createField(label: string, value: string): Paragraph[] {
  return [
    new Paragraph({
      spacing: { before: 200 },
      border: {
        bottom: { style: BorderStyle.DOTTED, size: 1, color: STYLES.borderColor },
      },
      children: [
        new TextRun({
          text: label,
          size: 20,
          bold: true,
          color: STYLES.textColor,
        }),
      ],
    }),
    new Paragraph({
      spacing: { before: 100, after: 200 },
      children: [
        new TextRun({
          text: value || '-',
          size: 20,
        }),
      ],
    }),
  ];
}

function createScheduleTable(schedule: BusinessPlanData['schedule']): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      // 헤더
      new TableRow({
        tableHeader: true,
        children: ['No', '개발 내용', '기간', '상세 내용'].map(
          (text) =>
            new TableCell({
              shading: { type: ShadingType.SOLID, color: STYLES.lightGray },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text,
                      size: 18,
                      bold: true,
                    }),
                  ],
                }),
              ],
            })
        ),
      }),
      // 데이터
      ...schedule.map(
        (item) =>
          new TableRow({
            children: [item.no, item.content, item.period, item.detail].map(
              (text) =>
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: text || '-',
                          size: 18,
                        }),
                      ],
                    }),
                  ],
                })
            ),
          })
      ),
    ],
  });
}

function createBudgetTable(budget: BusinessPlanData['budget']): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      // 헤더
      new TableRow({
        tableHeader: true,
        children: ['비용 항목', '상세 내용', '금액'].map(
          (text) =>
            new TableCell({
              shading: { type: ShadingType.SOLID, color: STYLES.lightGray },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text,
                      size: 18,
                      bold: true,
                    }),
                  ],
                }),
              ],
            })
        ),
      }),
      // 데이터
      ...budget.map(
        (item) =>
          new TableRow({
            children: [item.category, item.detail, item.amount].map(
              (text) =>
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: text || '-',
                          size: 18,
                        }),
                      ],
                    }),
                  ],
                })
            ),
          })
      ),
    ],
  });
}

function createScorecardTable(scorecard: BusinessPlanData['scorecard']): Table {
  const items = [
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
    rows: items.map(
      ([label, score]) =>
        new TableRow({
          children: [
            new TableCell({
              shading: { type: ShadingType.SOLID, color: 'f9f9f9' },
              width: { size: 50, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: label as string,
                      size: 18,
                      color: STYLES.grayColor,
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              shading: { type: ShadingType.SOLID, color: 'f9f9f9' },
              width: { size: 50, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [
                    new TextRun({
                      text: `${(score as { current: number; max: number }).current}/${(score as { current: number; max: number }).max}`,
                      size: 18,
                      bold: true,
                    }),
                  ],
                }),
              ],
            }),
          ],
        })
    ),
  });
}
