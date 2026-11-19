// Loads the official trophy list and exposes lookup helpers for it.
// The data file holds the 55 trophies with their official names, descriptions,
// grades, hidden flags, kinds, missable flags, PSN targets and guides.

export const KIND_LABELS = {
  story: 'Story',
  side: 'Side missions',
  collectible: 'Collectibles',
  activity: 'Activities',
  robbery: 'Robberies',
  onetime: 'One-off stunts',
  completion: '100% completion',
  meta: 'Platinum',
  misc: 'Everything else',
};

export const GRADE_ORDER = ['platinum', 'gold', 'silver', 'bronze'];

export async function loadTrophyData() {
  const response = await fetch('data/trophies.json');
  if (!response.ok) throw new Error(`trophies.json failed to load (${response.status})`);
  const doc = await response.json();
  if (!Array.isArray(doc.trophies) || doc.trophies.length !== 55) {
    throw new Error('trophies.json does not hold 55 trophies');
  }
  return doc;
}

export function trophyById(doc, id) {
  return doc.trophies.find((t) => t.id === id) ?? null;
}

export function trophiesByKind(doc, kind) {
  return doc.trophies.filter((t) => t.kind === kind);
}

export function gradeCounts(doc, earned) {
  const counts = {};
  for (const grade of GRADE_ORDER) {
    const ofGrade = doc.trophies.filter((t) => t.grade === grade);
    counts[grade] = {
      total: ofGrade.length,
      earned: ofGrade.filter((t) => earned.has(t.id)).length,
    };
  }
  return counts;
}
