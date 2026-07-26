# Code Without Limits — Design & Colour Scheme PRD

**Version:** 1.0
**Scope:** Mobile app + website (codewithoutlimits.org)
**Series context:** App 1 of 3 related apps sharing one structural design system
**Owner:** Carline Romain — Mondial Connections / Community Changers

---

## 1. Purpose

This document defines the visual identity for Code Without Limits — the first release in
a planned family of three related apps. It establishes the color palette, typography,
component styling, and cross-platform (app + website) design rules for this app
specifically, while noting where the design system is meant to be shared or varied across
the family.

## 2. Design Philosophy

**Archetype:** Desert Modernism (an evolution of the existing "Organic & Earthy"
direction). Neo-minimalist, calm, and highly legible — built for low-bandwidth,
energy-constrained environments, so the interface leans on typography, negative space, and
lightweight vector artwork rather than heavy photography or large image assets.

This app's identity is drawn from **brown, sepia, desert sand, and mountain grey** —
warm, earthen, sun-worn tones evoking dry highland landscapes. It should read as grounded,
trustworthy, and unhurried, never sterile or corporate.

## 3. Colour Palette

| Token | Hex | Name | Usage |
|---|---|---|---|
| `background_primary` | `#F1E6D3` | Desert Sand | App/website base background |
| `background_secondary` | `#FBF7F0` | Warm Sand White | Cards, elevated surfaces |
| `text_primary` | `#2A211B` | Espresso | Headings, primary body text |
| `text_secondary` | `#6B5D50` | Warm Taupe | Secondary/supporting text |
| `brand_primary` | `#6F4A32` | Sepia Brown | Primary buttons, key brand moments |
| `brand_primary_active` | `#5A3A27` | Deep Sepia | Pressed/active states |
| `brand_secondary` | `#6E6A63` | Mountain Grey | Secondary actions, meters, icon accents |
| `accent_warm` | `#D8B98C` | Desert Tan | Highlights, subtle emphasis, hover states |
| `border_subtle` | `#E1D3BC` | Sand Border | Card borders, dividers, input outlines |
| `success` | `#6B7A52` | Olive Sage | Correct answers, positive states |
| `danger` | `#A6402C` | Clay Red | Incorrect answers, errors, destructive actions |

**Contrast rule:** any text placed on `brand_primary` or `brand_secondary` must be white.
Any text placed on `background_primary` or `background_secondary` must be `text_primary` or
`text_secondary`. All primary text/background pairings must meet WCAG AA (4.5:1 minimum).

## 4. Typography

Unchanged from the existing system — this PRD is a colour-scheme update, not a type
change:
- **Headings:** Outfit (semibold, tight tracking)
- **Body:** DM Sans (regular, relaxed leading)
- Heading and overline text use `brand_primary` / `text_primary`; body and small text use
  `text_secondary`.

## 5. App Components

| Component | Treatment |
|---|---|
| Primary button | `brand_primary` fill, white text, fully rounded, `brand_primary_active` on press |
| Secondary button | `background_primary` fill, `border_subtle` outline, `text_primary` text |
| Card | `background_secondary` fill, `border_subtle` outline, soft shadow, large radius |
| Input field | `background_secondary` fill, `border_subtle` outline, `brand_primary` on focus |
| Token/usage meter | Pill-shaped, progress fill in `brand_secondary` (Mountain Grey) |
| Quiz correct/incorrect | `success` (Olive Sage) for correct, `danger` (Clay Red) for incorrect |
| Icons | Phosphor, duotone — `brand_primary` as primary layer, `brand_secondary` as secondary layer |

**Existing hero illustration:** the welcome screen's mountain-ridge illustration
(`KenscoffMountains`) is a strong existing anchor for the "mountain grey" identity and
should be treated as the visual reference point for this app. Its sky gradient has been
aligned to the new `background_primary` token; the ridge gradients themselves are
hand-tuned artwork and are flagged as a follow-up task for full palette alignment rather
than a token-level change.

## 6. Website (codewithoutlimits.org)

The website shares the same token palette as the app — no separate web-only colour
system. Specific web treatment:
- **Navigation bar:** `background_secondary`, `border_subtle` bottom border, `brand_primary`
  for the active link/logo mark.
- **Hero section:** `background_primary` base, with the mountain-ridge motif (adapted from
  the app's welcome-screen illustration) as a wide-format hero background.
- **CTA buttons:** identical treatment to the app's primary/secondary buttons, for visual
  continuity between web and native.
- **Footer:** `text_primary` background with `background_primary` text (an inverted
  moment, used once, to anchor the page).
- Sign-in and demo-mode entry points should visually match their native counterparts
  exactly (same colours, same button shapes) so switching between web and app never feels
  like a different product.

## 7. Cross-App Family System

This app is the first of three planned, related apps sharing one **structural** design
system — same typography, spacing scale, component shapes, radii, and icon style — with
each app expressing its own **palette** on top of that shared structure. This app's
palette is Desert Modernism (brown/sepia/sand/mountain grey), established above. The
palettes for apps 2 and 3 are out of scope for this document and should be defined when
those apps are scoped, but should follow the same token structure (`background_primary`,
`text_primary`, `brand_primary`, etc.) so the underlying component code can be re-themed
by swapping token values alone, without structural changes.

## 8. Accessibility

- All colour pairings listed in Section 3 must meet WCAG AA contrast minimums.
- Colour is never the only signal for correctness/incorrectness in the quiz — icon or text
  labeling accompanies the Olive Sage / Clay Red colour coding.
- Focus states (inputs, buttons) must remain visible against `background_primary` and
  `background_secondary` in addition to any colour change (e.g. a visible border, not
  colour alone).
