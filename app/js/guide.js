// The detail pane: one trophy's full guide, its sources and its missable
// note. A masked trophy stays masked here too until it is earned.

import { KIND_LABELS } from './data.js';
import { isMasked } from './checklist.js';

export function renderGuidePane(cardEl, emptyEl, trophy, doc, earned, onToggle) {
  if (!trophy) {
    cardEl.hidden = true;
    emptyEl.hidden = false;
    return;
  }
  emptyEl.hidden = true;
  cardEl.hidden = false;
  cardEl.replaceChildren();

  const masked = isMasked(trophy, true, earned);
  const title = document.createElement('h2');
  title.textContent = masked ? 'Hidden trophy' : trophy.name;
  cardEl.append(title);

  const desc = document.createElement('p');
  desc.className = 'official-desc';
  desc.textContent = masked
    ? 'This trophy stays hidden on PlayStation until you earn it. Turn spoilers off, or earn it, to see its name and description.'
    : `“${trophy.description}”`;
  cardEl.append(desc);

  const badges = document.createElement('p');
  const gradeBadge = document.createElement('span');
  gradeBadge.className = `grade-badge grade-${trophy.grade}`;
  gradeBadge.textContent = trophy.grade;
  badges.append(gradeBadge, ' ', tag(KIND_LABELS[trophy.kind], ''));
  if (trophy.hidden) badges.append(' ', tag('Hidden', 'hidden-tag'));
  if (trophy.missable) badges.append(' ', tag('Missable', 'missable-tag'));
  if (trophy.targetLabel) badges.append(' ', tag(trophy.targetLabel, ''));
  cardEl.append(badges);

  if (trophy.missable && trophy.missableNote) {
    const note = document.createElement('p');
    note.className = 'missable-note';
    note.textContent = trophy.missableNote;
    cardEl.append(note);
  }

  const guideHeading = document.createElement('h3');
  guideHeading.textContent = 'Guide';
  const guide = document.createElement('p');
  guide.textContent = masked ? 'Hidden until earned.' : trophy.guide;
  cardEl.append(guideHeading, guide);

  const sourcesHeading = document.createElement('h3');
  sourcesHeading.textContent = 'Sources';
  const list = document.createElement('ul');
  for (const key of trophy.sources) {
    const source = doc.sources[key];
    if (!source) continue;
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = source.url;
    link.textContent = source.label;
    link.target = '_blank';
    link.rel = 'noopener';
    item.append(link);
    list.append(item);
  }
  const ownWords = document.createElement('li');
  ownWords.textContent = 'Guide text: our own advice from the official description, not yet checked in the game.';
  list.append(ownWords);
  cardEl.append(sourcesHeading, list);

  const earnRow = document.createElement('div');
  earnRow.className = 'earn-row';
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.id = 'detail-earned';
  box.checked = earned.has(trophy.id);
  box.addEventListener('change', () => onToggle(trophy.id));
  const label = document.createElement('label');
  label.htmlFor = 'detail-earned';
  label.textContent = earned.has(trophy.id) ? 'Earned — tick to undo' : 'Mark as earned';
  earnRow.append(box, label);
  cardEl.append(earnRow);
}

function tag(text, extraClass) {
  const el = document.createElement('span');
  el.className = `tag ${extraClass}`.trim();
  el.textContent = text;
  return el;
}
