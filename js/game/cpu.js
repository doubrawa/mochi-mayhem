/* CPU controller — clean rewrite per user spec.
 *
 *   Priority of goals (the CPU tries each in turn):
 *     1. ATTACK  — drop a bomb where its blast hits an enemy
 *     2. CLEAR   — drop a bomb that destroys crates (preferring crates near
 *                  enemies, so we open paths toward them)
 *     3. PICKUP  — walk to the nearest reachable power-up
 *
 *   For the chosen goal we build a complete ROUTE: walk steps to reach the
 *   target tile, the bomb-plant step (if applicable), then walk steps to a
 *   verified safe escape tile.  The CPU then executes the route step by step
 *   and DOES NOT reconsider its goal mid-route — once the goal is chosen, we
 *   commit.  Replanning happens only when the route is fully done (or in the
 *   one survival-reflex case below).
 *
 *   The single exception is a survival reflex: if the CPU's CURRENT tile is
 *   about to explode in < 1.5 s and the route's next step doesn't escape it,
 *   we abandon the route and walk the closest safe step.  This is a reflex,
 *   not goal weighing.
 *
 *   Routes that include a bomb-plant always have the escape pre-computed at
 *   plan time, so under a single CPU's bomb the escape is guaranteed safe.
 *   Other CPUs placing bombs on our path is the inherent risk of "no
 *   midway re-evaluation".
 */

import { TILE } from './field.js';
import { computeExplosionSegments, playerHitByBlast, FUSE_SECONDS } from './bombs.js';
import { tilesUnderPlayer } from './players.js';

const CARDINALS = [[1,0],[-1,0],[0,1],[0,-1]];
const ARRIVE_EPS = 0.18;
const BFS_LIMIT = 24;
const ESCAPE_MARGIN = 1.2;          // arrival + this < blast time
/* Threshold above the max fuse (3 s) so we react to ANY bomb covering our
   tile, even one just placed.  This is the only mid-route override; without
   it the CPU walks committed escape paths that another CPU's bomb has cut. */
const SURVIVAL_THRESHOLD = 4.0;
const STUCK_TICKS_MAX = 8;          // can't move for this many ticks → abandon route, replan
/* Consecutive no-route idle ticks before the CPU gives up waiting and
   wanders one tile.  Catches the dead-end where planRoute keeps
   returning null (e.g. EXPLORE suppressed by the ping-pong guard) —
   without this the CPU stands frozen until the world changes around
   it. ~45 ticks ≈ 0.75 s at 60 fps. */
const IDLE_TICKS_MAX = 45;
/* How many tiles ahead of a moving enemy to treat as a bomb target.  A
   bomb has a 3 s fuse, so aiming only at where the enemy stands now almost
   always misses a runner; weighting the next couple of tiles in its
   heading lets the blast actually land on it.  Two tiles is the sweet
   spot — far enough to lead, short enough that erratic enemies don't make
   it noise. */
const LEAD_TILES = 2;

const PICKUP_VALUE = {
  bomb: 100, fire: 100, shield: 80,
  remote: 70, ghost: 60, kick: 60, magnet: 50, slow: 40,
  flash: 80, earthquake: 50,
  confuse: -1,
};

