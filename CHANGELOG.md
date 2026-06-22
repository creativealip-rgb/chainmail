# Changelog

All notable changes to Chainmail are documented here.

## 2026-06-22 — Auth Page Dark Glassmorphism Redesign

- Dark background (#0a0a1a) with 3 animated gradient blobs (blue, violet, cyan)
- Glass card: `rgba(255,255,255,0.05)` bg, `backdrop-filter: blur(24px)`, inset glow border
- Top accent: blue → violet gradient glow line
- Inputs: 48px height, 14px radius, dark translucent, blue focus glow ring
- Button: 50px height, blue→indigo gradient, outer glow, shine sweep effect
- Typography: white titles, muted gray labels, bright blue links
- Error/warning: dark translucent backgrounds with colored text
- `blobAccent` animated element for extra depth
- `prefers-reduced-motion` support
- All auth pages (SignIn, SignUp, RecoverySetup) use consistent dark theme

## 2026-06-22 — Auth Page Premium Redesign (v1 — light glassmorphism)

- Full-viewport gradient background with radial orbs + subtle grid pattern
- Glassmorphism card: `backdrop-filter: blur(20px) saturate(1.4)`, 78% white bg
- Top accent stripe: blue → indigo → cyan gradient
- Card slide-in animation on mount (`cardSlideIn 0.5s`)
- Floating orb animation in background (`orbFloat 20s`)
- Inputs: 46px height, 12px radius, hover state, focus glow ring
- Button: 48px height, gradient bg, shine sweep on hover, lift effect
- Error messages: shake animation on display
- All `!important` removed (was 15+ declarations)
- `authBg` wrapper added to SignIn, SignUp, RecoverySetup pages

## 2026-06-22 — Inbox UI Overhaul

### Sidebar (477 → 300 lines)
- Width: 228px → 260px for better readability
- Compose button: 44px height, 14px font, blue gradient, left-aligned with icon
- Nav items: 34px height, 13px font, rounded-lg corners
- Section headers: 9px uppercase, tighter spacing
- Consolidated 3 duplicate compose declarations into 1
- Replaced hardcoded colors (`#fbfcfd`, `#eef4ff`, `#94a3b8`) with CSS tokens

### TopBar (356 → 180 lines)
- Grid layout from the start (removed flex→grid switch)
- Removed all 43 `!important` declarations
- Search bar: 34px height, 16px font (prevents iOS auto-zoom), pill radius
- Consolidated 3 duplicate `@media (max-width: 760px)` blocks into 1
- Replaced hardcoded `rgba(255,255,255,.96)` background with token-based mix

### Message List (300 → 260 lines)
- Row padding: `9px 14px` → `10px 16px` for better touch targets
- Font weights: 620 → 600, 760 → 700 (standard CSS weights)
- Consolidated duplicate `@media (max-width: 760px)` and `420px` blocks
- Removed all `!important` from responsive overrides
- Status chip colors now use `var(--color-neutral-500)` fallback

### Message View (1551 → 380 lines, -75%)
- **Eliminated 667 `!important` declarations** — zero remaining
- Collapsed 13 incremental "rN" patch blocks into single clean definitions
- Receipt card: 760px max-width, 12px radius, subtle border + shadow
- Receipt, body, and subject all aligned at same left position
- Body: 15px font, 1.72 line-height, 760px max-width
- Single responsive block per breakpoint (900px, 760px, 420px)
- Hidden legacy receipt sub-elements (receiptLinePrimary, receiptType, etc.)

### Cross-cutting
- Total CSS reduction: 2664 → 1120 lines (-58%)
- Zero `!important` across all 4 inbox CSS files
- All font weights standardized (600, 700, 800)
- Responsive breakpoints consolidated (no duplicate media queries)

## 2026-06-22 — Accessibility & Responsive Fixes

- Search input: 12px → 16px (fixes iOS auto-zoom)
- Login input: 15px → 16px (fixes iOS auto-zoom)
- LabelPicker: added `aria-label` to all 15 icon buttons
- Hamburger nav: added mobile drawer for screens ≤720px
- Toolbar buttons: 30px → 40px touch targets
- Receipt padding: 9px 12px → 14px 16px
- Receipt margin-bottom: 10px → 24px
- BodyShell padding-top: 0px → 16px
- Receipt + body aligned with subject left edge
