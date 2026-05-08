/* Game engine — owns state, runs the rAF loop, mediates between
   field/players/input and the rendering DOM in screens/game.js.

   The engine is rendering-agnostic: it tells the renderer what changed and
   the renderer decides how to draw.  This keeps screens/game.js free of
   gameplay logic. */

import { createField, FIELD_PRESETS, TILE } from './field.js';
import { createInput, CONTROL_SCHEMES } from './input.js';
import { createPlayer, stepPlayer } from './players.js';

/* The first 4 humans get keyboards, in declaration order. */
const HUMAN_SCHEMES = ['wasd', 'arrows', 'ijkl', 'numpad'];

export function createEngine(lobby, hooks){
  const presetId = lobby.fieldSize in FIELD_PRESETS ? lobby.fieldSize : 'medium';
  const activePlayers = lobby.players.filter(p => p.mode !== 'off');
  const field = createField(presetId, activePlayers.length);
  const input = createInput();

  /* Build players: pull spawn positions from the field, hand keyboards to humans. */
  const players = [];
  let humanCount = 0;
  activePlayers.forEach((cfg, i) => {
    const spawn = field.spawns[i] || field.spawns[0];
    const slot = { idx: i, x: spawn[0], y: spawn[1] };
    let scheme = null;
    if(cfg.mode === 'human'){
      scheme = HUMAN_SCHEMES[humanCount] || null;
      humanCount++;
    }
    players.push(createPlayer(slot, scheme, cfg.id, cfg.mode, cfg.name));
  });

  /* Track previous bomb-key state per player for edge detection (used in Etappe 3). */
  const prevBomb = new Map();

  let rafHandle = null;
  let timeoutHandle = null;
  let lastTime = 0;
  let running = false;

  function tick(now){
    if(!running) return;
    if(!lastTime) lastTime = now;
    const dt = Math.min(0.05, (now - lastTime) / 1000);   // clamp huge deltas
    lastTime = now;

    /* Drive each human player from input. CPU/off players sit still for now. */
    for(const p of players){
      if(p.type !== 'human' || !p.scheme){ continue; }
      const wasBomb = prevBomb.get(p.idx) || false;
      const r = input.read(p.scheme, wasBomb);
      prevBomb.set(p.idx, r.bomb);
      stepPlayer(p, r.dx, r.dy, dt, field);
    }

    if(hooks.onTick) hooks.onTick(dt);
    if(hooks.onRender) hooks.onRender();

    scheduleNext();
  }

  /* Prefer rAF for smoothness; fall back to setTimeout when the tab is hidden
     (browsers throttle or freeze rAF in background tabs). */
  function scheduleNext(){
    if(!running) return;
    rafHandle = null; timeoutHandle = null;
    if(document.hidden){
      timeoutHandle = setTimeout(() => tick(performance.now()), 33);
    } else {
      rafHandle = requestAnimationFrame(tick);
    }
  }

  function onVisibilityChange(){
    if(!running) return;
    /* When returning to foreground, switch back to rAF promptly. */
    if(!document.hidden && !rafHandle){
      if(timeoutHandle){ clearTimeout(timeoutHandle); timeoutHandle = null; }
      rafHandle = requestAnimationFrame(tick);
    }
  }

  return {
    field,
    players,
    presetId,
    start(){
      running = true;
      lastTime = 0;
      document.addEventListener('visibilitychange', onVisibilityChange);
      scheduleNext();
    },
    stop(){
      running = false;
      if(rafHandle){ cancelAnimationFrame(rafHandle); rafHandle = null; }
      if(timeoutHandle){ clearTimeout(timeoutHandle); timeoutHandle = null; }
      document.removeEventListener('visibilitychange', onVisibilityChange);
      input.teardown();
    },
  };
}

export { TILE, CONTROL_SCHEMES };
