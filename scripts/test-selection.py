"""Test SelectionScreen after login"""
from playwright.sync_api import sync_playwright
import os

os.makedirs('test-results/local', exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1280, 'height': 800})

    page.goto('http://localhost:3009/')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(3000)

    # Skip tutorial
    skip_btn = page.locator('text=건너뛰기').first
    if skip_btn.count() > 0 and skip_btn.is_visible():
        skip_btn.click()
        page.wait_for_timeout(500)

    # Fill form and submit
    inputs = page.locator('input')
    if inputs.count() > 0:
        inputs.first.fill('TestUser')
        if inputs.count() >= 2:
            inputs.nth(1).fill('TestCo')
        if inputs.count() >= 3:
            inputs.nth(2).fill('test@example.com')

        checkbox = page.locator('text=개인정보').first
        if checkbox.count() > 0:
            checkbox.click()

        submit = page.locator('button:has-text("시작하기")').first
        if submit.count() > 0:
            submit.click()
            page.wait_for_timeout(3000)

    # Capture goal selection screen (new Step 0)
    page.screenshot(path='test-results/local/goal-selection.png', full_page=True)
    print("[OK] Goal selection screen captured")

    # Click quick validation to see persona selection
    quick_btn = page.locator('text=빠른 아이디어 검증').first
    if quick_btn.count() > 0 and quick_btn.is_visible():
        quick_btn.click()
        page.wait_for_timeout(2000)
        page.screenshot(path='test-results/local/quick-persona-selection.png', full_page=True)
        print("[OK] Quick persona selection captured")
    else:
        print("[WARN] Quick validation button not found")
        page.screenshot(path='test-results/local/debug-state.png', full_page=True)

    browser.close()
    print("[DONE]")
