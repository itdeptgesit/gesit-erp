# (2) Search • Threads — Design System Reference

## Mission
Create implementation-ready, token-driven UI guidance for (2) Search • Threads that is optimized for consistency, accessibility, and fast delivery across documentation and enterprise portal sites.

## Brand
- **Product/Brand**: (2) Search • Threads
- **Reference URL**: `https://www.threads.com/search?exact_match=false&q=cue%20by%20manus&serp_type=tags`
- **Audience**: Developers, technical teams, and enterprise operators
- **Product Surface**: Documentation & enterprise portal modules

## Style Foundations
- **Visual Style**: Clean, functional, implementation-oriented, dark/structured
- **Main Font Style**:
  - `font.family.primary`: `system-ui`
  - `font.family.stack`: `system-ui, -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif`
  - `font.size.base`: `15px`, `font.weight.base`: `400`, `font.lineHeight.base`: `21px`
- **Typography Scale**:
  - `font.size.xs`: `12px`
  - `font.size.sm`: `15px`
- **Color Palette & Semantic Tokens**:
  - `color.surface.base`: `#000000`
  - `color.surface.muted`: `#101010`
  - `color.surface.raised`: `#1e1e1e`
  - `color.text.primary`: `#f3f5f7`
  - `color.text.secondary`: `#777777`
  - `color.text.tertiary`: `#385898`
  - `color.text.inverse`: `#ffffff`
- **Spacing Scale**:
  - `space.1`: `1px`, `space.2`: `2px`, `space.3`: `4px`, `space.4`: `12px`, `space.5`: `16px`
- **Radius / Shape Tokens**:
  - `radius.xs`: `8px`
  - `radius.sm`: `50px` (pills, badges, toggle bars)
  - `radius.md`: `1000px` (circular avatars/icons)

## Accessibility (WCAG 2.2 AA)
- Target: WCAG 2.2 AA standard.
- Keyboard-first interactions required on all interactive components.
- Focus-visible rules required (outline/ring never hidden without high-contrast replacement).
- Minimum contrast ratio: 4.5:1 for standard text, 3:1 for large text and UI boundaries.

## Writing Tone
Concise, confident, implementation-focused.

## Rules: Do
- Use semantic tokens, not raw ad-hoc hex values, in component guidance.
- Every component must define required states: `default`, `hover`, `focus-visible`, `active`, `disabled`, `loading`, and `error`.
- Component behavior should specify responsive and edge-case handling.
- Interactive components must document keyboard, pointer, and touch behavior.
- Accessibility acceptance criteria must be testable in implementation.

## Rules: Don't
- Do not allow low-contrast text or hidden focus indicators.
- Do not introduce one-off spacing or typography exceptions.
- Do not use ambiguous labels or non-descriptive actions.
- Do not ship component guidance without explicit state rules.

## Guideline Authoring Workflow
1. Restate design intent in one sentence.
2. Define foundations and semantic tokens.
3. Define component anatomy, variants, interactions, and state behavior.
4. Add accessibility acceptance criteria with pass/fail checks.
5. Add anti-patterns, migration notes, and edge-case handling.
6. End with a QA checklist.

## Component Rule Expectations
- Include keyboard, pointer, and touch behavior.
- Include spacing and typography token requirements.
- Include long-content, overflow, and empty-state handling.
- Known component density reference: buttons (247), links (99), inputs (1), lists (1).

## Quality Gates
- Every non-negotiable rule must use "must".
- Every recommendation should use "should".
- Every accessibility rule must be testable in implementation.
- Teams should prefer system consistency over local visual exceptions.
