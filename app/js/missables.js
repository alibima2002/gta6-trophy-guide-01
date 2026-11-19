// The missables view: every trophy flagged missable, plus the save advice.
// Only one trophy in the list carries a missable report, and that report is
// unconfirmed — the view says so plainly instead of overstating it.

export function renderMissables(viewEl, doc, earned, onSelect) {
  viewEl.replaceChildren();
  const missable = doc.trophies.filter((t) => t.missable);
  for (const trophy of missable) {
    const card = document.createElement('article');
    card.className = 'missable-card';
    const heading = document.createElement('h2');
    heading.textContent = `${trophy.name} — ${trophy.grade}`;
    const desc = document.createElement('p');
    desc.textContent = trophy.description;
    const note = document.createElement('p');
    note.textContent = trophy.missableNote ?? trophy.guide;
    const status = document.createElement('p');
    status.textContent = earned.has(trophy.id)
      ? 'Earned — safe.'
      : 'Not earned yet — see the save advice below.';
    const open = document.createElement('button');
    open.type = 'button';
    open.textContent = 'Open its full guide';
    open.addEventListener('click', () => onSelect(trophy.id));
    card.append(heading, desc, note, status, open);
    viewEl.append(card);
  }

  const advice = document.createElement('section');
  advice.className = 'save-advice';
  const heading = document.createElement('h2');
  heading.textContent = 'Save advice';
  const line1 = document.createElement('p');
  line1.textContent =
    'No other trophy in the list is reported missable. Community discussion says you may not be able to miss any trophy in GTA 6, but treat that as unconfirmed until more players finish a run.';
  const line2 = document.createElement('p');
  line2.textContent =
    'The safe habit costs nothing: keep a manual save at the start of every chapter, and one before the final mission. If a mission ends a storyline, keep a manual save from just before it. There is no mission replay reported, so a save is the only way back.';
  advice.append(heading, line1, line2);
  viewEl.append(advice);
}
