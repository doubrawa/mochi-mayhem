import {
  charCanvas, bombCanvas, boxCanvas, pillarCanvas,
  exCenterCanvas, exArmCanvas, heartCanvas, pupCanvas,
  PUPS,
} from '../sprites.js';

/* Static demo layout matching the v2 mockup. Real gameplay arrives in Etappe 2+. */
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
  { id:'bubble',  name:'BUBBLE',  hp:3, sc:380,  pups:['bomb','fire','speed'],                 dead:false, badge:'' },
  { id:'mochi',   name:'MOCHI',   hp:2, sc:1200, pups:['bomb','bomb','fire','glove','shield'], dead:false, badge:'LEAD' },
  { id:'biscuit', name:'BISCUIT', hp:1, sc:620,  pups:['speed','remote'],                      dead:false, badge:'' },
  { id:'pickle',  name:'PICKLE',  hp:0, sc:240,  pups:['kick'],                                dead:true,  badge:'OUT' },
];

const PLAYER_CHAR_BY_NUM = ['bubble','mochi','biscuit','pickle'];
const PUMAP = { a:'bomb', f:'fire', g:'glove', e:'speed' };

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
          <h4><span class="dot"></span>POWER-UPS · ALL 12 PICK-UPS</h4>
          <div class="pup-grid" id="pupGrid"></div>
        </div>
      </div>

      <div class="gpcol right" id="rightHud"></div>
    </div>
  `;
  app.appendChild(section);

  buildBoard(section.querySelector('#board'));
  buildPowerupRow(section.querySelector('#pupGrid'));
  const lh = section.querySelector('#leftHud');
  const rh = section.querySelector('#rightHud');
  DEMO_HUD.slice(0,2).forEach(p => lh.appendChild(buildHudCard(p)));
  DEMO_HUD.slice(2,4).forEach(p => rh.appendChild(buildHudCard(p)));

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
  for(let y = 0; y < H; y++){
    for(let x = 0; x < W; x++){
      const t = document.createElement('div');
      t.className = 'tile';
      const c = DEMO_LAYOUT[y][x];
      const isFloor = '123456789'.includes(c) || c === '.' || PUMAP[c] || 'bhXxy'.includes(c);
      if(isFloor){
        t.classList.add('floor');
        if((x+y) % 2) t.classList.add('b');
      }

      if(c === '#') t.appendChild(pillarCanvas());
      else if(c === 'B') t.appendChild(boxCanvas());
      else if(c === 'b'){ const w = wrap('breathe', bombCanvas(false)); t.appendChild(w); }
      else if(c === 'h'){ const w = wrap('hot-pulse', bombCanvas(true)); t.appendChild(w); }
      else if(c === 'X'){ const w = wrap('pulse-fast', exCenterCanvas()); t.appendChild(w); }
      else if(c === 'x'){ const w = wrap('pulse-fast', exArmCanvas(0)); t.appendChild(w); }
      else if(c === 'y'){ const w = wrap('pulse-fast', exArmCanvas(90)); t.appendChild(w); }

      const pn = '1234'.indexOf(c);
      if(pn >= 0){
        const w = wrap('breathe', charCanvas(PLAYER_CHAR_BY_NUM[pn]));
        t.appendChild(w);
      }

      if(PUMAP[c]){
        const id = PUMAP[c];
        const w = wrap('pulse-slow', pupCanvas(id));
        t.appendChild(w);
        const lbl = document.createElement('div');
        lbl.className = 'label';
        lbl.textContent = PUPS[id].nm;
        t.appendChild(lbl);
      }

      board.appendChild(t);
    }
  }
}

function wrap(cls, child){
  const w = document.createElement('div');
  w.className = cls;
  w.appendChild(child);
  return w;
}

function buildPowerupRow(grid){
  Object.keys(PUPS).forEach(id => {
    const cell = document.createElement('div');
    cell.className = 'pup-cell';
    cell.appendChild(pupCanvas(id));
    const text = document.createElement('span');
    text.innerHTML = `<span class="nm">${PUPS[id].nm}</span><span class="ds">${PUPS[id].ds}</span>`;
    cell.appendChild(text);
    grid.appendChild(cell);
  });
}

function buildHudCard(p){
  const card = document.createElement('div');
  card.className = 'pcard ' + (p.dead ? 'dead' : '');
  card.innerHTML = `
    ${p.badge ? `<span class="badge">${p.badge}</span>` : ''}
    <div class="row1" data-row1></div>
    <div class="hearts" data-hearts></div>
    <div class="pups" data-pups></div>
  `;
  const row1 = card.querySelector('[data-row1]');
  row1.appendChild(charCanvas(p.id));
  const nm = document.createElement('span'); nm.className = 'nm'; nm.textContent = p.name;
  const sc = document.createElement('span'); sc.className = 'sc'; sc.textContent = p.sc.toLocaleString();
  row1.appendChild(nm); row1.appendChild(sc);

  const hearts = card.querySelector('[data-hearts]');
  for(let i = 0; i < 3; i++) hearts.appendChild(heartCanvas(i >= p.hp));

  const pups = card.querySelector('[data-pups]');
  p.pups.forEach(id => {
    const pupBox = document.createElement('span');
    pupBox.className = 'pup';
    pupBox.appendChild(pupCanvas(id));
    pups.appendChild(pupBox);
  });
  return card;
}
