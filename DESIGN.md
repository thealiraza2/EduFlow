# EduFlow — Design System (DESIGN.md)

> Single source of truth for the redesign. If code and this file disagree, this file wins; change this file first, then the code.
> Status: **Direction C ("Warm, photo + floating app cards") — chosen by the owner.** Implemented on the home page, header/footer, auth pages and shared dashboard chrome via tokens.

---

## 1. North star

**"Less paperwork. More teaching."** A warm, premium, international-looking product that still feels made for Pakistani schools: cream surfaces, plum ink, an elegant serif voice and real product moments (attendance, fees, parent messages) floating over a bright classroom photo.

### Tone

| Scale | Value | Why |
| --- | --- | --- |
| Energy | Calm–confident | Owners and parents handle money and records. |
| Finish | Refined | Rounded 16–28px surfaces, soft layered shadows, generous whitespace. |
| Density | Marketing: airy · Dashboards: medium-dense | Marketing persuades; dashboards are daily tools. |
| Weight | Light display, bold UI | Thin serif headlines against bold sans labels and numbers. |
| Seriousness | Formal-warm | Plum and cream read as an established private school, not a toy. |

### What we avoid
Navy + yellow, dark "midnight" dashboards, neon glow, fake testimonials or invented metrics, emoji icons, dated or low-quality stock photos.

---

## 2. Colour

| Token | Hex | Use |
| --- | --- | --- |
| `--canvas` | `#FBF7F2` | Page background (warm cream) |
| `--surface` | `#FFFFFF` | Cards, tables, modals, inputs |
| `--surface-sunken` | `#F3EDE5` | Bento panels, table headers, inset areas |
| `--ink` | `#1C1917` | Primary text |
| `--ink-2` | `#57534E` | Secondary text |
| `--ink-3` | `#716B66` | Captions, placeholders (≥4.5:1 on canvas) |
| `--line` / `--line-strong` | `#EAE3DA` / `#D6CCBF` | Hairlines / input borders |
| `--primary` | `#6D1F3A` | Plum: primary buttons, links, active states, key words in headlines |
| `--primary-hover` / `--primary-pressed` | `#561830` / `#43122A` | Button states |
| `--primary-tint` / `--primary-tint-strong` | `#F6E9EE` / `#EBD3DD` | Selected backgrounds, icon chips, focus halo |
| `--accent` | `#9A6B1F` | Gold — "Most popular" badge and rare highlights only |
| `--sidebar` | `#231519` | Dark sections (How it works) and dashboard sidebar |
| `--sidebar-ink` / `--sidebar-ink-2` | `#F5ECEF` / `#BFA9B1` | Text on dark |

Status colours (dashboards and previews) stay separate from the brand and always carry a word: success `#1E7A4C`, warning `#A65F00`, danger `#B3261E`, info `#24578F`.

Tailwind's stock scales are remapped: `slate/gray/stone…` → warm stone neutrals, `indigo/purple/teal/greenboard/plum` → plum scale (600 = primary).

---

## 3. Typography

| Role | Family | Notes |
| --- | --- | --- |
| Display | **Instrument Serif** 400 (+ italic) | Headlines only. Italic plum for the second phrase ("More teaching."). Never faux-bold (`font-synthesis-weight: none`). |
| UI + body | **DM Sans** 400/500/600/700 | Everything else; bold for card titles and numbers. |
| IDs | **IBM Plex Mono** 500 | Admission and challan numbers. |

Scale: hero 52 → 66 (sm) → 56 (md) → 76 (lg) → 86 (xl); section titles 38 → 48 → 56; body 17–18.5 on marketing, 15 in dashboards; nothing below 12px. Numbers use tabular figures.

---

## 4. Shape, space, elevation

- Spacing on a 4px grid; sections 80–112px vertical (64 on phones).
- Radii: pills (999) for buttons and nav; 16px floating cards; 20–24px feature cards; 28px photo frames; 32px CTA band.
- Shadows: `shadow-1` cards, `shadow-2` hover, floating cards `0 24px 48px -16px rgba(28,25,23,.28)`, `shadow-3` modals.
- Containers: 1240px max, gutters 16 / 24 / 32px.

---

## 5. Responsive rules

| Width | Layout |
| --- | --- |
| < 640px | Single column. Hero copy and role buttons first, then the photo (4:5) with floating cards kept **inside** the photo edges. Facts strip 2×2. Full-screen mobile menu. |
| 640–767px | Photo square, cards at their full size. |
| 768–1023px | Hero becomes two columns (copy · photo 4:5), smaller cards. Feature grid 2 columns. Menu still collapsed. |
| ≥ 1024px | Desktop nav, hero 1 : 1.05, bento grid (attendance spans two rows), 4-up small features. |

Every grid child gets `min-w-0` so long names truncate instead of widening the page. Verified: no horizontal scroll at 375, 768 and 1440px.

---

## 6. Imagery

Bright, modern, real classroom photography — never old or low-light snapshots. Self-hosted in `public/images/`, credited in `CREDITS.md`.

| File | Use |
| --- | --- |
| `students-laptop.jpg` (Pexels, Monstera Production) | Home hero, login/signup photo panel |
| `electronics-lab.jpg` (Pexels, Elements Interactive) | "Made for Pakistan" section |
| `ali-raza.jpg` | About page (owner asset) |

Product UI (attendance register, fee table, result bars, parent SMS) is drawn in code, not screenshots, and is labelled as sample data.

---

## 7. Motion

- Hero copy and floating cards rise in once (≤ 600ms total, staggered 150ms); the attendance ring draws to 86%.
- Buttons press to 98% (80ms in, 160ms out); hover lift max 2px.
- FAQ items expand with the native `<details>`; the + rotates to ×.
- `prefers-reduced-motion`: everything appears instantly.
