import { charCanvas, crownCanvas, icoCanvas, pupCanvas } from '../sprites.js';

const DEMO_RESULTS = [
  { id:'mochi',   name:'MOCHI',   ko:4, pups:['bomb','bomb','fire','glove','shield'], time:'1:42', score:1200, place:1 },
  { id:'bubble',  name:'BUBBLE',  ko:2, pups:['bomb','fire','speed'],                 time:'2:30', score:740,  place:2 },
  { id:'biscuit', name:'BISCUIT', ko:2, pups:['speed','remote'],                      time:'2:30', score:620,  place:3 },
  { id:'pickle',  name:'PICKLE',  ko:1, pups:['kick'],                                time:'2:30', score:380,  place:4 },
];
const PLACE_GLYPH = ['','🥇','🥈','🥉','4','5','6','7','8'];

export function render(app, navigate){
  const winner = DEMO_RESULTS[0];

  const section = document.createElement('section');
  section.className = 'screen we active';
  section.innerHTML = `
    <div class="conf" id="conf"></div>
    <div class="banner">ROUND&nbsp;WINNER!</div>

    <div class="winner">
      <span class="crown" data-spr="crown"></span>
      <span class="ch" data-spr="char" data-id="${winner.id}"></span>
      <div class="pedestal"></div>
    </div>

    <div class="scoreboard">
      <div class="sb-h">
        <span></span><span>PLAYER</span><span>K/O</span><span>POWER-UPS</span><span>TIME</span><span>SCORE</span>
      </div>
      <div data-rows></div>
    </div>

    <div class="actions">
      <button class="pxbtn" data-action="menu"><span class="glyph" data-spr="ico-back"></span>BACK TO MENU</button>
      <button class="pxbtn primary" data-action="next"><span class="glyph" data-spr="ico-play"></span>NEXT ROUND</button>
    </div>
  `;
  app.appendChild(section);

  /* fill sprite slots */
  section.querySelectorAll('[data-spr]').forEach(el => {
    const k = el.getAttribute('data-spr');
    if(k === 'crown') el.appendChild(crownCanvas());
    else if(k === 'char') el.appendChild(charCanvas(el.getAttribute('data-id')));
    else if(k === 'ico-back') el.appendChild(icoCanvas('back'));
    else if(k === 'ico-play') el.appendChild(icoCanvas('play'));
  });

  /* scoreboard rows */
  const rows = section.querySelector('[data-rows]');
  DEMO_RESULTS.forEach(r => rows.appendChild(buildRow(r)));

  /* confetti */
  const conf = section.querySelector('#conf');
  const palette = ['#ff6b9d','#ffe79e','#9fe0b8','#7ec4ff','#d2b3ee','#ff7a3d'];
  for(let i = 0; i < 60; i++){
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

function buildRow(r){
  const row = document.createElement('div');
  row.className = 'sb-row' + (r.place === 1 ? ' win' : '');

  const pos = document.createElement('span'); pos.className = 'pos'; pos.textContent = PLACE_GLYPH[r.place] || r.place;
  const pname = document.createElement('span'); pname.className = 'pname';
  const av = charCanvas(r.id); av.classList.add('av'); pname.appendChild(av);
  pname.appendChild(document.createTextNode(r.name));

  const ko = document.createElement('span'); ko.textContent = r.ko;

  const pup = document.createElement('span'); pup.className = 'pl-mini';
  r.pups.forEach(id => pup.appendChild(pupCanvas(id)));

  const time = document.createElement('span'); time.textContent = r.time;
  const score = document.createElement('span');
  score.innerHTML = r.place === 1 ? `<b>${r.score}</b>` : String(r.score);

  row.append(pos, pname, ko, pup, time, score);
  return row;
}
