---
name: Portal of Future
description: Academic management portal for one technical school — navy-and-gold institutional identity, calm operate-mode dashboard, geometric-crest login.
colors:
  navy-ink: "#0f172a"
  navy-primary: "#1e40af"
  navy-deep: "#1e3a8a"
  navy-light: "#3b82f6"
  navy-soft: "#dbeafe"
  gold-accent: "#fbbf24"
  gold-deep: "#d97706"
  gold-light: "#fcd34d"
  gold-soft: "#fef3c7"
  success: "#15803d"
  success-soft: "#f0fdf4"
  warning: "#a16207"
  warning-soft: "#fffbeb"
  danger: "#b91c1c"
  danger-soft: "#fef2f2"
  page-bg: "#eef2f9"
  surface: "#ffffff"
  surface-sunken: "#f5f8fc"
  border: "#d8e0ed"
  border-strong: "#b8c5db"
  text-ink: "#0f172a"
  text-ink-2: "#334155"
  text-muted: "#64748b"
  text-subtle: "#94a3b8"
typography:
  display:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "22px"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "11.5px"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "0.06em"
  mono:
    fontFamily: "'JetBrains Mono', 'SF Mono', Consolas, monospace"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "normal"
rounded:
  sm: "6px"
  md: "10px"
  lg: "12px"
  xl: "22px"
  xxl: "26px"
  pill: "100px"
spacing:
  xs: "6px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "36px"
components:
  button-primary:
    backgroundColor: "{colors.navy-primary}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    padding: "10px 16px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-ink}"
    rounded: "{rounded.sm}"
    padding: "10px 16px"
  button-danger:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.danger}"
    rounded: "{rounded.sm}"
    padding: "10px 16px"
  auth-button-primary:
    backgroundColor: "{colors.navy-deep}"
    textColor: "#ffffff"
    rounded: "{rounded.lg}"
    padding: "14px 18px"
  badge:
    backgroundColor: "{colors.navy-soft}"
    textColor: "{colors.navy-primary}"
    rounded: "{rounded.pill}"
    padding: "3px 10px"
---

# Design System: Portal of Future

## Overview

**Creative North Star: "The School's Own Crest"**

Portal of Future is the daily academic record system for one technical school — its
identity comes from a real institutional crest (navy shield, gold laurel, three torches,
a tree, "EDUCA+ ESCOLA / ESCOLA DE TECNOLOGIA" lettering), not an invented SaaS brand. The
authenticated app (dashboard, tables, forms — Operate mode) stays calm and functional: a
cool light-blue page ground, white cards, navy as the structural/ink color, gold reserved
for the one thing that should catch the eye per screen (an active nav item, a stat icon,
a status badge). The login/signup screen (Operate, but the visitor's very first
impression) is the one place the crest gets a stage: a geometric navy mosaic crown
(circles, rings, triangles, authored as an inline SVG, not a photo or a gradient
standing in for one) tops a plain white card, translating a pinned reference
(monochrome black-header, white-body, one-dark-button mobile login) into this school's
own navy-and-gold palette. Rejected: the product's own earlier full-dark "cosmic space"
login treatment — too Persuade/marketing-flavored for a form five different daily user
roles fill out to get to work.

**Key Characteristics:**
- Cool, light, low-saturation page ground everywhere except the auth header band.
- Navy carries structure and primary actions; gold is rationed to single accents.
- Flat surfaces and soft, real (offset+blur) shadows — no glass, no colored glow shadows.
- One geometric, authored asset (the auth header SVG) rather than a stock gradient blob.

## Colors

A cool, restrained palette: navy is the dominant "ink" role used for structure and
primary actions; gold is the single rationed accent; everything else is neutral blue-gray.

### Primary
- **Navy Primary** (`#1e40af`): primary buttons, links inside the dashboard, focus rings, active/selected state.
- **Navy Deep** (`#1e3a8a`): sidebar gradient, the auth screen's header/button ink tone — the "darkest structural" navy.
- **Navy Light** (`#3b82f6`): hover states, lighter accents inside the navy family, the auth header's mosaic shapes.
- **Navy Soft** (`#dbeafe`): tinted backgrounds behind navy badges/icons/stat tiles.

