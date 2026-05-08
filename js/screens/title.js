import { bombCanvas, sparkCanvas, cloudCanvas, icoCanvas, charCanvas } from '../sprites.js';

export function render(app, navigate){
  const section = document.createElement('section');
  section.className = 'screen tall active';
  section.innerHTML = `
    <div class="title">
      <div class="stars">
        <span class="star" style="left:8%; top:14%"></span>
        <span class="star" style="left:18%; top:8%; animation-delay:.4s"></span>
        <span class="star" style="left:84%; top:12%; animation-delay:.7s"></span>
        <span class="star" style="left:92%; top:24%; animation-delay:1.1s"></span>
        <span class="star" style="left:6%; top:38%; animation-delay:.2s"></span>
      </div>
      <div class="clouds">
        <span class="cloud" data-spr="cloud" style="left:6%; top:12%"></span>
        <span class="cloud big" data-spr="cloud-big" style="right:6%; top:18%; animation-delay:1.5s"></span>
        <span class="cloud" data-spr="cloud" style="left:22%; top:48%; animation-delay:.7s"></span>
      </div>

      <div class="logo-wrap">
        <span class="logo">BOOM<span class="small">·BUDDIES·</span></span>
        <span class="logo-bomb" data-spr="bomb"></span>
        <span class="logo-spark" data-spr="spark"></span>
      </div>

      <div class="menu">
        <button class="pxbtn primary" data-action="play"><span class="glyph" data-spr="ico-play"></span>PLAY</button>
        <button class="pxbtn" data-action="local-mp"><span class="glyph" data-spr="ico-mp"></span>LOCAL MULTIPLAYER</button>
        <button class="pxbtn" data-action="online-mp" disabled><span class="glyph" data-spr="ico-net"></span>ONLINE · COMING SOON</button>
        <button class="pxbtn" data-action="settings"><span class="glyph" data-spr="ico-cog"></span>SETTINGS</button>
        <button class="pxbtn" data-action="highscores"><span class="glyph" data-spr="ico-cup"></span>HIGHSCORES</button>
      </div>

      <div class="title-mascots">
        <span class="mascot m1" data-spr="char" data-id="bubble"></span>
        <span class="mascot m2" data-spr="char" data-id="biscuit"></span>
        <span class="mascot m3" data-spr="char" data-id="mochi"></span>
        <span class="mascot m4" data-spr="char" data-id="plum"></span>
      </div>

      <div class="ground"></div>
      <div class="footer">MADE WITH <span class="heart">♥</span> &nbsp;·&nbsp; BOOM BUDDIES &nbsp;·&nbsp; v0.2</div>
    </div>
  `;
  app.appendChild(section);

  /* paint sprites */
  section.querySelectorAll('[data-spr]').forEach(el => {
    const k = el.getAttribute('data-spr');
    if(k === 'cloud') el.appendChild(cloudCanvas(false));
    else if(k === 'cloud-big') el.appendChild(cloudCanvas(true));
    else if(k === 'bomb') el.appendChild(bombCanvas(false));
    else if(k === 'spark') el.appendChild(sparkCanvas());
    else if(k === 'ico-play') el.appendChild(icoCanvas('play'));
    else if(k === 'ico-mp') el.appendChild(icoCanvas('mp'));
    else if(k === 'ico-net') el.appendChild(icoCanvas('net'));
    else if(k === 'ico-cog') el.appendChild(icoCanvas('cog'));
    else if(k === 'ico-cup') el.appendChild(icoCanvas('cup'));
    else if(k === 'char') el.appendChild(charCanvas(el.getAttribute('data-id')));
  });

  section.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const a = btn.getAttribute('data-action');
      if(a === 'play' || a === 'local-mp') navigate('lobby');
      else if(a === 'settings') alert('Settings — coming soon');
      else if(a === 'highscores') alert('Highscores — coming soon');
    });
  });
}
