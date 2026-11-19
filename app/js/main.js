// Boot: load the trophy list, wire the toolbar, the three views and the
// detail pane, then render. Everything runs from files under app/.

import { loadTrophyData, gradeCounts } from './data.js';
import { loadStore, saveStore, toggleEarned, downloadExport, parseImportFile, resetStore } from './store.js';
import { filterTrophies, renderChecklist } from './checklist.js';
import { renderGuidePane } from './guide.js';
import { renderRoadmap } from './roadmap.js';
import { renderMissables } from './missables.js';

const store = loadStore();
const state = {
  earned: store.earned,
  spoilers: store.spoilers,
  kind: 'all',
  grade: 'all',
  query: '',
  missableOnly: false,
  hideEarned: false,
  view: 'checklist',
  selectedId: null,
};

const doc = await loadTrophyData();

const rowsEl = document.getElementById('rows');
const resultCountEl = document.getElementById('result-count');
const detailCardEl = document.getElementById('detail-card');
const detailEmptyEl = document.getElementById('detail-empty');
const checklistView = document.getElementById('checklist-view');
const roadmapView = document.getElementById('roadmap-view');
const missablesView = document.getElementById('missables-view');

function renderAll() {
  renderProgress();
  const visible = filterTrophies(doc.trophies, state);
  resultCountEl.textContent =
    state.view === 'checklist'
      ? `Showing ${visible.length} of 55 trophies`
      : '';
  if (state.view === 'checklist') renderChecklist(rowsEl, visible, state, selectTrophy, toggleTrophy);
  if (state.view === 'roadmap') renderRoadmap(roadmapView, doc, state, selectTrophy);
  if (state.view === 'missables') renderMissables(missablesView, doc, state.earned, selectTrophy);
  const selected = state.selectedId ? doc.trophies.find((t) => t.id === state.selectedId) ?? null : null;
  renderGuidePane(detailCardEl, detailEmptyEl, selected, doc, state.earned, toggleTrophy);
}

function renderProgress() {
  const earnedCount = state.earned.size;
  document.getElementById('progress-count').textContent = `${earnedCount} of 55 earned`;
  document.getElementById('progress-fill').style.width = `${Math.round((earnedCount / 55) * 100)}%`;
  const counts = gradeCounts(doc, state.earned);
  document.getElementById('progress-grades').textContent =
    `Platinum ${counts.platinum.earned}/${counts.platinum.total} · ` +
    `Gold ${counts.gold.earned}/${counts.gold.total} · ` +
    `Silver ${counts.silver.earned}/${counts.silver.total} · ` +
    `Bronze ${counts.bronze.earned}/${counts.bronze.total}`;
}

function selectTrophy(id) {
  state.selectedId = id;
  setView('checklist');
  renderAll();
  detailCardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function toggleTrophy(id) {
  toggleEarned(store, id);
  state.earned = store.earned;
  renderAll();
}

function setView(view) {
  state.view = view;
  checklistView.hidden = view !== 'checklist';
  roadmapView.hidden = view !== 'roadmap';
  missablesView.hidden = view !== 'missables';
  for (const tab of document.querySelectorAll('.view-tab')) {
    tab.classList.toggle('is-active', tab.dataset.view === view);
  }
}

for (const tab of document.querySelectorAll('.view-tab')) {
  tab.addEventListener('click', () => {
    setView(tab.dataset.view);
    renderAll();
  });
}

document.getElementById('search').addEventListener('input', (event) => {
  state.query = event.target.value;
  renderAll();
});
document.getElementById('kind').addEventListener('change', (event) => {
  state.kind = event.target.value;
  renderAll();
});
document.getElementById('grade').addEventListener('change', (event) => {
  state.grade = event.target.value;
  renderAll();
});
const spoilersBox = document.getElementById('spoilers');
spoilersBox.checked = state.spoilers;
spoilersBox.addEventListener('change', () => {
  state.spoilers = spoilersBox.checked;
  store.spoilers = state.spoilers;
  saveStore(store);
  renderAll();
});
document.getElementById('missable-only').addEventListener('change', (event) => {
  state.missableOnly = event.target.checked;
  renderAll();
});
document.getElementById('hide-earned').addEventListener('change', (event) => {
  state.hideEarned = event.target.checked;
  renderAll();
});

document.getElementById('export').addEventListener('click', () => downloadExport(store));
document.getElementById('import').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const imported = parseImportFile(await file.text());
    store.earned = imported.earned;
    store.spoilers = imported.spoilers;
    state.earned = store.earned;
    state.spoilers = store.spoilers;
    spoilersBox.checked = state.spoilers;
    saveStore(store);
    renderAll();
  } catch (error) {
    alert(`Import failed: ${error.message}`);
  }
  event.target.value = '';
});
document.getElementById('reset').addEventListener('click', () => {
  if (!window.confirm('Clear all earned ticks and reset the spoiler setting?')) return;
  const fresh = resetStore();
  store.earned = fresh.earned;
  store.spoilers = fresh.spoilers;
  state.earned = fresh.earned;
  state.spoilers = fresh.spoilers;
  state.selectedId = null;
  spoilersBox.checked = true;
  renderAll();
});

renderAll();
