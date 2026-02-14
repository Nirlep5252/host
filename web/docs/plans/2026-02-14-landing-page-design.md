# Landing Page Design: "Minimalist Statement"

**Date**: 2026-02-14
**Target**: Developer audience, no code on the page
**Approach**: Bold typography, generous whitespace, subtle animations
**Primary CTA**: Waitlist-first (access is gated)

## Sections

### 1. Hero (full viewport)

- **Background**: Pure black (`bg-primary`) with large soft magenta glow blur behind heading
- **Heading**: "formality.life" in Instrument Sans display font. Large (text-6xl mobile, text-8xl desktop). The ".life" portion in accent magenta (#D946EF)
- **Tagline**: "Fast, private image hosting for developers." in `text-secondary`, Geist Sans, text-xl
- **CTAs**:
  - Primary: "Join the Waitlist" → `/waitlist` (magenta Button, size="lg")
  - Secondary: "Sign In" → `/login` (ghost Button, size="lg")
- **Layout**: Centered vertically with min-h-screen, heavy top/bottom padding

### 2. Features Grid

6 features in responsive grid (3 cols desktop, 2 cols tablet, 1 col mobile). Each uses `Card` component with `hoverable`:

| Feature | Description |
|---------|-------------|
| Drag & Drop Upload | "Drop your images, get instant links." |
| Custom Domains | "Serve images from your own domain." |
| API & ShareX | "Integrate with your tools via API key." |
| Private by Default | "Your images, your rules." |
| Fast CDN | "Lightning-fast delivery worldwide." |
| Storage Dashboard | "Track usage with real-time stats." |

Each card: simple inline SVG icon (magenta accent), bold title, one-line description. Subtle fadeInUp animation on scroll via Motion.

### 3. Closing CTA

- Background: `bg-secondary` for visual separation
- Heading: "Ready to host?" in display font
- Subtext: "Join the waitlist and get early access." in `text-secondary`
- CTA: "Get Early Access" (primary magenta, large) → `/waitlist`
- Subtle magenta glow behind section

### 4. Footer

- Background: `bg-tertiary`
- Left: "formality.life" branding
- Right: Links (GitHub if applicable)
- Bottom: copyright line
- `text-muted` for all footer text

## Responsive Behavior

- **Mobile (<640px)**: Single column, text-4xl hero, stacked CTAs, full-width cards
- **Tablet (640-1024px)**: 2-column features grid, medium headings
- **Desktop (>1024px)**: 3-column features grid, full-size headings, max-w-6xl centered container

## Animations

- Hero elements: `fadeIn` on mount with slight stagger
- Feature cards: `fadeInUp` with stagger using Motion `whileInView`
- Closing CTA: `fadeIn` on scroll
- Keep all animations subtle and fast (150-300ms)

## Technical Notes

- **File**: `app/page.tsx` (replaces current minimal page)
- **Components used**: `Button`, `Card` from `components/ui/`
- **Motion presets**: from `lib/motion.ts`
- **No new dependencies** needed
- **All styling**: Tailwind + existing CSS variables
