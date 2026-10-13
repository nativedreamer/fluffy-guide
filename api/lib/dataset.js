import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const DATASET_PATH = path.join(root, 'data', 'corner-booking-samples.json');
const DATASET_CANDIDATES = [
  DATASET_PATH,
  path.join(process.cwd(), 'data', 'corner-booking-samples.json')
];

export function emptyDataset() {
  return {
    updatedAt: null,
    source: 'ESPN summary boxscore',
    definition: {
      totalCorners: 'Home corners won + away corners won from the ESPN boxscore.',
      totalCards: 'Yellow cards + red cards shown. Red cards are also stored separately. This is not a booking-points market.',
      halves: 'First-half and second-half cards come from ESPN key events. Corner key events are not published, so half corner splits stay unavailable.'
    },
    samples: []
  };
}

export async function loadDataset() {
  for (const file of DATASET_CANDIDATES) {
    try {
      const raw = await readFile(file, 'utf8');
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed.samples)) continue;
      return parsed;
    } catch {
      /* Try the next location. Vercel may place included files next to the project root. */
    }
  }
  return emptyDataset();
}

export function mergeSamples(dataset, incoming) {
  const byId = new Map((dataset.samples || []).filter((row) => row?.eventId).map((row) => [row.eventId, row]));
  for (const sample of incoming) {
    if (!sample?.eventId || sample.totalCorners == null) continue;
    byId.set(sample.eventId, sample);
  }
  const samples = [...byId.values()].sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 2500);
  return {
    ...emptyDataset(),
    ...dataset,
    updatedAt: new Date().toISOString(),
    samples
  };
}

export async function saveDataset(dataset) {
  try {
    await mkdir(path.dirname(DATASET_PATH), { recursive: true });
    await writeFile(DATASET_PATH, JSON.stringify(dataset));
    return true;
  } catch (error) {
    if (error?.code === 'EROFS' || error?.code === 'EPERM') return false;
    throw error;
  }
}

export function samplesForTeam(dataset, teamId, limit = 10) {
  const id = String(teamId || '');
  if (!id) return [];
  return (dataset.samples || [])
    .filter((sample) => sample.homeTeamId === id || sample.awayTeamId === id)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, limit);
}
