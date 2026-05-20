from playwright.sync_api import sync_playwright

def inspect():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        iphone_13 = p.devices['iPhone 13']
        context = browser.new_context(**iphone_13)
        page = context.new_page()
        page.goto('http://localhost:5173')
        page.wait_for_load_state('networkidle')
        
        # Close AuthModal
        try:
            page.get_by_role("button", name="Close").click()
            page.wait_for_timeout(500)
        except:
            pass
            
        # Click Continue as Guest
        page.get_by_role("button", name="Continue as Guest").click()
        page.wait_for_load_state('networkidle')
        page.wait_for_selector('header')
        
        # Get bounding boxes for key elements
        header = page.locator('header').bounding_box()
        main = page.locator('main').bounding_box()
        aside = page.locator('aside').bounding_box()
        section = page.locator('section').bounding_box()
        balance_cards = page.locator('.card').all()
        
        print(f"Header: {header}")
        print(f"Main: {main}")
        print(f"Aside (Balance): {aside}")
        print(f"Section (Transactions): {section}")
        
        for i, card in enumerate(balance_cards):
            print(f"Card {i} bounding box: {card.bounding_box()}")
            # Check if text is hidden
            text = card.inner_text()
            print(f"Card {i} text: {text.replace('\n', ' ')}")

        # Check Transaction List items
        tx_items = page.locator('[role="listitem"]').all()
        print(f"Transaction items count: {len(tx_items)}")
        if tx_items:
            item = tx_items[0]
            print(f"Transaction item 0 bounding box: {item.bounding_box()}")
            # Check if edit/delete buttons are visible
            edit_btn = item.locator('button[aria-label^="Edit"]')
            delete_btn = item.locator('button[aria-label^="Delete"]')
            print(f"Edit button visible: {edit_btn.is_visible()}")
            print(f"Delete button visible: {delete_btn.is_visible()}")

        browser.close()

if __name__ == "__main__":
    inspect()
