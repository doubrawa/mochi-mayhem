/* Player entity: position is in TILE coordinates as floats.
   The hitbox is a centered AABB smaller than a tile so players can squeeze
   between corners when aligned, just like classic Bomberman.

   Movement:
   - Direction comes from the input system as (dx, dy) each in {-1,0,1}.
   - We try the X axis and the Y axis separately, snapping back when blocked.
     This produces natural wall-sliding without diagonal cheats.
   - When only one axis is pressed, we softly nudge the player toward the
     center of the perpendicular axis, so they don't get stuck on corners. */

import { TILE } from './field.js';

const HALF = 0.40;          // hitbox half-extent in tiles
const NUDGE_PX = 0.30;      // axis re-centering speed in tiles/sec when single-axis

export function createPlayer(slot, schemeId, charId, controllerType, displayName){
  return {
    idx: slot.idx,            // 0..7
    charId,                    // sprite identity
    name: displayName,         // user-entered or default
    scheme: schemeId,          // input scheme (wasd/arrows/...) — null for cpu/off
    type: controllerType,      // 'human' | 'cpu' | 'off'
    x: slot.x + 0.5,
    y: slot.y + 0.5,
    speed: 4.5,                // tiles per second
    facing: 'down',
    alive: true,
    bombHeld: false,
  };
}

/* Move one player by dt seconds along (dx,dy), respecting field collisions. */
export function stepPlayer(p, dx, dy, dt, field){
  if(!p.alive) return;

  /* normalise so diagonals aren't faster */
  if(dx !== 0 || dy !== 0){
    const m = Math.hypot(dx, dy) || 1;
    dx /= m; dy /= m;
  }

  /* facing — pick whichever axis is dominant */
  if(Math.abs(dx) > Math.abs(dy)){
    p.facing = dx < 0 ? 'left' : 'right';
  } else if(dy !== 0){
    p.facing = dy < 0 ? 'up' : 'down';
  }

  /* X step.  If the candidate position collides we just don't advance — the
     remaining gap is ≤ one frame's movement (≤ 4 px at 60fps), invisible. */
  if(dx !== 0){
    const nx = p.x + dx * p.speed * dt;
    if(canFit(field, nx, p.y)) p.x = nx;
  } else {
    p.x = nudgeToward(p.x, dt);
  }

  /* Y step */
  if(dy !== 0){
    const ny = p.y + dy * p.speed * dt;
    if(canFit(field, p.x, ny)) p.y = ny;
  } else {
    p.y = nudgeToward(p.y, dt);
  }
}

function nudgeToward(v, dt){
  const target = Math.floor(v) + 0.5;
  const d = target - v;
  if(Math.abs(d) < 0.01) return target;
  const step = NUDGE_PX * dt * Math.sign(d);
  return Math.abs(step) >= Math.abs(d) ? target : v + step;
}

/* True iff a HALF-sized AABB centered at (cx,cy) sits on walkable tiles only. */
function canFit(field, cx, cy){
  const x0 = Math.floor(cx - HALF);
  const x1 = Math.floor(cx + HALF);
  const y0 = Math.floor(cy - HALF);
  const y1 = Math.floor(cy + HALF);
  for(let y = y0; y <= y1; y++){
    for(let x = x0; x <= x1; x++){
      if(field.at(x, y) !== TILE.FLOOR) return false;
    }
  }
  return true;
}

