/**
 * Automated Screenshot Capture Script
 *
 * Usage: npm run capture
 *
 * 모든 주요 화면을 자동으로 캡처하여 docs/screens/ 폴더에 저장합니다.
 * 발표자료, 정부지원 서류, 포트폴리오 등에 활용할 수 있습니다.
 */

import { chromium, Browser, Page } from 'playwright'
import * as fs from 'fs'
import * as path from 'path'

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3000'
const OUTPUT_DIR = path.join(process.cwd(), 'docs', 'screens')

// Screenshot configuration
interface ScreenConfig {
  name: string
  filename: string
  url: string
  waitFor?: string  // CSS selector to wait for
  action?: (page: Page) => Promise<void>
  viewport?: { width: number; height: number }
  fullPage?: boolean
  delay?: number  // Additional delay in ms
}

const screens: ScreenConfig[] = [
  // ===== Main Screens (from /dev for consistency) =====
  {
    name: 'Onboarding Screen',
    filename: '01-onboarding',
    url: '/dev',
    waitFor: '[data-testid="onboarding-screen"]',
    action: async (page) => {
      // Scroll to onboarding section and capture just that
      await page.evaluate(() => {
        const element = document.querySelector('[data-testid="onboarding-screen"]')
        element?.scrollIntoView({ behavior: 'instant', block: 'start' })
      })
      await page.waitForTimeout(500)
    },
    viewport: { width: 1200, height: 700 },
    fullPage: false,
  },

  // ===== Dev Showcase =====
  {
    name: 'Component Showcase',
    filename: '02-dev-showcase',
    url: '/dev',
    waitFor: 'main',
    fullPage: true,
  },

  // ===== Individual Components (from /dev) =====
  {
    name: 'Workflow Stepper - All States',
    filename: '03-workflow-stepper',
    url: '/dev',
    waitFor: '[data-testid="workflow-stepper"]',
    action: async (page) => {
      // Scroll to workflow stepper section
      await page.evaluate(() => {
        const element = document.querySelector('[data-testid="workflow-stepper"]')
        element?.scrollIntoView({ behavior: 'instant', block: 'start' })
      })
      await page.waitForTimeout(300)
    },
    viewport: { width: 1200, height: 500 },
    fullPage: false,
  },
  {
    name: 'Program Cards Grid',
    filename: '04-program-cards',
    url: '/dev',
    waitFor: '[data-testid="program-cards-grid"]',
    action: async (page) => {
      // Scroll to program cards section
      await page.evaluate(() => {
        const element = document.querySelector('[data-testid="program-cards-grid"]')
        element?.scrollIntoView({ behavior: 'instant', block: 'start' })
      })
      await page.waitForTimeout(500)
    },
    viewport: { width: 1200, height: 800 },
    fullPage: false,
  },
  {
    name: 'Program Selector Modal',
    filename: '05-program-modal',
    url: '/dev',
    waitFor: '[data-testid="program-selector-modal"]',
    action: async (page) => {
      // Scroll to modal section first
      await page.evaluate(() => {
        const element = document.querySelector('[data-testid="program-selector-modal"]')
        element?.scrollIntoView({ behavior: 'instant', block: 'center' })
      })
      await page.waitForTimeout(300)

      // Click the modal open button with force to bypass any intercepting elements
      const button = page.locator('[data-testid="open-program-modal-btn"]')
      await button.click({ force: true })
      await page.waitForTimeout(1000)  // Wait for modal animation
    },
    viewport: { width: 1400, height: 900 },
    fullPage: false,
  },
  {
    name: 'Selection Screen with Workflow Banner',
    filename: '06-selection-screen',
    url: '/dev',
    waitFor: '[data-testid="selection-screen"]',
    action: async (page) => {
      // Scroll to selection screen section
      await page.evaluate(() => {
        const element = document.querySelector('[data-testid="selection-screen"]')
        element?.scrollIntoView({ behavior: 'instant', block: 'start' })
      })
      await page.waitForTimeout(500)
    },
    viewport: { width: 1200, height: 900 },
    fullPage: false,
  },

  // ===== Mobile Views =====
  {
    name: 'Mobile - Onboarding',
    filename: '07-mobile-onboarding',
    url: '/dev',
    waitFor: '[data-testid="onboarding-screen"]',
    action: async (page) => {
      await page.evaluate(() => {
        const element = document.querySelector('[data-testid="onboarding-screen"]')
        element?.scrollIntoView({ behavior: 'instant', block: 'start' })
      })
    },
    viewport: { width: 390, height: 844 },  // iPhone 14
    fullPage: false,
  },
  {
    name: 'Mobile - Dev Showcase',
    filename: '08-mobile-dev',
    url: '/dev',
    waitFor: 'main',
    viewport: { width: 390, height: 844 },
    fullPage: true,
  },
]

