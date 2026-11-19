// Earned progress and the spoiler setting live in localStorage, so a
// checklist survives a reload. Export and import move them as one JSON file.

export const STORE_KEY = 'gta6-trophy-guide-v1';

export function loadStore() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return { earned: new Set(), spoilers: true };
    const parsed = JSON.parse(raw);
    const earned = new Set(
      (Array.isArray(parsed.earned) ? parsed.earned : []).filter(
        (id) => Number.isInteger(id) && id >= 1 && id <= 55,
      ),
    );
    return { earned, spoilers: parsed.spoilers !== false };
  } catch {
    return { earned: new Set(), spoilers: true };
  }
}

export function saveStore(store) {
  localStorage.setItem(
    STORE_KEY,
    JSON.stringify({ earned: [...store.earned].sort((a, b) => a - b), spoilers: store.spoilers }),
  );
}

export function toggleEarned(store, id) {
  if (store.earned.has(id)) store.earned.delete(id);
  else store.earned.add(id);
  saveStore(store);
  return store.earned.has(id);
}

export function buildExportFile(store) {
  return JSON.stringify(
    {
      app: 'gta6-trophy-guide',
      version: 1,
      exportedAt: new Date().toISOString(),
      earned: [...store.earned].sort((a, b) => a - b),
      spoilers: store.spoilers,
    },
    null,
    2,
  );
}

export function downloadExport(store) {
  const blob = new Blob([buildExportFile(store)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'gta6-trophy-progress.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

export function parseImportFile(text) {
  const parsed = JSON.parse(text);
  const earned = Array.isArray(parsed.earned) ? parsed.earned : parsed;
  if (!Array.isArray(earned)) throw new Error('Import file holds no earned list');
  const ids = earned.filter((id) => Number.isInteger(id) && id >= 1 && id <= 55);
  if (ids.length === 0 && earned.length > 0) throw new Error('Import file holds no valid trophy ids');
  return { earned: new Set(ids), spoilers: parsed.spoilers !== false };
}

export function resetStore() {
  localStorage.removeItem(STORE_KEY);
  return { earned: new Set(), spoilers: true };
}
