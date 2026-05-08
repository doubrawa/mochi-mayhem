import { charCanvas, crownCanvas, icoCanvas } from '../sprites.js';
import { rankings, isMatchOver, matchChampion } from '../game/match.js';

const PLACE_GLYPH = ['','🥇','🥈','🥉','4','5','6','7','8'];

export function render(ctx){
  const { app, navigate, match, lastRound } = ctx;
  const matchOver = isMatchOver(match);
  const ranked = rankings(match);

  /* Pick who appears on the podium. */
  const champion = matchOver ? matchChampion(match) : null;
  const roundWinner = lastRound?.winnerIdx != null
    ? match.players.find(p => p.idx === lastRound.winnerIdx)
    : null;
  const podium = champion || roundWinner;

  /* Banner copy. */
  let bannerText;
  if(matchOver) bannerText = champion ? 'MATCH&nbsp;CHAMPION!' : 'MATCH&nbsp;DRAW!';
  else if(roundWinner) bannerText = `ROUND&nbsp;${match.current - 1}&nbsp;WINNER!`;
  else bannerText = `ROUND&nbsp;${match.current - 1}&nbsp;DRAW!`;

  const section = document.createElement('section');
  section.className = 'screen we active';
  section.innerHTML = `
    <div class="conf" id="conf"></div>
    <div class="banner">${bannerText}</div>

    <div class="winner">
      <span class="crown" data-spr="crown" ${podium ? '' : 'style="display:none"'}></span>
      <span class="ch" data-spr="char" ${podium ? `data-id="${podium.id}"` : 'style="display:none"'}></span>
      <div class="pedestal" ${podium ? '' : 'style="display:none"'}></div>
    </div>

    <div class="scoreboard">
      <div class="sb-h">
        <span></span><span>PLAYER</span><span>WINS</span><span>TOTAL K/O</span><span>LAST RUN</span><span>SCORE</span>
      </div>
      <div data-rows></div>
    </div>

    <div class="actions">
      <button class="pxbtn" data-action="menu"><span class="glyph" data-spr="ico-back"></span>BACK TO MENU</button>
      ${matchOver ? '' : `<button class="pxbtn primary" data-action="next"><span class="glyph" data-spr="ico-play"></span>NEXT ROUND</button>`}
    </div>
  `;
  app.appendChild(section);

  /* Fill sprite slots. */
  section.querySelectorAll('[data-spr]').forEach(el => {
    const k = el.getAttribute('data-spr');
    if(k === 'crown' && podium) el.appendChild(crownCanvas());
    else if(k === 'char' && podium) el.appendChild(charCanvas(podium.id));
    else if(k === 'ico-back') el.appendChild(icoCanvas('back'));
    else if(k === 'ico-play') el.appendChild(icoCanvas('play'));
  });

  /* Scoreboard rows: ranked. The "LAST RUN" column shows K/Os from the round
     just finished so each round contributes visible info. */
  const rowsHost = section.querySelector('[data-rows]');
  ranked.forEach((p, i) => {
    const place = i + 1;
    const lastKos = lastRound?.kos?.get?.(p.idx) || 0;
    const score = p.score * 100 + p.ko * 10;
    rowsHost.appendChild(buildRow({ place, p, lastKos, score, isWinner: place === 1 && (champion || roundWinner) }));
  });

  /* Confetti only when there's a real winner to celebrate. */
  if(podium){
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
  }

  section.querySelector('[data-action="menu"]').addEventListener('click', () => navigate('title'));
  const nextBtn = section.querySelector('[data-action="next"]');
  if(nextBtn) nextBtn.addEventListener('click', () => navigate('game'));
}

function buildRow({ place, p, lastKos, score, isWinner }){
  const row = document.createElement('div');
  row.className = 'sb-row' + (isWinner && place === 1 ? ' win' : '');

  const pos = document.createElement('span'); pos.className = 'pos'; pos.textContent = PLACE_GLYPH[place] || place;
  const pname = document.createElement('span'); pname.className = 'pname';
  const av = charCanvas(p.id); av.classList.add('av'); pname.appendChild(av);
  pname.appendChild(document.createTextNode(p.name));

  const wins = document.createElement('span'); wins.textContent = String(p.score);
  const ko = document.createElement('span'); ko.textContent = String(p.ko);
  const last = document.createElement('span'); last.textContent = lastKos > 0 ? `${lastKos} KO` : '—';
  const sc = document.createElement('span');
  sc.innerHTML = isWinner && place === 1 ? `<b>${score}</b>` : String(score);

  row.append(pos, pname, wins, ko, last, sc);
  return row;
}
