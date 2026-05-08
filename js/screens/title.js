import { logoBomb, spark, cloud, ico, chibiWave, chibiThrow, chibiCheer } from '../sprites.js';

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
        <span class="cloud" style="left:6%; top:12%">${cloud(false)}</span>
        <span class="cloud" style="right:6%; top:18%; animation-delay:1.5s">${cloud(false)}</span>
        <span class="cloud" style="left:18%; top:46%; animation-delay:.7s">${cloud(true)}</span>
      </div>

      <div class="logo-wrap">
        <span class="logo">BOOM<span class="small">·BUDDIES·</span></span>
        <span class="logo-bomb">${logoBomb()}</span>
        <span class="logo-spark">${spark()}</span>
      </div>

      <div class="menu">
        <button class="pxbtn primary" data-action="play"><span class="glyph">${ico('play')}</span>PLAY</button>
        <button class="pxbtn" data-action="local-mp"><span class="glyph">${ico('mp')}</span>LOCAL MULTIPLAYER</button>
        <button class="pxbtn" data-action="online-mp" disabled><span class="glyph">${ico('net')}</span>ONLINE · COMING SOON</button>
        <button class="pxbtn" data-action="settings"><span class="glyph">${ico('cog')}</span>SETTINGS</button>
        <button class="pxbtn" data-action="highscores"><span class="glyph">${ico('cup')}</span>HIGHSCORES</button>
      </div>

      <div class="title-mascots">
        <span class="mascot m1">${chibiWave('#6dd5e8','#3aa3bf')}</span>
        <span class="mascot m2">${chibiThrow('#ff9ec7','#c8567f')}</span>
        <span class="mascot m3">${chibiCheer('#f5d958','#b89b1f')}</span>
      </div>

      <div class="ground"></div>
      <div class="footer">MADE WITH <span class="heart">♥</span> &nbsp;·&nbsp; BOOM BUDDIES &nbsp;·&nbsp; v0.1</div>
    </div>
  `;
  app.appendChild(section);

  section.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const a = btn.getAttribute('data-action');
      if(a === 'play' || a === 'local-mp') navigate('lobby');
      else if(a === 'settings') alert('Settings — coming soon');
      else if(a === 'highscores') alert('Highscores — coming soon');
    });
  });
}