export function createCpuController(level = 'nice'){
  let route = null;     // { kind: 'attack'|'clear'|'pickup', steps: [{x,y,kind: 'walk'|'bomb'}] }
  let stepIdx = 0;
  let stuckTicks = 0;
  let idleTicks = 0;    // consecutive ticks spent idle with no route
  let lastPos = null;
  /* Random startup delay (0-1.5 s) prevents 6 CPUs from all dropping their
     first bomb on the same tick.  Synchronised early bombs make the field
     unplannable: every CPU's escape route gets cut by a neighbour's bomb. */
  const startupDelay = Math.random() * 1.5;
  /* Track the previous tile we were on so EXPLORE can avoid the
     "ping-pong between adjacent tiles in a tight spawn corner" case:
     when the only EXPLORE candidate is the tile we just came from, we
     idle instead of walking back. */
  let prevTile = null;
  let curTile = null;
  /* Enemy positions from the previous tick, idx → {x,y}.  Used to derive
     each enemy's current heading for LEAD targeting (buildEnemyTargets). */
  const enemyPrev = new Map();

  return {
    decide(me, view){
      const myTx = Math.floor(me.x);
      const myTy = Math.floor(me.y);
      const tileKey = myTx + ',' + myTy;
      if(curTile !== null && curTile !== tileKey){
        prevTile = curTile;
      }
      curTile = tileKey;
      const danger = buildDangerMap(view);

      /* Predicted, trap-weighted enemy target tiles for ATTACK planning.
         Build from last tick's positions, THEN record this tick's — order
         matters so the heading is the delta across the tick.  Done every
         tick (even when we return early) so the heading stays continuous. */
      const enemyTargets = buildEnemyTargets(view, me, enemyPrev);
      recordEnemyPositions(view, me, enemyPrev);

      /* ── SURVIVAL REFLEX ──────────────────────────────────────────────
         Body-extent check: every tile the HITBOX overdaps by more than
         the engine's playerHitByBlast tolerance is treated as part of
         "where I am".  If any of those tiles is in actual blast or in a
         foreign bomb's line of fire AND our committed route doesn't
         deliver us to a permanently-safe destination, we abandon the
         route and commit to a MULTI-STEP flee route.  Critically: we do
         NOT recompute per tick — once a flee route is committed and its
         destination is still safe, routeWillSave keeps the reflex
         quiet so the CPU follows the path without oscillating between
         alternative flee targets every frame. */
      const foreignWorst = buildForeignWorstDanger(view, me);
      let myBlastT = Infinity;
      let inForeignThreat = false;
      for(const [bx, by] of tilesUnderPlayer(me)){
        if(!playerHitByBlast(me, bx, by)) continue;
        const k = bx + ',' + by;
        const t = danger.get(k);
        if(t !== undefined && t < myBlastT) myBlastT = t;
        if(foreignWorst.has(k)) inForeignThreat = true;
      }
      const inActualBlast = myBlastT < SURVIVAL_THRESHOLD;
      if((inActualBlast || inForeignThreat)
         && !routeWillSave(route, stepIdx, danger, foreignWorst)){
        const fleeRoute = planFlee(me, view, danger, foreignWorst);
        if(fleeRoute){
          route = fleeRoute; stepIdx = 0;
          return walkToward(me, fleeRoute.steps[0]);
        }
      }

      /* ── REMOTE KILL TRIGGER ──────────────────────────────────────────
         A remote bomb has an infinite fuse and never detonates on its
         own — the CPU must trigger it explicitly.  The instant one of our
         live bombs has an enemy in its blast, and firing won't catch our
         own body, detonate.  Checked every tick (not just at route end)
         so we blow it the moment an enemy steps into the kill zone. */
      if(me.hasRemote
         && ownBombHitsEnemy(view, me)
         && !ownDetonationHitsSelf(view, me)){
        return { dx: 0, dy: 0, bomb: false, detonate: true };
      }

      /* ── STUCK DETECTION ──────────────────────────────────────────────
         If we haven't moved a meaningful amount for STUCK_TICKS_MAX ticks
         (e.g. another CPU dropped a bomb in our path), drop the route and
         replan. */
      const posKey = me.x.toFixed(1) + ',' + me.y.toFixed(1);
      if(posKey === lastPos) stuckTicks++;
      else { stuckTicks = 0; lastPos = posKey; }
      if(stuckTicks > STUCK_TICKS_MAX){
        route = null; stepIdx = 0; stuckTicks = 0;
      }

      /* ── PLAN ROUTE if we don't have one ──────────────────────────────
         When our own bomb is still ticking and we're safely outside the
         blast, three cases:
           a) We can place another bomb (multi-bomb pickup, bombsLive <
              bombMax) → fall through to planning.  The chain-bonus in the
              scorer will prefer placements that cascade with the first.
           b) We can't place more, but we have hasRemote → detonate it now.
           c) Else → just wait it out.  Replanning here would walk us back
              through the existing blast. */
      if(!route || stepIdx >= route.steps.length){
        const safeHere = !danger.has(myTx + ',' + myTy);
        const liveOwn  = me.bombsLive > 0;
        const canPlaceMore = me.bombsLive < me.bombMax;
        /* At max capacity with a live bomb there's nothing more to place.
           A remote bomb never goes off by itself, so detonate it (when we
           won't catch our own blast); a normal bomb we just wait out —
           replanning here would walk us back through our own blast. */
        if(safeHere && liveOwn && !canPlaceMore){
          if(me.hasRemote && !ownDetonationHitsSelf(view, me)){
            return { dx: 0, dy: 0, bomb: false, detonate: true };
          }
          if(!me.hasRemote) return idle();
          /* remote, but detonating would graze us — fall through and let
             planning move us somewhere safer first. */
        }
        const allowBomb = view.elapsed >= startupDelay;
        route = planRoute(me, view, danger, allowBomb, prevTile, enemyTargets);
        stepIdx = 0;
        if(!route){
          /* Nothing productive to do.  Don't sit on a live remote bomb —
             detonate it (when safe) rather than standing frozen.  With
             spare bomb slots the at-max branch above never fires, so
             without this a remote bomb placed early would never go off
             and the CPU would just stop. */
          if(safeHere && liveOwn && me.hasRemote && !ownDetonationHitsSelf(view, me)){
            return { dx: 0, dy: 0, bomb: false, detonate: true };
          }
          /* Planning failed.  Tolerate a short wait (the world is often
             about to change — a blast clearing, a crate breaking), but
             after IDLE_TICKS_MAX ticks force a one-tile wander to any
             safe passable neighbour.  prevTile is allowed here: after a
             genuine pause this is "turn around and go back", not the
             rapid ping-pong the EXPLORE guard exists to stop. */
          idleTicks++;
          if(idleTicks > IDLE_TICKS_MAX){
            for(const [dx, dy] of CARDINALS){
              const nx = myTx + dx, ny = myTy + dy;
              if(!isPassable(view, me, nx, ny)) continue;
              const blastT = danger.get(nx + ',' + ny);
              if(blastT !== undefined && blastT < 2.0) continue;
              idleTicks = 0;
              route = { kind: 'wander', steps: [{ x: nx, y: ny, kind: 'walk' }] };
              stepIdx = 0;
              return walkToward(me, route.steps[0]);
            }
          }
          return idle();
        }
        idleTicks = 0;
      }

      /* ── ROUTE INTEGRITY ─────────────────────────────────────────────
         The next tile we'd walk onto must not be about to explode AND
         must still be passable.  If another CPU's bomb covers it (blast)
         or sits on it (blocking the tile), abandon the route and replan. */
      if(!nextStepStillSafe(route, stepIdx, danger, view, me)){
        route = null; stepIdx = 0;
        return idle();
      }

      /* ── EXECUTE current step ───────────────────────────────────────── */
      const step = route.steps[stepIdx];

      if(step.kind === 'bomb'){
        /* Plant when fully centred on the bomb tile. */
        if(myTx === step.x && myTy === step.y && tileReached(me, step)){
          if(me.bombsLive < me.bombMax){
            stepIdx++;
            return { dx: 0, dy: 0, bomb: true };
          }
          /* Capacity full — wait one tick. */
          return idle();
        }
        return walkToward(me, step);
      }

      /* Walk step.  EVERY step must be fully centred on before advancing,
         so the CPU walks to the centre of each tile before turning.
         Otherwise it changes axis mid-tile and the body extent straddles
         perpendicular tiles around corners — that's the "hanging at
         corners" feel.  Centring at every step costs a couple of extra
         ticks per turn but keeps movement clean and predictable. */
      if(myTx === step.x && myTy === step.y){
        if(!tileReached(me, step)) return walkToward(me, step);
        stepIdx++;
        if(stepIdx >= route.steps.length) return idle();
        return walkToward(me, route.steps[stepIdx]);
      }
      return walkToward(me, step);
    },
    _debug(){ return { route, stepIdx }; },
  };
}

