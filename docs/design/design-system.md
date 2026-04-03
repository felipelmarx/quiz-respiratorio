# IBNR Admin Dashboard -- Design System Specification

> **Version:** 1.0
> **Date:** 2026-04-02
> **Brand:** IBNR (Instituto Brasileiro de Neurociencia Respiratoria) / iBreathwork
> **Quality bar:** "Apple design + Disney experience" -- premium, polished, intentional

---

## Table of Contents

1. [Color System](#1-color-system)
2. [Typography](#2-typography)
3. [Component Specifications](#3-component-specifications)
4. [Spacing & Layout](#4-spacing--layout)
5. [Tailwind Config](#5-tailwind-config)
6. [Color Migration Map](#6-color-migration-map)

---

## 1. Color System

### 1.1 Navy (Primary)

The primary brand color. Used for sidebar accents, primary buttons, headings, and high-emphasis UI.

| Token       | Hex       | Usage                                      |
|-------------|-----------|----------------------------------------------|
| `navy-50`   | `#F0F4F8` | Tinted backgrounds, active nav item bg       |
| `navy-100`  | `#D9E2EC` | Hover backgrounds, subtle borders            |
| `navy-200`  | `#BCCCDC` | Disabled borders, dividers                   |
| `navy-300`  | `#9FB3C8` | Placeholder text, muted icons               |
| `navy-400`  | `#7B8FA8` | Secondary text, inactive icons               |
| `navy-500`  | `#547396` | Body text on light bg                        |
| `navy-600`  | `#3E5A7A` | Subheadings, medium-emphasis text            |
| `navy-700`  | `#243B55` | High-emphasis text, icon color               |
| `navy-800`  | `#162845` | Button hover, sidebar hover state            |
| `navy-900`  | `#0A192F` | Primary buttons, sidebar bg, headings        |
| `navy-950`  | `#06101F` | Deepest shade, hover on dark surfaces        |

### 1.2 Gold (Accent)

The accent color. Used for CTAs, highlights, active states, decorative elements, and overlines.

| Token       | Hex       | Usage                                        |
|-------------|-----------|------------------------------------------------|
| `gold-50`   | `#FBF8F1` | Accent backgrounds, highlight bg              |
| `gold-100`  | `#F2EBD9` | Light accent bg (from brand book)             |
| `gold-200`  | `#E8DBC0` | Hover on light accent surfaces               |
| `gold-300`  | `#DCCAA3` | Borders on accent elements                   |
| `gold-400`  | `#D1B988` | Muted accent, placeholder                    |
| `gold-500`  | `#C6A868` | **Brand gold** -- primary accent              |
| `gold-600`  | `#B09255` | Gold hover state (from brand book)            |
| `gold-700`  | `#957A42` | Active/pressed gold, high-contrast accent    |
| `gold-800`  | `#7A6335` | Dark accent for text on light bg             |
| `gold-900`  | `#5F4D2A` | Deep accent, gold text on white              |
| `gold-950`  | `#3D311B` | Deepest accent shade                         |

### 1.3 Semantic Colors

These remain standard Tailwind palette values. They are NOT rebranded.

| Purpose   | Light bg         | Text / Icon      | Border            | Dark bg          |
|-----------|------------------|-------------------|-------------------|------------------|
| **Success** | `green-50`     | `green-700`       | `green-200`       | `green-600`      |
| **Warning** | `amber-50`     | `amber-700`       | `amber-200`       | `amber-600`      |
| **Danger**  | `red-50`       | `red-700`         | `red-200`         | `red-600`        |
| **Info**    | `blue-50`      | `blue-700`        | `blue-200`        | `blue-600`       |

### 1.4 Quiz Profile Colors

Each quiz result profile has a dedicated color for badges, progress bars, and charts.

| Profile             | Key                 | Light bg        | Text / Icon     | Progress bar   |
|---------------------|---------------------|-----------------|-----------------|----------------|
| Respiracao Funcional  | `funcional`         | `green-100`     | `green-600`     | `green-500`    |
| Atencao Moderada    | `atencao_moderada`  | `yellow-100`    | `yellow-600`    | `yellow-500`   |
| Disfuncao           | `disfuncao`         | `orange-100`    | `orange-600`    | `orange-500`   |
| Disfuncao Severa    | `disfuncao_severa`  | `red-100`       | `red-600`       | `red-500`      |

### 1.5 Neutral Grays

Standard Tailwind `gray` scale. Used for text hierarchy, borders, and backgrounds.

| Token      | Hex       | Usage                                        |
|------------|-----------|------------------------------------------------|
| `gray-50`  | `#F9FAFB` | Page background, subtle card bg              |
| `gray-100` | `#F3F4F6` | Secondary button bg, table row hover         |
| `gray-200` | `#E5E7EB` | Borders, dividers                            |
| `gray-300` | `#D1D5DB` | Input borders, disabled borders              |
| `gray-400` | `#9CA3AF` | Placeholder text                             |
| `gray-500` | `#6B7280` | Secondary text, captions                     |
| `gray-600` | `#4B5563` | Body text (default)                          |
| `gray-700` | `#374151` | Labels, input text                           |
| `gray-800` | `#1F2937` | Headings in cards                            |
| `gray-900` | `#111827` | Primary text, card titles                    |
| `gray-950` | `#030712` | Maximum contrast text                        |

---

## 2. Typography

### 2.1 Font Families

| Role      | Family                                             | CSS Variable       |
|-----------|----------------------------------------------------|---------------------|
| Display   | `'Playfair Display', Georgia, 'Times New Roman', serif` | `--font-display`    |
| Body      | `'Lato', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` | `--font-body` |
| Mono      | `'JetBrains Mono', 'Fira Code', 'Consolas', monospace` | `--font-mono` |

**Loading:** Import via Google Fonts in `layout.tsx`:
```
Playfair Display: 400, 600, 700 (normal + italic)
Lato: 300, 400, 700
```

### 2.2 Type Scale

| Token          | Size     | Line Height | Weight  | Family   | Usage                              |
|----------------|----------|-------------|---------|----------|------------------------------------|
| `h1`           | 2.25rem (36px) | 1.2   | 700     | Display  | Page titles                        |
| `h2`           | 1.75rem (28px) | 1.25  | 700     | Display  | Section titles                     |
| `h3`           | 1.375rem (22px)| 1.3   | 600     | Display  | Card titles, subsections           |
| `h4`           | 1.125rem (18px)| 1.35  | 600     | Display  | Widget titles, sub-subsections     |
| `body-lg`      | 1.125rem (18px)| 1.75  | 400     | Body     | Intro paragraphs, descriptions     |
| `body`         | 1rem (16px)    | 1.625 | 400     | Body     | Default body text                  |
| `body-sm`      | 0.875rem (14px)| 1.5   | 400     | Body     | Table cells, secondary text        |
| `caption`      | 0.75rem (12px) | 1.5   | 400     | Body     | Timestamps, helper text            |
| `overline`     | 0.8125rem (13px)| 1.4  | 700     | Body     | Section labels (uppercase, tracked)|

### 2.3 Weight Usage

| Weight | Name       | When to use                                    |
|--------|------------|------------------------------------------------|
| 300    | Light      | Large display text for elegance (rare)         |
| 400    | Regular    | Body text, descriptions, table content         |
| 500    | Medium     | UI labels, navigation items, button text       |
| 600    | Semibold   | Card titles, subheadings, emphasis             |
| 700    | Bold       | Page headings, stat numbers, CTAs              |

### 2.4 Heading Color Rules

- Page-level headings (`h1`, `h2`): `navy-900` (brand navy)
- Card titles (`h3`): `gray-900`
- Overline / decorative labels: `gold-500` (brand gold), uppercase, `letter-spacing: 0.1em`
- Headings on dark (navy) backgrounds: `white`

---

## 3. Component Specifications

### 3.1 Button

**Variants:**

| Variant     | Default state                                                        | Hover                                          | Active                      |
|-------------|----------------------------------------------------------------------|-------------------------------------------------|-----------------------------|
| `primary`   | `bg-navy-900 text-white shadow-sm`                                   | `bg-navy-800`                                   | `bg-navy-950`               |
| `secondary` | `bg-gold-500 text-navy-900 shadow-sm`                                | `bg-gold-600 shadow-md`                         | `bg-gold-700`               |
| `outline`   | `border border-gray-300 bg-white text-gray-700`                      | `bg-gray-50`                                    | `bg-gray-100`               |
| `ghost`     | `text-gray-600 bg-transparent`                                       | `bg-gray-100 text-gray-900`                     | `bg-gray-200`               |
| `danger`    | `bg-red-600 text-white`                                              | `bg-red-700`                                    | `bg-red-800`                |

**States:**
- **Disabled:** `opacity-50 pointer-events-none`
- **Loading:** Spinner SVG with `animate-spin`, replaces left icon slot
- **Focus:** `focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2`

**Sizes:**

| Size | Height | Padding     | Font size | Radius      |
|------|--------|-------------|-----------|-------------|
| `sm` | `h-8`  | `px-3`      | `text-sm` | `rounded-md`|
| `md` | `h-10` | `px-4`      | `text-sm` | `rounded-lg`|
| `lg` | `h-12` | `px-6`      | `text-base`| `rounded-lg`|

**Notes:**
- All buttons use `font-medium`
- Transition: `transition-colors` (150ms ease)
- Gold button uses navy text for high contrast (matches brand book pattern)

### 3.2 Card

| Property  | Value                                      |
|-----------|--------------------------------------------|
| Background| `bg-white`                                 |
| Border    | `border border-gray-200`                   |
| Shadow    | `shadow-sm` (0 1px 2px rgba(0,0,0,0.05))  |
| Radius    | `rounded-xl` (12px)                        |
| Padding   | `p-6` (24px)                               |
| Hover (optional) | `hover:shadow-md hover:border-gold-300/30` (only on interactive cards) |

**Sub-components:**

| Part           | Styling                                     |
|----------------|---------------------------------------------|
| `CardHeader`   | `mb-4`                                      |
| `CardTitle`    | `text-lg font-semibold text-gray-900`       |
| `CardDescription` | `text-sm text-gray-500`                  |
| `CardContent`  | No default styling (inherits)               |

### 3.3 Input

| State     | Border          | Ring                              | Background |
|-----------|-----------------|-----------------------------------|------------|
| Default   | `border-gray-300`| none                             | `bg-white` |
| Focus     | `border-gold-500`| `ring-2 ring-gold-500/20`        | `bg-white` |
| Error     | `border-red-300` | `ring-2 ring-red-500/20` (focus) | `bg-white` |
| Disabled  | `border-gray-200`| none                             | `bg-gray-50` |

**Label:** `text-sm font-medium text-gray-700`, `mb-1` gap
**Error message:** `text-xs text-red-600`, `mt-1` gap
**Placeholder:** `text-gray-400`
**Dimensions:** `h-10 rounded-lg px-3 py-2 text-sm`

### 3.4 Badge

**Generic variants:**

| Variant   | Classes                              |
|-----------|--------------------------------------|
| `default` | `bg-gray-100 text-gray-700`         |
| `success` | `bg-green-100 text-green-700`       |
| `warning` | `bg-amber-100 text-amber-700`       |
| `danger`  | `bg-red-100 text-red-700`           |
| `info`    | `bg-blue-100 text-blue-700`         |
| `navy`    | `bg-navy-50 text-navy-700`          |
| `gold`    | `bg-gold-100 text-gold-800`         |

**Quiz profile variants (new):**

| Profile            | Classes                                |
|--------------------|----------------------------------------|
| `funcional`        | `bg-green-100 text-green-600`          |
| `atencao_moderada` | `bg-yellow-100 text-yellow-600`        |
| `disfuncao`        | `bg-orange-100 text-orange-600`        |
| `disfuncao_severa` | `bg-red-100 text-red-600`              |

**Base styles:** `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium`

### 3.5 Sidebar

| Element              | Current (emerald)            | New (Navy/Gold)                          |
|----------------------|------------------------------|------------------------------------------|
| Container bg         | `bg-white`                   | `bg-white`                               |
| Border               | `border-r border-gray-200`   | `border-r border-gray-200`               |
| Logo badge           | `bg-emerald-700`             | `bg-navy-900`                            |
| Logo text            | `text-white font-bold`       | `text-white font-bold`                   |
| Brand name           | `text-gray-900 font-bold`    | `text-gray-900 font-bold`                |
| Nav item (default)   | `text-gray-600`              | `text-gray-600`                          |
| Nav item (hover)     | `hover:bg-gray-50`           | `hover:bg-navy-50 hover:text-navy-700`   |
| Nav item (active bg) | `bg-emerald-50`              | `bg-navy-50`                             |
| Nav item (active text)| `text-emerald-700`          | `text-navy-900`                          |
| Active indicator      | none                        | `border-l-2 border-gold-500` (left edge) |
| User avatar bg       | `bg-emerald-100`             | `bg-navy-50`                             |
| User avatar text     | `text-emerald-700`           | `text-navy-700`                          |
| Divider              | `border-gray-200`            | `border-gray-200`                        |

**Dimensions:**
- Expanded width: `w-64` (256px)
- Collapsed width (future): `w-16` (64px) -- icons only, tooltip on hover
- Height: `h-screen` (full viewport)
- Logo area height: `h-16` (64px)
- Nav item padding: `px-3 py-2`
- Nav item gap (icon to text): `gap-3`
- Nav icon size: `h-5 w-5`

### 3.6 Stats Cards

| Element               | Current                  | New                                      |
|-----------------------|--------------------------|------------------------------------------|
| Icon container bg     | `bg-emerald-50`          | `bg-navy-50`                             |
| Icon color            | `text-emerald-700`       | `text-navy-700`                          |
| Stat value            | `text-2xl font-bold text-gray-900` | `text-2xl font-bold text-gray-900` |
| Stat label            | `text-sm text-gray-500`  | `text-sm text-gray-500`                 |
| Progress bar fill     | `bg-emerald-500`         | Per-profile color (see 1.4) or `bg-gold-500` for generic |
| Progress bar track    | `bg-gray-100`            | `bg-gray-100`                            |

**Trend indicators (future):**
- Positive: `text-green-600` with up-arrow icon
- Negative: `text-red-600` with down-arrow icon
- Neutral: `text-gray-500` with dash

**Number formatting:**
- Counts: locale-formatted (`1.234` in pt-BR)
- Percentages: one decimal (`45,2%`)
- Scores: one decimal (`24,7`)

---

## 4. Spacing & Layout

### 4.1 Base Unit

`4px` (Tailwind default). All spacing uses multiples of 4px.

### 4.2 Common Spacing Tokens

| Token | Value   | Usage                                    |
|-------|---------|------------------------------------------|
| `1`   | 4px     | Tight inline spacing                    |
| `2`   | 8px     | Icon-to-text gap, badge padding         |
| `3`   | 12px    | Nav item padding, input padding         |
| `4`   | 16px    | Card internal sections                  |
| `6`   | 24px    | Card padding, section gaps              |
| `8`   | 32px    | Between cards in a grid                 |
| `10`  | 40px    | Page section spacing                    |
| `12`  | 48px    | Major section breaks                    |
| `16`  | 64px    | Page top/bottom padding                 |

### 4.3 Grid System

- **Layout:** CSS Grid with Tailwind classes
- **Dashboard grid:** `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`
- **Full-width sections:** `grid grid-cols-1 gap-6`
- **Sidebar + content:** Sidebar fixed left, content with `ml-64` (or `ml-16` when collapsed)

### 4.4 Breakpoints

Standard Tailwind breakpoints:

| Name | Min-width | Usage                          |
|------|-----------|--------------------------------|
| `sm` | 640px     | Mobile landscape               |
| `md` | 768px     | Tablet                         |
| `lg` | 1024px    | Desktop                        |
| `xl` | 1280px    | Wide desktop                   |
| `2xl`| 1536px    | Ultra-wide                     |

### 4.5 Key Layout Dimensions

| Element            | Value         |
|--------------------|---------------|
| Sidebar expanded   | `w-64` (256px)|
| Sidebar collapsed  | `w-16` (64px) |
| Top header height  | `h-16` (64px) |
| Content max-width  | `max-w-7xl` (1280px) |
| Content padding    | `px-6 py-8`   |
| Card padding       | `p-6` (24px)  |
| Card border radius | `rounded-xl` (12px) |
| Button radius (md) | `rounded-lg` (8px) |
| Input radius       | `rounded-lg` (8px) |
| Badge radius       | `rounded-full` |

---

## 5. Tailwind Config

The following is the exact `theme.extend` section for `admin/tailwind.config.ts`:

```typescript
import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50:  '#F0F4F8',
          100: '#D9E2EC',
          200: '#BCCCDC',
          300: '#9FB3C8',
          400: '#7B8FA8',
          500: '#547396',
          600: '#3E5A7A',
          700: '#243B55',
          800: '#162845',
          900: '#0A192F',
          950: '#06101F',
        },
        gold: {
          50:  '#FBF8F1',
          100: '#F2EBD9',
          200: '#E8DBC0',
          300: '#DCCAA3',
          400: '#D1B988',
          500: '#C6A868',
          600: '#B09255',
          700: '#957A42',
          800: '#7A6335',
          900: '#5F4D2A',
          950: '#3D311B',
        },
      },
      fontFamily: {
        display: ["'Playfair Display'", 'Georgia', "'Times New Roman'", 'serif'],
        body: ["'Lato'", '-apple-system', 'BlinkMacSystemFont', "'Segoe UI'", 'Roboto', 'sans-serif'],
        mono: ["'JetBrains Mono'", "'Fira Code'", 'Consolas', 'monospace'],
      },
      fontSize: {
        'h1': ['2.25rem', { lineHeight: '1.2', fontWeight: '700' }],
        'h2': ['1.75rem', { lineHeight: '1.25', fontWeight: '700' }],
        'h3': ['1.375rem', { lineHeight: '1.3', fontWeight: '600' }],
        'h4': ['1.125rem', { lineHeight: '1.35', fontWeight: '600' }],
        'body-lg': ['1.125rem', { lineHeight: '1.75', fontWeight: '400' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
        'caption': ['0.75rem', { lineHeight: '1.5', fontWeight: '400' }],
        'overline': ['0.8125rem', { lineHeight: '1.4', fontWeight: '700', letterSpacing: '0.1em' }],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 10px 30px rgba(0, 0, 0, 0.08)',
        'gold-glow': '0 5px 15px rgba(198, 168, 104, 0.4)',
      },
      borderRadius: {
        'card': '12px',
      },
      width: {
        'sidebar': '256px',
        'sidebar-collapsed': '64px',
      },
      spacing: {
        'sidebar': '256px',
        'sidebar-collapsed': '64px',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-left': {
          '0%': { opacity: '0', transform: 'translateX(-8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-in-left': 'slide-in-left 0.2s ease-out',
      },
    },
  },
  plugins: [],
}

export default config
```

---

## 6. Color Migration Map

A complete mapping from the current emerald-based classes to their Navy/Gold replacements.

### 6.1 Direct Class Replacements

| Current class            | Replacement class          | Context                          |
|--------------------------|----------------------------|----------------------------------|
| `bg-emerald-700`         | `bg-navy-900`              | Primary buttons, logo badge      |
| `bg-emerald-800`         | `bg-navy-800`              | Button hover                     |
| `bg-emerald-600`         | `bg-navy-800`              | Medium emphasis bg               |
| `bg-emerald-500`         | `bg-gold-500`              | Progress bars, accents           |
| `bg-emerald-100`         | `bg-navy-50`               | Avatar bg, light tint            |
| `bg-emerald-50`          | `bg-navy-50`               | Active nav item bg, icon bg      |
| `text-emerald-700`       | `text-navy-900`            | Active nav text, icon color      |
| `text-emerald-600`       | `text-navy-700`            | Medium emphasis text             |
| `text-emerald-500`       | `text-gold-500`            | Accent text, links               |
| `hover:bg-emerald-800`   | `hover:bg-navy-800`        | Button hover state               |
| `focus:border-emerald-500` | `focus:border-gold-500`  | Input focus border               |
| `focus:ring-emerald-500` | `focus:ring-gold-500`      | Focus ring                       |
| `focus-visible:ring-emerald-500` | `focus-visible:ring-gold-500` | Button focus ring       |
| `ring-emerald-500/20`    | `ring-gold-500/20`         | Input focus ring with opacity    |

### 6.2 File-by-File Migration Reference

**`button.tsx`:**
```
bg-emerald-700         ->  bg-navy-900
hover:bg-emerald-800   ->  hover:bg-navy-800
ring-emerald-500       ->  ring-gold-500
```

**`input.tsx`:**
```
focus:border-emerald-500   ->  focus:border-gold-500
focus:ring-emerald-500/20  ->  focus:ring-gold-500/20
```

**`sidebar.tsx`:**
```
bg-emerald-700   ->  bg-navy-900       (logo badge)
bg-emerald-50    ->  bg-navy-50        (active nav item)
text-emerald-700 ->  text-navy-900     (active nav text)
bg-emerald-100   ->  bg-navy-50        (user avatar)
text-emerald-700 ->  text-navy-700     (user avatar text)
```

**`stats-cards.tsx`:**
```
bg-emerald-50    ->  bg-navy-50        (icon container)
text-emerald-700 ->  text-navy-700     (icon color)
bg-emerald-500   ->  bg-gold-500       (generic progress bar)
```
Note: Profile-specific progress bars should use their respective profile color (green/yellow/orange/red), not a single gold bar.

### 6.3 Pattern Summary

| Emerald shade | Replacement     | Rationale                                         |
|---------------|-----------------|---------------------------------------------------|
| 50            | `navy-50`       | Lightest tint stays in primary family             |
| 100           | `navy-50`       | Collapse two light shades into one                |
| 500           | `gold-500`      | Mid-tone accent shifts to gold for energy         |
| 600           | `navy-800`      | Medium-dark maps to navy upper range              |
| 700           | `navy-900`      | Primary brand color (the exact brand navy)        |
| 800           | `navy-800`      | Hover state one step lighter than 900             |
| Focus rings   | `gold-500`      | Accent color for interactive feedback             |

---

## Appendix: Design Principles

1. **Navy is authority.** Use it for structure: navigation, headings, primary actions. It grounds the interface in professionalism and scientific credibility.

2. **Gold is intention.** Use it sparingly for moments that matter: focus states, active indicators, CTAs, overlines. It should feel like a deliberate highlight, never overwhelming.

3. **White space is luxury.** Generous padding (`p-6`), breathing room between elements (`gap-6`), and clean card containers create the premium feel. Do not crowd.

4. **Semantic colors stay semantic.** Green = success, red = danger, amber = warning, blue = info. Never use navy or gold as semantic indicators -- they carry brand meaning only.

5. **Profile colors are sacred.** The four quiz profiles (funcional/atencao_moderada/disfuncao/disfuncao_severa) always use their assigned color (green/yellow/orange/red). These are clinical indicators and must not be rebranded.

6. **Typography hierarchy is strict.** Playfair Display for display headings only. Lato for everything else. Mixing them arbitrarily breaks the academic-meets-modern balance.

7. **Transitions are subtle.** 150ms ease for color changes, 200ms ease-out for transforms. Nothing should bounce, slide dramatically, or call attention to the mechanism. The interaction should feel inevitable.
