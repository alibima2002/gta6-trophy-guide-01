// Renders the trophy table under the current filters, with the spoiler mask
// applied: while spoilers are hidden, a hidden trophy shows no name and no
// description until it is earned.

import { KIND_LABELS } from './data.js';

export function isMasked(trophy, spoilersOn, earned) {
  return spoilersOn && trophy.hidden && !earned.has(trophy.id);
}

export function filterTrophies(trophies, filters) {
  const query = filters.query.trim().toLowerCase();
  return trophies.filter((t) => {
    if (filters.kind !== 'all' && t.kind !== filters.kind) return false;
    if (filters.grade !== 'all' && t.grade !== filters.grade) return false;
    if (filters.missableOnly && !t.missable) return false;
    if (filters.hideEarned && filters.earned.has(t.id)) return false;
    if (query) {
      const haystack = `${t.name} ${t.description} ${t.guide}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

export function renderChecklist(rowsEl, trophies, state, onSelect, onToggle) {
  rowsEl.replaceChildren();
  for (const trophy of trophies) {
    const earned = state.earned.has(trophy.id);
    const masked = isMasked(trophy, state.spoilers, state.earned);
    const tr = document.createElement('tr');
    if (earned) tr.classList.add('is-earned');
    if (state.selectedId === trophy.id) tr.classList.add('is-selected');
    tr.dataset.trophyId = String(trophy.id);

    const checkCell = document.createElement('td');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned;
    box.setAttribute('aria-label', `Mark ${masked ? 'hidden trophy' : trophy.name} as earned`);
    box.addEventListener('change', () => onToggle(trophy.id));
    box.addEventListener('click', (event) => event.stopPropagation());
    checkCell.append(box);

    const nameCell = document.createElement('td');
    if (masked) {
      const maskedName = document.createElement('span');
      maskedName.className = 'masked';
      maskedName.textContent = 'Hidden trophy — earn it to reveal';
      nameCell.append(maskedName);
    } else {
      const name = document.createElement('span');
      name.className = 'trophy-name';
      name.textContent = trophy.name;
      const desc = document.createElement('span');
      desc.className = 'trophy-desc';
      desc.textContent = trophy.description;
      nameCell.append(name, desc);
    }
    if (trophy.hidden) nameCell.append(tag('Hidden', 'hidden-tag'));
    if (trophy.missable) nameCell.append(tag('Missable', 'missable-tag'));
    nameCell.append(tag(KIND_LABELS[trophy.kind], ''));

    const gradeCell = document.createElement('td');
    const badge = document.createElement('span');
    badge.className = `grade-badge grade-${trophy.grade}`;
    badge.textContent = trophy.grade;
    gradeCell.append(badge);
    if (trophy.targetLabel) {
      const target = document.createElement('span');
      target.className = 'trophy-desc';
      target.textContent = trophy.targetLabel;
      gradeCell.append(document.createElement('br'), target);
    }

    const guideCell = document.createElement('td');
    guideCell.className = 'trophy-guide-cell';
    guideCell.textContent = masked ? 'Hidden until earned.' : trophy.guide;

    tr.append(checkCell, nameCell, gradeCell, guideCell);
    tr.addEventListener('click', () => onSelect(trophy.id));
    rowsEl.append(tr);
  }
}

function tag(text, extraClass) {
  const el = document.createElement('span');
  el.className = `tag ${extraClass}`.trim();
  el.textContent = text;
  return el;
}
