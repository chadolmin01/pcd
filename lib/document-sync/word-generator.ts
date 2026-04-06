// 클라이언트 사이드 DOCX 생성기
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
import type { ApplicationFormData } from './types';

// 스타일 상수
const STYLES = {
  primaryColor: '0052CC',
  textColor: '1a1a1a',
  grayColor: '666666',
  lightGray: 'f5f5f5',
  borderColor: 'dddddd',
};

/**
 * 지원서 데이터를 DOCX 문서로 생성
 * @param data 지원서 폼 데이터
 * @returns DOCX 문서의 Buffer
 */
export async function generateApplicationDocx(data: ApplicationFormData): Promise<Buffer> {
  const doc = createApplicationDocument(data);
  const buffer = await Packer.toBuffer(doc);
  return buffer;
}

/**
 * DOCX 문서 객체 생성
 */
function createApplicationDocument(data: ApplicationFormData): Document {
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
            size: 48, // 24pt
            bold: true,
            color: STYLES.textColor,
          },
          paragraph: {
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
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
                    text: `${data.programName} 지원서`,
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
                text: data.programName,
                size: 48,
                bold: true,
              }),
            ],
          }),

          // 부제목 (아이디어 제목)
          ...(data.ideaTitle
            ? [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 400 },
                  children: [
                    new TextRun({
                      text: data.ideaTitle,
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
                text: `작성일: ${formatDate(data.updatedAt)}`,
                size: 20,
                color: STYLES.grayColor,
              }),
            ],
          }),

          // 각 섹션 렌더링
          ...data.sections.flatMap((section, index) => [
            createSectionTitle(`${index + 1}. ${section.titleKo} (${section.weight}점)`),
            ...createSectionContent(section.content),
            new Paragraph({ spacing: { before: 400 } }),
          ]),
        ],
      },
    ],
  });

  return doc;
}

/**
 * 섹션 제목 생성
 */
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

/**
 * 섹션 내용 생성 (빈 내용 처리 포함)
 */
function createSectionContent(content: string): Paragraph[] {
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

  // 줄바꿈으로 분리하여 각 줄을 별도 Paragraph로
  const lines = content.split('\n');
  return lines.map(
    (line) =>
      new Paragraph({
        spacing: { before: 60, after: 60 },
        children: [
          new TextRun({
            text: line || ' ', // 빈 줄도 유지
            size: 22,
          }),
        ],
      })
  );
}

/**
 * 날짜 포맷팅
 */
function formatDate(date: Date): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}년 ${month}월 ${day}일`;
}

/**
 * Blob으로 다운로드 (폴백용)
 */
export async function downloadAsDocx(data: ApplicationFormData, fileName?: string): Promise<void> {
  const buffer = await generateApplicationDocx(data);
  // Buffer를 ArrayBuffer로 복사하여 Blob 생성 (타입 호환성)
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
  const blob = new Blob([arrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName || `${data.programName}_지원서.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
