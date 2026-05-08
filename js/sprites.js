/* =====================================================
   Pixel-SVG sprite library.
   Sprites are arrays of strings (one char per pixel).
   '.' or ' ' = transparent.  Other chars look up palette.
   ===================================================== */

export const INK   = '#2a2238';
export const INK2  = '#4a3a5e';
export const WHT   = '#fff8e7';
export const BLK   = '#1a1228';
export const SKIN  = '#ffd9c0';
export const SKIN2 = '#ffb494';
export const CHEEK = '#ff9bbb';

export const PLAYER_COLORS = [
  { col:'#6dd5e8', dk:'#3aa3bf' }, // cyan
  { col:'#e878c9', dk:'#a83fa0' }, // magenta
  { col:'#f5d958', dk:'#b89b1f' }, // yellow
  { col:'#7ed98a', dk:'#3a9447' }, // green
  { col:'#ff9b6e', dk:'#c46434' }, // orange
  { col:'#b58ee8', dk:'#6b4ec1' }, // purple
  { col:'#ff9ec7', dk:'#c8567f' }, // pink
  { col:'#f5ece0', dk:'#a89e8e' }, // cream
];

export function spr(grid, pal, scale){
  scale = scale || 4;
  const h = grid.length, w = grid[0].length;
  let rects = '';
  for(let y=0; y<h; y++){
    let x=0;
    while(x<w){
      const c = grid[y][x];
      if(c==='.' || c===' '){ x++; continue; }
      let x2 = x+1;
      while(x2<w && grid[y][x2]===c) x2++;
      const color = pal[c] || c;
      rects += `<rect x="${x}" y="${y}" width="${x2-x}" height="1" fill="${color}"/>`;
      x = x2;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w*scale}" height="${h*scale}" shape-rendering="crispEdges">${rects}</svg>`;
}

/* ----- chibi character (16x16) ----- */
export function chibi(bodyCol, bodyDark, opts){
  opts = opts || {};
  const pal = {O:INK, B:bodyCol, D:bodyDark, S:SKIN, k:SKIN2, W:WHT, E:INK, C:CHEEK, H:'#3a2a4d'};
  const a = [
    "................",
    ".....OOOOOO.....",
    "....OBBBBBBO....",
    "...OBBBBBBBBO...",
    "...OBSSSSSSBO...",
    "..OBSSWEWESSBO..",
    "..OBSSWEWESSBO..",
    "..OBkSSSSSSkBO..",
    "..OBSCSSSSCSBO..",
    "...OBSSSSSSBO...",
    "....OBBBBBBO....",
    "...OBDDBBDDBO...",
    "..OBDDBBBBDDBO..",
    "..OBDDBBBBDDBO..",
    "...OO.OOOO.OO...",
    "...OO......OO..."
  ];
  return spr(a, pal, opts.scale || 4);
}

/* mini 8x8 chibi for HUD/scoreboard */
export function chibiMini(bodyCol, bodyDark){
  const pal={O:INK, B:bodyCol, D:bodyDark, S:SKIN, E:INK, C:CHEEK, W:WHT};
  const a=[
    "..OOOO..",
    ".OBBBBO.",
    ".OSSSSO.",
    "OSEWWEEO",
    "OSCSSCSO",
    ".OBBBBO.",
    "OBDBBDBO",
    ".O.OO.O."
  ];
  return spr(a,pal,3);
}

/* chibi waving */
export function chibiWave(bodyCol, bodyDark){
  const pal={O:INK, B:bodyCol, D:bodyDark, S:SKIN, k:SKIN2, W:WHT, E:INK, C:CHEEK};
  const a=[
    "..................",
    ".....OOOOOO.......",
    "....OBBBBBBO......",
    "...OBBBBBBBBO.....",
    "...OBSSSSSSBO.....",
    "..OBSSWEWESSBO..OO",
    "..OBSSWEWESSBO.OSO",
    "..OBkSSSSSSkBO.OSO",
    "..OBSCSSSSCSBO.OSO",
    "...OBSSSSSSBO.OBBO",
    "....OBBBBBBO.OBBO.",
    "...OBDDBBDDBOBBBO.",
    "..OBDDBBBBDDBBBO..",
    "..OBDDBBBBDDBBO...",
    "...OO.OOOO.OO.....",
    "...OO......OO.....",
    "..................",
    ".................."
  ];
  return spr(a,pal,4);
}

/* chibi throwing bomb */
export function chibiThrow(bodyCol, bodyDark){
  const pal={O:INK, B:bodyCol, D:bodyDark, S:SKIN, k:SKIN2, W:WHT, E:INK, C:CHEEK, P:'#1a1228', X:'#5a4570', F:'#ffb061'};
  const a=[
    "..................",
    "....OOOOOO........",
    "...OBBBBBBO.......",
    "..OBBBBBBBBO......",
    "..OBSSSSSSBO......",
    ".OBSSWEWESSBO.....",
    ".OBSSWEWESSBO.....",
    ".OBkSSSSSSkBO.....",
    ".OBSCSSSSCSBO.....",
    "..OBSSSSSSBO......",
    "...OBBBBBBO.OO....",
    "..OBDDBBDDBOPPO...",
    ".OBDDBBBBDDBPPPPO.",
    ".OBDDBBBBDDBPPPPO.",
    "..OO.OOOO.OO.PPPO.",
    "..OO......OO.OOO..",
    ".............F....",
    ".................."
  ];
  return spr(a,pal,4);
}

/* chibi cheer (jump w/ arms up) */
export function chibiCheer(bodyCol, bodyDark){
  const pal={O:INK, B:bodyCol, D:bodyDark, S:SKIN, k:SKIN2, W:WHT, E:INK, C:CHEEK};
  const a=[
    "..OO.........OO..",
    ".OSO.OOOOOO.OSO..",
    ".OSO.OBBBBBBOSO..",
    ".OSOOBBBBBBBBOSO.",
    ".OSOBSSSSSSSBOSO.",
    "..OOBSSWEWWESSBOO",
    "...OBSSWEWWESSBO.",
    "...OBkSSSSSSkBO..",
    "...OBSSCCCCSSBO..",
    "....OBSSSSSSBO...",
    ".....OBBBBBBO....",
    "....OBDDBBDDBO...",
    "...OBDDBBBBDDBO..",
    "...OBDDBBBBDDBO..",
    "....OO.OOOO.OO...",
    "....OO......OO...",
    "................."
  ];
  return spr(a,pal,4);
}

/* bomb 16x16 — calm */
export function bomb(scale){
  const pal={O:INK, B:'#3b2a55', D:'#1a1228', H:'#7a6494', W:WHT, E:INK, C:CHEEK, F:'#3a2a4d', s:'#ffe79e', S:'#ff7a3d'};
  const a=[
    "................",
    "............F...",
    "...........FF...",
    "..........FsF...",
    ".....OOOO.FFF...",
    "....OBBBBOFF....",
    "...OBHBBBBO.....",
    "..OBBHBBBBBO....",
    "..OBHBWEWEBBO...",
    "..OBBBWEWEBBO...",
    "..OBBCBBBBCBO...",
    "..OBBBBBBBBBO...",
    "...OBDDDDDBO....",
    "....OBDDBO......",
    ".....OOOO.......",
    "................"
  ];
  return spr(a,pal,scale||4);
}

/* bomb pulsing red */
export function bombHot(scale){
  const pal={O:INK, B:'#ff4a55', D:'#a82030', H:'#ff8a90', W:WHT, E:INK, C:'#ffe1ee', F:'#ff7a3d', s:'#ffe79e'};
  const a=[
    "................",
    "............F...",
    "...........FsF..",
    "..........FsFs..",
    ".....OOOO.FFF...",
    "....OBBBBOFF....",
    "...OBHBBBBO.....",
    "..OBBHBBBBBO....",
    "..OBHBWEWEBBO...",
    "..OBBBWEWEBBO...",
    "..OBBCBBBBCBO...",
    "..OBBBBBBBBBO...",
    "...OBDDDDDBO....",
    "....OBDDBO......",
    ".....OOOO.......",
    "................"
  ];
  return spr(a,pal,scale||4);
}

/* destructible wood crate */
export function box(scale){
  const pal={O:INK, B:'#d49758', D:'#a96e34', L:'#ecc28e', S:SKIN, W:WHT, E:INK, C:CHEEK};
  const a=[
    "OOOOOOOOOOOOOOOO",
    "OLBBBBBBBBBBBBLO",
    "OBLDDDDDDDDDDLBO",
    "OBDLBBBBBBBBLDBO",
    "OBDBLBWEWBLLBDBO",
    "OBDBLBWEWBLLBDBO",
    "OBDBL.CCCC.LBDBO",
    "OBDBLBBBBBBLBDBO",
    "OBDBLBBBBBBLBDBO",
    "OBDBLBBBBBBLBDBO",
    "OBDLBBBBBBBBLDBO",
    "OBLDDDDDDDDDDLBO",
    "OBLBBBBBBBBBBLBO",
    "OLBBBBBBBBBBBBLO",
    "OOOOOOOOOOOOOOOO",
    "................"
  ];
  return spr(a,pal,scale||4);
}

/* indestructible pillar */
export function pillar(scale){
  const pal={O:INK, B:'#9a96b5', D:'#5e5878', L:'#cfccdf', W:WHT, E:INK, M:'#3a3550'};
  const a=[
    "OOOOOOOOOOOOOOOO",
    "OLLBBBBBBBBBBLLO",
    "OLBLLBBBBBBLLBLO",
    "OBLBBBLLLLBBBLBO",
    "OBLBBLLBBLLBBLBO",
    "OBLBBLBWEWBLLBLO",
    "OBLBBLBWEWBLLBLO",
    "OBLBBLLBBLLBBLBO",
    "OBLBBLLBBLLBBLBO",
    "OBLBBLLBBLLBBLBO",
    "OBLBBBLLLLBBBLBO",
    "OBDDBBBBBBBBDDBO",
    "OBDDDDDDDDDDDDBO",
    "OBDDDDMMMMDDDDBO",
    "OOOOOOOOOOOOOOOO",
    "................"
  ];
  return spr(a,pal,scale||4);
}

/* explosion pieces */
export function exCenter(scale){
  const pal={F:'#ff7a3d', f:'#ffb061', y:'#ffe79e', W:'#fff8e7', O:INK};
  const a=[
    "....OOOOOO....",
    "..OOFFFFFOO...",
    ".OFffyyyfFO...",
    ".OFfyyWyyfFO..",
    "OFfyWWWWWyfFO.",
    "OFyWWyWyWWyFO.",
    "OFfyWWWWWyfFO.",
    ".OFfyyWyyfFO..",
    ".OFffyyyfFO...",
    "..OOFFFFFOO...",
    "....OOOOOO....",
  ];
  return spr(a,pal,scale||3);
}
export function exArm(scale, dir){
  const pal={F:'#ff7a3d', f:'#ffb061', y:'#ffe79e', W:'#fff8e7', O:INK};
  const a=[
    "OOOOOOOOOOO",
    "OFFFfffFFFO",
    "OFffyyyffFO",
    "OffyyWyyffO",
    "OFffyyyffFO",
    "OFFFfffFFFO",
    "OOOOOOOOOOO"
  ];
  let svg = spr(a,pal,scale||3);
  if(dir==='v'){
    svg = svg.replace('<svg ', '<svg style="transform:rotate(90deg)" ');
  }
  return svg;
}

/* heart 8x8 */
export function heart(empty, scale){
  const pal={O:INK, R:empty?'#d8c8e0':'#ff6b9d', H:'#ffb3c8', D:empty?'#a89aab':'#c84277'};
  const a=[
    ".OO..OO.",
    "ORHRORHR",
    "ORRRRRRR",
    "ORHRRRRR",
    "ORRRRRRR",
    ".ODDDDR.",
    "..ODDR..",
    "...OO..."
  ];
  return spr(a,pal,scale||3);
}

/* cloud */
export function cloud(big){
  const pal={W:'#fff8e7', S:'#e6d5f3', O:INK};
  const a = big ? [
    "....OOOOO.......",
    "..OOWWWWWOO.....",
    ".OWWWWSWWWO.OO..",
    "OWWWSWWWWWWOOWO.",
    "OWWWWWWWSWWWWWO.",
    "OWWSWWWWWWWWWO..",
    ".OOOOOOOOOOOO..."
  ] : [
    "..OOOOO...",
    ".OWWWWWO..",
    "OWWWSWWWO.",
    "OWWWWWWWO.",
    ".OOOOOOO.."
  ];
  return spr(a,pal,4);
}

/* spark */
export function spark(){
  const pal={Y:'#ffe79e', W:'#fff8e7', O:'#ff7a3d'};
  const a=[
    "...O...",
    ".O.Y.O.",
    "..YWY..",
    "OYWWWYO",
    "..YWY..",
    ".O.Y.O.",
    "...O..."
  ];
  return spr(a,pal,3);
}

/* crown */
export function crown(){
  const pal={O:INK, Y:'#ffd34d', y:'#ffe79e', R:'#ff6b9d', B:'#7ec4ff', L:'#ffb061'};
  const a=[
    "O........O........O",
    "OY......OY......OY.",
    "OY.O...OY.O....OY..",
    "OYYYO.OYYYOO..OYYYO",
    "OYRYYYYYBYYYYYYYLYO",
    "OyYYYYYYYYYYYYYYYyO",
    "OOOOOOOOOOOOOOOOOO."
  ];
  return spr(a,pal,4);
}

/* logo bomb large */
export function logoBomb(){
  const pal={O:INK, B:'#3b2a55', D:'#1a1228', H:'#7a6494', W:WHT, E:INK, C:CHEEK, F:'#ff7a3d', s:'#ffe79e'};
  const a=[
    "........................",
    "................F.......",
    "...............FsF......",
    "..............FsFs......",
    ".............FFFF.......",
    "............FF..........",
    ".......OOOOOO...........",
    ".....OOBBBBBBOO.........",
    "....OBHBBBBBBBBO........",
    "...OBBHBBBBBBBBBO.......",
    "...OBHBWWEEWWBBBBO......",
    "..OBBBBWWEEWWBBBBBO.....",
    "..OBBBBBBBBBBBBBBBO.....",
    "..OBBCCBBBBBBBBCCBO.....",
    "..OBBCCBBBBBBBBCCBO.....",
    "..OBBBBBBBBBBBBBBBO.....",
    "..OBHBBBBBBBBBBBHBO.....",
    "...OBBBBBBBBBBBBBO......",
    "....OBDDDDDDDDDBO.......",
    ".....OBDDDDDDDBO........",
    "......OOOOOOOOO.........",
    "........................",
    "........................",
    "........................"
  ];
  return spr(a,pal,5);
}

/* small icons */
export function ico(kind){
  const pal={O:INK, P:'#ff6b9d', Y:'#ffe79e', G:'#9fe0b8', B:'#7ec4ff', W:WHT, D:'#a82030', R:'#ff4a55', I:'#3a3550'};
  const map={
    play:[
      "..OO....",
      "..OPO...",
      "..OPPO..",
      "..OPPPO.",
      "..OPPO..",
      "..OPO...",
      "..OO....",
      "........"
    ],
    mp:[
      "..OO.OO.",
      ".OBBOPPO",
      ".OBBOPPO",
      "OBOOOOPO",
      "OBBOOPPO",
      ".OBBPPPO",
      "..OOOOO.",
      "........"
    ],
    cog:[
      "..O.OO..",
      ".OWOOWO.",
      "OWWGGGWO",
      "O.GIIG.O",
      "O.GIIG.O",
      "OWWGGGWO",
      ".OWOOWO.",
      "..O.OO.."
    ],
    cup:[
      "OOOOOOOO",
      "OYYYYYYO",
      "OYIYYIYO",
      "OYIYYIYO",
      "OYYYYYYO",
      ".OYYYYO.",
      "..OYYO..",
      ".OOOOOO."
    ],
    back:[
      "...OO...",
      "..OOO...",
      ".OPOOOOO",
      "OPPPPPPP",
      ".OPOOOOO",
      "..OOO...",
      "...OO...",
      "........"
    ],
    net:[
      "..OOOO..",
      ".OBWWBO.",
      "OBWWWWBO",
      "OWGWWGWO",
      "OWGWWGWO",
      "OBWWWWBO",
      ".OBWWBO.",
      "..OOOO.."
    ],
  };
  return spr(map[kind], pal, 4);
}

/* ============ POWER-UP definitions ============ */
export const POWERUPS = [
  { id:'bomb', nm:'+ BOMB', ds:'CARRY ONE MORE BOMB',
    pal:{O:INK,B:'#ff6b9d',D:'#c84277',H:'#ffa3c0',W:WHT,F:'#ff7a3d',s:'#ffe79e',C:'#ffe1ee'},
    a:[
      "................",
      "................",
      "..........F.....",
      "..........FF....",
      ".....OOOO.FsF...",
      "....OBBBBOFFF...",
      "...OBHBBBBO.....",
      "..OBBHBBBBBO....",
      "..OBHBWBWBBBO...",
      "..OBBBWBWBBBO...",
      "..OBBCBBBBCBO...",
      "..OBBBBBBBBBO...",
      "...OBDDDDDBO....",
      "....OBDDBO......",
      ".....OOOO.......",
      "................"
  ]},
  { id:'fire', nm:'+ RANGE', ds:'BIGGER BLAST CROSS',
    pal:{O:INK,F:'#ff7a3d',f:'#ffb061',y:'#ffe79e',W:WHT,R:'#ff4a55'},
    a:[
      "................",
      "........y.......",
      ".......yWy......",
      "......yfWfy.....",
      ".....yfWFfWy....",
      "....yfWFFFWfy...",
      "...yWFFFFFFWy...",
      "..yfFFRRRRFFfy..",
      "..yFRRRRRRRRFy..",
      "..yFRRRWWRRRFy..",
      "...yFRRRRRRFy...",
      "....yfFFFFfy....",
      ".....yfFFfy.....",
      "......yffy......",
      ".......OO.......",
      "................"
    ]},
  { id:'speed', nm:'+ SPEED', ds:'WALK FASTER',
    pal:{O:INK,B:'#ffe79e',D:'#d49758',W:WHT,L:'#ff6b9d',Y:'#ff7a3d',R:'#ff4a55'},
    a:[
      "................",
      "................",
      ".....OOOOO......",
      "....OBBBBBO.....",
      "...OBBWWWBBO....",
      "..OLBWWLLWWBO...",
      ".OLLBWWWWWWBLO..",
      "OLLLBBBBBBBBLLO.",
      "ODDDDDDDDDDDDDO.",
      ".ODYYYYYYYYYDO..",
      "..ODDDDDDDDDDO..",
      "...OOOO..OOOO...",
      "...O..R..R..O...",
      "...O..R..R..O...",
      "....OO....OO....",
      "................"
    ]},
  { id:'remote', nm:'REMOTE', ds:'DETONATE ON COMMAND',
    pal:{O:INK,B:'#3b2a55',D:'#1a1228',G:'#7ec4ff',W:WHT,R:'#ff4a55',Y:'#ffe79e'},
    a:[
      "................",
      "....OOOOOOOO....",
      "...OBBBBBBBBO...",
      "..OBGGGGGGGGBO..",
      "..OBGYYYYYYGBO..",
      "..OBGYYRRYYGBO..",
      "..OBGYYYYYYGBO..",
      "..OBBBBBBBBBBO..",
      "..OBROBROBROBO..",
      "..OBBBBBBBBBBO..",
      "..OBROBROBROBO..",
      "..OBBBBBBBBBBO..",
      "..OBBBOROBBBBO..",
      "..OBBBBBBBBBBO..",
      "...OOOOOOOOOO...",
      "................"
    ]},
  { id:'kick', nm:'KICK BOMB', ds:'PUSH BOMBS WITH FOOT',
    pal:{O:INK,B:'#ff7a3d',D:'#a8431f',L:'#ffb061',W:WHT,P:'#3b2a55'},
    a:[
      "................",
      "....OOOOOOOO....",
      "...OBBLLLBBBO...",
      "..OBLLBBBLLBBO..",
      "..OBLBBBBBLBBO..",
      "..OBLBBBBBLBBO..",
      "..OBBBBBBBBBBO..",
      ".OBBBBBBBBBBBBO.",
      ".OBDDDDDDDDDDBO.",
      ".OBDDDDDDDDDDBO.",
      "..OOOOOOOOOOOOO.",
      "..............O.",
      "...OOO........O.",
      "..OPPPO.......O.",
      "...OOO........O.",
      "................"
    ]},
  { id:'glove', nm:'THROW BOMB', ds:'PICK UP & THROW',
    pal:{O:INK,B:'#7ec4ff',D:'#3a7ec4',W:WHT,L:'#cfe9ff'},
    a:[
      "................",
      "......OOOOO.....",
      ".....OBLLBBO....",
      "....OBBLLBBBO...",
      "...OBLBLLBLBBO..",
      "..OBLLBLLBLLBO..",
      "..OBLLBBBBLLBO..",
      "..OBLBLLLLBLBO..",
      "..OBLLBBBBLLBO..",
      "..OBLLLLLLLLBO..",
      "...OBBBBBBBBO...",
      "....OBDDDDBO....",
      "....OBDDDDBO....",
      ".....OBDDBO.....",
      "......OOOO......",
      "................"
    ]},
  { id:'ghost', nm:'GHOST', ds:'WALK THRU WALLS BRIEFLY',
    pal:{O:INK,W:WHT,L:'#e8e0f0',E:INK,C:'#ffb3c8'},
    a:[
      "................",
      ".....OOOO.......",
      "....OWWWWO......",
      "...OWWWWWWO.....",
      "..OWWWWWWWWO....",
      "..OWWEWWEWWO....",
      "..OWWWWWWWWO....",
      "..OWWWLLWWWO....",
      "..OWCWWWWCWO....",
      "..OWWWWWWWWO....",
      "..OWWWWWWWWO....",
      "..OWWWWWWWWO....",
      "..OWWLWWWLWO....",
      "..OOOO.OOOO.....",
      "................",
      "................"
    ]},
  { id:'shield', nm:'SHIELD', ds:'SURVIVE 1 EXPLOSION',
    pal:{O:INK,B:'#7ec4ff',L:'#cfe9ff',D:'#3a7ec4',Y:'#ffe79e'},
    a:[
      "................",
      "....OOOOOOOO....",
      "...OBLLLLLLBO...",
      "..OBLLLLLLLLBO..",
      "..OBLLYLLYLLBO..",
      "..OBLLLLLLLLBO..",
      "..OBLLLYYLLLBO..",
      "..OBLLLLLLLLBO..",
      "..OBLLLLLLLLBO..",
      "..ODBLLLLLLBDO..",
      "...ODBLLLLBDO...",
      "....ODBLLBDO....",
      ".....ODBBDO.....",
      "......ODDO......",
      ".......OO.......",
      "................"
    ]},
  { id:'ice', nm:'ICE BOMB', ds:'FREEZE ENEMIES',
    pal:{O:INK,B:'#cfe9ff',D:'#7ec4ff',L:WHT,F:'#3a7ec4',W:WHT,E:INK},
    a:[
      "................",
      "............W...",
      "...........WLW..",
      "..........WLLW..",
      ".....OOOO.WWW...",
      "....OBBBBOWW....",
      "...OBLBBBBO.....",
      "..OBBLBBBBBO....",
      "..OBLBWEWEBBO...",
      "..OBBBWEWEBBO...",
      "..OBLBBBBBLBO...",
      "..OBBBBBBBBBO...",
      "...OFDDDDDFO....",
      "....OFDDFO......",
      ".....OOOO.......",
      "................"
    ]},
  { id:'magnet', nm:'MAGNET', ds:'PULLS POWER-UPS IN',
    pal:{O:INK,R:'#ff4a55',B:'#3a3550',W:WHT,L:'#ffb3c8'},
    a:[
      "................",
      ".OOOOO....OOOOO.",
      "OBRRRBO..OBRRRBO",
      "OBRLRBO..OBRLRBO",
      "OBRRRBO..OBRRRBO",
      "OBRRRBO..OBRRRBO",
      "OBBBBBO..OBBBBBO",
      "OBWWWBO..OBWWWBO",
      "OBWWWBO..OBWWWBO",
      "OBWWWBO..OBWWWBO",
      "OBWWWBO..OBWWWBO",
      "OBBBBBO..OBBBBBO",
      ".OOOOO....OOOOO.",
      "................",
      "................",
      "................"
    ]},
  { id:'slow', nm:'SLOW-MO', ds:'SLOWS OTHERS',
    pal:{O:INK,B:'#fff8e7',D:'#d2b3ee',H:'#7d6996',R:'#ff4a55',W:WHT},
    a:[
      "................",
      "......OOOO......",
      "....OOBBBBOO....",
      "...OBBBBBBBBO...",
      "..OBBWWWWWWBBO..",
      "..OBWWWHWWWWBO..",
      "..OBWWWHRWWWBO..",
      "..OBWWWHHHWWBO..",
      "..OBWWWWWWHWBO..",
      "..OBWWWWWWWWBO..",
      "..OBBWWWWWWBBO..",
      "...OBBBBBBBBO...",
      "....OOBBBBOO....",
      "......OOOO......",
      "................",
      "................"
    ]},
  { id:'super', nm:'SUPER BOMB', ds:'BLAST TO THE WALL',
    pal:{O:INK,B:'#ffe79e',D:'#d4a224',Y:'#ffe79e',R:'#ff4a55',W:WHT,P:'#3b2a55',F:'#ff7a3d',s:'#ffe79e'},
    a:[
      "................",
      "..........F.....",
      ".........FsF....",
      "........FsFs....",
      ".....OOOO.FFF...",
      "....ORRRROFF....",
      "...ORYRRRRO.....",
      "..ORRYRRRRRO....",
      "..ORYRWBWBRRO...",
      "..ORRRWBWBYRO...",
      "..ORRYRRRRYRO...",
      "..ORRRRRRRRRO...",
      "...OPDDDDPO.....",
      "....OPDDPO......",
      ".....OOOO.......",
      "................"
    ]},
];

export function getPowerup(id){
  return POWERUPS.find(p => p.id === id);
}
