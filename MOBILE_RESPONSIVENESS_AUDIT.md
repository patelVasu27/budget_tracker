# Mobile Responsiveness Audit - SimpleBudget

## Root Causes Identified

### 1. **Fixed Width Containers & Grid Layout Issues**
- Dashboard uses `grid md:grid-cols-[320px_1fr]` with fixed 320px sidebar
- `min-w-0` missing on flex children causing overflow
- `grid md:grid-cols-[320px_1fr]` creates horizontal scroll on < 320px screens

### 2. **Fixed Pixel Heights/Widths**
- Landing page phone mockup: `min-h-[480px] max-h-[480px]` fixed heights
- Landing page watermark: `w-[60vw] max-w-[500px]` fixed dimensions
- Modals: `max-w-md` (448px), `max-w-lg` (512px) exceed 320px viewport
- Category chips: fixed `min-h-[56px] min-w-[56px]`

### 3. **Missing Responsive Breakpoints**
- Many components lack `sm:`, `md:` responsive prefixes
- Fixed `p-6 lg:p-12` without `sm:` or `md:` responsive scaling
- Fixed `max-w-md` (448px) modals exceed 320px viewport

### 4. **Text Overflow & Wrapping**
- Transaction notes, category names lack `truncate` or `overflow-wrap`
- Headlines missing `text-wrap: balance`
- No `overflow-wrap: anywhere` for long tokens

### 5. **Fixed Modal Dimensions**
- Modals: `max-w-md` (448px), `max-w-lg` (512px) exceed 320px viewport
- `max-h-[88vh]`/`max-h-[85vh]` without mobile scroll handling
- Missing `max-w-[90vw]` responsive constraints

### 6. **Touch Target Issues**
- Some interactive elements lack `min-h-[44px] min-w-[44px]`
- Icon buttons without proper touch targets

### 6. **Grid/Flex Misconfiguration**
- Missing `min-w-0` on flex children
- Grid layout `grid md:grid-cols-[320px_1fr]` not mobile-friendly
- Missing `overflow-x-hidden` on containers

### 7. **Missing Viewport Meta**
- Index.html has basic viewport but missing `viewport-fit=cover`

### 8. **Modal Issues**
- `max-w-md` (448px), `max-w-lg` (512px) exceed 320px
- `max-h-[88vh]`/`max-h-[85vh]` without proper scroll
- Missing `max-w-[90vw]` responsive constraints

### 9. **Auth Modal Issues**
- Fixed `max-w-md` width
- Missing responsive padding on mobile

### 10. **Category Manager Modal**
- `max-w-lg` (512px) width
- `max-h-[85vh]` without proper mobile handling

### 11. **Category Chips**
- Fixed `min-h-[56px] min-w-[56px]` may be too large on small screens

### 12. **Landing Page Issues**
- Phone mockup `min-h-[480px] max-h-[480px]` fixed heights
- Watermark `w-[60vw] max-w-[500px]` fixed dimensions
- Hero content not properly responsive

---

## Fix Plan - File by File

### 1. `index.html` - Viewport Meta
- Add `viewport-fit=cover` for safe area support

### 2. `src/index.css` - Global Mobile Styles
- Add `overflow-x-hidden` to prevent horizontal scroll
- Add responsive text utilities
- Add safe area padding utilities
- Add `text-wrap: balance` for headlines

### 3. `tailwind.config.js` - Responsive Breakpoints
- Add custom breakpoints for 320px, 375px, 414px
- Add safe area utilities

### 4. `src/App.tsx` - Landing Page & Layout
- Fix landing page responsive layout
- Make phone mockup responsive
- Add responsive watermark
- Fix grid layout for mobile

### 5. `src/features/Dashboard.tsx` - Main Dashboard
- Fix grid layout: `grid md:grid-cols-[320px_1fr]` → responsive
- Add `min-w-0` to flex children
- Make header responsive
- Fix balance cards responsive
- Fix transaction list responsive

### 6. `src/components/TransactionList.tsx`
- Add `truncate` to transaction notes
- Make transaction rows responsive
- Fix sticky date headers on mobile

### 6. `src/components/BalanceCard.tsx`
- Make amounts responsive with `text-wrap: balance`
- Use `clamp()` for font sizes

### 7. `src/components/AddExpenseModal.tsx`
- Make modal responsive: `max-w-[90vw] max-w-md`
- Fix category list scrolling on mobile
- Add responsive padding
- Fix category chip touch targets

### 8. `src/components/ExportModal.tsx`
- Responsive modal width
- Fix date inputs on mobile

### 8. `src/components/AuthModal.tsx`
- Responsive modal width
- Responsive padding

### 9. `src/components/CategoryManager.tsx`
- Responsive modal width/height
- Fix category list on mobile
- Responsive chip grid

### 10. `src/components/VoiceMicButton.tsx`
- Fix tooltip positioning on mobile
- Ensure 44x44 touch targets

### 11. `src/components/CategoryIcon.tsx`
- Responsive size classes

### 12. `src/components/CategoryManager.tsx`
- Responsive modal dimensions
- Fix category chips for mobile

### 13. `src/components/CategoryManager.tsx` (Category chips)
- Responsive chip sizing
- Better touch targets

### 14. `src/components/Tooltip.tsx`
- Mobile-aware tooltip positioning

### 15. `index.html`
- Add `viewport-fit=cover`
- Add theme-color meta tag

---

## Device/Viewport Test Checklist

### Mobile (Portrait)
- [ ] 320px (iPhone SE, small Android)
- [ ] 375px (iPhone 12/13/14/15, Pixel)
- [ ] 390px (iPhone 12/13/14/15 Pro)
- [ ] 393px (Pixel 7/8)
- [ ] 414px (iPhone 11/12/13/14/15 Pro Max, Plus models)
- [ ] 428px (iPhone 14/15 Pro Max)

### Mobile (Landscape)
- [ ] 320px height
- [ ] 375px height
- [ ] 414px height
- [ ] 844px height (iPhone Plus/Pro Max)

### Tablet
- [ ] 768px (iPad mini, iPad)
- [ ] 820px (iPad Air/Pro 11")
- [ ] 1024px (iPad Pro 12.9")

### Desktop
- [ ] 1024px
- [ ] 1440px
- [ ] 1920px

### Browsers
- [ ] Mobile Safari (iOS 16+)
- [ ] Chrome for Android (110+)
- [ ] Samsung Internet (18+)
- [ ] Firefox for Android
- [ ] Edge Mobile

### Edge Cases
- [ ] Split screen / multi-window (iPad, Android)
- [ ] Dynamic Island / notch (iPhone 14+ Pro)
- [ ] Foldables (Z Fold, Pixel Fold)
- [ ] Reduced motion preference
- [ ] High contrast mode
- [ ] Large text / accessibility text sizes
- [ ] RTL languages (if applicable)
- [ ] Zoom 200%+

---

## Fix Implementation Order

1. **Critical (Blockers)**: index.html viewport, index.css global mobile styles, Dashboard grid layout
2. **High Priority**: Modals (AddExpenseModal, AuthModal, CategoryManager, ExportModal, AuthModal), Dashboard layout
3. **Medium Priority**: Landing page (App.tsx), modals responsive width, TransactionList, BalanceCard
4. **Low Priority**: CategoryIcon, VoiceMicButton tooltip, CategoryManager chips
5. **Polish**: Touch targets, spacing, text wrapping, orientation support