import {
  charCanvas, boxCanvas, pillarCanvas, heartCanvas, pupCanvas,
  PUPS, CHARS,
} from '../sprites.js';
import { createEngine } from '../game/engine.js';
import { TILE, FIELD_PRESETS } from '../game/field.js';
import { SCHEME_LABEL } from '../game/input.js';

const TS = 42;                 // tile pixel size — must match CSS .board --ts
const PLAYER_PX = 38;          // sprite display size in px

let engine = null;
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

  /* Spin up the engine.  It generates the field and the player roster. */
  engine = createEngine(state, {
    onRender: () => renderPlayers(playerLayer, engine.players),
  });

  const boardEl = section.querySelector('#board');
  const playerLayer = buildBoard(boardEl, engine.field);
  buildPowerupRow(section.querySelector('#pupGrid'));

  /* HUD reflects the actual roster, not the demo. */
  const lh = section.querySelector('#leftHud');
  const rh = section.querySelector('#rightHud');
  const half = Math.ceil(engine.players.length / 2);
  engine.players.slice(0, half).forEach(p => lh.appendChild(buildHudCard(p)));
  engine.players.slice(half).forEach(p => rh.appendChild(buildHudCard(p)));

  /* Width the powerup row to match the board. */
  const pupRow = section.querySelector('.pup-row');
  pupRow.style.width = (engine.field.width * TS + 8) + 'px';

  /* Timer countdown (visual only for now). */
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
    teardown();
    navigate('roundend');
  });

  engine.start();
}

export function teardown(){
  stopTimer();
  if(engine){ engine.stop(); engine = null; }
}

function stopTimer(){ if(timerHandle){ clearInterval(timerHandle); timerHandle = null; } }
function formatTime(s){ const m = Math.floor(s/60), ss = String(s%60).padStart(2,'0'); return `${m}:${ss}`; }

/* ============ BOARD RENDER ============ */

function buildBoard(boardEl, field){
  /* Make the CSS grid match the actual field size. */
  boardEl.style.gridTemplateColumns = `repeat(${field.width}, ${TS}px)`;
  boardEl.style.gridTemplateRows    = `repeat(${field.height}, ${TS}px)`;

  for(let y = 0; y < field.height; y++){
    for(let x = 0; x < field.width; x++){
      const t = document.createElement('div');
      t.className = 'tile';
      const v = field.at(x, y);
      if(v === TILE.FLOOR){
        t.classList.add('floor');
        if((x + y) % 2) t.classList.add('b');
      } else if(v === TILE.PILLAR){
        t.appendChild(pillarCanvas());
      } else if(v === TILE.BOX){
        t.classList.add('floor');
        if((x + y) % 2) t.classList.add('b');
        t.appendChild(boxCanvas());
      }
      boardEl.appendChild(t);
    }
  }

  /* Player layer sits absolutely on top of the grid so movement is smooth. */
  const layer = document.createElement('div');
  layer.className = 'player-layer';
  layer.style.cssText = `
    position:absolute; left:4px; top:4px;
    width:${field.width * TS}px; height:${field.height * TS}px;
    pointer-events:none;
  `;
  /* The .board element gets relative positioning so the absolute layer is anchored. */
  boardEl.style.position = 'relative';
  boardEl.appendChild(layer);

  return layer;
}

function renderPlayers(layer, players){
  /* Lazily create sprite divs per player on the first render. */
  if(!layer._sprites){
    layer._sprites = new Map();
    for(const p of players){
      const div = document.createElement('div');
      div.className = 'player-sprite';
      div.style.cssText = `
        position:absolute;
        width:${PLAYER_PX}px; height:${PLAYER_PX}px;
        margin-left:${-PLAYER_PX/2}px; margin-top:${-PLAYER_PX/2}px;
        will-change: transform;
        z-index:5;
      `;
      const cv = charCanvas(p.charId);
      cv.style.width = PLAYER_PX + 'px';
      cv.style.height = PLAYER_PX + 'px';
      div.appendChild(cv);
      layer.appendChild(div);
      layer._sprites.set(p.idx, div);
    }
  }
  /* Update positions. */
  for(const p of players){
    const div = layer._sprites.get(p.idx);
    if(!div) continue;
    div.style.transform = `translate(${(p.x * TS).toFixed(2)}px, ${(p.y * TS).toFixed(2)}px)`;
    if(!p.alive) div.style.filter = 'grayscale(.7) opacity(.5)';
  }
}

/* ============ HUD + POWER-UP ROW ============ */

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
  card.className = 'pcard';
  card.dataset.idx = p.idx;
  const ctrlLabel = p.scheme ? SCHEME_LABEL[p.scheme] : (p.type === 'cpu' ? 'CPU' : '—');
  card.innerHTML = `
    <div class="row1" data-row1></div>
    <div class="hearts" data-hearts></div>
    <div class="ctrl-mini" style="font-size:7px;color:var(--mid);margin-top:6px">${ctrlLabel}</div>
  `;
  const row1 = card.querySelector('[data-row1]');
  row1.appendChild(charCanvas(p.charId));
  const nm = document.createElement('span'); nm.className = 'nm'; nm.textContent = p.name || nameFor(p);
  const sc = document.createElement('span'); sc.className = 'sc'; sc.textContent = '0';
  row1.appendChild(nm); row1.appendChild(sc);
  const hearts = card.querySelector('[data-hearts]');
  for(let i = 0; i < 3; i++) hearts.appendChild(heartCanvas(false));
  return card;
}

function nameFor(p){
  /* fallback to char id as a friendly name for now */
  return (CHARS[p.charId] && p.charId.toUpperCase()) || ('P' + (p.idx + 1));
}