/* ====================================================
   Route planning — try each priority in order.
   ==================================================== */

function planRoute(me, view, danger, allowBomb = true, prevTile = null, enemyTargets = null){
  /* BFS reachability — every path tile must be currently passable AND
     safe-on-arrival under the current danger map. */
  const reach = bfsSafe(me, view, danger);

  /* Soft priority: each goal type produces its best scored candidate; we
     pick the highest-scoring across all kinds.  Score weights are tuned
     so the user's example works (enemy at dist 10 vs pickup at dist 2 →
     pickup wins) without losing the obvious cases (close attack > far
     pickup; massive crate cluster > nearby pickup). */
  const candidates = [];
  if(allowBomb){
    const a = planAttackCandidate(me, view, reach, enemyTargets);
    if(a) candidates.push(a);
    const c = planClearCandidate(me, view, reach);
    if(c) candidates.push(c);
  }
  const pu = planPickupCandidate(me, view, reach);
  if(pu) candidates.push(pu);
  const ps = planPursueCandidate(me, view, reach);
  if(ps) candidates.push(ps);

  if(candidates.length){
    candidates.sort((a, b) => b.score - a.score);
    const best = candidates[0];
    const includeBomb = best.kind === 'attack' || best.kind === 'clear';
    return assembleRoute(best.kind, me, reach, best.x, best.y, includeBomb, best.escape || null);
  }

  return planExplore(me, view, reach, prevTile);
}

/* Count an enemy's orthogonal escape exits — floor tiles it could step
   onto.  Few exits ⇒ cornered ⇒ a higher-value bomb target (TRAP
   awareness).  Cheap (4 lookups), so it can feed the pre-sort score. */
function enemyExitCount(view, e){
  const ex = Math.floor(e.x), ey = Math.floor(e.y);
  const f = view.field;
  let exits = 0;
  for(const [dx, dy] of CARDINALS){
    const nx = ex + dx, ny = ey + dy;
    if(nx < 0 || ny < 0 || nx >= f.width || ny >= f.height) continue;
    if(f.at(nx, ny) === TILE.FLOOR) exits++;
  }
  return exits;
}

/* Build the weighted enemy TARGET map used by planAttackCandidate.
   For each living enemy:
     • trapMult scales every weight up when the enemy has few exits, so a
       cornered enemy outranks one in the open (TRAP awareness).
     • If it's moving, weight the next LEAD_TILES tiles in its heading
       (LEAD targeting) plus a small weight on its current tile (it might
       stop/turn).  If it's standing still, weight only its current tile.
   Projection stops at the first non-floor tile (a blast can't reach
   through a wall anyway). */
