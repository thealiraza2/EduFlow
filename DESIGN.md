# EduFlow — Design System (DESIGN.md)

> Single source of truth for every redesign phase. If code and this file disagree, this file wins; change this file first, then the code.
> Status: **Phase 0 — proposed, awaiting owner approval.** Nothing in `src/` has been changed yet.

---

## 1. North star

**"A well-kept school register."** Calm chalk-paper surfaces, greenboard ink, every number in its column.
The product is used by Pakistani academy owners, teachers and parents to keep records they trust (attendance, fees, marks). The UI should feel like the best-run office in a good private school: orderly, quiet, confident — never playful, never flashy.

### Tone (5 scales)

| Scale | Value | Why |
| --- | --- | --- |
| Energy | Quiet | Owners and parents check money and attendance; calm reads as trustworthy. |
| Finish | Refined | Tight alignment to a 4px grid, max 3 shadow levels, 2 hue families. |
| Density | Marketing: airy · Dashboards: medium-dense | Marketing persuades; dashboards are tools used daily (tables first). |
| Weight | Medium | Serif headlines carry authority; UI text stays regular/medium. |
| Seriousness | Formal-warm | Real photos of Pakistani students bring warmth; layout and type stay formal. |

### What we deliberately drop
- The old navy `#0F2040` + yellow `#F5B800` palette (450+ hard-coded uses — all to be replaced by tokens).
- Dark "midnight SaaS" dashboards, glow, gradient blobs, glassmorphism.
- Pill-shaped buttons everywhere, emoji as icons, fake testimonials or invented metrics.
- Left/right "headline + button | screenshot" hero.

---

## 2. Colour

Colour comes from the product's world: the **greenboard** found in Pakistani classrooms (primary), the **cream walls and chalk-paper** of registers (canvas), and the **maroon of school-uniform ties** visible in our photography (accent, marketing only).

### 2.1 Core tokens (light)

| Token | Hex | Use |
| --- | --- | --- |
| `--canvas` | `#F7F5F0` | Page background (chalk paper) |
| `--surface` | `#FFFFFF` | Cards, tables, modals, inputs |
| `--surface-sunken` | `#EFECE5` | Table header row, inset areas, skeletons |
| `--ink` | `#16211E` | Primary text, headings |
| `--ink-2` | `#4A5652` | Secondary text, table body meta |
| `--ink-3` | `#66716D` | Tertiary text, placeholders, captions (≥4.5:1 on canvas) |
| `--line` | `#E2DED5` | Hairlines, table row dividers |
| `--line-strong` | `#CFCAC0` | Input borders, card borders when needed |
| `--primary` | `#0F4F45` | Greenboard: primary buttons, links, active nav, focus ring |
| `--primary-hover` | `#0B3F37` | Primary hover |
| `--primary-pressed` | `#082F29` | Primary pressed |
| `--primary-tint` | `#E3EFEC` | Selected rows, active nav background, info chips |
| `--primary-tint-strong` | `#C7DFD9` | Selected + hover, progress track |
| `--on-primary` | `#FFFFFF` | Text/icons on primary |
| `--accent` | `#8E2C3A` | Uniform maroon — **marketing only**: eyebrow text, underline marks, one highlighted word. ≤10% of any screen. Never used for status. |
| `--accent-tint` | `#F6E7E9` | Accent background chips on marketing pages |
| `--sidebar` | `#0F2A25` | Dashboard sidebar (the greenboard itself) |
| `--sidebar-ink` | `#E8EFEC` | Sidebar text (chalk white) |
| `--sidebar-ink-2` | `#9DB3AC` | Sidebar secondary text, section labels |
| `--sidebar-active` | `#1A3E37` | Sidebar active item background |
| `--disabled-bg` | `#ECE9E2` | Disabled controls |
| `--disabled-ink` | `#9AA29F` | Disabled text |

### 2.2 Status tokens (dashboards)

Status is never shown by colour alone — always a text label and/or icon.

| Status | Text/Icon | Background | Used for |
| --- | --- | --- | --- |
| Success | `#1E7A4C` | `#E5F3EB` | Paid, Present, Published, Active |
| Warning | `#A65F00` | `#FBF0DC` | Partial, Late, Draft, Trial ending |
| Danger | `#B3261E` | `#FBE9E7` | Unpaid/overdue, Absent, Suspended, errors |
| Info | `#24578F` | `#E6EEF7` | Leave, notices, neutral system messages |

Attendance always pairs colour with a letter: **P** Present · **A** Absent · **L** Leave · **Lt** Late.

### 2.3 Data-viz order
`#0F4F45` (primary) → `#5E8F86` → `#A65F00` → `#24578F` → `#8E2C3A` → `#9AA29F`. Max 4 series per chart; label lines directly where possible.

---

## 3. Typography

