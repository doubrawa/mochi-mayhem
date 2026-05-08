import { chibi, PLAYER_COLORS } from '../sprites.js';

const DEFAULT_NAMES = ['BUBBLE','MOCHI','BISCUIT','PICKLE','YAM','CPU LV3','—','—'];
const DEFAULT_CTRL  = ['WASD + SPACE','ARROWS + RSHIFT','IJKL + N','NUMPAD 8456 + 0','GAMEPAD 1','AI · SMART','EMPTY SLOT','EMPTY SLOT'];
const DEFAULT_MODES = ['human','human','human','human','cpu','cpu','off','off'];

const FIELD_SIZES = [
  { id:'small',  w:11, h:9,  label:'SMALL',  meta:'FAST · COZY · PERFECT FOR 2-3' },
  { id:'medium', w:15, h:13, label:'MEDIUM', meta:'CLASSIC · 4-6 PLAYERS · RECOMMENDED' },
  { id:'large',  w:19, h:17, label:'LARGE',  meta:'CHAOS · 6-8 PLAYERS · BRING SNACKS' },
];

export function render(app, navigate, state){
  const section = document.createElement('section');
  section.className = 'screen med active';

  const fieldCards = FIELD_SIZES.map(f => `
    <div class="gcard ${state.fieldSize === f.id ? 'sel' : ''}" data-grid="${f.id}">
      <div class="lbl"><span>${f.label}</span><span>${f.w}×${f.h}</span></div>
      <div class="mini" data-mini="${f.w}x${f.h}"></div>
      <div class="meta">${f.meta}</div>
    </div>
  `).join('');

  section.innerHTML = `
    <div class="lobby">
      <div class="topbar-nav">
        <button class="back" data-action="back">◀ BACK</button>
        <div></div>
      </div>
      <h2>GAME SETUP</h2>
      <p class="sub">PICK A FIELD · ASSIGN PLAYERS · SET THE RULES</p>

      <div class="panel">
        <div class="panel-h"><span class="pip"></span>FIELD SIZE</div>
        <div class="grids" id="grids">${fieldCards}</div>
      </div>

      <div class="panel">
        <div class="panel-h"><span class="pip"></span>PLAYERS &nbsp;<span style="color:var(--mid); font-size:9px; margin-left:auto">UP TO 8 LOCAL</span></div>
        <div class="pgrid" id="pgrid"></div>
      </div>

      <div class="twocol">
        <div class="panel">
          <div class="panel-h"><span class="pip"></span>GOODIE FREQUENCY</div>
          <div class="slider" data-slider="goodies">
            <div class="fill" style="width:${['33%','60%','85%'][state.goodieFreq]}"></div>
            <div class="ticks"><span>SPARSE</span><span>NORMAL</span><span>GENEROUS</span></div>
          </div>
          <div style="font-size:9px; color:var(--mid); margin-top:14px">CONTROLS HOW OFTEN BOXES DROP POWER-UPS WHEN BLOWN UP.</div>
        </div>
        <div class="panel">
          <div class="panel-h"><span class="pip"></span>ROUND RULES</div>
          <div style="font-size:10px; color:var(--ink2); margin-top:6px">ROUNDS</div>
          <div class="seg-row" data-seg="rounds">
            <span data-val="1" class="${state.rounds===1?'on':''}">1</span>
            <span data-val="3" class="${state.rounds===3?'on':''}">3</span>
            <span data-val="5" class="${state.rounds===5?'on':''}">5</span>
          </div>
          <div style="font-size:10px; color:var(--ink2); margin-top:14px">TIME LIMIT</div>
          <div class="seg-row" data-seg="time">
            <span data-val="90"  class="${state.timeLimit===90?'on':''}">1:30</span>
            <span data-val="150" class="${state.timeLimit===150?'on':''}">2:30</span>
            <span data-val="210" class="${state.timeLimit===210?'on':''}">3:30</span>
            <span data-val="0"   class="${state.timeLimit===0?'on':''}">∞</span>
          </div>
        </div>
      </div>

      <button class="start-btn" data-action="start">START!</button>
    </div>
  `;
  app.appendChild(section);

  /* mini grid previews */
  section.querySelectorAll('[data-mini]').forEach(el => {
    const [w,h] = el.getAttribute('data-mini').split('x').map(Number);
    buildMini(el, w, h);
  });

  /* field card selection */
  section.querySelectorAll('#grids .gcard').forEach(c => {
    c.addEventListener('click', () => {
      section.querySelectorAll('#grids .gcard').forEach(x => x.classList.remove('sel'));
      c.classList.add('sel');
      state.fieldSize = c.getAttribute('data-grid');
    });
  });

  /* player slots */
  const pgrid = section.querySelector('#pgrid');
  state.players.forEach((p,i) => {
    const cls = p.mode === 'off' ? 'off' : (p.mode === 'cpu' ? 'cpu' : '');
    const pc = PLAYER_COLORS[i];
    const slot = document.createElement('div');
    slot.className = 'pslot ' + cls;
    slot.dataset.idx = i;
    slot.innerHTML = `
      <div class="top"><span>P${i+1}</span><span data-mode-label>${p.mode.toUpperCase()}</span></div>
      <div class="av"><span>${chibi(pc.col, pc.dk, {scale:3})}</span>
        <input class="nm" value="${p.name}" maxlength="10">
      </div>
      <div class="ctrl">${p.ctrl}</div>
      <div class="seg" data-pseg>
        <span data-mv="human" class="${p.mode==='human'?'on':''}">HUMAN</span>
        <span data-mv="cpu"   class="${p.mode==='cpu'?'on':''}">CPU</span>
        <span data-mv="off"   class="${p.mode==='off'?'on':''}">OFF</span>
      </div>
    `;
    pgrid.appendChild(slot);

    slot.querySelector('.nm').addEventListener('input', (e) => {
      state.players[i].name = e.target.value;
    });
    slot.querySelectorAll('[data-pseg] span').forEach(s => {
      s.addEventListener('click', () => {
        slot.querySelectorAll('[data-pseg] span').forEach(x => x.classList.remove('on'));
        s.classList.add('on');
        const mv = s.getAttribute('data-mv');
        state.players[i].mode = mv;
        slot.querySelector('[data-mode-label]').textContent = mv.toUpperCase();
        slot.classList.remove('off','cpu');
        if(mv === 'off') slot.classList.add('off');
        if(mv === 'cpu') slot.classList.add('cpu');
      });
    });
  });

  /* segment groups (round rules) */
  section.querySelectorAll('[data-seg]').forEach(g => {
    g.querySelectorAll('span').forEach(s => {
      s.addEventListener('click', () => {
        g.querySelectorAll('span').forEach(x => x.classList.remove('on'));
        s.classList.add('on');
        const key = g.getAttribute('data-seg');
        const val = parseInt(s.getAttribute('data-val'), 10);
        if(key === 'rounds') state.rounds = val;
        if(key === 'time')   state.timeLimit = val;
      });
    });
  });

  /* goodie slider — simple 3-step */
  const slider = section.querySelector('[data-slider="goodies"]');
  slider.addEventListener('click', (e) => {
    const r = slider.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const step = x < 0.34 ? 0 : (x < 0.67 ? 1 : 2);
    state.goodieFreq = step;
    slider.querySelector('.fill').style.width = ['33%','60%','85%'][step];
  });

  /* nav buttons */
  section.querySelector('[data-action="back"]').addEventListener('click', () => navigate('title'));
  section.querySelector('[data-action="start"]').addEventListener('click', () => navigate('game'));
}

