---
phase: 1
slug: environment-authentication-security-stabilization
status: approved
shadcn_initialized: true
preset: none
created: 2026-06-07
---

# Phase 1 — UI Design Contract

> Visual and interaction contract for frontend phases.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | shadcn |
| Preset | none |
| Component library | radix |
| Icon library | lucide-react |
| Font | Inter |

---

## Spacing Scale

Declared values (must be multiples of 4):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon gaps, inline padding |
| sm | 8px | Compact element spacing |
| md | 16px | Default element spacing |
| lg | 24px | Section padding |
| xl | 32px | Layout gaps |
| 2xl | 48px | Major section breaks |
| 3xl | 64px | Page-level spacing |

Exceptions: none (no new UI elements designed in this phase)

---

## Typography

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 14px | Regular | 1.5 |
| Label | 12px | Medium | 1.2 |
| Heading | 20px | SemiBold | 1.25 |
| Display | 30px | Bold | 1.2 |

---

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | #ffffff | Background, surfaces |
| Secondary (30%) | #f9fafb | Cards, sidebar, nav |
| Accent (10%) | #0f172a | Buttons, active states |
| Destructive | #ef4444 | Destructive actions only |

Accent reserved for: none (no new UI elements designed in this phase)

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Primary CTA | Not applicable (automatic redirect) |
| Empty state heading | Not applicable |
| Empty state body | Not applicable |
| Error state | Access Denied: Please log in as an administrator to access this page. |
| Destructive confirmation | Not applicable |

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not required |

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS

**Approval:** approved 2026-06-07
