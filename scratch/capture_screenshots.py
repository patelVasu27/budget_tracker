from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        
        # Desktop view
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()
        page.goto('http://localhost:5173')
        # Since there's auth, we'll probably see the landing page first
        page.wait_for_load_state('networkidle')
        page.screenshot(path='scratch/desktop_landing.png')
        
        # Mobile view
        iphone_13 = p.devices['iPhone 13']
        mobile_context = browser.new_context(**iphone_13)
        mobile_page = mobile_context.new_page()
        mobile_page.goto('http://localhost:5173')
        mobile_page.wait_for_load_state('networkidle')
        
        # Close AuthModal if it's blocking
        try:
            close_button = mobile_page.get_by_role("button", name="Close")
            if close_button.is_visible():
                close_button.click()
                mobile_page.wait_for_timeout(500)
        except:
            pass
            
        mobile_page.screenshot(path='scratch/mobile_landing.png')
        
        # Try to click "Continue as Guest" to see the dashboard
        try:
            guest_button = mobile_page.get_by_role("button", name="Continue as Guest")
            if guest_button.is_visible():
                guest_button.click()
                mobile_page.wait_for_load_state('networkidle')
                # Wait for dashboard to load
                mobile_page.wait_for_selector('header', timeout=5000)
                mobile_page.screenshot(path='scratch/mobile_dashboard.png', full_page=True)
                
                # Open Add Expense Modal
                add_button = mobile_page.get_by_role("button", name="Add Expense")
                if add_button.is_visible():
                    add_button.click()
                    mobile_page.wait_for_selector('[role="dialog"]')
                    mobile_page.screenshot(path='scratch/mobile_add_expense.png')
        except Exception as e:
            print(f"Error navigating to dashboard: {e}")

        browser.close()

if __name__ == "__main__":
    run()
