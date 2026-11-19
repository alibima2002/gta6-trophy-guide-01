// The platinum roadmap: seven stages built from the official descriptions,
// in the order to play them. Story first, then the map, then the cleanup;
// A Long Road and the Platinum land last.

import { isMasked } from './checklist.js';

export const ROADMAP_STAGES = [
  {
    title: '1 · Story first — Chapters 1–5',
    blurb: 'Finish the campaign. The chapter trophies, the named mission trophies and the four vague story trophies all pop here, and none of them can be missed.',
    ids: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 47, 48, 49, 50],
  },
  {
    title: '2 · Side characters & strangers',
    blurb: 'Finish the final missions for Andy, Kenton, Billy, Randy and Tyrone, hunt the unique animal for Bret, and complete eight stranger strands.',
    ids: [22, 23, 24, 25, 26, 27, 29],
  },
  {
    title: '3 · Explore Leonida',
    blurb: 'Reveal all 52 areas, meditate at every spot, WAiNK It at 100 locations, discover 100 vehicles, buy all 8 garages and register 10 vehicles. Do the Chapter 1 meditation spot before Chapter 1 ends — see Missables.',
    ids: [28, 42, 31, 35, 54, 55],
  },
  {
    title: '4 · Activities & skill',
    blurb: '250 stunts, all 9 activity types once, gold on all 42 Shooting Range challenges, a Top Fun win at all 14 venues, 20 different race wins, a fishing win against Cal, one arcade game and a game of bowling.',
    ids: [15, 16, 17, 18, 19, 20, 21, 46],
  },
  {
    title: '5 · Robberies & money',
    blurb: 'Five bank vaults, an armored truck, a jewelry store without being seen, three shops back-to-back, one illegal operation per gang — then launder $250,000 of Marked Bills and spend $100,000 across the shops.',
    ids: [33, 34, 39, 40, 41, 43, 52, 53],
  },
  {
    title: '6 · Collectibles & challenges',
    blurb: 'Three card sets, 50 challenges, the one-off stunts: five enemies in one Combat Focus, the unscheduled VCIA departure, the Rhino, the Ocean Beach cocktail, the showroom exit and the melee drive-by.',
    ids: [30, 32, 36, 37, 38, 44, 45, 51],
  },
  {
    title: '7 · Cleanup & 100%',
    blurb: 'Push the last counts to 100% completion. A Long Road pops, and the Platinum follows it immediately.',
    ids: [14, 1],
  },
];

export function renderRoadmap(viewEl, doc, state, onSelect) {
  viewEl.replaceChildren();
  for (const stage of ROADMAP_STAGES) {
    const trophies = stage.ids.map((id) => doc.trophies.find((t) => t.id === id));
    const done = trophies.filter((t) => state.earned.has(t.id)).length;
    const section = document.createElement('section');
    section.className = 'roadmap-stage';

    const heading = document.createElement('h2');
    heading.textContent = stage.title;
    const progress = document.createElement('p');
    const progressCount = document.createElement('span');
    progressCount.className = 'stage-progress';
    progressCount.textContent = `${done} of ${trophies.length} earned`;
    progress.append(progressCount);
    const blurb = document.createElement('p');
    blurb.textContent = stage.blurb;

    const list = document.createElement('ul');
    list.className = 'stage-list';
    for (const trophy of trophies) {
      const item = document.createElement('li');
      if (state.earned.has(trophy.id)) item.classList.add('is-earned');
      // The spoiler mask applies here too: a hidden trophy the player has
      // not earned shows no name in the roadmap while spoilers are hidden.
      if (isMasked(trophy, state.spoilers, state.earned)) {
        const masked = document.createElement('span');
        masked.className = 'masked';
        masked.textContent = `Hidden trophy — ${trophy.grade}`;
        item.append(masked);
      } else {
        const link = document.createElement('a');
        link.href = '#';
        link.textContent = `${trophy.name} — ${trophy.grade}`;
        link.addEventListener('click', (event) => {
          event.preventDefault();
          onSelect(trophy.id);
        });
        item.append(link);
      }
      list.append(item);
    }
    section.append(heading, progress, blurb, list);
    viewEl.append(section);
  }
}
