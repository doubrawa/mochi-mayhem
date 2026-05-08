/* Field: tile grid + spawn placement.
   Tile values are small integers so we can stash them in a Uint8Array. */

export const TILE = Object.freeze({
  FLOOR:   0,
  PILLAR:  1,
  BOX:     2,
});

export const FIELD_PRESETS = {
  small:  { w: 11, h: 9 },
  medium: { w: 15, h: 13 },
  large:  { w: 19, h: 17 },
};

/* The 8 spawn slots, listed as (col, row) in tile coords.
   The first 4 are the corners (used for 1-4 players).
   Slots 5-8 sit on the middle of each edge for 5-8 player matches. */
function spawnSlots(w, h){
  return [
    [1,     1    ],   // top-left
    [w-2,   h-2  ],   // bottom-right
    [w-2,   1    ],   // top-right
    [1,     h-2  ],   // bottom-left
    [Math.floor(w/2), 1    ],
    [Math.floor(w/2), h-2  ],
    [1,     Math.floor(h/2)],
    [w-2,   Math.floor(h/2)],
  ];
}

/* L-shaped clearance around a spawn so the player can't be trapped. */
function spawnClearance(sx, sy){
  return [
    [sx, sy], [sx+1, sy], [sx-1, sy], [sx, sy+1], [sx, sy-1],
  ];
}

export function createField(presetId, playerCount, rng = Math.random){
  const { w, h } = FIELD_PRESETS[presetId] || FIELD_PRESETS.medium;
  const tiles = new Uint8Array(w * h);
  const idx = (x, y) => y * w + x;

  /* Border + interior grid pillars (every other cell). */
  for(let y = 0; y < h; y++){
    for(let x = 0; x < w; x++){
      const border = x === 0 || y === 0 || x === w-1 || y === h-1;
      const pillar = (x % 2 === 0) && (y % 2 === 0);
      if(border || pillar) tiles[idx(x,y)] = TILE.PILLAR;
    }
  }

  /* Pre-clear spawn zones so we don't drop boxes there. */
  const slots = spawnSlots(w, h).slice(0, Math.max(playerCount, 1));
  const clear = new Set();
  slots.forEach(([sx, sy]) => spawnClearance(sx, sy).forEach(([cx, cy]) => clear.add(`${cx},${cy}`)));

  /* Sprinkle destructible boxes onto remaining floor tiles. */
  const BOX_DENSITY = 0.62;
  for(let y = 0; y < h; y++){
    for(let x = 0; x < w; x++){
      if(tiles[idx(x,y)] !== TILE.FLOOR) continue;
      if(clear.has(`${x},${y}`)) continue;
      if(rng() < BOX_DENSITY) tiles[idx(x,y)] = TILE.BOX;
    }
  }

  return {
    width: w,
    height: h,
    tiles,
    spawns: slots,
    at(x, y){
      if(x < 0 || y < 0 || x >= w || y >= h) return TILE.PILLAR;
      return tiles[y * w + x];
    },
    set(x, y, v){
      if(x < 0 || y < 0 || x >= w || y >= h) return;
      tiles[y * w + x] = v;
    },
    isWalkable(x, y){
      const t = this.at(x, y);
      return t === TILE.FLOOR;
    },
  };
}