function buildMini(el, w, h){
  el.style.gridTemplateColumns = `repeat(${w}, 6px)`;
  el.style.gridTemplateRows    = `repeat(${h}, 6px)`;
  el.innerHTML = '';
  for(let y=0;y<h;y++){
    for(let x=0;x<w;x++){
      const i = document.createElement('i');
      i.style.width='6px'; i.style.height='6px';
      const isBorder = x===0||y===0||x===w-1||y===h-1;
      const isPillar = x%2===0 && y%2===0;
      if(isBorder || isPillar){
        i.style.background = '#7d6996';
      } else if((x+y)%5===0 || (x*7+y*3)%6===0){
        i.style.background = '#d49758';
      } else {
        i.style.background = (x+y)%2 ? '#d8eecf' : '#c8e3bd';
      }
      if(x===1&&y===1) i.style.background='#6dd5e8';
      if(x===w-2&&y===1) i.style.background='#e878c9';
      if(x===1&&y===h-2) i.style.background='#f5d958';
      if(x===w-2&&y===h-2) i.style.background='#7ed98a';
      el.appendChild(i);
    }
  }
}

export function defaultLobbyState(){
  return {
    fieldSize: 'medium',
    rounds: 3,
    timeLimit: 150,
    goodieFreq: 1, // 0=sparse, 1=normal, 2=generous
    players: PLAYER_COLORS.map((c,i) => ({
      name: DEFAULT_NAMES[i],
      ctrl: DEFAULT_CTRL[i],
      mode: DEFAULT_MODES[i],
      color: c,
    })),
  };
}