function buildEnemyTargets(view, me, enemyPrev){
  const targets = new Map();
  const add = (x, y, w) => {
    const k = x + ',' + y;
    targets.set(k, (targets.get(k) || 0) + w);
  };
  const f = view.field;
  for(const e of view.players){
    if(e.idx === me.idx || !e.alive) continue;
    const ex = Math.floor(e.x), ey = Math.floor(e.y);
    const trapMult = 1 + (4 - enemyExitCount(view, e)) * 0.4;
    const prev = enemyPrev.get(e.idx);
    let dx = 0, dy = 0;
    if(prev){
      const rdx = e.x - prev.x, rdy = e.y - prev.y;
      /* Dominant axis only — diagonal motion isn't possible on the grid. */
      if(Math.abs(rdx) >= Math.abs(rdy)){
        if(Math.abs(rdx) > 0.02) dx = Math.sign(rdx);
      } else if(Math.abs(rdy) > 0.02){
        dy = Math.sign(rdy);
      }
    }
    if(dx === 0 && dy === 0){
      add(ex, ey, 1.0 * trapMult);
      continue;
    }
    add(ex, ey, 0.4 * trapMult);
    let cx = ex, cy = ey;
    for(let i = 1; i <= LEAD_TILES; i++){
      cx += dx; cy += dy;
      if(cx < 0 || cy < 0 || cx >= f.width || cy >= f.height) break;
      if(f.at(cx, cy) !== TILE.FLOOR) break;
      add(cx, cy, 1.0 * trapMult);
    }
  }
  return targets;
}

/* Snapshot the current enemy positions for next tick's heading delta. */
function recordEnemyPositions(view, me, enemyPrev){
  enemyPrev.clear();
  for(const e of view.players){
    if(e.idx === me.idx || !e.alive) continue;
    enemyPrev.set(e.idx, { x: e.x, y: e.y });
  }
}

/* ATTACK candidate: a bomb position whose blast covers a weighted enemy
   TARGET tile, with a verified escape.  `enemyTargets` (built by
   buildEnemyTargets) is a map of tileKey → weight that already folds in
   two things:
     • LEAD TARGETING — a moving enemy's predicted next tiles are weighted,
       not just where it stands now, so a 3 s fuse actually catches a
       running target instead of always exploding where it used to be.
     • TRAP awareness — enemies with few escape exits get a higher weight,
       so we prefer bombing a cornered enemy over one in the open.
   Two phases for speed: score every hitting placement cheaply, sort, then
   verify the expensive escape only from the best down until one is viable
   (computeEscape used to run for EVERY hitting tile every tick). */
function planAttackCandidate(me, view, reach, enemyTargets){
  if(me.bombsLive >= me.bombMax) return null;
  if(!enemyTargets || enemyTargets.size === 0) return null;

  /* Tiles already covered by one of our own ticking bombs.  Placing a
     second bomb on the same line just amplifies the same blast — looks
     pointless and visually silly ("two bombs in a row").  Skip them. */
  const ownBlastTiles = ownBombBlastTiles(view, me);
  const raw = [];
  for(const [k, info] of reach){
    if(ownBlastTiles.has(k)) continue;
    const [x, y] = k.split(',').map(Number);
    const segs = computeExplosionSegments(view.field, x, y, me.range);
    let hitWeight = 0;
    for(const s of segs){
      const w = enemyTargets.get(s.x + ',' + s.y);
      if(w) hitWeight += w;
    }
    if(hitWeight === 0) continue;
    /* Base 100 + 30 per weighted hit − 8 per tile of distance. */
    const score = 100 + hitWeight * 30 - info.dist * 8;
    raw.push({ x, y, score, dist: info.dist });
  }
  if(raw.length === 0) return null;
  raw.sort(candidateOrder);
  for(const c of raw){
    const escape = computeEscape(me, view, c.x, c.y, 2, me.range + 2);
    if(escape) return { kind: 'attack', x: c.x, y: c.y, score: c.score, dist: c.dist, escape };
  }
  return null;
}

/* PURSUE candidate: walk toward the closest reachable enemy without
   bombing.  Lower base than ATTACK so a real attack window always wins
   when one is available. */
function planPursueCandidate(me, view, reach){
  const enemies = view.players.filter(p => p.idx !== me.idx && p.alive);
  if(enemies.length === 0) return null;
  let closest = null;
  for(const e of enemies){
    const ex = Math.floor(e.x), ey = Math.floor(e.y);
    const info = reach.get(ex + ',' + ey);
    if(!info || info.dist === 0) continue;
    if(!closest || info.dist < closest.dist){
      closest = { x: ex, y: ey, dist: info.dist };
    }
  }
  if(!closest) return null;
  /* Base 80 − 6 per tile.  Beats far pickups when the enemy is close (dist
     1 → 74), loses to a nearby pickup when the enemy is across the map. */
  const score = 80 - closest.dist * 6;
  return { kind: 'pursue', x: closest.x, y: closest.y, score, dist: closest.dist };
}

