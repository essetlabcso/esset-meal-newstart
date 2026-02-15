# Branding Integration Plan (v0.1)

## 1. Brand Identity & Strategy
- **Vision:** TBD
- **Mission:** TBD
- **Tagline:** Evidence-Powered Change

### Core Values
- **Co‑Creation:** design *with* CSOs/communities/partners.
- **Evidence That Matters:** prioritize useful evidence for decisions, not compliance-only reporting.
- **Adaptation & Learning:** normalize reflection, iteration, and course-correction.
- **Digital Simplicity:** low‑bandwidth, low‑literacy, accessible by design.
- **Justice & Rights:** power-aware, accountability-centered, safeguard-first.

---

## 2. Visual Style Guide

### Color Palette (Tokens)
| Token | Name | Hex | Usage |
|-------|------|-----|-------|
| `--color-primary` | ESSET Teal | `#005F56` | Headers, primary buttons, nav highlights |
| `--color-accent` | ESSET Orange | `#F4A026` | CTAs, highlights, selected states |
| `--color-text` | Charcoal | `#2C2C2C` | Body text, icons |

### Typography
- **Headings (H1, H2):** Montserrat (Bold)
- **Body Text:** Open Sans / Inter (Regular)
- **Mobile Fallback:** Roboto

---

## 3. Asset Inventory (`public/brand/`)

### Core Assets
- `esset-logo-full.svg`: Full brand logo for light backgrounds.
- `esset-logo-header.svg`: Horizontal lockup for navigation bars.
- `esset-logo-icon.svg`: Favicon and small badge usage.
- `esset-logo.png`: High-resolution pixel version.

### Variants & Legacy
- `legacy/logo-full.svg`: Previous version logo.
- `legacy/icon-options/`: Various icon experimentations.

---

## 4. Canonical Asset Choices
The following files are the ONLY canonical assets for the New Start:

| Asset Layer | Canonical File | Note |
|-------------|----------------|------|
| **Full Logo** | `esset-logo-full.svg` | Primary brand mark |
| **App Icon** | `esset-logo-icon.svg` | Favicon / small UI elements |
| **Nav Header** | `esset-logo-header.svg` | Horizontal usage |
| **Backgrounds** | `public/brand/esset-meal/` | Approved pattern variants |

Any assets in `public/brand/legacy/` are for reference only and MUST NOT be used in new UI development.

---

## 5. Implementation Guidance
- **Mobile-first:** prioritize large tap targets and legible text.
- **Low-bandwidth:** avoid heavy animations; keep transitions subtle.
- **Accessibility:** Ensure high contrast between Teal/Charcoal and white backgrounds.
- **Tone:** Strategic, Grounded, Inviting, Respectful.