| Role | Family | Weight | Notes |
| --- | --- | --- | --- |
| Display / page titles | **Source Serif 4** (Google Fonts, variable, optical size) | 600 | Marketing headlines; dashboard page `h1` only. Gives the "school register / prospectus" authority. |
| UI + body | **IBM Plex Sans** (Google Fonts) | 400 / 500 / 600 | Everything else. Institutional, very legible at 13–16px. |
| Numbers | IBM Plex Sans with `font-variant-numeric: tabular-nums` | 500 / 600 | All money (PKR), counts, %, dates in tables and KPIs. |
| IDs / codes | **IBM Plex Mono** | 500 | Admission no. (`EF-0042`), challan no., transaction IDs only. |

Load with `next/font/google`: `Source_Serif_4`, `IBM_Plex_Sans` (weights 400/500/600), `IBM_Plex_Mono` (500). Replaces Inter + Fraunces.

### 3.1 Type scale

| Token | Size / line-height | Family · weight | Where |
| --- | --- | --- | --- |
| `display-xl` | 64 / 1.05 (mobile 40 / 1.1) | Serif 600, tracking -0.02em | Home hero headline |
| `display-l` | 48 / 1.1 (mobile 34 / 1.15) | Serif 600 | Marketing section titles |
| `display-m` | 36 / 1.15 (mobile 28 / 1.2) | Serif 600 | Pricing, About headings |
| `h1` | 28 / 1.25 (mobile 24) | Serif 600 | Dashboard page titles |
| `h2` | 22 / 1.3 | Sans 600 | Card / section titles |
| `h3` | 18 / 1.4 | Sans 600 | Sub-sections, modal titles |
| `body-l` | 18 / 1.65 | Sans 400 | Marketing paragraphs (max 68ch) |
| `body` | 15 / 1.6 (marketing 16) | Sans 400 | Dashboard body, forms |
| `small` | 13 / 1.5 | Sans 400/500 | Table meta, helper text, timestamps |
| `label` | 12 / 1.4 | Sans 600, uppercase, +0.06em | Eyebrows, table headers — sparingly |
| `data-xl` | 32 / 1.1 | Sans 600 tabular | KPI numbers |
| `data` | 15 / 1.4 | Sans 500 tabular | Table numbers, right-aligned |

Rules: no text below 12px; body line-height 1.6+; multi-line headings 1.1–1.25 and checked at 360px for widows; numbers + units never wrap (`PKR 4,500`, `92%`).

---

## 4. Spacing, layout, radii, shadows

### 4.1 Spacing (4px base)
`4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80 · 112`
- Inside a group: 8–12. Between groups: 24–32. Between marketing sections: 80–112 (mobile 64).
- Group with space first, then type weight, then background; lines and borders last.

### 4.2 Layout
- **Marketing:** content max-width 1200px; gutters 24px desktop / 16px mobile; 12-column grid.
- **Dashboards:** sidebar 248px fixed ≥1024px, becomes a slide-in drawer below; top bar 56px single row (page title · scope/filters · primary action); content max-width 1280px. The first row of real content (KPIs or the main table) must be visible above the fold — no hero banners or explanatory paragraphs in tools.
- **Auth pages (login, signup, change password):** form column 440px + photo panel (hidden < 900px).

### 4.3 Radii
| Token | Value | Use |
| --- | --- | --- |
| `radius-xs` | 4px | Badges inside tables, checkboxes |
| `radius-sm` | 6px | Status chips, tags |
| `radius-md` | 8px | Buttons, inputs, selects, nav items |
| `radius-lg` | 12px | Cards, modals, popovers, tables |
| `radius-xl` | 20px | Marketing photo frames |
| `radius-full` | 9999px | Avatars only |

### 4.4 Shadows (max 3 levels)
| Token | Value | Use |
| --- | --- | --- |
| `shadow-1` | `0 1px 2px rgba(22,33,30,.06)` | Cards on canvas, inputs |
| `shadow-2` | `0 4px 12px -2px rgba(22,33,30,.08), 0 2px 4px -2px rgba(22,33,30,.05)` | Hovered clickable cards, sticky top bar |
| `shadow-3` | `0 16px 40px -8px rgba(22,33,30,.18)` | Modals, popovers, drawers |

---

## 5. Controls grammar

One sentence: **8px corners, 1px hairline borders, greenboard fill for the single primary action, press sinks to 98%.**

| Control | Spec |
| --- | --- |
| Button height | 40px default · 36px compact (tables/toolbars) · 44px primary on mobile |
| Primary button | `--primary` bg, white 15px/500 text, radius 8; hover `--primary-hover`; pressed `--primary-pressed` + scale .98 |
| Secondary button | `--surface` bg, 1px `--line-strong`, `--ink` text; hover bg `--surface-sunken` |
| Ghost / link | No border, `--primary` text, underline on hover |
| Destructive | Danger text on white with danger border; solid danger only inside a confirm dialog |
| Inputs | 40px, radius 8, 1px `--line-strong`, 16px font on mobile (prevents zoom); focus: 2px `--primary` ring at 2px offset |
| Focus ring | `0 0 0 2px var(--canvas), 0 0 0 4px var(--primary)` on every interactive element |
| Selected (nav, rows, tabs) | `--primary-tint` background + 3px left bar `--primary` (nav) or bottom bar (tabs) |
| Badges / chips | radius 6, status bg + status text, 12px/600, always a word |
| Tables | Header row `--surface-sunken`, `label` style; rows 48px (compact 40px); hairline `--line` between rows only, no vertical lines; numbers right-aligned tabular |
| Cards | `--surface`, radius 12, `shadow-1`, no border unless on white; never nest bordered cards |
| Empty states | One line of what's missing + the action that fixes it ("No students yet — Admit first student") |

