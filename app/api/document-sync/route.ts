import { NextRequest, NextResponse } from 'next/server';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
  ShadingType,
  Header,
  Footer,
  PageNumber,
} from 'docx';

// 스타일 상수
const STYLES = {
  primaryColor: '0052CC',
  textColor: '1a1a1a',
  grayColor: '666666',
  lightGray: 'f5f5f5',
};

interface SectionData {
  id: string;
  titleKo: string;
  weight: number;
  content: string;
}

interface RequestBody {
  programName: string;
  sections: SectionData[];
  ideaTitle?: string;
}

/**
 * 서버사이드 DOCX 생성 API (폴백용)
 * FSA API를 지원하지 않는 브라우저를 위한 대안
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RequestBody;
    const { programName, sections, ideaTitle } = body;

    if (!programName || !sections) {
      return NextResponse.json(
        { error: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      );
    }

    const doc = createDocument(programName, sections, ideaTitle);
    const buffer = await Packer.toBuffer(doc);

    const fileName = `${programName}_지원서.docx`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Document generation error:', error);
    return NextResponse.json(
      { error: '문서 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

function createDocument(
  programName: string,
  sections: SectionData[],
  ideaTitle?: string
): Document {
  const now = new Date();
  const dateStr = `${now.getFullYear()}년 ${String(now.getMonth() + 1).padStart(2, '0')}월 ${String(now.getDate()).padStart(2, '0')}일`;

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Noto Sans KR',
            size: 22,
          },
          paragraph: {
            spacing: { line: 360 },
          },
        },
      },
    },
    sections: [
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
                    text: `${programName} 지원서`,
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
          // 제목
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 600, after: 200 },
            children: [
              new TextRun({
                text: programName,
                size: 48,
                bold: true,
              }),
            ],
          }),

          // 부제목
          ...(ideaTitle
            ? [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 400 },
                  children: [
                    new TextRun({
                      text: ideaTitle,
                      size: 28,
                      color: STYLES.grayColor,
                    }),
                  ],
                }),
              ]
            : []),

          // 작성일
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 800 },
            children: [
              new TextRun({
                text: `작성일: ${dateStr}`,
                size: 20,
                color: STYLES.grayColor,
              }),
            ],
          }),

          // 섹션들
          ...sections.flatMap((section, index) => [
            // 섹션 제목
            new Paragraph({
              shading: {
                type: ShadingType.SOLID,
                color: STYLES.lightGray,
              },
              border: {
                left: {
                  style: BorderStyle.SINGLE,
                  size: 24,
                  color: STYLES.primaryColor,
                },
              },
              spacing: { before: 400, after: 200 },
              children: [
                new TextRun({
                  text: `  ${index + 1}. ${section.titleKo} (${section.weight}점)`,
                  size: 28,
                  bold: true,
                }),
              ],
            }),
            // 섹션 내용
            ...createContentParagraphs(section.content),
            new Paragraph({ spacing: { before: 400 } }),
          ]),
        ],
      },
    ],
  });

  return doc;
}

function createContentParagraphs(content: string): Paragraph[] {
  if (!content || content.trim().length === 0) {
    return [
      new Paragraph({
        spacing: { before: 100, after: 200 },
        children: [
          new TextRun({
            text: '(작성 중...)',
            size: 20,
            color: STYLES.grayColor,
            italics: true,
          }),
        ],
      }),
    ];
  }

  const lines = content.split('\n');
  return lines.map(
    (line) =>
      new Paragraph({
        spacing: { before: 60, after: 60 },
        children: [
          new TextRun({
            text: line || ' ',
            size: 22,
          }),
        ],
      })
  );
}
