# Fluffy Guide — Live Sports Fixture Radar

A React 19, TypeScript, Tailwind CSS, and Vite fixture radar. Upcoming matches come from ESPN scoreboards. Corner and booking projections come from ESPN match-summary boxscores stored in `data/corner-booking-samples.json`, not from guessed league averages.

## Analysis backend

- `GET /api/fixtures?days=6` — upcoming football and basketball fixtures, published prices, and form.
- `GET /api/analysis?days=6&sport=FOOTBALL|BASKETBALL|BOTH&targetOdds=10` — the same fixtures plus corner projections, card projections, and an accumulator.
- The accumulator keeps the existing confidence filter. When boxscores exist, a shrunk Poisson or normal model is merged on top: the leg is removed if that model puts the side under 50%, or if the devigged price is more than 8 points shorter than the model. Corners and cards still need the historical hit rate, and the shrunk count model has to clear the same line.
- Corner totals are home corners won plus away corners won. Card totals are yellow cards plus red cards. Half-by-half corners stay "Data unavailable" because ESPN key events do not list corners.
- `npm run refresh` rebuilds the sample file from current ESPN summaries.

No sports prediction is guaranteed. Odds and team news can change before kickoff.

## Local development

```bash
npm install
npm test
npm run dev
```

## Deploy

Connect the repository to Vercel with build command `npm run build` and output directory `dist`. The `/api` functions serve the analysis. Do not rewrite `/api/*` to `index.html`.