/* Goal 4 (always-on fallback): EXPLORE — pick the farthest reachable safe
   tile and walk there.  Never returns null as long as ANY neighbour is
   reachable, EXCEPT when the only candidate at max distance is the tile
   we just came from (prevTile).  Without that exception, a CPU stuck in
   a tight 2-3-tile spawn corner would ping-pong between the two adjacent
   tiles forever — visible to the user as the back-and-forth.  Returning
   null lets the outer idle path keep us put until the world changes. */
function planExplore(me, view, reach, prevTile = null){
  let best = null;
  for(const [k, info] of reach){
    if(info.dist === 0) continue;
    if(!best || info.dist > best.dist){
      const [x, y] = k.split(',').map(Number);
      best = { x, y, dist: info.dist, key: k };
    }
  }
  if(!best) return null;
  /* Refuse to walk back to the tile we just left if it's the only
     "farthest" candidate we found — that's the ping-pong case. */
  if(best.dist === 1 && best.key === prevTile) return null;
  return assembleRoute('explore', me, reach, best.x, best.y, false, null);
}

/* CLEAR candidate: a bomb position that destroys at least one crate.
   Score is scaled by how many crates remain on the field — early game
   (lots of crates) we prioritise CLEAR; late game (few crates) it drops
   well below ATTACK and PICKUP, since end-game is about killing not
   chopping wood. */
function planClearCandidate(me, view, reach){
  if(me.bombsLive >= me.bombMax) return null;
  /* Don't bomb tiles already in one of our own bombs' blast zones —
     adjacent placement just doubles up on the same area. */
  const ownBlastTiles = ownBombBlastTiles(view, me);
  const totalCrates = countCrates(view.field);
  /* Multiplier: ~1.2 when ≥60 crates left, smoothly down to 0.3 when
     few are left.  Threshold 60 is a typical post-spawn crate count on
     a medium field. */
  const crateFactor = Math.min(1.2, Math.max(0.3, totalCrates / 60));

  /* Same two-phase trick as ATTACK: cheap score for every crate-hitting
     placement, sort, then verify the expensive escape only from the best
     down until one is viable. */
  const raw = [];
  for(const [k, info] of reach){
    if(ownBlastTiles.has(k)) continue;
    const [x, y] = k.split(',').map(Number);
    const segs = computeExplosionSegments(view.field, x, y, me.range);
    let crates = 0;
    for(const s of segs){
      if(view.field.at(s.x, s.y) === TILE.BOX) crates++;
    }
    if(crates === 0) continue;
    const score = (50 + crates * 30 - info.dist * 6) * crateFactor;
    raw.push({ x, y, score, dist: info.dist });
  }
  if(raw.length === 0) return null;
  raw.sort(candidateOrder);
  for(const c of raw){
    const escape = computeEscape(me, view, c.x, c.y, 2, me.range + 2);
    if(escape) return { kind: 'clear', x: c.x, y: c.y, score: c.score, dist: c.dist, escape };
  }
  return null;
}

function countCrates(field){
  let c = 0;
  for(let y = 0; y < field.height; y++){
    for(let x = 0; x < field.width; x++){
      if(field.at(x, y) === TILE.BOX) c++;
    }
  }
  return c;
}

/* PICKUP candidate: closest reachable pickup with a positive value
   (skipping Curse).  Base score and distance falloff are tuned so that
   pickups out-prioritise CLEAR almost across the board — only a really
   fat multi-crate cluster beats a reachable pickup.  ATTACK with a real
   hit still wins because attack adds 30 per enemy hit. */
function planPickupCandidate(me, view, reach){
  if(view.pickups.length === 0) return null;
  let best = null;
  for(const pu of view.pickups){
    const info = reach.get(pu.x + ',' + pu.y);
    if(!info) continue;
    const value = PICKUP_VALUE[pu.type] ?? 30;
    if(value <= 0) continue;
    /* Base 160 − 3 per tile.  Even pickups 15 tiles away score 115,
       beating a 2-crate CLEAR (typical ~92).  Big 4-5-crate clears still
       outscore. */
    const score = 160 - info.dist * 3;
    if(!best || score > best.score){
      best = { kind: 'pickup', x: pu.x, y: pu.y, score, dist: info.dist };
    }
  }
  return best;
}

function assembleRoute(kind, me, reach, tx, ty, includeBomb, escape){
  const myTx = Math.floor(me.x), myTy = Math.floor(me.y);
  const walkPath = reconstructPath(reach, myTx, myTy, tx, ty) || [];
  const steps = walkPath.map(([x, y]) => ({ x, y, kind: 'walk' }));
  if(includeBomb){
    steps.push({ x: tx, y: ty, kind: 'bomb' });
    if(escape){
      for(const [x, y] of escape) steps.push({ x, y, kind: 'walk' });
    }
  }
  if(steps.length === 0) return null;
  return { kind, steps };
}

