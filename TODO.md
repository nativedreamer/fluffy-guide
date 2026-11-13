# Redesign outcomes

## Complete the Apple-inspired visual redesign

- Preserve the existing fixture analysis, accumulator, detail modal, install prompt, offline state, and odds-format behavior.
- Replace the dense terminal-like shell with the chosen Midnight Glass Radar visual system.
- Add a clear hero hierarchy with live status, coverage, fixture count, and accumulator state.
- Rebuild the header and section navigation as touch-friendly, responsive, translucent surfaces.
- Apply pointer-down feedback, compositing-friendly motion, visible focus states, and reduced-motion fallbacks.
- Keep the experience legible on narrow mobile screens and desktop widths.

## Validate the delivered PWA

- Keep the existing `npm run build`, `npm run lint`, and `npm test` commands usable.
- Serve a synchronized `/manus-routes.json` route manifest for the single-page app.
- Confirm the redesign builds without TypeScript errors and does not change API contracts.
