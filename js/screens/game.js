import { spr, chibi, bomb, bombHot, box, pillar, exCenter, exArm, heart, POWERUPS, PLAYER_COLORS } from '../sprites.js';

/* Static demo layout matching the mockup. Real gameplay will replace this in Etappe 2+. */
const DEMO_LAYOUT = [
  "###############",
  "#1...B....B..2#",
  "#.#.#B#B#.#B#.#",
  "#.B.....B...B.#",
  "#.#.#.#a#.#.#.#",
  "#.B.b.B.B.f.B.#",
  "#...x.X.x.....#",
  "#.B.h.B.B.B.B.#",
  "#.#.#B#g#.#.#.#",
  "#.B.....e...B.#",
  "#.#B#.#.#.#.#.#",
  "#3..B.B.....B4#",
  "###############"
];

const DEMO_HUD = [
  { idx:0, name:'BUBBLE',  hp:3, sc:380,  pups:['bomb','fire','speed'],                     dead:false, badge:'' },
  { idx:1, name:'MOCHI',   hp:2, sc:1200, pups:['bomb','bomb','fire','glove','shield'],     dead:false, badge:'LEAD' },
  { idx:2, name:'BISCUIT', hp:1, sc:620,  pups:['speed','remote'],                          dead:false, badge:'' },
  { idx:3, name:'PICKLE',  hp:0, sc:240,  pups:['kick'],                                    dead:true,  badge:'OUT' },
];

let timerHandle = null;

export function render(app, navigate, state){
  const section = document.createElement('section');
  section.className = 'screen gp active';
  section.innerHTML = `
    <div class="gp">
      <div class="gpcol left" id="leftHud"></div>

      <div class="stage">
        <div class="topbar">
          <div class="round-pill">ROUND&nbsp;1/${state.rounds}</div>
          <div class="timer" id="timer">${formatTime(state.timeLimit || 150)}</div>
          <div class="live">● LIVE</div>
          <button class="end-round" data-action="end-round">END ROUND ▶</button>
        </div>
        <div class="board" id="board"></div>
        <div class="pup-row">
          <h4><span class="dot"></span>POWER-UPS · ALL 12 PICK-UPS (TOOLTIPS SHOWN ON FIELD)</h4>
          <div class="pup-grid" id="pupGrid"></div>
        </div>
      </div>

      <div class="gpcol right" id="rightHud"></div>
    </div>
  `;
  app.appendChild(section);

  buildBoard(section.querySelector('#board'));
  buildPowerupRow(section.querySelector('#pupGrid'));
  section.querySelector('#leftHud').innerHTML  = DEMO_HUD.slice(0,2).map(hudCard).join('');
  section.querySelector('#rightHud').innerHTML = DEMO_HUD.slice(2,4).map(hudCard).join('');

  /* timer countdown (visual only for now) */
  let secs = state.timeLimit || 150;
  const timerEl = section.querySelector('#timer');
  if(secs > 0){
    timerHandle = setInterval(() => {
      secs = Math.max(0, secs - 1);
      timerEl.textContent = formatTime(secs);
      if(secs === 0) stopTimer();
    }, 1000);
  }

  section.querySelector('[data-action="end-round"]').addEventListener('click', () => {
    stopTimer();
    navigate('roundend');
  });
}

export function teardown(){ stopTimer(); }
function stopTimer(){ if(timerHandle){ clearInterval(timerHandle); timerHandle = null; } }
function formatTime(s){ const m = Math.floor(s/60), ss = String(s%60).padStart(2,'0'); return `${m}:${ss}`; }

function buildBoard(board){
  const W = 15, H = 13;
  const pumap = { a:'bomb', f:'fire', g:'glove', e:'speed' };

  for(let y=0; y<H; y++){
    for(let x=0; x<W; x++){
      const t = document.createElement('div');
      t.className = 'tile';
      const c = DEMO_LAYOUT[y][x];
      const checker = (x+y) % 2;

      const isFloor = '123456789'.includes(c) || c === '.' || pumap[c] || c==='b' || c==='h' || c==='X' || c==='x' || c==='y';
      if(isFloor){
        t.classList.add('floor');
        if(checker) t.classList.add('b');
      }

      if(c === '#') t.innerHTML = pillar(2);
      if(c === 'B') t.innerHTML = box(2);
      if(c === 'b'){ const w = document.createElement('div'); w.className='breathe'; w.innerHTML = bomb(2); t.appendChild(w); }
      if(c === 'h'){ const w = document.createElement('div'); w.className='pulse-fast'; w.innerHTML = bombHot(2); t.appendChild(w); }
      if(c === 'X'){ const w = document.createElement('div'); w.className='pulse-fast'; w.innerHTML = exCenter(3); t.appendChild(w); }
      if(c === 'x'){ const w = document.createElement('div'); w.className='pulse-fast'; w.innerHTML = exArm(3,'h'); t.appendChild(w); }
      if(c === 'y'){ const w = document.createElement('div'); w.className='pulse-fast'; w.innerHTML = exArm(3,'v'); t.appendChild(w); }

      const pn = '1234'.indexOf(c);
      if(pn >= 0){
        const pc = PLAYER_COLORS[pn];
        const w = document.createElement('div');
        w.className = 'breathe';
        w.style.cssText = 'position:absolute; inset:0; transform:scale(.7); display:flex; align-items:center; justify-content:center';
        w.innerHTML = chibi(pc.col, pc.dk, {scale:2});
        t.appendChild(w);
      }

      if(pumap[c]){
        const pu = POWERUPS.find(p => p.id === pumap[c]);
        if(pu){
          const w = document.createElement('div');
          w.className = 'pulse-slow';
          w.style.cssText = 'position:absolute; inset:0; display:flex; align-items:center; justify-content:center';
          w.innerHTML = spr(pu.a, pu.pal, 2);
          t.appendChild(w);
          const lbl = document.createElement('div');
          lbl.className = 'label';
          lbl.textContent = pu.nm;
          t.appendChild(lbl);
        }
      }

      board.appendChild(t);
    }
  }
}

function buildPowerupRow(grid){
  POWERUPS.forEach(p => {
    const cell = document.createElement('div');
    cell.className = 'pup-cell';
    cell.innerHTML = `<span class="ico">${spr(p.a, p.pal, 1.5)}</span>
      <span><span class="nm">${p.nm}</span><span class="ds">${p.ds}</span></span>`;
    grid.appendChild(cell);
  });
}

function hudCard(p){
  const pc = PLAYER_COLORS[p.idx];
  const heartHTML = [0,1,2].map(i => heart(i >= p.hp, 3)).join('');
  const pups = p.pups.map(id => {
    const pu = POWERUPS.find(x => x.id === id);
    return `<span class="pup">${pu ? spr(pu.a, pu.pal, 1) : ''}</span>`;
  }).join('');
  const badge = p.badge ? `<span class="badge">${p.badge}</span>` : '';
  return `<div class="pcard ${p.dead ? 'dead' : ''}">
    ${badge}
    <div class="row1">
      <span>${chibi(pc.col, pc.dk, {scale:2})}</span>
      <span class="nm">${p.name}</span>
      <span class="sc">${p.sc.toLocaleString()}</span>
    </div>
    <div class="hearts">${heartHTML}</div>
    <div class="pups">${pups}</div>
  </div>`;
}
