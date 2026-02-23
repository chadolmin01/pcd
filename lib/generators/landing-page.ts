/**
 * 랜딩페이지 HTML 생성기
 * web-builder 디자인 시스템 기반
 *
 * 적용 규칙 (CLAUDE.md):
 * - 모든 값 CSS 변수 사용 (하드코딩 = 버그)
 * - 이모지 금지 → SVG 아이콘
 * - 그라데이션 ≤1곳
 * - Shadow 1종
 * - 8차원 검수 기준 준수
 *
 * 섹션 구조 (generate-content.md):
 * GNB → Hero → Social Proof → Features → How it works → Testimonials → Final CTA → Footer
 */

import { BusinessPlanData } from '@/components/idea-validator/types';

export interface LandingPageSection {
  type: 'gnb' | 'hero' | 'social-proof' | 'features' | 'how-it-works' | 'testimonials' | 'final-cta' | 'footer';
  content: Record<string, unknown>;
}

export interface LandingPageOutput {
  sections: LandingPageSection[];
  html: string;
  contentMd: string;
}

export function generateLandingPage(data: BusinessPlanData): LandingPageOutput {
  const { basicInfo, sectionData, scorecard, validationScore } = data;

  // 콘텐츠 기획서 생성 (generate-content.md 형식)
  const contentMd = generateContentMd(data);

  // HTML 생성
  const html = generateHTML(data);

  const sections: LandingPageSection[] = [
    { type: 'gnb', content: { logo: basicInfo.itemName } },
    { type: 'hero', content: { headline: basicInfo.itemName, sub: basicInfo.oneLiner } },
    { type: 'social-proof', content: { score: validationScore } },
    { type: 'features', content: {} },
    { type: 'how-it-works', content: {} },
    { type: 'testimonials', content: {} },
    { type: 'final-cta', content: {} },
    { type: 'footer', content: {} },
  ];

  return { sections, html, contentMd };
}

function generateContentMd(data: BusinessPlanData): string {
  const { basicInfo, sectionData } = data;

  return `# ${basicInfo.itemName} 랜딩페이지 — 콘텐츠 기획서

## 서비스 정보
- 서비스명: ${basicInfo.itemName}
- 한줄 소개: ${basicInfo.oneLiner}
- 타겟: ${basicInfo.targetCustomer}
- 산업: ${basicInfo.industry}
- 톤앤매너: 프로페셔널
- CTA 목표: 서비스 체험 유도

---

## 1. GNB
- 로고: ${basicInfo.itemName}
- 메뉴: 기능 / 가격 / 문의
- CTA 버튼: "시작하기"

## 2. Hero
- 헤드라인: "${basicInfo.itemName}"
- 서브텍스트: "${basicInfo.oneLiner}"
- Primary CTA: "무료로 시작하기"
- Secondary CTA: "자세히 알아보기"

## 3. Social Proof
- 메인 카피: "AI 검증 점수 ${data.validationScore}점"
- 타겟: ${basicInfo.targetCustomer}

## 4. Features
- Feature 1: 문제 해결 - ${summarize(sectionData.problem.problem_definition, 50)}
- Feature 2: 솔루션 - ${summarize(sectionData.solution.development_plan, 50)}
- Feature 3: 차별화 - ${summarize(sectionData.solution.differentiation, 50)}

## 5. How it works
- Step 1: 문제 인식 - ${summarize(sectionData.problem.market_status, 30)}
- Step 2: 솔루션 적용 - ${summarize(sectionData.solution.development_plan, 30)}
- Step 3: 성장 - ${summarize(sectionData.scaleup.business_model, 30)}

## 6. Testimonials
- 후기 1: "${basicInfo.targetCustomer}로서 이 서비스가 정말 필요했습니다."

## 7. Final CTA
- 헤드라인: "지금 시작하세요"
- Primary CTA: "무료 체험하기"

## 8. Footer
- 로고: ${basicInfo.itemName}
- 저작권: © 2024 ${basicInfo.itemName}. All rights reserved.
`;
}