**Icons:** keep the installed `lucide-react` (no new library). 18px in UI, 16px in tables, `strokeWidth={1.75}`; one style only, no emoji, icon + visible label for anything unfamiliar.

---

## 6. Imagery

Real photographs of **Pakistani students in well-run private-school settings** (crisp uniforms, clean classrooms, labs). Free licences only; no photos of named schools, no school logos, no implied affiliation with any real school network.

| # | Photo | Photographer · licence | Use |
| --- | --- | --- | --- |
| 1 | Boy laughing at desk, white shirt + maroon tie, bright classroom — `images.unsplash.com/photo-1698993081947-8a3654303904` | Assad Tanoli · Unsplash License | Home hero (full-bleed) |
| 2 | Boy writing in notebook, classroom — `images.unsplash.com/photo-1698993026848-f67c1eb7f989` | Assad Tanoli · Unsplash License | Attendance / teacher feature |
| 3 | Boy reading, classmates behind — `images.unsplash.com/photo-1698993082050-19ca94c62fb8` | Assad Tanoli · Unsplash License | Results / online tests feature |
| 4 | Student with books on campus, Karachi — `images.unsplash.com/photo-1700680056842-20d9acc36e91` | Muneer ahmed ok · Unsplash License | Login & signup photo panel |
| 5 | Girl in uniform and hijab, classroom — `images.unsplash.com/photo-1698992985938-32e7cff274a3` | Assad Tanoli · Unsplash License | Parent portal section |
| 6 | Students in electronics lab, school sweaters — `images.pexels.com/photos/33992840` | Elements Interactive · Pexels License | Features page / "built for modern schools" |
| 7 | Classroom of students in green uniforms — `images.pexels.com/photos/12506828` | Mohammad Awais · Pexels License | About page |
| — | `public/ali-raza.jpg` (existing founder photo) | Owner asset | About page — keep |

Treatment rules:
- Self-host every image in `public/images/` (downloaded at Phase 1), served via `next/image`, with a `CREDITS.md` entry.
- Hero: full-bleed with a bottom-left `--ink` → transparent scrim (max 55% opacity) so the serif headline sits on the photo's calm area.
- Warm, natural colour only — no duotones, no heavy filters; crop to faces and hands doing real work.
- Photos appear on marketing and auth pages only. Dashboards use no stock photography (data is the picture).

---

## 7. Motion

Feel: **"click" — a register stamp snapping down.** Short and firm for frequent actions; nothing floaty.

| Element | Duration / easing |
| --- | --- |
| Button press | scale .98 in 80ms, release 160ms `cubic-bezier(.2,.8,.2,1)` |
| Hover (clickable cards only) | lift 2px + `shadow-2`, 180ms |
| Dropdown / popover | 200ms from scale .96 + fade, origin at trigger |
| Modal | 220ms fade + 8px rise; backdrop fade 180ms |
| Sidebar drawer (mobile) | 280ms `cubic-bezier(.32,.72,0,1)` slide |
| Page first entry | Main content then cards, 50ms stagger, total ≤ 600ms, first load only |
| KPI numbers | Roll to value once on first load (≤ 600ms) |
| Toasts | Say the result ("Payment of PKR 4,500 recorded"), 4s, slide up 200ms |

**Signature moment — attendance tick:** marking a student Present draws a check stroke (220ms stroke-dashoffset) and the "Present 31 / 34" counter rolls to the new value; "Mark all present" sweeps down the list with a 20ms row stagger.

Rules: animate only `transform` and `opacity`; every animation interruptible; `prefers-reduced-motion: reduce` → all states jump instantly, nothing hidden behind animation.

---

## 8. Implementation notes (for Phase 1+)

- Tokens live as CSS variables in `src/app/globals.css` and are mapped in `tailwind.config.ts` (`colors.canvas`, `colors.primary`, `colors.status.*`, `fontFamily.serif/sans/mono`, `borderRadius`, `boxShadow`).
- Replace the shadcn HSL defaults and the `brand.*`, `pine.*`, `amber.*`, `paper`, `ink` keys; then remove every hard-coded hex (`#0F2040`, `#F5B800`, `#FFF9E6`, `#DF9E00`, `#F4F6F9`, …) from components.
- Fix shared pieces first so every page inherits them: `components/ui/*` (button, card, input, table, badge, dialog), the five nav/sidebar components, `SignOutButton`, `CountUp`, `AnimatedMenuButton`, marketing `Header` / `Footer`.
- Check every page at 360px, 768px and 1440px.
