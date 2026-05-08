/* Power-up pickups: entities that sit on a floor tile until a player walks
   over them.  Drops happen when a box is destroyed; the goodieFreq slider
   in the lobby controls drop probability. */

/* Drop probabilities for the lobby slider's three positions. */
export const DROP_CHANCE = [0.15, 0.30, 0.50];

/* Power-ups we ACTUALLY apply this etappe.  The other 4 (kick / glove / ice /
   magnet) ship visually as sprites but are not in the random drop pool yet. */
export const PICKUP_POOL = [
  'bomb', 'fire', 'speed', 'remote', 'shield', 'super', 'ghost', 'slow',
];

/* Caps so a runaway match doesn't produce comical superplayers. */
export const MAX_BOMBS = 8;
export const MAX_RANGE = 8;
export const MAX_SPEED = 8.5;

/* Ghost duration (seconds while phasing through walls). */
export const GHOST_DURATION = 5;
/* Slow duration applied to OTHER players (seconds). */
export const SLOW_DURATION = 3;
/* Slow multiplier (50%). */
export const SLOW_FACTOR = 0.5;

let nextPickupId = 1;

export function createPickup(type, x, y){
  return { id: nextPickupId++, type, x, y };
}

export function pickRandomPickup(rng = Math.random){
  return PICKUP_POOL[Math.floor(rng() * PICKUP_POOL.length)];
}

/* Apply a picked-up power-up to the player.  `slowOthers` is a callback the
   engine provides so the slow power-up can reach into other players' state
   without coupling pickups.js to the engine. */
export function applyPickup(player, type, ctx){
  switch(type){
    case 'bomb':
      player.bombMax = Math.min(MAX_BOMBS, player.bombMax + 1);
      break;
    case 'fire':
      player.range = Math.min(MAX_RANGE, player.range + 1);
      break;
    case 'speed':
      player.speed = Math.min(MAX_SPEED, player.speed + 0.5);
      break;
    case 'remote':
      player.hasRemote = true;
      break;
    case 'shield':
      player.shieldStacks = (player.shieldStacks || 0) + 1;
      break;
    case 'super':
      player.hasSuper = true;
      break;
    case 'ghost':
      player.ghostUntil = ctx.elapsed + GHOST_DURATION;
      break;
    case 'slow':
      ctx.slowOthers(player, SLOW_DURATION);
      break;
    /* The remaining 4 are dropped as sprites but no effect yet — they'll
       still register in player.collected for HUD display. */
    case 'kick':
      player.hasKick = true;
      break;
    case 'glove':
      player.hasGlove = true;
      break;
    case 'ice':
      player.hasIce = true;
      break;
    case 'magnet':
      player.hasMagnet = true;
      break;
  }
  /* Maintain a list of all collected types for the HUD display. */
  if(!player.collected) player.collected = [];
  player.collected.push(type);
}