async function captureScreenshots() {
  console.log('🎬 Starting screenshot capture...\n')

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
    console.log(`📁 Created output directory: ${OUTPUT_DIR}\n`)
  }

  const browser: Browser = await chromium.launch({
    headless: true,
  })

  const results: { name: string; path: string; success: boolean; error?: string }[] = []

  for (const screen of screens) {
    const viewport = screen.viewport || { width: 1440, height: 900 }
    const context = await browser.newContext({
      viewport,
      deviceScaleFactor: 2,  // Retina quality
    })
    const page = await context.newPage()

    try {
      console.log(`📸 Capturing: ${screen.name}`)

      // Navigate to URL
      await page.goto(`${BASE_URL}${screen.url}`, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      })
      // Additional wait for hydration
      await page.waitForTimeout(2000)

      // Wait for specific element if specified
      if (screen.waitFor) {
        await page.waitForSelector(screen.waitFor, { timeout: 10000 })
      }

      // Execute custom action if specified
      if (screen.action) {
        await screen.action(page)
      }

      // Additional delay if specified
      if (screen.delay) {
        await page.waitForTimeout(screen.delay)
      }

      // Capture screenshot
      const filename = `${screen.filename}.png`
      const filepath = path.join(OUTPUT_DIR, filename)

      await page.screenshot({
        path: filepath,
        fullPage: screen.fullPage ?? false,
      })

      results.push({
        name: screen.name,
        path: filepath,
        success: true,
      })
      console.log(`   ✅ Saved: ${filename}`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      results.push({
        name: screen.name,
        path: '',
        success: false,
        error: errorMessage,
      })
      console.log(`   ❌ Failed: ${errorMessage}`)
    }

    await context.close()
  }

  await browser.close()

  // Summary
  console.log('\n' + '='.repeat(50))
  console.log('📊 Capture Summary')
  console.log('='.repeat(50))

  const successful = results.filter(r => r.success)
  const failed = results.filter(r => !r.success)

  console.log(`\n✅ Successful: ${successful.length}`)
  successful.forEach(r => console.log(`   - ${r.name}`))

  if (failed.length > 0) {
    console.log(`\n❌ Failed: ${failed.length}`)
    failed.forEach(r => console.log(`   - ${r.name}: ${r.error}`))
  }

  console.log(`\n📁 Output directory: ${OUTPUT_DIR}`)
  console.log('\n🎉 Done!')

  // Generate index HTML for easy viewing
  await generateIndexHtml(successful)

  return results
}

async function generateIndexHtml(screenshots: { name: string; path: string }[]) {
  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Screen Captures - Draft PRD</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; padding: 2rem; }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    .meta { color: #666; font-size: 0.875rem; margin-bottom: 2rem; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 1.5rem; }
    .card { background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .card img { width: 100%; height: auto; display: block; border-bottom: 1px solid #eee; }
    .card .info { padding: 1rem; }
    .card h3 { font-size: 0.875rem; font-weight: 600; margin-bottom: 0.25rem; }
    .card p { font-size: 0.75rem; color: #666; font-family: monospace; }
  </style>
</head>
<body>
  <h1>Screen Captures</h1>
  <p class="meta">Generated: ${new Date().toLocaleString('ko-KR')} • ${screenshots.length} screens</p>
  <div class="grid">
    ${screenshots.map(s => `
    <div class="card">
      <a href="${path.basename(s.path)}" target="_blank">
        <img src="${path.basename(s.path)}" alt="${s.name}" loading="lazy" />
      </a>
      <div class="info">
        <h3>${s.name}</h3>
        <p>${path.basename(s.path)}</p>
      </div>
    </div>
    `).join('')}
  </div>
</body>
</html>`

  const indexPath = path.join(OUTPUT_DIR, 'index.html')
  fs.writeFileSync(indexPath, html)
  console.log(`📄 Generated index: ${indexPath}`)
}

// Run
captureScreenshots().catch(console.error)
