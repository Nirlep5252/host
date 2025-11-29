# Host - Image Hosting Frontend

## Design System

The design system is available at `/design` route for reference.

### Aesthetic
- **Theme**: Dark-first, refined minimal
- **Accent**: Hot Magenta (#D946EF)
- **Typography**: Instrument Sans (display), Geist Sans (body), Geist Mono (code)

### Components
All reusable components are in `components/ui/`:

```tsx
import { Button, Input, Textarea, Badge, Toggle, Card, StatsCard, ImageCard } from "@/components/ui";
```

| Component | Key Props |
|-----------|-----------|
| `Button` | `variant="primary\|secondary\|ghost\|destructive"`, `size="sm\|md\|lg"` |
| `Input` | `label`, + all input attrs |
| `Textarea` | `label`, + all textarea attrs |
| `Badge` | `variant="default\|success\|warning\|error\|accent"` |
| `Toggle` | `checked`, `onChange` (controlled) |
| `Card` | `hoverable` |
| `StatsCard` | `label`, `value`, `subtext` |
| `ImageCard` | `id`, `filename`, `size`, `isPrivate`, `thumbnailUrl`, `onCopy`, `onDelete` |

### CSS Variables
Available via Tailwind classes (e.g., `bg-bg-primary`, `text-accent`):

- Backgrounds: `bg-primary`, `bg-secondary`, `bg-tertiary`, `bg-hover`
- Text: `text-primary`, `text-secondary`, `text-muted`
- Borders: `border-subtle`, `border-default`, `border-focus`
- Accent: `accent`, `accent-hover`, `accent-muted`
- Semantic: `success`, `warning`, `error` (+ `-muted` variants)

### Design Tokens
- Border radius: `--radius-sm` (6px), `--radius-md` (8px), `--radius-lg` (12px)
- Use `font-[family-name:var(--font-display)]` for display headings

## API Integration
- Base URL: `https://formality.life` (production) or env variable
- Auth: `X-API-Key` header with user's API key
