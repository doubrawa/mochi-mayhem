/* Wire protocol for host <-> client messaging.
   Messages are JSON over WebRTC data channels — small enough that we don't
   bother with a binary format yet. Every message has a `t` (type) tag. */

/* Client → host */
export const MSG_JOIN  = 'join';      // { name, charId }
export const MSG_INPUT = 'input';     // { dx, dy, bomb }
export const MSG_LEAVE = 'leave';     // {}
export const MSG_PICK  = 'pick';      // { charId } — switch character in lobby

/* Host → client */
export const MSG_WELCOME  = 'welcome';   // { idx, lobby }
export const MSG_LOBBY    = 'lobby';     // { players, fieldSize, rounds, timeLimit, goodieFreq }
export const MSG_START    = 'start';     // { lobby, fieldSeed }
export const MSG_FIELD    = 'field';     // { width, height, tiles: [int...] }  one-shot at round start
export const MSG_STATE    = 'state';     // per-tick player/bomb/pickup snapshot
export const MSG_EVENTS   = 'events';    // batch of game events (boxBroken, pickupTaken, etc.)
export const MSG_ROUNDEND = 'roundend';  // { result, match }
export const MSG_KICK     = 'kick';      // { reason }   — host kicks a client

/* Helpers — JSON.stringify/parse today, easy to upgrade later. */
export function encode(msg){ return JSON.stringify(msg); }
export function decode(raw){
  try { return JSON.parse(raw); } catch { return null; }
}

/* Compact field encoding: tiles to a flat number array. */
export function encodeField(field){
  return {
    width: field.width,
    height: field.height,
    tiles: Array.from(field.tiles),
  };
}

/* Compact per-tick snapshot.  We keep only what the client renders — booleans
   for status overlays so the client can show ghost/slow/shield filters
   without re-running engine logic. */
export function encodeState(engine){
  const e = engine.elapsed;
  return {
    e,
    p: engine.players.map(p => ({
      i: p.idx,
      x: +p.x.toFixed(3),
      y: +p.y.toFixed(3),
      a: p.alive ? 1 : 0,
      g: e < (p.ghostUntil || 0) ? 1 : 0,
      s: e < (p.slowUntil || 0) ? 1 : 0,
      sh: (p.shieldStacks || 0) > 0 ? 1 : 0,
    })),
    b: engine.bombs.map(b => ({
      i: b.id,
      x: b.x, y: b.y,
      hot: b.fuse <= 1.0 ? 1 : 0,
    })),
    pu: engine.pickups.map(pk => ({
      i: pk.id,
      t: pk.type,
      x: pk.x, y: pk.y,
    })),
    ex: engine.explosions.map(ex => ({
      ttl: +ex.ttl.toFixed(2),
      s: ex.segments.map(s => ({ x: s.x, y: s.y, k: s.kind })),
    })),
  };
}