### Secondary
- **Gold Accent** (`#fbbf24`): the sidebar's active-nav-item fill and avatar-initials background — the one "found it" color in the authenticated app.
- **Gold Deep** (`#d97706`) / **Gold Light** (`#fcd34d`) / **Gold Soft** (`#fef3c7`): pending-status badges, the first-run setup notice pill.

### Neutral
- **Page Ground** (`#eef2f9`): the app's own background, every screen outside a white card.
- **Surface** (`#ffffff`): cards, modals, the auth card body.
- **Surface Sunken** (`#f5f8fc`): input fills, table stripe, anywhere content sits a half-step below the card surface.
- **Border** (`#d8e0ed`) / **Border Strong** (`#b8c5db`): hairlines and input outlines.
- **Text Ink** (`#0f172a`) / **Text Ink 2** (`#334155`): primary and secondary reading text.
- **Text Muted** (`#64748b`) / **Text Subtle** (`#94a3b8`): captions, placeholders, meta rows — `text-subtle` is for decoration only (icons, dividers), never for text carrying meaning, since it falls under 3:1 on white.

### Named Rules
**The One-Accent Rule.** Gold appears once per screen with intent (an active nav pill, one link, one status dot) — never as a second competing call-to-action against navy.

## Typography

**Display/Body Font:** Inter (with system-ui fallback)
**Label/Mono Font:** JetBrains Mono (numeric/tabular data, IDs, matrícula, monetary/percent values)

**Character:** A plain, high-legibility grotesk carries every weight from body copy to
800-weight headings; JetBrains Mono appears only where digits need to line up (tables,
badges, matrícula fields), never as a "technical" costume.

### Hierarchy
- **Display** (800, 22–24px, 1.2, -0.02em): card/page titles ("Portal of Future", page headers).
- **Title** (700–800, 18–20px): section/card headers.
- **Body** (500, 13.5–14px, 1.5): form values, table cells, paragraph copy.
- **Label** (700, 10.5–11.5px, uppercase, 0.06–0.08em tracking): field labels, stat captions, badges — 11.5px is the floor; nothing functional goes smaller.
- **Mono** (500–600, 12–13px, tabular-nums): matrícula numbers, dates, percentages, IDs.

## Layout

