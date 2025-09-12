from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Go to login page
    page.goto("http://localhost:3000/index.html")

    # Fill in login form
    page.get_by_placeholder("Username").fill("testuser")
    page.get_by_placeholder("Password").fill("password123")
    page.get_by_role("button", name="Login").click()

    # Wait for navigation to home page
    page.wait_for_url("http://localhost:3000/home.html")

    # Take screenshot
    page.screenshot(path="jules-scratch/verification/verification_redesign.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
