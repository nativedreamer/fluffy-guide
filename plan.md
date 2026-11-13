# Fluffy Guide redesign plan

## Product direction

Redesign the existing live sports fixture radar as a calm, high-signal Apple-inspired PWA. Preserve the current analysis engine, data contracts, API routes, tabs, accumulator logic, PWA install flow, and match detail interactions. Change the presentation layer to feel like a focused live radar rather than a terminal dashboard.

## Design

Three directions considered:

- **Midnight Glass Radar** — quiet dark ink, translucent surfaces, lime signal color, amber only for actions and odds. Probability: 0.06.
- **Editorial Matchday** — warm paper, serif headlines, scorecard composition. Probability: 0.04.
- **Neon Control Room** — high-contrast black, saturated neon, dense instrumentation. Probability: 0.03.

Chosen: **Midnight Glass Radar**.

- **Design movement:** Apple-style fluid interface translated to a sports intelligence surface.
- **Core principles:** instant feedback, progressive disclosure, spatial consistency, restraint.
- **Color philosophy:** deep ink creates focus; cool mint communicates verified/live state; warm amber is reserved for decisions, odds, and primary actions.
- **Layout paradigm:** a sticky glass command bar, horizontal gesture-friendly section rail, one editorial hero block, then content surfaces that breathe rather than stack as a dense grid.
- **Signature elements:** mint live pulse, translucent chrome, large quiet numeric readouts, and amber decision controls.
- **Interaction philosophy:** pointer-down feedback, touch-friendly hit areas, interruptible motion, no input lock during transitions, and obvious source-to-surface relationships.
- **Animation:** prefer transform/opacity, use spring-like easing, preserve current presentation values, keep motion subtle by default, and reduce to fades under reduced-motion preferences.
- **Typography:** system UI stack for optical sizing and legibility; compact mono only for metadata, dates, and odds.
- **Brand essence:** a calm, evidence-led matchday companion for people who want signal before noise. Personality: focused, credible, composed.
- **Brand voice:** direct and specific. Example lines: “Read the slate before you place a leg.” “Only selections with evidence make the slip.”
- **Wordmark:** lowercase `fluffy / guide` with a small mint radar dot as the mark.
- **Signature brand color:** `#B9F6D0` mint signal.

## Implementation structure

- `app/page.tsx`: preserve data loading and event handlers; replace the shell with hero metrics, status treatment, and a more spacious main frame.
- `components/Header.tsx`: rebuild as a compact glass command bar with brand, live state, odds format, install action, and primary analysis action.
- `components/CategoryTabs.tsx`: rebuild as a horizontally scrollable, gesture-friendly rail with compact labels and active-state signal.
- `components/AllFixturesList.tsx` and `components/AccumulatorCard.tsx`: retain behavior and data but adopt the new surface language at their roots and primary cards.
- `app/globals.css`: establish tokens, surfaces, typography, focus states, motion defaults, reduced-motion/transparency/contrast handling, and scrollbar treatment.
- `public/manus-routes.json`: declare the single-page route for preview tooling.

## Runtime assumptions

The existing Vite + React + TypeScript stack remains in place. No new backend services or data sources are required. The PWA manifest and service worker remain compatible with the redesign.