/* ====================================================
   BFS helpers + danger map.
   ==================================================== */

function isPassable(view, me, tx, ty){
  const f = view.field;
  if(tx < 0 || ty < 0 || tx >= f.width || ty >= f.height) return false;
  if(f.at(tx, ty) !== TILE.FLOOR) return false;
  for(const b of view.bombs){
    if(b.x === tx && b.y === ty && !me.passthrough.has(b.id)) return false;
  }
  return true;
}

function buildDangerMap(view){
  /* Chain-aware: a bomb in another bomb's blast inherits the smaller fuse. */
  const bombs = view.bombs;
  const eff = new Map();
  for(const b of bombs) eff.set(b.id, b.detonating ? 0 : Math.max(0, b.fuse));
  let changed = true;
  while(changed){
    changed = false;
    for(const a of bombs){
      const aFuse = eff.get(a.id);
      const aSegs = computeExplosionSegments(view.field, a.x, a.y, a.range);
      for(const s of aSegs){
        for(const b of bombs){
          if(b.id === a.id) continue;
          if(b.x === s.x && b.y === s.y){
            const bFuse = eff.get(b.id);
            if(aFuse < bFuse){ eff.set(b.id, aFuse); changed = true; }
          }
        }
      }
    }
  }
  const map = new Map();
  for(const b of bombs){
    const fuse = eff.get(b.id);
    const segs = computeExplosionSegments(view.field, b.x, b.y, b.range);
    for(const s of segs){
      const k = s.x + ',' + s.y;
      const cur = map.get(k);
      if(cur === undefined || fuse < cur) map.set(k, fuse);
    }
  }
  return map;
}

/* BFS that visits every tile reachable from `me` via passable, safe-on-
   arrival tiles.  Used for general planning. */
function bfsSafe(me, view, danger, startTx, startTy){
  const speed = Math.max(me.speed, 1);
  const sx = startTx !== undefined ? startTx : Math.floor(me.x);
  const sy = startTy !== undefined ? startTy : Math.floor(me.y);
  const visited = new Map();
  visited.set(sx + ',' + sy, { dist: 0, prev: null });
  /* Head-index queue instead of Array.shift(): shift() is O(n) per pop,
     which makes the whole BFS O(n²).  BFS is the hottest path in the CPU
     (run several times per tick per CPU), so we advance a read cursor and
     never mutate the array front. */
  const queue = [[sx, sy, 0]];
  let head = 0;
  while(head < queue.length){
    const [x, y, d] = queue[head++];
    if(d > BFS_LIMIT) continue;
    for(const [dx, dy] of CARDINALS){
      const nx = x + dx, ny = y + dy;
      const k = nx + ',' + ny;
      if(visited.has(k)) continue;
      if(!isPassable(view, me, nx, ny)) continue;
      const arriveT = (d + 1) / speed;
      const blastT = danger.get(k);
      if(blastT !== undefined && blastT < arriveT + ESCAPE_MARGIN) continue;
      visited.set(k, { dist: d + 1, prev: [x, y] });
      queue.push([nx, ny, d + 1]);
    }
  }
  return visited;
}

function reconstructPath(visited, fromTx, fromTy, toTx, toTy){
  const path = [];
  let cur = [toTx, toTy];
  while(cur[0] !== fromTx || cur[1] !== fromTy){
    path.unshift(cur);
    const node = visited.get(cur[0] + ',' + cur[1]);
    if(!node || !node.prev) return null;
    cur = node.prev;
  }
  return path;
}

/* Compute a complete ESCAPE PATH from a hypothetical-bomb tile to a
   permanently-safe destination, returning [[x,y],...] or null.  Callers
   pick how strict the escape distance must be: ATTACK uses range+3 / +4,
   CLEAR uses range+2 / +3 (we can afford a tighter escape when bombing
   crates because crate-clearing is what makes ATTACK options reachable
   in the first place; never bombing because the strict escape is
   unreachable is the worse failure mode). */
