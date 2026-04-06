"""
Local web app testing script
Captures screenshots and tests basic functionality
"""
from playwright.sync_api import sync_playwright
import os

# Create output directory
os.makedirs('test-results/local', exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1280, 'height': 800})

    print("1. Testing main page load...")
    page.goto('http://localhost:3004/')
    page.wait_for_load_state('networkidle')

    # Wait for boot animation
    page.wait_for_timeout(3000)
    page.screenshot(path='test-results/local/01-main-page.png', full_page=True)
    print("   [OK] Main page loaded")

    # Check for tutorial modal
    print("2. Checking for tutorial modal...")
    skip_btn = page.locator('text=건너뛰기').first
    if skip_btn.count() > 0 and skip_btn.is_visible():
        page.screenshot(path='test-results/local/02-tutorial-modal.png')
        skip_btn.click()
        page.wait_for_timeout(500)
        print("   [OK] Tutorial modal dismissed")

    # Check current screen
    print("3. Capturing current screen...")
    page.screenshot(path='test-results/local/03-after-tutorial.png', full_page=True)

    # Check for registration form
    inputs = page.locator('input')
    if inputs.count() > 0:
        print(f"   Found {inputs.count()} input fields")

        # Fill registration if visible
        name_input = inputs.first
        if name_input.is_visible():
            print("4. Filling registration form...")
            name_input.fill('TestUser')

            if inputs.count() >= 2:
                inputs.nth(1).fill('TestCompany')
            if inputs.count() >= 3:
                inputs.nth(2).fill('local_test@example.com')

            # Check privacy consent
            checkbox = page.locator('text=개인정보').first
            if checkbox.count() > 0:
                checkbox.click()

            page.screenshot(path='test-results/local/04-form-filled.png', full_page=True)
            print("   [OK] Form filled")

    # Final screenshot
    print("5. Final state captured")
    page.screenshot(path='test-results/local/05-final-state.png', full_page=True)

    browser.close()

print("")
print("[DONE] Local testing complete!")
print("Screenshots saved to: test-results/local/")
