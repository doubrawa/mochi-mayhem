import { spr, chibiCheer, chibiMini, crown, ico, POWERUPS, PLAYER_COLORS } from '../sprites.js';

const DEMO_RESULTS = [
  { idx:1, name:'MOCHI',   ko:4, pups:['bomb','bomb','fire','glove','shield'], time:'1:42', score:1200, place:1 },
  { idx:0, name:'BUBBLE',  ko:2, pups:['bomb','fire','speed'],                 time:'2:30', score:740,  place:2 },
  { idx:2, name:'BISCUIT', ko:2, pups:['speed','remote'],                      time:'2:30', score:620,  place:3 },
  { idx:3, name:'PICKLE',  ko:1, pups:['kick'],                                time:'2:30', score:380,  place:4 },
];
const PLACE_GLYPH = ['','🥇','🥈','🥉','4','5','6','7','8'];

export function render(app, navigate){
  const winner = DEMO_RESULTS[0];
  const wpc = PLAYER_COLORS[winner.idx];

  const section = document.createElement('section');
  section.className = 'screen we active';
  section.innerHTML = `
    <div class="conf" id="conf"></div>
    <div class="banner">ROUND&nbsp;WINNER!</div>

    <div class="winner">
      <span class="crown">${crown()}</span>
      <span class="ch">${chibiCheer(wpc.col, wpc.dk)}</span>
      <div class="pedestal"></div>
    </div>

    <div class="scoreboard">
      <div class="sb-h">
        <span></span><span>PLAYER</span><span>K/O</span><span>POWER-UPS</span><span>TIME</span><span>SCORE</span>
      </div>
      ${DEMO_RESULTS.map(r => sbRow(r)).join('')}
    </div>

    <div class="actions">
      <button class="pxbtn" data-action="menu"><span class="glyph">${ico('back')}</span>BACK TO MENU</button>
      <button class="pxbtn primary" data-action="next"><span class="glyph">${ico('play')}</span>NEXT ROUND</button>
    </div>
  `;
  app.appendChild(section);

  /* confetti */
  const conf = section.querySelector('#conf');
  const palette = ['#ff6b9d','#ffe79e','#9fe0b8','#7ec4ff','#d2b3ee','#ff7a3d'];
  for(let i=0; i<60; i++){
    const c = document.createElement('div');
    c.className = 'c';
    c.style.left = Math.random() * 100 + '%';
    c.style.background = palette[i % palette.length];
    c.style.animationDelay = (Math.random() * 4) + 's';
    c.style.animationDuration = (3 + Math.random() * 3) + 's';
    if(i % 3 === 0) c.style.borderRadius = '50%';
    if(i % 4 === 0){ c.style.width = '6px'; c.style.height = '14px'; }
    conf.appendChild(c);
  }

  section.querySelector('[data-action="menu"]').addEventListener('click', () => navigate('title'));
  section.querySelector('[data-action="next"]').addEventListener('click', () => navigate('game'));
}

function sbRow(r){
  const pc = PLAYER_COLORS[r.idx];
  const pupCells = r.pups.map(id => {
    const pu = POWERUPS.find(x => x.id === id);
    return `<span style="margin-right:3px">${pu ? spr(pu.a, pu.pal, 1) : ''}</span>`;
  }).join('');
  const cls = r.place === 1 ? 'sb-row win' : 'sb-row';
  return `<div class="${cls}">
    <span class="pos">${PLACE_GLYPH[r.place] || r.place}</span>
    <span class="row"><span>${chibiMini(pc.col, pc.dk)}</span>&nbsp;${r.name}</span>
    <span>${r.ko}</span>
    <span class="row">${pupCells}</span>
    <span>${r.time}</span>
    <span>${r.place === 1 ? `<b>${r.score}</b>` : r.score}</span>
  </div>`;
}
