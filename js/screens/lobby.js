import { charCanvas, miniCanvas, CHAR_IDS } from '../sprites.js';

const FIELD_SIZES = [
  { id:'small',  w:11, h:9,  label:'SMALL',  meta:'FAST · COZY · PERFECT FOR 2-3' },
  { id:'medium', w:15, h:13, label:'MEDIUM', meta:'CLASSIC · 4-6 PLAYERS · RECOMMENDED' },
  { id:'large',  w:19, h:17, label:'LARGE',  meta:'CHAOS · 6-8 PLAYERS · BRING SNACKS' },
];

const DEFAULT_NAMES = ['BUBBLE','MOCHI','BISCUIT','PICKLE','YAM','PLUM','PEACH','MALLOW'];
const DEFAULT_CTRL  = ['WASD + SPACE','ARROWS + RSHIFT','IJKL + N','NUMPAD 8456 + 0','GAMEPAD 1','AI · WIZARD LV3','EMPTY SLOT','EMPTY SLOT'];
const DEFAULT_MODES = ['human','human','human','human','cpu','cpu','off','off'];

export function defaultLobbyState(){
  return {
    fieldSize: 'medium',
    rounds: 3,
    timeLimit: 150,
    goodieFreq: 1, // 0=sparse, 1=normal, 2=generous
    players: CHAR_IDS.map((id, i) => ({
      id,
      name: DEFAULT_NAMES[i],
      ctrl: DEFAULT_CTRL[i],
      mode: DEFAULT_MODES[i],
    })),
  };
}

export function render(ctx){
  const { app, navigate, lobby: state } = ctx;
  const section = document.createElement('section');
  section.className = 'screen med active';

  const fieldCards = FIELD_SIZES.map(f => `
    <div class="gcard ${state.fieldSize === f.id ? 'sel' : ''}" data-grid="${f.id}">
      <div class="lbl"><span>${f.label}</span><span>${f.w}×${f.h}</span></div>
      <span data-mini data-w="${f.w}" data-h="${f.h}"></span>
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
        <div class="panel-h"><span class="pip"></span>PLAYERS &nbsp;<span style="color:var(--mid); font-size:9px; margin-left:auto">UP TO 8 LOCAL · EVERY SLOT IS A DIFFERENT BUDDY</span></div>
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
    const w = parseInt(el.getAttribute('data-w'), 10);
    const h = parseInt(el.getAttribute('data-h'), 10);
    const cv = miniCanvas(w, h);
    cv.classList.add('mini');
    cv.style.width = (w * 8) + 'px';
    cv.style.height = (h * 8) + 'px';
    el.replaceWith(cv);
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
  state.players.forEach((p, i) => {
    const cls = p.mode === 'off' ? 'off' : (p.mode === 'cpu' ? 'cpu' : '');
    const slot = document.createElement('div');
    slot.className = 'pslot ' + cls;
    slot.dataset.idx = i;
    slot.innerHTML = `
      <div class="top"><span>P${i+1}</span><span data-mode-label>${p.mode.toUpperCase()}</span></div>
      <div class="av"><span data-char-host></span>
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

    slot.querySelector('[data-char-host]').appendChild(charCanvas(p.id));

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

  /* goodie slider — 3-step */
  const slider = section.querySelector('[data-slider="goodies"]');
  slider.addEventListener('click', (e) => {
    const r = slider.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const step = x < 0.34 ? 0 : (x < 0.67 ? 1 : 2);
    state.goodieFreq = step;
    slider.querySelector('.fill').style.width = ['33%','60%','85%'][step];
  });

  /* nav */
  section.querySelector('[data-action="back"]').addEventListener('click', () => navigate('title'));
  section.querySelector('[data-action="start"]').addEventListener('click', () => navigate('game'));
}
