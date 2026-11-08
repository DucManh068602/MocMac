---
version: alpha
name: "Mộc Mạc"
description: "A Vietnamese artisan-commerce interface with a calm, trustworthy operations dashboard."
colors:
  primary: "#435731"
  primary-strong: "#35472A"
  accent: "#C77A4A"
  canvas: "#FBFAF3"
  surface: "#FFFFFF"
  surface-muted: "#F5F4ED"
  text: "#2B2A22"
  text-muted: "#6B6A5C"
  border: "#E4DDC8"
  focus: "#2E6B50"
  danger: "#B5473D"
  warning: "#A86B16"
typography:
  display:
    fontFamily: "Lora, Georgia, serif"
  sans:
    fontFamily: "Segoe UI, Be Vietnam Pro, system-ui, sans-serif"
rounded:
  sm: "0.5rem"
  DEFAULT: "0.625rem"
  lg: "0.75rem"
spacing:
  page-max: "73.75rem"
  content-gap: "1.125rem"
components:
  sidebar:
    background: "#35472A"
  card:
    radius: "0.75rem"
  button:
    radius: "0.5625rem"
---

# Mộc Mạc Design System

## Overview

### Creative North Star

The product should feel like a well-organised atelier ledger: warm paper, muted botanical green, and the quiet material confidence of Vietnamese craft—not a generic blue SaaS console.

### Product context and register

- **Audience and primary job:** Vietnamese shoppers browse artisan goods; staff use the admin routes to monitor orders, products, customers, and store activity.
- **Target market(s) and evidence:** Vietnamese-language storefront and admin content in the repository.
- **Locale(s) and language policy:** Vietnamese (`vi`) is the default product language; controls, dates, status labels, and accessible names should be Vietnamese.
- **Usage scene:** Desktop-first operations work with responsive mobile navigation for quick checks.
- **Register:** Hybrid. Public routes may be more expressive; `/admin` is product-oriented, information-dense, and restrained.
- **Memorable signature:** Forest-green navigation with a terracotta active accent, echoing a workshop shelf label.
- **Restraint:** Data cards, tables, filters, and status feedback stay practical and low-ornament.
- **Anti-references:** Avoid cold neon dashboards, heavy glass effects, and blue-gradient SaaS clichés.
- **Token ownership/runtime mapping:** Existing runtime CSS variables in `src/styles.css` are canonical; `tailwind.config.js` mirrors the established palette for utilities. This document records the accepted values.

## Colors

`primary` and `primary-strong` lead navigation, high-emphasis actions, and headings. `accent` is reserved for the active navigation marker and selected visual emphasis. `canvas`, `surface`, and `surface-muted` build quiet tonal depth; borders provide separation before shadows. `danger` and `warning` are semantic only. Focus uses `focus` with a visible ring.

## Typography

Lora is reserved for page and panel headings to retain the existing editorial craft character. Segoe UI / Be Vietnam Pro is the compact, legible body and data stack. Use sentence case Vietnamese labels; numbers should stay tabular and easy to scan.

## Layout

Admin content is capped at `page-max`, with an 18px content rhythm. The desktop sidebar is 256px; mobile turns it into an off-canvas menu. Tables own horizontal overflow rather than forcing the page shell to clip. Cards collapse from four to two columns below 900px.

## Elevation & Depth

Use canvas-to-surface contrast, a fine warm border, and only a soft low-contrast shadow on elevated dashboard cards. The sidebar uses a tonal green gradient rather than floating elevation. Do not stack loud shadows.

## Shapes

Controls use `rounded.sm`; cards use `rounded.lg`. Icon containers are small rounded squares, never pills. Status badges are the intentional pill exception.

## Components

### Foundational visual states

Interactive controls must show hover, visible keyboard focus, active, and disabled states. Loading lowers data-area opacity without moving geometry. Errors use inline warm-red alerts with a retry action.

### Buttons and actions

Primary actions use forest green; secondary actions use a bordered white surface. Destructive actions use `danger` and remain visually separate. Keep icon and text together for all non-universal actions.

### Navigation and data display

Navigation uses Font Awesome solid icons inside 32px icon containers and always retains labels. Dashboard KPI cards pair a 38px icon tile with the metric. Charts use green as the primary series, with terracotta and blue only as distinct secondary series.

### Forms and overlays

Inputs and selects use the warm border and a visible green focus ring. Native selects remain acceptable where platform popup styling is not required. Toasts are owned by the existing admin toast service.

### Iconography

Use Font Awesome 6 solid icons, typically 14–16px within labeled controls, and 12px inside dashboard title tiles. Icon-only controls require Vietnamese accessible labels.

### Motion

Use 200ms transitions for hover and load feedback. Motion communicates state only; respect reduced-motion preferences.

### Content and data visualization

Use direct Vietnamese action labels such as “Làm mới”, “Xem tất cả”, and “Thử lại”. Amounts use `đ`; charts retain textual labels and tooltips so color is not the only carrier of meaning.

## Do's and Don'ts

- **Do:** retain the earthy green-and-clay craft identity across public and admin routes.
- **Do:** use outlined surfaces and clear label/icon pairs for dense operations work.
- **Don't:** introduce unrelated bright primary colors for decoration.
- **Don't:** rely on hover alone to communicate a value, action, or status.