function computeEscape(me, view, bx, by, minCornerDist, minStraightDist){
  /* Hypothetical danger map = current bombs + new bomb at (bx,by). */
  const hyDanger = new Map();
  const allBombs = [...view.bombs, { id: -1, x: bx, y: by, range: me.range, fuse: FUSE_SECONDS, detonating: false }];
  const eff = new Map();
  for(const b of allBombs) eff.set(b.id, b.detonating ? 0 : Math.max(0, b.fuse));
  let changed = true;
  while(changed){
    changed = false;
    for(const a of allBombs){
      const aFuse = eff.get(a.id);
      const aSegs = computeExplosionSegments(view.field, a.x, a.y, a.range);
      for(const s of aSegs){
        for(const b of allBombs){
          if(b.id === a.id) continue;
          if(b.x === s.x && b.y === s.y){
            const bFuse = eff.get(b.id);
            if(aFuse < bFuse){ eff.set(b.id, aFuse); changed = true; }
          }
        }
      }
    }
  }
  for(const b of allBombs){
    const fuse = eff.get(b.id);
    const segs = computeExplosionSegments(view.field, b.x, b.y, b.range);
    for(const s of segs){
      const k = s.x + ',' + s.y;
      const cur = hyDanger.get(k);
      if(cur === undefined || fuse < cur) hyDanger.set(k, fuse);
    }
  }

  /* BFS from (bx,by) under the hypothetical danger.  Two tiers, in order:
       1. CORNER escape — destination differs from the bomb tile in BOTH x
          AND y, so a pillar or wall is between us and any future bomb at
          this spot.
       2. STRAIGHT escape — destination shares the bomb's row or column.
          A future fire-up bomb here could reach us, so we walk one more
          tile out. */
  const visited = bfsSafe(me, view, hyDanger, bx, by);
  let cornerBest = null;
  let straightBest = null;
  for(const [k, info] of visited){
    if(hyDanger.has(k)) continue;
    const [x, y] = k.split(',').map(Number);
    const isCorner = (x !== bx) && (y !== by);
    if(isCorner && info.dist >= minCornerDist){
      if(!cornerBest || info.dist < cornerBest.dist){
        cornerBest = { x, y, dist: info.dist };
      }
    } else if(!isCorner && info.dist >= minStraightDist){
      if(!straightBest || info.dist < straightBest.dist){
        straightBest = { x, y, dist: info.dist };
      }
    }
  }
  const best = cornerBest || straightBest;
  if(!best) return null;
  return reconstructPath(visited, bx, by, best.x, best.y);
}

/* Survival reflex: build a MULTI-STEP flee route to a safe destination.
   Returning a full route (not just the next step) is what stops the CPU
   from oscillating at corner transitions — once the route is committed,
   routeWillSave keeps the reflex quiet for the rest of the escape.
   Two-tier destination preference:
     1. CORNER tile — outside both the actual danger map AND every
        foreign bomb's worst-case row/column; chosen at the shortest
        distance.  "Around the corner" of the bomb.
     2. FAR tile — outside actual danger but still in some foreign
        line-of-fire.  Used when no true corner is reachable; we prefer
        the FARTHEST such tile (more tiles between us and the enemy bomb
        source). */
function planFlee(me, view, danger, foreignWorst){
  const visited = bfsSafe(me, view, danger);
  const myTx = Math.floor(me.x), myTy = Math.floor(me.y);
  let cornerBest = null;
  let farBest = null;
  for(const [k, info] of visited){
    if(info.dist === 0) continue;
    if(danger.has(k)) continue;
    const inForeign = foreignWorst && foreignWorst.has(k);
    if(!inForeign){
      if(!cornerBest || info.dist < cornerBest.dist){
        const [x, y] = k.split(',').map(Number);
        cornerBest = { x, y, dist: info.dist };
      }
    } else {
      if(!farBest || info.dist > farBest.dist){
        const [x, y] = k.split(',').map(Number);
        farBest = { x, y, dist: info.dist };
      }
    }
  }
  const best = cornerBest || farBest;
  if(!best){
    /* Truly trapped — single-step route into any passable neighbour. */
    for(const [dx, dy] of CARDINALS){
      const nx = myTx + dx, ny = myTy + dy;
      if(isPassable(view, me, nx, ny)){
        return { kind: 'flee', steps: [{ x: nx, y: ny, kind: 'walk' }] };
      }
    }
    return null;
  }
  const path = reconstructPath(visited, myTx, myTy, best.x, best.y);
  if(!path || path.length === 0) return null;
  return { kind: 'flee', steps: path.map(([x, y]) => ({ x, y, kind: 'walk' })) };
}

/* ====================================================
   Movement primitives.
   ==================================================== */

function tileReached(me, target){
  return Math.abs(me.x - (target.x + 0.5)) < ARRIVE_EPS
      && Math.abs(me.y - (target.y + 0.5)) < ARRIVE_EPS;
}

function walkToward(me, target){
  const cx = target.x + 0.5, cy = target.y + 0.5;
  const dxr = cx - me.x, dyr = cy - me.y;
  const adx = Math.abs(dxr), ady = Math.abs(dyr);
  let dx = 0, dy = 0;
  if(adx > 0.05 || ady > 0.05){
    if(adx >= ady) dx = Math.sign(dxr);
    else            dy = Math.sign(dyr);
  }
  return { dx, dy, bomb: false };
}

function idle(){ return { dx: 0, dy: 0, bomb: false }; }

