import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { withRateLimit } from '@/lib/rate-limit';
import { BusinessPlanData } from '@/components/idea-validator/types';

export const POST = withRateLimit(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { data, format } = body as { data: BusinessPlanData; format: string };

    // 입력 검증
    if (!data) {
      return NextResponse.json(
        { error: '사업계획서 데이터가 필요합니다.' },
        { status: 400 }
      );
    }

    if (format !== 'pdf') {
      return NextResponse.json(
        { error: '지원하지 않는 형식입니다. (지원: pdf)' },
        { status: 400 }
      );
    }

    if (!data.basicInfo || !data.sectionData) {
      return NextResponse.json(
        { error: '사업계획서 필수 정보가 누락되었습니다.' },
        { status: 400 }
      );
    }

    const htmlContent = generateBusinessPlanHtml(data);
    const pdfBuffer = await generatePdfFromHtml(htmlContent);

    const fileName = `사업계획서_${data.basicInfo.itemName || 'draft'}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('PDF Export error:', error);
    return NextResponse.json(
      { error: 'PDF 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}, { isAI: true }); // Puppeteer는 리소스 집약적이므로 AI 티어로 제한

async function generatePdfFromHtml(htmlContent: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `
        <div style="width: 100%; font-size: 9px; color: #999; text-align: center; padding: 10px;">
          <span class="pageNumber"></span> / <span class="totalPages"></span>
        </div>
      `,
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

function generateBusinessPlanHtml(data: BusinessPlanData): string {
  const { basicInfo, sectionData, schedule, budget, scorecard, validationScore } = data;

  return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>${basicInfo.itemName} - 사업계획서</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Noto Sans KR', sans-serif;
      font-size: 10pt;
      line-height: 1.8;
      color: #1a1a1a;
      background: white;
    }

    .cover {
      text-align: center;
      padding: 80px 40px;
      page-break-after: always;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .cover-badge {
      display: inline-block;
      font-size: 11pt;
      color: #0052CC;
      border: 2px solid #0052CC;
      padding: 8px 24px;
      margin-bottom: 40px;
      font-weight: 600;
    }

    .cover-title {
      font-size: 28pt;
      font-weight: 700;
      margin-bottom: 16px;
    }

    .cover-subtitle {
      font-size: 14pt;
      color: #666;
      margin-bottom: 60px;
    }

    .cover-info {
      max-width: 400px;
      margin: 0 auto;
      text-align: left;
    }

    .cover-info-row {
      display: flex;
      padding: 12px 0;
      border-bottom: 1px solid #eee;
    }

    .cover-info-label {
      width: 120px;
      color: #666;
      font-weight: 500;
    }

    .cover-info-value {
      flex: 1;
      font-weight: 600;
    }

    .cover-score {
      margin-top: 60px;
      font-size: 16pt;
    }

    .cover-score-value {
      font-size: 48pt;
      font-weight: 700;
      color: #0052CC;
    }

    .content { padding: 40px; }

    .section {
      margin-bottom: 32px;
      page-break-inside: avoid;
    }

    .section-title {
      font-size: 14pt;
      font-weight: 700;
      background: #f5f5f5;
      padding: 12px 16px;
      margin-bottom: 16px;
      border-left: 4px solid #0052CC;
    }

    .section-content {
      padding: 0 16px;
    }

    .field { margin-bottom: 20px; }

    .field-label {
      font-size: 10pt;
      font-weight: 600;
      color: #333;
      margin-bottom: 8px;
      padding-bottom: 4px;
      border-bottom: 1px dotted #ddd;
    }

    .field-value {
      font-size: 10pt;
      line-height: 1.9;
      white-space: pre-wrap;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      font-size: 9pt;
    }

    th, td {
      border: 1px solid #ddd;
      padding: 10px 12px;
      text-align: left;
    }

    th {
      background: #f5f5f5;
      font-weight: 600;
    }

    .scorecard-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin: 16px 0;
    }

    .scorecard-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 12px;
      background: #f9f9f9;
      border-radius: 4px;
    }

    .scorecard-label { color: #666; }
    .scorecard-score { font-weight: 600; }
  </style>
</head>
<body>
  <!-- Cover Page -->
  <div class="cover">
    <div class="cover-badge">AI 검증 사업계획서</div>
    <h1 class="cover-title">${escapeHtml(basicInfo.itemName)}</h1>
    <p class="cover-subtitle">${escapeHtml(basicInfo.oneLiner)}</p>

    <div class="cover-info">
      <div class="cover-info-row">
        <span class="cover-info-label">타겟 고객</span>
        <span class="cover-info-value">${escapeHtml(basicInfo.targetCustomer)}</span>
      </div>
      <div class="cover-info-row">
        <span class="cover-info-label">산업 분야</span>
        <span class="cover-info-value">${escapeHtml(basicInfo.industry)}</span>
      </div>
      <div class="cover-info-row">
        <span class="cover-info-label">희망 지원금</span>
        <span class="cover-info-value">${basicInfo.fundingAmount?.toLocaleString() || '-'}만원</span>
      </div>
    </div>

    <div class="cover-score">
      <div>검증 점수</div>
      <div class="cover-score-value">${validationScore}</div>
    </div>
  </div>

  <!-- Content -->
  <div class="content">
    <!-- 1. 문제 정의 -->
    <div class="section">
      <h2 class="section-title">1. 문제 정의</h2>
      <div class="section-content">
        <div class="field">
          <div class="field-label">시장 현황</div>
          <div class="field-value">${escapeHtml(sectionData.problem.market_status)}</div>
        </div>
        <div class="field">
          <div class="field-label">핵심 문제점</div>
          <div class="field-value">${escapeHtml(sectionData.problem.problem_definition)}</div>
        </div>
        <div class="field">
          <div class="field-label">개발 필요성</div>
          <div class="field-value">${escapeHtml(sectionData.problem.development_necessity)}</div>
        </div>
      </div>
    </div>

    <!-- 2. 솔루션 -->
    <div class="section">
      <h2 class="section-title">2. 솔루션</h2>
      <div class="section-content">
        <div class="field">
          <div class="field-label">개발 계획</div>
          <div class="field-value">${escapeHtml(sectionData.solution.development_plan)}</div>
        </div>
        <div class="field">
          <div class="field-label">차별화 포인트</div>
          <div class="field-value">${escapeHtml(sectionData.solution.differentiation)}</div>
        </div>
        <div class="field">
          <div class="field-label">경쟁력 분석</div>
          <div class="field-value">${escapeHtml(sectionData.solution.competitiveness)}</div>
        </div>
      </div>
    </div>

    <!-- 3. 스케일업 -->
    <div class="section">
      <h2 class="section-title">3. 스케일업 전략</h2>
      <div class="section-content">
        <div class="field">
          <div class="field-label">비즈니스 모델</div>
          <div class="field-value">${escapeHtml(sectionData.scaleup.business_model)}</div>
        </div>
        <div class="field">
          <div class="field-label">시장 규모</div>
          <div class="field-value">${escapeHtml(sectionData.scaleup.market_size)}</div>
        </div>
        <div class="field">
          <div class="field-label">사업화 로드맵</div>
          <div class="field-value">${escapeHtml(sectionData.scaleup.roadmap)}</div>
        </div>
      </div>
    </div>

    <!-- 4. 팀 구성 -->
    <div class="section">
      <h2 class="section-title">4. 팀 구성</h2>
      <div class="section-content">
        <div class="field">
          <div class="field-label">대표자 프로필</div>
          <div class="field-value">${escapeHtml(sectionData.team.founder)}</div>
        </div>
        <div class="field">
          <div class="field-label">팀 구성원</div>
          <div class="field-value">${escapeHtml(sectionData.team.team_members)}</div>
        </div>
        <div class="field">
          <div class="field-label">팀 시너지</div>
          <div class="field-value">${escapeHtml(sectionData.team.team_synergy)}</div>
        </div>
      </div>
    </div>

    <!-- 5. 추진 일정 -->
    ${schedule.length > 0 ? `
    <div class="section">
      <h2 class="section-title">5. 추진 일정</h2>
      <div class="section-content">
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>개발 내용</th>
              <th>기간</th>
              <th>상세 내용</th>
            </tr>
          </thead>
          <tbody>
            ${schedule.map(item => `
              <tr>
                <td>${escapeHtml(item.no)}</td>
                <td>${escapeHtml(item.content)}</td>
                <td>${escapeHtml(item.period)}</td>
                <td>${escapeHtml(item.detail)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
    ` : ''}

    <!-- 6. 소요 예산 -->
    ${budget.length > 0 ? `
    <div class="section">
      <h2 class="section-title">6. 소요 예산</h2>
      <div class="section-content">
        <table>
          <thead>
            <tr>
              <th>비용 항목</th>
              <th>상세 내용</th>
              <th>금액</th>
            </tr>
          </thead>
          <tbody>
            ${budget.map(item => `
              <tr>
                <td>${escapeHtml(item.category)}</td>
                <td>${escapeHtml(item.detail)}</td>
                <td>${escapeHtml(item.amount)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
    ` : ''}

    <!-- 7. 스코어카드 -->
    <div class="section">
      <h2 class="section-title">7. AI 검증 스코어카드</h2>
      <div class="section-content">
        <div class="scorecard-grid">
          <div class="scorecard-item">
            <span class="scorecard-label">문제 정의</span>
            <span class="scorecard-score">${scorecard.problemDefinition.current}/${scorecard.problemDefinition.max}</span>
          </div>
          <div class="scorecard-item">
            <span class="scorecard-label">솔루션</span>
            <span class="scorecard-score">${scorecard.solution.current}/${scorecard.solution.max}</span>
          </div>
          <div class="scorecard-item">
            <span class="scorecard-label">시장 분석</span>
            <span class="scorecard-score">${scorecard.marketAnalysis.current}/${scorecard.marketAnalysis.max}</span>
          </div>
          <div class="scorecard-item">
            <span class="scorecard-label">수익 모델</span>
            <span class="scorecard-score">${scorecard.revenueModel.current}/${scorecard.revenueModel.max}</span>
          </div>
          <div class="scorecard-item">
            <span class="scorecard-label">차별화</span>
            <span class="scorecard-score">${scorecard.differentiation.current}/${scorecard.differentiation.max}</span>
          </div>
          <div class="scorecard-item">
            <span class="scorecard-label">논리 일관성</span>
            <span class="scorecard-score">${scorecard.logicalConsistency.current}/${scorecard.logicalConsistency.max}</span>
          </div>
          <div class="scorecard-item">
            <span class="scorecard-label">실현 가능성</span>
            <span class="scorecard-score">${scorecard.feasibility.current}/${scorecard.feasibility.max}</span>
          </div>
          <div class="scorecard-item">
            <span class="scorecard-label">피드백 반영</span>
            <span class="scorecard-score">${scorecard.feedbackReflection.current}/${scorecard.feedbackReflection.max}</span>
          </div>
        </div>
        <div style="text-align: center; margin-top: 24px; font-size: 14pt;">
          <strong>총점: ${scorecard.totalScore}/100</strong>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

function escapeHtml(text: string): string {
  if (!text) return '';
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, (char) => htmlEscapes[char] || char);
}