Authenticated app: fixed 72px icon rail that expands to 260px on hover, a sticky 76px
topbar, and a fluid content column with card-based sections (`.card`, `.stats-grid`,
`.grid-2`/`.grid-3`). Tables scroll horizontally inside `.table-wrap` rather than
compressing columns. The login/signup surface is a single centered card (max 440px)
independent of the app shell, full-bleed edge-to-edge below a 480px viewport (the mobile
card becomes the screen, matching a native app's single-purpose login).

## Elevation & Depth

Mostly flat. Cards sit on the page ground with a hairline border, no shadow, at rest.
Depth is reserved for floating/temporary surfaces — modals and the auth card — which get
a real offset-and-blur shadow, never a zero-offset colored glow.

### Shadow Vocabulary
- **Card-at-rest**: no shadow; a 1px `border` (`#d8e0ed`) is the only separation.
- **Auth card** (`0 28px 60px -20px rgba(15,23,42,.35), 0 2px 8px rgba(15,23,42,.06)`): the one surface that floats over the page ground.
- **Auth button hover** (`0 10-14px 24-30px -8px rgba(15,23,42,.5)`): a dark, neutral-tinted shadow, not a colored glow — depth reads as lift, not as light.

### Named Rules
**The Neutral-Shadow Rule.** Every shadow in this system is a dark neutral (`rgba(15,23,42,…)`), never a colored halo matching the element's own hue.

## Shapes

Small-to-medium radii throughout: `6px` for buttons/inputs/badges-as-rectangles, `10px`
for cards and modals, `12px` for the auth screen's own inputs/button, up to `22–26px` for
the auth card itself and its mobile full-bleed state. Pills (`100px`) are reserved for
true status/badge chips. No neobrutalist hard-offset shadows, no clip-path polygons.

## Components

### Buttons
- **Shape:** 6px radius everywhere except the auth screen (12px).
- **Primary:** navy fill, white text, `10px 16px` (12–18px vertical/horizontal on the auth screen's full-width button).
- **Secondary:** white fill, ink text, 1px border — used for "Cancelar" and non-destructive secondary actions.
- **Danger:** white fill, red (`#b91c1c`) text — used for destructive row actions (Excluir).
- **Auth Primary:** solid navy-to-ink gradient, full width, white text, no border — one button per screen, no secondary CTA competing with it.

### Badges / Chips
- **Style:** tinted-soft background + saturated text of the same hue family (e.g. `navy-soft` bg + `navy-primary` text; `gold-soft` bg + a darkened gold text, not the raw `gold-deep` value, to clear 4.5:1), pill radius.
- **State:** role/status badges (Ativo/Inativo, Diretor/Professor/Aluno…) each get their own hue; pending/awaiting-approval always reads gold.

### Cards / Containers
- **Corner Style:** 10px (dashboard cards), 22–26px (auth card).
- **Background:** white on the light page ground.
- **Shadow Strategy:** none at rest (dashboard); real offset shadow only for the floating auth card and modals.
- **Border:** 1px `#d8e0ed` on dashboard cards; none on the auth card (the shadow alone separates it from the page).
- **Internal Padding:** 16–24px (dashboard card body); 20–36px (auth card body).

### Inputs / Fields
- **Dashboard style:** white fill, 1.5px `border-2` outline, 6–10px radius.
- **Auth style (a deliberate departure, scoped to this one surface):** flat `surface-2` fill, no border at rest, no leading icon, label in small caps above — earned by the pinned reference this surface translates.
- **Focus:** border shifts to navy, `0 0 0 4px` navy-tinted glow ring (`--blue-glow`) on both styles.
- **Error:** red left-accent message banner below the field group (`.auth-msg.error` / `.field-group.invalid .err`), never a red border alone.

### Navigation
- Icon-only rail (72px) that reveals labels on hover (260px); active item is a solid gold pill with navy-dark text — the sidebar's one gold moment per view. Mobile collapses to a slide-in drawer behind a hamburger toggle.

### Auth Header (signature component)
A fixed-height (176px) navy gradient band (`#0f172a → #1e3a8a → #1e40af`) carrying an
authored inline-SVG geometric mosaic (overlapping circles, one stroked ring, small
triangles and dots at varied opacity) — never a repeating tile, never a photo. A white
84px rounded-square badge holding the real crest logo straddles the seam between the
header and the white body below (`margin-top: -42px`), the one place the crest and the
mosaic touch. This header is constant across every auth sub-form (login, signup, first-
admin setup, forgot/reset password) so switching forms never re-triggers the brand
moment — it's the fixed frame, the form beneath it is what changes.

## Do's and Don'ts

### Do:
- **Do** keep gold to one accent per screen (the auth "Cadastre-se"/"Entrar" link, or one sidebar active state) — never two competing gold elements in the same view.
- **Do** use `text-muted` (`#64748b`), not `text-subtle` (`#94a3b8`), for any text on a white/light background that carries meaning — subtle fails contrast at that pairing.
- **Do** keep the auth header's mosaic purely navy-tonal (whites/blues only); gold lives in the body below it, never in the header art itself.
- **Do** give every functional label/caption at least 11.5px — this system's own detector flags anything under 11px as a legibility failure, not a style choice.

### Don't:
- **Don't** add a colored `border-left` accent bar to alert/message boxes (`.auth-msg`, toasts) — tint the whole background instead; a left bar is the most recognizable AI-UI tell.
- **Don't** bring the auth screen's icon-less, borderless input style into the authenticated dashboard's forms, or vice versa — the two are intentionally different registers (a first-impression card vs. a dense daily-use tool) and blending them erodes both.
- **Don't** reintroduce a full-bleed dark/"cosmic" background on the login screen — that direction was explicitly replaced; treat it as anti-reference, not a fallback.
- **Don't** ship a plate/pattern-style graphic as a CSS gradient standing in for it — the auth header is real authored SVG geometry; a gradient approximation is the cheap version of the effect.