function generateHTML(data: BusinessPlanData): string {
  const { basicInfo, sectionData, validationScore } = data;

  // 특징 추출
  const features = extractFeatures(sectionData.solution.differentiation, sectionData.solution.development_plan);

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${basicInfo.itemName} — ${basicInfo.oneLiner}</title>
  <meta name="description" content="${basicInfo.oneLiner}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
${generateCSS()}
  </style>
</head>
<body>

  <!-- GNB -->
  <nav class="gnb">
    <div class="container gnb-inner">
      <a href="#" class="gnb-logo">${basicInfo.itemName}</a>
      <div class="gnb-menu">
        <a href="#features" class="gnb-link">기능</a>
        <a href="#how-it-works" class="gnb-link">이용방법</a>
        <a href="#" class="gnb-link">가격</a>
      </div>
      <a href="#" class="btn-primary">시작하기</a>
    </div>
  </nav>

  <!-- HERO -->
  <section class="hero">
    <div class="container">
      <h1 class="hero-headline">${basicInfo.itemName}</h1>
      <p class="hero-sub">${basicInfo.oneLiner}</p>
      <p class="hero-target">${basicInfo.targetCustomer}를 위한 서비스</p>
      <div class="hero-cta">
        <a href="#" class="btn-primary btn-large">무료로 시작하기</a>
        <a href="#features" class="btn-secondary">자세히 알아보기</a>
      </div>
      <div class="hero-visual">
        <div class="hero-visual-inner">Product Screenshot</div>
      </div>
    </div>
  </section>

  <!-- SOCIAL PROOF -->
  <section class="social-proof">
    <div class="container">
      <div class="stats-row">
        <div class="stat-item">
          <div class="stat-number">${validationScore}</div>
          <div class="stat-label">AI 검증 점수</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">${basicInfo.industry}</div>
          <div class="stat-label">산업 분야</div>
        </div>
      </div>
    </div>
  </section>

  <!-- PROBLEM -->
  <section class="problem">
    <div class="container">
      <div class="section-header">
        <h2 class="section-title">해결하려는 문제</h2>
        <p class="section-sub">${summarize(sectionData.problem.problem_definition, 100)}</p>
      </div>
      <div class="problem-detail">
        <p>${sectionData.problem.market_status}</p>
      </div>
    </div>
  </section>

  <!-- FEATURES -->
  <section id="features" class="features">
    <div class="container">
      <div class="section-header">
        <h2 class="section-title">핵심 기능</h2>
        <p class="section-sub">창업에 필요한 핵심 정보를 제공합니다</p>
      </div>
      <div class="features-grid">
${features.map((f, i) => `        <div class="feature-card">
          <div class="feature-icon">
            ${getFeatureIcon(i)}
          </div>
          <h3 class="feature-title">${f.title}</h3>
          <p class="feature-desc">${f.description}</p>
        </div>`).join('\n')}
      </div>
    </div>
  </section>

  <!-- HOW IT WORKS -->
  <section id="how-it-works" class="how-it-works">
    <div class="container">
      <div class="section-header">
        <h2 class="section-title">이렇게 작동합니다</h2>
        <p class="section-sub">3단계로 시작하세요</p>
      </div>
      <div class="steps-grid">
        <div class="step-card">
          <div class="step-number">1</div>
          <h3 class="step-title">문제 인식</h3>
          <p class="step-desc">${summarize(sectionData.problem.market_status, 60)}</p>
        </div>
        <div class="step-card">
          <div class="step-number">2</div>
          <h3 class="step-title">솔루션 적용</h3>
          <p class="step-desc">${summarize(sectionData.solution.development_plan, 60)}</p>
        </div>
        <div class="step-card">
          <div class="step-number">3</div>
          <h3 class="step-title">성장</h3>
          <p class="step-desc">${summarize(sectionData.scaleup.business_model, 60)}</p>
        </div>
      </div>
    </div>
  </section>

  <!-- TESTIMONIALS -->
  <section class="testimonials">
    <div class="container">
      <div class="testimonial-card">
        <p class="testimonial-quote">"${basicInfo.targetCustomer}로서 이런 서비스가 정말 필요했습니다. ${basicInfo.itemName} 덕분에 명확한 방향을 잡을 수 있었습니다."</p>
        <div class="testimonial-author">
          <div class="testimonial-avatar"></div>
          <div>
            <p class="testimonial-name">김민수</p>
            <p class="testimonial-role">${basicInfo.targetCustomer}</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- FINAL CTA -->
  <section class="final-cta">
    <div class="container">
      <h2 class="cta-headline">지금 시작하세요</h2>
      <p class="cta-sub">${basicInfo.oneLiner}</p>
      <div class="cta-buttons">
        <a href="#" class="btn-primary btn-large">무료 체험하기</a>
      </div>
    </div>
  </section>

  <!-- FOOTER -->
  <footer class="footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <p class="footer-logo">${basicInfo.itemName}</p>
          <p class="footer-desc">${basicInfo.oneLiner}</p>
        </div>
        <div class="footer-links">
          <p class="footer-title">Product</p>
          <a href="#" class="footer-link">기능</a>
          <a href="#" class="footer-link">가격</a>
          <a href="#" class="footer-link">FAQ</a>
        </div>
        <div class="footer-links">
          <p class="footer-title">Company</p>
          <a href="#" class="footer-link">소개</a>
          <a href="#" class="footer-link">블로그</a>
          <a href="#" class="footer-link">문의</a>
        </div>
        <div class="footer-links">
          <p class="footer-title">Legal</p>
          <a href="#" class="footer-link">개인정보처리방침</a>
          <a href="#" class="footer-link">이용약관</a>
        </div>
      </div>
      <div class="footer-bottom">
        <p>© 2024 ${basicInfo.itemName}. All rights reserved.</p>
      </div>
    </div>
  </footer>

</body>
</html>`;
}

function generateCSS(): string {
  return `    :root {
      /* Colors - 5색 제한 */
      --color-primary: #5046E5;
      --color-primary-light: #EEF2FF;
      --color-bg: #FFFFFF;
      --color-bg-alt: #F9FAFB;
      --color-text: #111827;
      --color-text-light: #6B7280;
      --color-border: #E5E7EB;

      /* Typography */
      --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      --text-hero: 56px;
      --text-h2: 36px;
      --text-h3: 20px;
      --text-body: 16px;
      --text-small: 14px;

      /* Spacing - 8의 배수 */
      --space-xs: 8px;
      --space-sm: 16px;
      --space-md: 24px;
      --space-lg: 48px;
      --space-xl: 80px;
      --section-gap: 120px;
      --max-width: 1200px;
      --gutter: 24px;

      /* Components */
      --radius: 8px;
      --radius-lg: 12px;
      --shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      --gnb-height: 60px;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: var(--font-sans);
      font-size: var(--text-body);
      color: var(--color-text);
      background: var(--color-bg);
      line-height: 1.6;
    }

    .container {
      max-width: var(--max-width);
      margin: 0 auto;
      padding: 0 var(--gutter);
    }

    /* Buttons */
    .btn-primary {
      display: inline-block;
      background: var(--color-primary);
      color: var(--color-bg);
      padding: var(--space-sm) var(--space-md);
      font-size: var(--text-body);
      font-weight: 600;
      border: none;
      border-radius: var(--radius);
      cursor: pointer;
      text-decoration: none;
      transition: opacity 0.2s;
    }
    .btn-primary:hover { opacity: 0.9; }
    .btn-large { padding: var(--space-sm) 32px; font-size: 18px; }

    .btn-secondary {
      display: inline-block;
      background: transparent;
      color: var(--color-text);
      padding: var(--space-sm) var(--space-md);
      font-size: var(--text-body);
      font-weight: 600;
      border: 1px solid var(--color-border);
      border-radius: var(--radius);
      cursor: pointer;
      text-decoration: none;
      transition: border-color 0.2s;
    }
    .btn-secondary:hover { border-color: var(--color-text); }

    /* GNB */
    .gnb {
      position: sticky;
      top: 0;
      background: var(--color-bg);
      border-bottom: 1px solid var(--color-border);
      height: var(--gnb-height);
      z-index: 100;
    }
    .gnb-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 100%;
    }
    .gnb-logo {
      font-size: var(--text-h3);
      font-weight: 700;
      color: var(--color-text);
      text-decoration: none;
    }
    .gnb-menu { display: flex; gap: var(--space-md); }
    .gnb-link {
      font-size: var(--text-small);
      color: var(--color-text-light);
      text-decoration: none;
      transition: color 0.2s;
    }
    .gnb-link:hover { color: var(--color-text); }

    /* Hero */
    .hero {
      padding: var(--space-xl) 0 var(--section-gap);
      text-align: center;
    }
    .hero-headline {
      font-size: var(--text-hero);
      font-weight: 700;
      line-height: 1.1;
      margin-bottom: var(--space-sm);
    }
    .hero-sub {
      font-size: var(--text-h3);
      color: var(--color-text-light);
      max-width: 600px;
      margin: 0 auto var(--space-sm);
    }
    .hero-target {
      font-size: var(--text-small);
      color: var(--color-text-light);
      margin-bottom: var(--space-lg);
    }
    .hero-cta {
      display: flex;
      gap: var(--space-sm);
      justify-content: center;
    }
    .hero-visual {
      margin-top: var(--space-xl);
    }
    .hero-visual-inner {
      background: var(--color-bg-alt);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      height: 400px;
      max-width: 900px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-text-light);
      font-size: var(--text-small);
    }

    /* Social Proof */
    .social-proof {
      padding: var(--space-lg) 0;
      background: var(--color-bg-alt);
    }
    .stats-row {
      display: flex;
      justify-content: center;
      gap: var(--space-xl);
    }
    .stat-item { text-align: center; }
    .stat-number {
      font-size: 48px;
      font-weight: 700;
      color: var(--color-primary);
    }
    .stat-label {
      font-size: var(--text-small);
      color: var(--color-text-light);
    }

    /* Problem */
    .problem {
      padding: var(--section-gap) 0;
    }
    .section-header {
      text-align: center;
      margin-bottom: var(--space-xl);
    }
    .section-title {
      font-size: var(--text-h2);
      font-weight: 700;
      margin-bottom: var(--space-sm);
    }
    .section-sub {
      font-size: var(--text-body);
      color: var(--color-text-light);
      max-width: 600px;
      margin: 0 auto;
    }
    .problem-detail {
      max-width: 800px;
      margin: 0 auto;
      padding: var(--space-lg);
      background: var(--color-bg-alt);
      border-radius: var(--radius-lg);
      text-align: center;
      color: var(--color-text-light);
    }

    /* Features */
    .features {
      padding: var(--section-gap) 0;
      background: var(--color-bg-alt);
    }
    .features-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--gutter);
    }
    .feature-card {
      background: var(--color-bg);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-lg) var(--space-md);
      text-align: center;
    }
    .feature-icon {
      width: 56px;
      height: 56px;
      background: var(--color-primary-light);
      border-radius: var(--radius);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto var(--space-sm);
    }
    .feature-icon svg {
      width: 28px;
      height: 28px;
      stroke: var(--color-primary);
    }
    .feature-title {
      font-size: var(--text-h3);
      font-weight: 600;
      margin-bottom: var(--space-xs);
    }
    .feature-desc {
      font-size: var(--text-small);
      color: var(--color-text-light);
      line-height: 1.6;
    }

    /* How it works */
    .how-it-works {
      padding: var(--section-gap) 0;
    }
    .steps-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--gutter);
    }
    .step-card {
      background: var(--color-bg);
      border-radius: var(--radius-lg);
      padding: var(--space-lg) var(--space-md);
      text-align: center;
      box-shadow: var(--shadow);
    }
    .step-number {
      width: 48px;
      height: 48px;
      background: var(--color-primary-light);
      color: var(--color-primary);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--text-h3);
      font-weight: 700;
      margin: 0 auto var(--space-sm);
    }
    .step-title {
      font-size: var(--text-h3);
      font-weight: 600;
      margin-bottom: var(--space-xs);
    }
    .step-desc {
      font-size: var(--text-small);
      color: var(--color-text-light);
    }

    /* Testimonials */
    .testimonials {
      padding: var(--section-gap) 0;
      background: var(--color-bg-alt);
    }
    .testimonial-card {
      max-width: 600px;
      margin: 0 auto;
      text-align: center;
      background: var(--color-bg);
      border-radius: var(--radius-lg);
      padding: var(--space-lg);
      box-shadow: var(--shadow);
    }
    .testimonial-quote {
      font-size: var(--text-body);
      color: var(--color-text);
      line-height: 1.7;
      margin-bottom: var(--space-md);
    }
    .testimonial-author {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-sm);
    }
    .testimonial-avatar {
      width: 48px;
      height: 48px;
      background: var(--color-primary-light);
      border-radius: 50%;
    }
    .testimonial-name {
      font-size: var(--text-small);
      font-weight: 600;
    }
    .testimonial-role {
      font-size: var(--text-small);
      color: var(--color-text-light);
    }

    /* Final CTA */
    .final-cta {
      padding: var(--section-gap) 0;
      text-align: center;
    }
    .cta-headline {
      font-size: var(--text-h2);
      font-weight: 700;
      margin-bottom: var(--space-sm);
    }
    .cta-sub {
      font-size: var(--text-body);
      color: var(--color-text-light);
      margin-bottom: var(--space-lg);
    }

    /* Footer */
    .footer {
      padding: var(--space-xl) 0 var(--space-lg);
      border-top: 1px solid var(--color-border);
    }
    .footer-grid {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr;
      gap: var(--space-lg);
      margin-bottom: var(--space-lg);
    }
    .footer-logo {
      font-size: var(--text-h3);
      font-weight: 700;
      margin-bottom: var(--space-xs);
    }
    .footer-desc {
      font-size: var(--text-small);
      color: var(--color-text-light);
    }
    .footer-title {
      font-size: var(--text-small);
      font-weight: 600;
      margin-bottom: var(--space-sm);
    }
    .footer-link {
      display: block;
      font-size: var(--text-small);
      color: var(--color-text-light);
      text-decoration: none;
      margin-bottom: var(--space-xs);
    }
    .footer-link:hover { color: var(--color-primary); }
    .footer-bottom {
      text-align: center;
      padding-top: var(--space-lg);
      border-top: 1px solid var(--color-border);
      font-size: var(--text-small);
      color: var(--color-text-light);
    }

    /* Responsive */
    @media (max-width: 768px) {
      :root {
        --text-hero: 36px;
        --text-h2: 28px;
        --section-gap: 80px;
      }
      .hero-cta { flex-direction: column; align-items: center; }
      .steps-grid, .features-grid { grid-template-columns: 1fr; }
      .stats-row { flex-direction: column; gap: var(--space-lg); }
      .footer-grid { grid-template-columns: 1fr 1fr; }
      .gnb-menu { display: none; }
    }`;
}

// Helper functions
function summarize(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

function extractFeatures(differentiation: string, developmentPlan: string): { title: string; description: string }[] {
  const combined = `${differentiation}. ${developmentPlan}`;
  const parts = combined.split(/[.。]/).filter(p => p.trim().length > 10);

  const features = parts.slice(0, 3).map((part, index) => {
    const trimmed = part.trim();
    const words = trimmed.split(/\s+/);
    return {
      title: words.slice(0, 3).join(' ') || `기능 ${index + 1}`,
      description: trimmed,
    };
  });

  // 최소 3개 보장
  while (features.length < 3) {
    features.push({
      title: `핵심 기능 ${features.length + 1}`,
      description: '더 나은 사용자 경험을 제공합니다.',
    });
  }

  return features;
}

function getFeatureIcon(index: number): string {
  const icons = [
    // Chart icon
    `<svg fill="none" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>`,
    // Users icon
    `<svg fill="none" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>`,
    // Shield icon
    `<svg fill="none" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>`,
  ];
  return icons[index % icons.length];
}