/* Stable ordering for bomb-placement candidates: highest score first, then
   (smaller y, smaller x) as a deterministic tiebreak.  Without the tiebreak
   the CPU flips between equal candidates each replan — the user-reported
   "back and forth between two equally good crate-bomb spots" oscillation.
   Used as the Array.sort comparator so attack/clear can rank candidates
   cheaply, then verify the expensive escape only for the best ones. */
function candidateOrder(a, b){
  if(a.score !== b.score) return b.score - a.score;
  if(a.y !== b.y) return a.y - b.y;
  return a.x - b.x;
}

/* Set of tiles currently inside any of OUR own ticking bombs' blasts.
   Used by planAttack/planClear to score chain-reaction placements: a
   second bomb on one of these tiles will cascade with the first. */
function ownBombBlastTiles(view, me){
  const set = new Set();
  for(const b of view.bombs){
    if(b.ownerIdx !== me.idx) continue;
    const segs = computeExplosionSegments(view.field, b.x, b.y, b.range);
    for(const s of segs) set.add(s.x + ',' + s.y);
  }
  return set;
}

/* Our own bombs that haven't started detonating yet — the ones a remote
   trigger could still set off. */
function ownLiveBombs(view, me){
  return view.bombs.filter(b => b.ownerIdx === me.idx && !b.detonating);
}

/* True if detonating our own live bombs right now would catch at least one
   living enemy (used to decide when to pull the remote trigger). */
function ownBombHitsEnemy(view, me){
  const enemies = view.players.filter(p => p.idx !== me.idx && p.alive);
  if(enemies.length === 0) return false;
  for(const b of ownLiveBombs(view, me)){
    const segs = computeExplosionSegments(view.field, b.x, b.y, b.range);
    for(const s of segs){
      for(const e of enemies){
        if(playerHitByBlast(e, s.x, s.y)) return true;
      }
    }
  }
  return false;
}

/* True if detonating our own live bombs right now would catch OUR body —
   a guard against remote-triggering ourselves to death. */
function ownDetonationHitsSelf(view, me){
  for(const b of ownLiveBombs(view, me)){
    const segs = computeExplosionSegments(view.field, b.x, b.y, b.range);
    for(const s of segs){
      if(playerHitByBlast(me, s.x, s.y)) return true;
    }
  }
  return false;
}

/* Worst-case danger from foreign (non-own) bombs.  We don't know the
   enemy's actual range, so we treat each foreign bomb as if its blast
   reached the maximum possible distance — implemented as a giant range
   passed to computeExplosionSegments, which still respects walls and
   crates as blockers.  Result: the full row + column from each enemy
   bomb tile (until obstacles), so we know which tiles share line-of-fire
   with an enemy bomb regardless of its actual range. */
function buildForeignWorstDanger(view, me){
  const set = new Set();
  const maxRange = Math.max(view.field.width, view.field.height);
  for(const b of view.bombs){
    if(b.ownerIdx === me.idx) continue;
    const segs = computeExplosionSegments(view.field, b.x, b.y, maxRange);
    for(const s of segs) set.add(s.x + ',' + s.y);
  }
  return set;
}

/* True if the current route ends on a tile that's permanently safe under
   BOTH the actual danger map AND the worst-case foreign-bomb threat —
   meaning the committed plan delivers us to a tile where we're clear of
   our own blasts and out of line-of-fire of every enemy bomb.  Suppresses
   the survival reflex while we're correctly walking our own escape. */
function routeWillSave(route, stepIdx, danger, foreignWorst){
  if(!route || stepIdx >= route.steps.length) return false;
  const last = route.steps[route.steps.length - 1];
  const k = last.x + ',' + last.y;
  if(danger.has(k)) return false;
  if(foreignWorst && foreignWorst.has(k)) return false;
  return true;
}

/* Check if the very next tile we'd walk onto is still safe to enter.  We
   don't validate the entire remaining path (the user wants commitment),
   only the immediate next step.  This catches the most common failure:
   another CPU dropped a bomb between our planning and now.

   Transit tiles (we'll walk through and off) only need a small buffer.
   The final step (where we stop) needs the full ESCAPE_MARGIN. */
function nextStepStillSafe(route, stepIdx, danger, view, me){
  if(!route || stepIdx >= route.steps.length) return true;
  const step = route.steps[stepIdx];
  if(step.kind === 'bomb') return true;
  /* Passability: a bomb just dropped on this tile blocks it; without
     this check the CPU walks at the bomb until stuck-detection fires. */
  if(!isPassable(view, me, step.x, step.y)) return false;
  const speed = Math.max(me.speed, 1);
  const arriveT = 1 / speed;
  const blastT = danger.get(step.x + ',' + step.y);
  if(blastT === undefined) return true;
  const isFinal = stepIdx === route.steps.length - 1;
  const buffer = isFinal ? ESCAPE_MARGIN : 0.3;
  return blastT > arriveT + buffer;
}
