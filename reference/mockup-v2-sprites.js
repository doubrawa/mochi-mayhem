/* ======================================================
   BOOM BUDDIES — sprite generator
   All sprites are drawn pixel-by-pixel into <canvas>
   elements. The host CSS scales them with image-rendering:
   pixelated so they read as crisp pixel-art PNG.
   Base resolution: 32×32 for chibis, 16×16 for power-ups,
   12×12 for icons, 24×24 for bombs, 32×32 for tiles.
   ====================================================== */

const INK='#2a1f3d', INK2='#4a3a5e', WHT='#fff8e7', CHK='#ff7aa3';

function px(ctx,x,y,c){ if(!c) return; ctx.fillStyle=c; ctx.fillRect(x,y,1,1); }
function rect(ctx,x,y,w,h,c){ if(!c) return; ctx.fillStyle=c; ctx.fillRect(x,y,w,h); }
function fillEll(ctx,cx,cy,rx,ry,c){
  for(let y=Math.floor(cy-ry); y<=Math.ceil(cy+ry); y++)
    for(let x=Math.floor(cx-rx); x<=Math.ceil(cx+rx); x++){
      const dx=(x+0.5-cx)/rx, dy=(y+0.5-cy)/ry;
      if(dx*dx+dy*dy<=1) px(ctx,x,y,c);
    }
}
function strokeEll(ctx,cx,cy,rx,ry,c){
  const ins = {};
  for(let y=Math.floor(cy-ry); y<=Math.ceil(cy+ry); y++)
    for(let x=Math.floor(cx-rx); x<=Math.ceil(cx+rx); x++){
      const dx=(x+0.5-cx)/rx, dy=(y+0.5-cy)/ry;
      if(dx*dx+dy*dy<=1) ins[x+','+y]=1;
    }
  for(const k in ins){
    const [a,b]=k.split(',').map(Number);
    if(!ins[(a-1)+','+b]||!ins[(a+1)+','+b]||!ins[a+','+(b-1)]||!ins[a+','+(b+1)]) px(ctx,a,b,c);
  }
}
function strokeRect(ctx,x,y,w,h,c){
  for(let i=x;i<x+w;i++){ px(ctx,i,y,c); px(ctx,i,y+h-1,c); }
  for(let i=y;i<y+h;i++){ px(ctx,x,i,c); px(ctx,x+w-1,i,c); }
}

/* ---------- CHIBI BASE ---------- */
function drawBase(c, body, dark){
  fillEll(c,16,14,11,10,body);
  for(let yy=20;yy<24;yy++) for(let xx=6;xx<26;xx++){
    const dx=(xx+0.5-16)/11, dy=(yy+0.5-14)/10;
    if(dx*dx+dy*dy<=1) px(c,xx,yy,dark);
  }
  strokeEll(c,16,14,11,10,INK);
  px(c,8,17,CHK);px(c,9,17,CHK); px(c,23,17,CHK);px(c,24,17,CHK);
  rect(c,12,23,8,4,body); rect(c,12,25,8,2,dark); strokeRect(c,12,23,8,4,INK);
  rect(c,5,18,3,3,body); strokeRect(c,5,18,3,3,INK);
  rect(c,24,18,3,3,body); strokeRect(c,24,18,3,3,INK);
  rect(c,11,27,4,3,dark); strokeRect(c,11,27,4,3,INK);
  rect(c,17,27,4,3,dark); strokeRect(c,17,27,4,3,INK);
}

function drawEyes(c,k,ly){
  ly=ly||14; const lx=11, rx=20;
  if(k==='round'){ for(const cx of [lx,rx]){ rect(c,cx-1,ly-1,3,4,WHT); rect(c,cx-1,ly,2,2,INK); px(c,cx,ly-1,WHT); }}
  else if(k==='sparkle'){ for(const cx of [lx,rx]){ rect(c,cx-1,ly-2,3,5,WHT); rect(c,cx-1,ly,2,3,INK); px(c,cx,ly-1,WHT); px(c,cx-1,ly+1,WHT); }}
  else if(k==='happy'){ for(const cx of [lx,rx]){ px(c,cx-2,ly,INK);px(c,cx+1,ly,INK); px(c,cx-1,ly-1,INK); px(c,cx,ly-1,INK); }}
  else if(k==='dot'){ for(const cx of [lx,rx]) rect(c,cx-1,ly,2,2,INK); }
  else if(k==='goggles'){ for(const cx of [lx,rx]){ strokeEll(c,cx,ly,3,3,INK); fillEll(c,cx,ly,2,2,'#7ec4ff'); px(c,cx-1,ly-1,WHT);} for(let i=lx+3;i<=rx-3;i++) px(c,i,ly,INK); }
  else if(k==='sleepy'){ for(const cx of [lx,rx]){ px(c,cx-2,ly,INK);px(c,cx-1,ly,INK);px(c,cx,ly,INK);px(c,cx+1,ly,INK); px(c,cx-2,ly+1,INK);px(c,cx+1,ly+1,INK);}}
  else if(k==='snore'){ for(const cx of [lx,rx]){ px(c,cx-1,ly-1,INK);px(c,cx,ly-1,INK); px(c,cx-2,ly,INK);px(c,cx+1,ly,INK); px(c,cx-1,ly+1,INK);px(c,cx,ly+1,INK);}}
  else if(k==='star'){ for(const cx of [lx,rx]){ rect(c,cx-1,ly-1,3,4,WHT); rect(c,cx-1,ly,2,2,INK); px(c,cx,ly-1,'#ffe79e'); px(c,cx-1,ly+1,WHT);}}
}

function drawMouth(c,k,my){
  my=my||19;
  if(k==='smile'){ px(c,15,my,INK);px(c,16,my,INK); px(c,14,my-1,INK);px(c,17,my-1,INK); }
  else if(k==='oh'){ rect(c,15,my-1,2,2,'#c84277'); strokeRect(c,15,my-1,2,2,INK); }
  else if(k==='grin'){ rect(c,13,my,6,2,INK); rect(c,14,my,4,1,'#fff'); px(c,15,my+1,'#ff7aa3');px(c,16,my+1,'#ff7aa3'); }
  else if(k==='uwu'){ px(c,13,my,INK);px(c,14,my-1,INK);px(c,15,my,INK); px(c,16,my,INK);px(c,17,my-1,INK);px(c,18,my,INK); }
  else if(k==='tongue'){ px(c,15,my,INK);px(c,16,my,INK); px(c,15,my+1,'#ff7aa3');px(c,16,my+1,'#ff7aa3'); px(c,14,my-1,INK);px(c,17,my-1,INK); }
  else if(k==='zz'){ px(c,15,my,INK);px(c,16,my,INK);px(c,17,my,INK); }
}

function drawAcc(c,k,body){
  if(k==='ears'){
    for(let y=0;y<8;y++){ rect(c,9,y,3,1,body); rect(c,20,y,3,1,body); }
    for(let y=2;y<7;y++){ px(c,10,y,'#ff9bbb'); px(c,21,y,'#ff9bbb'); }
    for(let y=0;y<8;y++){ px(c,8,y,INK); px(c,12,y,INK); px(c,19,y,INK); px(c,23,y,INK);}
    rect(c,9,0,3,1,INK); rect(c,20,0,3,1,INK);
  } else if(k==='bow'){
    rect(c,17,2,4,3,'#ff6b9d'); rect(c,21,1,4,5,'#ff6b9d'); rect(c,25,2,3,3,'#ff6b9d');
    rect(c,22,3,2,1,'#c84277');
    strokeRect(c,17,2,4,3,INK); strokeRect(c,21,1,4,5,INK); strokeRect(c,25,2,3,3,INK);
  } else if(k==='chef'){
    fillEll(c,12,2,4,2,WHT); fillEll(c,17,1,4,2,WHT); fillEll(c,22,2,4,2,WHT);
    rect(c,9,4,14,2,WHT); strokeRect(c,9,4,14,2,INK);
    strokeEll(c,12,2,4,2,INK); strokeEll(c,17,1,4,2,INK); strokeEll(c,22,2,4,2,INK);
  } else if(k==='leaf'){
    rect(c,12,2,8,4,'#3a9447');
    rect(c,11,3,1,2,'#3a9447'); rect(c,20,3,1,2,'#3a9447');
    rect(c,15,3,1,3,'#7ed98a');
    px(c,16,1,'#3a9447'); px(c,16,0,'#3a9447');
    strokeRect(c,12,2,8,4,INK); px(c,11,3,INK); px(c,11,4,INK); px(c,20,3,INK); px(c,20,4,INK);
  } else if(k==='avi'){
    rect(c,7,4,18,3,'#a96e34'); rect(c,8,3,16,1,'#a96e34');
    rect(c,9,7,14,1,'#7d4d22');
    strokeRect(c,7,4,18,3,INK);
    px(c,8,3,INK); px(c,23,3,INK);
  } else if(k==='wiz'){
    px(c,16,0,'#5b3aa8');
    rect(c,15,1,3,1,'#5b3aa8'); rect(c,14,2,5,1,'#5b3aa8'); rect(c,13,3,7,1,'#5b3aa8');
    rect(c,12,4,9,1,'#5b3aa8'); rect(c,11,5,11,1,'#5b3aa8');
    rect(c,8,6,17,2,'#5b3aa8'); rect(c,7,7,19,1,'#3a2370');
    px(c,16,4,'#ffe79e'); px(c,15,5,'#ffe79e'); px(c,17,5,'#ffe79e');
    px(c,16,0,INK); px(c,15,1,INK); px(c,18,1,INK); px(c,14,2,INK); px(c,19,2,INK);
    px(c,13,3,INK); px(c,20,3,INK); px(c,12,4,INK); px(c,21,4,INK); px(c,11,5,INK); px(c,22,5,INK);
    strokeRect(c,7,7,19,1,INK); strokeRect(c,8,6,17,2,INK);
  } else if(k==='flower'){
    fillEll(c,7,4,2,2,'#ffa3c0'); fillEll(c,11,4,2,2,'#ffa3c0');
    fillEll(c,9,2,2,2,'#ffa3c0'); fillEll(c,9,6,2,2,'#ffa3c0');
    fillEll(c,9,4,2,2,'#ff6b9d');
    px(c,9,4,'#ffe79e');
    px(c,12,5,'#3a9447'); px(c,13,6,'#3a9447');
  } else if(k==='beanie'){
    rect(c,8,3,16,4,'#7ec4ff'); rect(c,8,5,16,1,'#3a7ec4');
    rect(c,9,7,14,1,'#cfe9ff');
    fillEll(c,16,1,2,2,'#fff8e7');
    strokeRect(c,8,3,16,4,INK); strokeEll(c,16,1,2,2,INK);
  }
}

const CHARS = {
  bubble:  {body:'#6dd5e8', dark:'#3aa3bf', acc:'ears',   eye:'round',   mouth:'smile'},
  mochi:   {body:'#ff9ec7', dark:'#c8567f', acc:'bow',    eye:'sparkle', mouth:'uwu'},
  biscuit: {body:'#f5d958', dark:'#b89b1f', acc:'chef',   eye:'happy',   mouth:'grin'},
  pickle:  {body:'#7ed98a', dark:'#3a9447', acc:'leaf',   eye:'dot',     mouth:'tongue'},
  yam:     {body:'#ff9b6e', dark:'#c46434', acc:'avi',    eye:'goggles', mouth:'smile'},
  plum:    {body:'#b58ee8', dark:'#6b4ec1', acc:'wiz',    eye:'sleepy',  mouth:'oh'},
  peach:   {body:'#ffb3c8', dark:'#c87890', acc:'flower', eye:'star',    mouth:'smile'},
  mallow:  {body:'#f5ece0', dark:'#a89e8e', acc:'beanie', eye:'snore',   mouth:'zz'},
};

function drawChar(ctx, id){
  const s = CHARS[id]; if(!s) return;
  drawBase(ctx, s.body, s.dark);
  drawAcc(ctx, s.acc, s.body);
  drawEyes(ctx, s.eye);
  drawMouth(ctx, s.mouth);
}

/* ---------- BOMB (24x24) ---------- */
function drawBomb(c, hot){
  const B = hot?'#ff4a55':'#3b2a55', D = hot?'#a82030':'#1a1228', H = hot?'#ff8a90':'#7a6494';
  // round body
  fillEll(c, 12, 14, 8, 8, B);
  // shading
  for(let yy=10;yy<22;yy++) for(let xx=4;xx<20;xx++){
    const dx=(xx+0.5-12)/8, dy=(yy+0.5-14)/8;
    if(dx*dx+dy*dy<=1 && yy>=15 && xx>=12) px(c, xx, yy, D);
  }
  // highlight
  fillEll(c, 9, 11, 2, 2, H);
  px(c, 8, 10, WHT);
  // outline
  strokeEll(c, 12, 14, 8, 8, INK);
  // eyes (cute)
  rect(c, 10, 13, 2, 3, WHT); rect(c, 14, 13, 2, 3, WHT);
  px(c, 11, 14, INK); px(c, 15, 14, INK);
  // cheeks
  px(c, 8, 17, '#ff9bbb'); px(c, 17, 17, '#ff9bbb');
  // mouth
  px(c, 12, 18, INK); px(c, 13, 18, INK);
  // top cap (where fuse comes in)
  rect(c, 11, 5, 4, 2, INK); rect(c, 12, 7, 2, 1, INK);
  // fuse
  px(c, 13, 4, '#5a4570'); px(c, 14, 3, '#5a4570'); px(c, 15, 2, '#5a4570');
  // spark
  if(hot){
    px(c, 16, 1, '#ff7a3d'); px(c, 17, 0, '#ffe79e'); px(c, 17, 2, '#ff7a3d'); px(c, 18, 1, '#ffe79e');
  } else {
    px(c, 16, 1, '#ff7a3d'); px(c, 17, 0, '#ffe79e');
  }
}

/* ---------- BOX (16x16 wood crate w/ eyes) ---------- */
function drawBox(c){
  // outer plank
  rect(c,0,0,16,16,'#a96e34');
  // inner highlight
  rect(c,1,1,14,14,'#d49758');
  rect(c,2,2,12,12,'#ecc28e');
  rect(c,3,3,10,10,'#d49758');
  // diagonal plank seams
  for(let i=0;i<10;i++){ px(c,3+i,3+i,'#a96e34'); px(c,3+i,12-i,'#a96e34'); }
  // border outline
  strokeRect(c,0,0,16,16,INK);
  // eyes
  rect(c,5,7,2,2,WHT); rect(c,9,7,2,2,WHT);
  px(c,5,7,INK); px(c,9,7,INK);
  px(c,6,8,INK); px(c,10,8,INK);
  // cheeks
  px(c,4,9,'#ff9bbb'); px(c,11,9,'#ff9bbb');
  // smile
  px(c,7,10,INK); px(c,8,10,INK);
}

/* ---------- PILLAR (16x16 stone w/ tiny face) ---------- */
function drawPillar(c){
  rect(c,0,0,16,16,'#7d6996');
  rect(c,1,1,14,14,'#9a96b5');
  // brick lines
  for(let i=0;i<16;i++){ px(c,i,5,'#7d6996'); px(c,i,10,'#7d6996'); }
  for(let i=1;i<5;i++) px(c,4,i,'#7d6996');
  for(let i=6;i<10;i++) px(c,8,i,'#7d6996');
  for(let i=11;i<15;i++) px(c,4,i,'#7d6996');
  for(let i=11;i<15;i++) px(c,11,i,'#7d6996');
  // highlight
  rect(c,2,2,2,1,'#cfccdf');
  // border
  strokeRect(c,0,0,16,16,INK);
  // tiny stoic face mid
  px(c,6,7,INK); px(c,9,7,INK);
  px(c,7,8,INK); px(c,8,8,INK);
}

/* ---------- EXPLOSION (16x16 center / arms drawn rotated) ---------- */
function drawExCenter(c){
  fillEll(c,8,8,7,7,'#ff7a3d');
  fillEll(c,8,8,5,5,'#ffb061');
  fillEll(c,8,8,3,3,'#ffe79e');
  fillEll(c,8,8,1,1,WHT);
  strokeEll(c,8,8,7,7,INK);
  // sparks
  px(c,1,8,INK); px(c,14,8,INK);
  px(c,8,1,INK); px(c,8,14,INK);
}
function drawExArm(c){
  // 16x16 horizontal flame plume
  for(let x=0;x<16;x++){
    rect(c,x,4,1,8,'#ff7a3d');
  }
  for(let x=1;x<15;x++) rect(c,x,5,1,6,'#ffb061');
  for(let x=2;x<14;x++) rect(c,x,6,1,4,'#ffe79e');
  for(let x=4;x<12;x++) rect(c,x,7,1,2,WHT);
  // outline top/bottom
  for(let x=0;x<16;x++){ px(c,x,4,INK); px(c,x,11,INK); }
}

/* ---------- HEART (8x8) ---------- */
function drawHeart(c, empty){
  const R = empty?'#d8c8e0':'#ff6b9d', H = '#ffb3c8', D = empty?'#a89aab':'#c84277';
  rect(c,1,1,2,1,R); rect(c,5,1,2,1,R);
  rect(c,1,2,6,1,R);
  rect(c,2,3,4,1,R);
  rect(c,3,4,2,1,D);
  px(c,2,1,H);
  // outline
  px(c,0,1,INK); px(c,3,1,INK); px(c,4,1,INK); px(c,7,1,INK);
  px(c,0,2,INK); px(c,7,2,INK);
  px(c,1,3,INK); px(c,6,3,INK);
  px(c,2,4,INK); px(c,5,4,INK);
  px(c,3,5,INK); px(c,4,5,INK);
}

/* ---------- POWER-UPS (16x16) ---------- */
const PUPS = {
  bomb:   { nm:'+ BOMB',  ds:'CARRY ONE MORE BOMB' },
  fire:   { nm:'+ RANGE', ds:'BIGGER BLAST CROSS' },
  speed:  { nm:'+ SPEED', ds:'WALK FASTER' },
  remote: { nm:'REMOTE',  ds:'DETONATE ON COMMAND' },
  kick:   { nm:'KICK',    ds:'PUSH BOMBS WITH FOOT' },
  glove:  { nm:'THROW',   ds:'PICK UP & THROW' },
  ghost:  { nm:'GHOST',   ds:'WALK THRU WALLS' },
  shield: { nm:'SHIELD',  ds:'SURVIVE 1 BLAST' },
  ice:    { nm:'ICE',     ds:'FREEZE ENEMIES' },
  magnet: { nm:'MAGNET',  ds:'PULLS UPS IN' },
  slow:   { nm:'SLOW-MO', ds:'SLOWS OTHERS' },
  super:  { nm:'SUPER',   ds:'BLAST TO WALL' },
};

function drawPup(c, id){
  if(id==='bomb'){
    fillEll(c,8,9,5,5,'#ff6b9d'); strokeEll(c,8,9,5,5,INK);
    fillEll(c,6,7,1,1,'#ffa3c0');
    rect(c,7,3,3,1,INK); px(c,8,5,INK); px(c,9,4,'#5a4570'); px(c,10,3,'#5a4570'); px(c,11,2,'#ff7a3d'); px(c,12,1,'#ffe79e');
    rect(c,6,8,2,2,WHT); rect(c,9,8,2,2,WHT); px(c,7,9,INK); px(c,10,9,INK);
    px(c,5,11,'#ffa3c0'); px(c,11,11,'#ffa3c0');
  } else if(id==='fire'){
    // flame
    px(c,8,2,'#ffe79e');
    rect(c,7,3,2,1,'#ffb061');
    rect(c,6,4,4,1,'#ff7a3d');
    rect(c,5,5,6,1,'#ff7a3d');
    rect(c,4,6,8,1,'#ff4a55');
    rect(c,3,7,10,2,'#ff4a55');
    rect(c,3,9,10,2,'#ff7a3d');
    rect(c,4,11,8,1,'#ffb061');
    rect(c,5,12,6,1,'#ffe79e');
    rect(c,6,13,4,1,WHT);
    // outline approximate
    px(c,8,1,INK); px(c,8,2,INK);
    px(c,3,7,INK); px(c,12,7,INK); px(c,3,10,INK); px(c,12,10,INK);
    px(c,2,8,INK); px(c,13,8,INK); px(c,2,9,INK); px(c,13,9,INK);
    px(c,5,4,INK); px(c,10,4,INK); px(c,4,5,INK); px(c,11,5,INK);
    px(c,6,13,INK); px(c,9,13,INK); px(c,7,14,INK); px(c,8,14,INK);
  } else if(id==='speed'){
    // sneaker
    rect(c,2,8,12,3,'#ffe79e');
    rect(c,2,11,12,2,'#d49758');
    rect(c,3,7,10,1,'#fff8e7');
    rect(c,4,6,8,1,'#fff8e7');
    rect(c,11,5,3,3,'#ffe79e');
    // laces
    px(c,5,7,'#ff6b9d'); px(c,7,7,'#ff6b9d'); px(c,9,7,'#ff6b9d');
    // sole stripes
    px(c,4,12,'#ff4a55'); px(c,8,12,'#ff4a55'); px(c,12,12,'#ff4a55');
    strokeRect(c,2,8,12,3,INK);
    strokeRect(c,2,11,12,2,INK);
    px(c,11,5,INK); px(c,13,5,INK); px(c,14,8,INK);
    // motion lines
    px(c,0,9,INK); px(c,0,10,INK);
  } else if(id==='remote'){
    rect(c,3,3,10,10,'#3b2a55'); strokeRect(c,3,3,10,10,INK);
    rect(c,4,4,8,3,'#7ec4ff'); rect(c,5,5,6,1,'#ffe79e');
    px(c,6,5,INK); px(c,9,5,INK);
    rect(c,5,8,2,1,'#ff4a55'); rect(c,9,8,2,1,'#ff4a55');
    rect(c,5,10,2,1,WHT); rect(c,9,10,2,1,WHT);
    px(c,8,12,'#ff4a55'); px(c,7,12,'#ff4a55');
    // antenna
    px(c,12,2,INK); px(c,13,1,INK); px(c,14,0,'#ffe79e');
  } else if(id==='kick'){
    // boot
    rect(c,3,4,4,8,'#ff7a3d');
    rect(c,3,11,9,2,'#a8431f');
    rect(c,7,7,5,5,'#ff7a3d');
    rect(c,4,5,2,2,'#ffb061');
    strokeRect(c,3,4,4,8,INK);
    strokeRect(c,3,11,9,2,INK);
    strokeRect(c,7,7,5,5,INK);
    // bomb being kicked
    fillEll(c,13,11,2,2,'#3b2a55');
    strokeEll(c,13,11,2,2,INK);
    px(c,15,9,'#ff7a3d');
  } else if(id==='glove'){
    // mitten/glove
    rect(c,4,3,8,8,'#7ec4ff');
    rect(c,3,5,2,4,'#7ec4ff'); // thumb
    rect(c,4,11,8,3,'#3a7ec4'); // cuff
    rect(c,5,4,6,1,'#cfe9ff'); // highlight
    strokeRect(c,4,3,8,8,INK);
    strokeRect(c,3,5,2,4,INK);
    strokeRect(c,4,11,8,3,INK);
    px(c,6,7,INK); px(c,8,7,INK); px(c,10,7,INK); // finger lines
  } else if(id==='ghost'){
    fillEll(c,8,7,5,5,WHT);
    rect(c,3,7,11,5,WHT);
    // wavy bottom
    rect(c,3,12,2,1,WHT); rect(c,6,12,2,1,WHT); rect(c,9,12,2,1,WHT); rect(c,12,12,2,1,WHT);
    rect(c,4,13,1,1,WHT); rect(c,7,13,1,1,WHT); rect(c,10,13,1,1,WHT); rect(c,13,13,1,1,WHT);
    strokeEll(c,8,7,5,5,INK);
    // bottom outline
    px(c,3,12,INK); px(c,5,12,INK); px(c,6,12,INK); px(c,8,12,INK); px(c,9,12,INK); px(c,11,12,INK); px(c,12,12,INK); px(c,14,12,INK);
    px(c,4,13,INK); px(c,7,13,INK); px(c,10,13,INK); px(c,13,13,INK);
    // eyes
    rect(c,6,7,1,2,INK); rect(c,9,7,1,2,INK);
    // cheeks
    px(c,5,9,'#ff9bbb'); px(c,11,9,'#ff9bbb');
  } else if(id==='shield'){
    // shield outline
    rect(c,4,2,8,2,'#7ec4ff');
    rect(c,3,4,10,5,'#7ec4ff');
    rect(c,4,9,8,2,'#7ec4ff');
    rect(c,5,11,6,1,'#7ec4ff');
    rect(c,6,12,4,1,'#7ec4ff');
    rect(c,7,13,2,1,'#7ec4ff');
    // star
    px(c,8,5,'#ffe79e'); rect(c,7,6,3,1,'#ffe79e'); rect(c,6,7,5,1,'#ffe79e'); rect(c,7,8,3,1,'#ffe79e'); px(c,8,9,'#ffe79e');
    // outline
    px(c,4,2,INK); px(c,11,2,INK); px(c,3,4,INK); px(c,12,4,INK);
    px(c,3,8,INK); px(c,12,8,INK); px(c,4,9,INK); px(c,11,9,INK);
    px(c,5,11,INK); px(c,10,11,INK); px(c,6,12,INK); px(c,9,12,INK);
    px(c,7,13,INK); px(c,8,13,INK);
    rect(c,4,3,8,1,'#cfe9ff');
  } else if(id==='ice'){
    fillEll(c,8,9,5,5,'#cfe9ff'); strokeEll(c,8,9,5,5,INK);
    rect(c,7,3,3,1,INK); px(c,8,5,INK); px(c,9,4,'#7ec4ff'); px(c,10,3,WHT);
    rect(c,6,8,2,2,WHT); rect(c,9,8,2,2,WHT); px(c,7,9,INK); px(c,10,9,INK);
    // snowflakes
    px(c,3,3,WHT); px(c,4,4,'#7ec4ff'); px(c,3,5,WHT);
    px(c,13,3,WHT); px(c,14,2,'#7ec4ff');
  } else if(id==='magnet'){
    // U magnet
    rect(c,3,3,3,8,'#ff4a55'); rect(c,10,3,3,8,'#ff4a55');
    rect(c,3,3,10,2,'#ff4a55');
    rect(c,3,3,3,3,'#fff8e7'); rect(c,10,3,3,3,'#fff8e7'); // top white tips? no — keep
    rect(c,3,11,3,2,WHT); rect(c,10,11,3,2,WHT);
    strokeRect(c,3,3,3,10,INK); strokeRect(c,10,3,3,10,INK);
    rect(c,6,3,4,2,'#ff4a55'); strokeRect(c,3,3,10,2,INK);
    // sparkles
    px(c,1,7,'#ffe79e'); px(c,14,7,'#ffe79e');
    px(c,2,2,'#ffe79e'); px(c,13,1,'#ffe79e');
  } else if(id==='slow'){
    // clock
    fillEll(c,8,9,6,6,WHT); strokeEll(c,8,9,6,6,INK);
    fillEll(c,8,9,5,5,'#fff8e7');
    // numbers tick marks
    px(c,8,4,INK); px(c,8,14,INK); px(c,3,9,INK); px(c,13,9,INK);
    // hands
    rect(c,8,6,1,3,INK); rect(c,8,9,4,1,INK);
    px(c,8,9,'#ff4a55');
    // top stem
    rect(c,7,2,3,2,'#3a3550'); strokeRect(c,7,2,3,2,INK);
  } else if(id==='super'){
    fillEll(c,8,9,5,5,'#ff4a55'); strokeEll(c,8,9,5,5,INK);
    // star pattern
    px(c,5,7,'#ffe79e'); px(c,11,7,'#ffe79e'); px(c,5,11,'#ffe79e'); px(c,11,11,'#ffe79e'); px(c,8,9,'#ffe79e');
    rect(c,7,3,3,1,INK); px(c,9,4,'#5a4570'); px(c,10,3,'#ff7a3d'); px(c,11,2,'#ffe79e'); px(c,12,1,WHT);
    rect(c,6,8,2,2,WHT); rect(c,9,8,2,2,WHT); px(c,7,9,INK); px(c,10,9,INK);
    // SP marker
    px(c,5,12,'#ffe79e'); px(c,11,12,'#ffe79e');
  }
}

/* ---------- ICONS (10x10) ---------- */
function drawIco(c,k){
  if(k==='play'){ for(let i=0;i<6;i++){ rect(c,3,2+i,1,1,INK);} for(let i=0;i<5;i++) rect(c,4+Math.floor(i/2),3+i, i%2===0?2:1, 1, '#ff6b9d'); 
    rect(c,3,2,1,6,INK); for(let i=0;i<6;i++) rect(c,4,2+i, Math.min(6-i,4), 1, '#ff6b9d');
    // re-outline
    px(c,3,2,INK); px(c,3,7,INK); px(c,4,2,INK); px(c,4,7,INK);
    px(c,5,3,INK); px(c,5,6,INK); px(c,6,4,INK); px(c,6,5,INK); px(c,7,4,INK); px(c,7,5,INK); px(c,8,4,INK); px(c,8,5,INK);
  } else if(k==='mp'){
    // two circles
    fillEll(c,3,5,2,2,'#7ec4ff'); strokeEll(c,3,5,2,2,INK);
    fillEll(c,7,5,2,2,'#ff6b9d'); strokeEll(c,7,5,2,2,INK);
  } else if(k==='cog'){
    fillEll(c,5,5,3,3,'#9fe0b8'); strokeEll(c,5,5,3,3,INK);
    fillEll(c,5,5,1,1,INK);
    // teeth
    px(c,5,1,INK); px(c,5,8,INK); px(c,1,5,INK); px(c,8,5,INK);
    px(c,2,2,INK); px(c,7,2,INK); px(c,2,7,INK); px(c,7,7,INK);
  } else if(k==='cup'){
    rect(c,2,2,6,4,'#ffe79e');
    rect(c,3,6,4,1,'#ffe79e');
    rect(c,3,7,4,1,'#a96e34');
    rect(c,2,8,6,1,'#a96e34');
    strokeRect(c,2,2,6,4,INK);
    px(c,2,8,INK); px(c,7,8,INK);
  } else if(k==='back'){
    // arrow left
    px(c,2,5,'#ff6b9d'); px(c,3,4,'#ff6b9d'); px(c,3,5,'#ff6b9d'); px(c,3,6,'#ff6b9d');
    rect(c,4,5,5,1,'#ff6b9d');
    px(c,3,4,INK); px(c,3,6,INK); px(c,2,5,INK); px(c,8,5,INK);
  }
}

/* ---------- CROWN (20x12) ---------- */
function drawCrown(c){
  // base
  rect(c,1,8,18,3,'#ffd34d');
  // 5 spikes
  rect(c,1,3,3,5,'#ffd34d');
  rect(c,5,5,3,3,'#ffd34d');
  rect(c,9,2,2,6,'#ffd34d');
  rect(c,12,5,3,3,'#ffd34d');
  rect(c,16,3,3,5,'#ffd34d');
  // jewels
  px(c,2,6,'#ff4a55'); px(c,6,7,'#7ec4ff'); px(c,9,5,'#ff6b9d'); px(c,13,7,'#7ed98a'); px(c,17,6,'#b58ee8');
  // highlights
  rect(c,1,8,18,1,'#ffe79e');
  // outline
  strokeRect(c,1,8,18,3,INK);
  px(c,1,3,INK); px(c,3,3,INK); px(c,1,7,INK); px(c,3,7,INK); px(c,4,7,INK);
  px(c,5,5,INK); px(c,7,5,INK); px(c,5,7,INK); px(c,7,7,INK); px(c,8,7,INK);
  px(c,9,2,INK); px(c,10,2,INK); px(c,9,7,INK); px(c,10,7,INK); px(c,11,7,INK);
  px(c,12,5,INK); px(c,14,5,INK); px(c,12,7,INK); px(c,14,7,INK); px(c,15,7,INK);
  px(c,16,3,INK); px(c,18,3,INK); px(c,16,7,INK); px(c,18,7,INK);
  for(let y=3;y<8;y++){ px(c,1,y,INK); px(c,18,y,INK); }
}

/* ---------- CLOUD ---------- */
function drawCloud(c, big){
  const w = c.canvas.width, h = c.canvas.height;
  fillEll(c, w*0.3, h*0.6, w*0.18, h*0.35, WHT);
  fillEll(c, w*0.5, h*0.5, w*0.22, h*0.45, WHT);
  fillEll(c, w*0.7, h*0.55, w*0.2, h*0.4, WHT);
  rect(c, 1, h-2, w-2, 1, WHT);
  if(big){ fillEll(c, w*0.85, h*0.65, w*0.12, h*0.3, WHT); }
}

/* ---------- SPARK ---------- */
function drawSpark(c){
  px(c,3,0,'#ff7a3d'); px(c,4,1,'#ffe79e'); px(c,3,1,'#ff7a3d');
  px(c,2,2,'#ffe79e'); px(c,3,2,WHT); px(c,4,2,'#ffe79e');
  px(c,3,3,'#ff7a3d'); rect(c,2,4,4,1,'#ff7a3d');
  px(c,1,3,'#ffe79e'); px(c,5,3,'#ffe79e');
  px(c,3,5,'#ffe79e'); px(c,3,6,'#ff7a3d');
  px(c,0,3,WHT); px(c,7,3,WHT);
}

/* ---------- MINI BOARD PREVIEW ---------- */
function drawMini(c, w, h){
  c.canvas.width = w*4; c.canvas.height = h*4;
  c.imageSmoothingEnabled = false;
  for(let y=0;y<h;y++) for(let x=0;x<w;x++){
    const isBorder = x===0||y===0||x===w-1||y===h-1;
    const isPillar = x%2===0 && y%2===0;
    let col;
    if(isBorder||isPillar) col='#7d6996';
    else if(((x+y)%5===0 || (x*7+y*3)%6===0)) col='#d49758';
    else col=(x+y)%2 ? '#d8eecf' : '#c8e3bd';
    if(x===1&&y===1) col='#6dd5e8';
    if(x===w-2&&y===1) col='#ff9ec7';
    if(x===1&&y===h-2) col='#f5d958';
    if(x===w-2&&y===h-2) col='#7ed98a';
    rect(c, x*4, y*4, 4, 4, col);
  }
}

/* ====================================================== */
/* RENDER ALL data-make CANVASES                          */
/* ====================================================== */
function setupCanvas(canvas, baseW, baseH, scale){
  // Render at base resolution; CSS controls display size + pixelated upscale.
  // We deliberately do NOT set inline style.width/height — that would override
  // the per-context CSS sizes (scoreboard avatars, HUD hearts, etc.).
  canvas.width = baseW;
  canvas.height = baseH;
  return canvas.getContext('2d');
}

document.querySelectorAll('canvas[data-make]').forEach(cv=>{
  const k = cv.getAttribute('data-make');
  let w=32, h=32, scale=4;
  if(k==='char'){ w=h=32; scale=4; }
  else if(k==='bomb'){ w=h=24; scale=2.5; }
  else if(k==='box' || k==='pillar'){ w=h=16; scale=2.5; }
  else if(k==='ex-c' || k==='ex-h' || k==='ex-v'){ w=h=16; scale=2.5; }
  else if(k==='heart'){ w=h=8; scale=2.5; }
  else if(k==='pup'){ w=h=16; scale=2; }
  else if(k.startsWith('ico-')){ w=h=10; scale=3.2; }
  else if(k==='crown'){ w=20; h=12; scale=4; }
  else if(k==='cloud'){ w=20; h=12; scale=4; }
  else if(k==='cloud2'){ w=30; h=14; scale=4; }
  else if(k==='spark'){ w=h=8; scale=4; }
  else if(k==='mini'){ /* size set inside */ scale=1; }
  
  if(k==='mini'){
    const ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled=false;
    drawMini(ctx, parseInt(cv.dataset.w), parseInt(cv.dataset.h));
    cv.style.width = (parseInt(cv.dataset.w)*8) + 'px';
    cv.style.height = (parseInt(cv.dataset.h)*8) + 'px';
    return;
  }
  
  const ctx = setupCanvas(cv, w, h, scale);
  ctx.imageSmoothingEnabled = false;
  
  if(k==='char'){ drawChar(ctx, cv.dataset.id); }
  else if(k==='bomb'){ drawBomb(ctx, cv.dataset.hot==='1'); }
  else if(k==='box'){ drawBox(ctx); }
  else if(k==='pillar'){ drawPillar(ctx); }
  else if(k==='ex-c'){ drawExCenter(ctx); }
  else if(k==='ex-h'){ drawExArm(ctx); }
  else if(k==='ex-v'){ ctx.translate(16,0); ctx.rotate(Math.PI/2); drawExArm(ctx); }
  else if(k==='heart'){ drawHeart(ctx, cv.dataset.empty==='1'); }
  else if(k==='pup'){ drawPup(ctx, cv.dataset.id); }
  else if(k==='ico-play'){ drawIco(ctx,'play'); }
  else if(k==='ico-mp'){ drawIco(ctx,'mp'); }
  else if(k==='ico-cog'){ drawIco(ctx,'cog'); }
  else if(k==='ico-cup'){ drawIco(ctx,'cup'); }
  else if(k==='ico-back'){ drawIco(ctx,'back'); }
  else if(k==='crown'){ drawCrown(ctx); }
  else if(k==='cloud'){ drawCloud(ctx, false); }
  else if(k==='cloud2'){ drawCloud(ctx, true); }
  else if(k==='spark'){ drawSpark(ctx); }
});

/* ====================================================== */
/* LOBBY: 8 player slots                                   */
/* ====================================================== */
const PLAYERS = [
  {id:'bubble',  nm:'BUBBLE',  ctrl:'WASD + SPACE',     mode:'human'},
  {id:'mochi',   nm:'MOCHI',   ctrl:'ARROWS + RSHIFT',  mode:'human'},
  {id:'biscuit', nm:'BISCUIT', ctrl:'IJKL + N',         mode:'human'},
  {id:'pickle',  nm:'PICKLE',  ctrl:'NUMPAD 8456 + 0',  mode:'human'},
  {id:'yam',     nm:'YAM',     ctrl:'GAMEPAD 1',        mode:'cpu'},
  {id:'plum',    nm:'PLUM',    ctrl:'AI · WIZARD LV3',  mode:'cpu'},
  {id:'peach',   nm:'PEACH',   ctrl:'EMPTY SLOT',       mode:'off'},
  {id:'mallow',  nm:'MALLOW',  ctrl:'EMPTY SLOT',       mode:'off'},
];
const pgrid = document.getElementById('pgrid');
PLAYERS.forEach((p,i)=>{
  const cls = p.mode==='off'?'off':(p.mode==='cpu'?'cpu':'');
  const slot = document.createElement('div');
  slot.className = 'pslot ' + cls;
  slot.innerHTML = `
    <div class="top"><span>P${i+1}</span><span>${p.mode.toUpperCase()}</span></div>
    <div class="av"><canvas data-make="char" data-id="${p.id}" width="32" height="32"></canvas>
      <input class="nm" value="${p.nm}">
    </div>
    <div class="ctrl">${p.ctrl}</div>
    <div class="seg">
      <span class="${p.mode==='human'?'on':''}">HUMAN</span>
      <span class="${p.mode==='cpu'?'on':''}">CPU</span>
      <span class="${p.mode==='off'?'on':''}">OFF</span>
    </div>
  `;
  pgrid.appendChild(slot);
  const cv = slot.querySelector('canvas');
  const ctx = setupCanvas(cv, 32, 32, 2);
  ctx.imageSmoothingEnabled=false;
  drawChar(ctx, p.id);
});

/* segment groups */
document.querySelectorAll('.seg-row, .pslot .seg').forEach(g=>{
  g.querySelectorAll('span').forEach(s=>{
    s.addEventListener('click',()=>{
      g.querySelectorAll('span').forEach(x=>x.classList.remove('on'));
      s.classList.add('on');
    });
  });
});
document.querySelectorAll('#grids .gcard').forEach(c=>{
  c.addEventListener('click',()=>{
    document.querySelectorAll('#grids .gcard').forEach(x=>x.classList.remove('sel'));
    c.classList.add('sel');
  });
});

/* ====================================================== */
/* GAMEPLAY board (15x13)                                  */
/* ====================================================== */
const W=15, H=13;
const layout = [
  "###############",
  "#1...B....B..2#",
  "#.#.#B#B#.#B#.#",
  "#.B.....B...B.#",
  "#.#.#.#a#.#.#.#",
  "#.B.b.B.B.f.B.#",
  "#...x.X.x.....#",
  "#.B.h.B.B.B.B.#",
  "#.#.#B#g#.#.#.#",
  "#.B.....e...B.#",
  "#.#B#.#.#.#.#.#",
  "#3..B.B.....B4#",
  "###############"
];

const pColors = ['bubble','mochi','biscuit','pickle'];
const pumap = {a:'bomb', f:'fire', g:'glove', e:'speed'};

const board = document.getElementById('board');
function mkCanvas(kind, dataset){
  const cv = document.createElement('canvas');
  cv.setAttribute('data-make', kind);
  for(const k in dataset) cv.dataset[k] = dataset[k];
  return cv;
}
function renderInto(cv, fn, w, h, scale){
  const ctx = setupCanvas(cv, w, h, scale);
  ctx.imageSmoothingEnabled=false;
  fn(ctx);
  return cv;
}

for(let y=0;y<H;y++){
  for(let x=0;x<W;x++){
    const t = document.createElement('div');
    t.className='tile';
    const ch = layout[y][x];
    if('123456789'.indexOf(ch)>=0 || ch==='.' || 'abcdefghijkl'.indexOf(ch)>=0 || ch==='b' || ch==='h' || ch==='X' || ch==='x' || ch==='y'){
      t.classList.add('floor'); if((x+y)%2) t.classList.add('b');
    }
    if(ch==='#'){ const cv=document.createElement('canvas'); renderInto(cv,(c)=>drawPillar(c),16,16,2.5); t.appendChild(cv); }
    if(ch==='B'){ const cv=document.createElement('canvas'); renderInto(cv,(c)=>drawBox(c),16,16,2.5); t.appendChild(cv); }
    if(ch==='b'){ const w=document.createElement('div'); w.className='breathe'; const cv=document.createElement('canvas'); renderInto(cv,(c)=>drawBomb(c,false),24,24,1.6); w.appendChild(cv); t.appendChild(w); }
    if(ch==='h'){ const w=document.createElement('div'); w.className='hot-pulse'; const cv=document.createElement('canvas'); renderInto(cv,(c)=>drawBomb(c,true),24,24,1.6); w.appendChild(cv); t.appendChild(w); }
    if(ch==='X'){ const w=document.createElement('div'); w.className='pulse-fast'; const cv=document.createElement('canvas'); renderInto(cv,(c)=>drawExCenter(c),16,16,2.5); w.appendChild(cv); t.appendChild(w); }
    if(ch==='x'){ const w=document.createElement('div'); w.className='pulse-fast'; const cv=document.createElement('canvas'); renderInto(cv,(c)=>drawExArm(c),16,16,2.5); w.appendChild(cv); t.appendChild(w); }
    if(ch==='y'){ const w=document.createElement('div'); w.className='pulse-fast'; const cv=document.createElement('canvas'); cv.style.transform='rotate(90deg)'; renderInto(cv,(c)=>drawExArm(c),16,16,2.5); w.appendChild(cv); t.appendChild(w); }
    const pi = '1234'.indexOf(ch);
    if(pi>=0){
      const w=document.createElement('div'); w.className='breathe';
      const cv=document.createElement('canvas');
      renderInto(cv, (c)=>drawChar(c, pColors[pi]), 32, 32, 1.2);
      w.appendChild(cv); t.appendChild(w);
    }
    if(pumap[ch]){
      const w=document.createElement('div'); w.className='pulse-slow';
      const cv=document.createElement('canvas');
      renderInto(cv,(c)=>drawPup(c,pumap[ch]),16,16,2);
      w.appendChild(cv); t.appendChild(w);
      const lbl=document.createElement('div'); lbl.className='label'; lbl.textContent = PUPS[pumap[ch]].nm;
      t.appendChild(lbl);
    }
    board.appendChild(t);
  }
}

/* power-up reference grid */
const pupGrid = document.getElementById('pupGrid');
Object.keys(PUPS).forEach(id=>{
  const cell = document.createElement('div');
  cell.className='pup-cell';
  cell.innerHTML = `<canvas></canvas><span><span class="nm">${PUPS[id].nm}</span><span class="ds">${PUPS[id].ds}</span></span>`;
  pupGrid.appendChild(cell);
  const cv = cell.querySelector('canvas');
  renderInto(cv, (c)=>drawPup(c,id), 16, 16, 2);
});

/* HUD player cards */
const hudPlayers = [
  {id:'bubble',  nm:'BUBBLE',  hp:3, sc:380,  pups:['bomb','fire','speed'],                 dead:false, badge:''},
  {id:'mochi',   nm:'MOCHI',   hp:2, sc:1200, pups:['bomb','bomb','fire','glove','shield'], dead:false, badge:'LEAD'},
  {id:'biscuit', nm:'BISCUIT', hp:1, sc:620,  pups:['speed','remote'],                      dead:false, badge:''},
  {id:'pickle',  nm:'PICKLE',  hp:0, sc:240,  pups:['kick'],                                dead:true,  badge:'OUT'},
];
function buildPCard(p){
  const card = document.createElement('div'); card.className='pcard ' + (p.dead?'dead':'');
  card.innerHTML = `
    ${p.badge?`<span class="badge">${p.badge}</span>`:''}
    <div class="row1"><canvas class="av" width="32" height="32"></canvas><span class="nm">${p.nm}</span><span class="sc">${p.sc.toLocaleString()}</span></div>
    <div class="hearts"></div>
    <div class="pups"></div>`;
  const av = card.querySelector('canvas.av');
  renderInto(av, (c)=>drawChar(c, p.id), 32, 32, 1.2);
  const hRow = card.querySelector('.hearts');
  for(let i=0;i<3;i++){
    const cv = document.createElement('canvas');
    renderInto(cv, (c)=>drawHeart(c, i>=p.hp), 8, 8, 2.2);
    hRow.appendChild(cv);
  }
  const pRow = card.querySelector('.pups');
  p.pups.forEach(id=>{
    const w = document.createElement('span'); w.className='pup';
    const cv = document.createElement('canvas');
    renderInto(cv, (c)=>drawPup(c,id), 16, 16, 1.1);
    w.appendChild(cv); pRow.appendChild(w);
  });
  return card;
}
const lh = document.getElementById('leftHud'), rh = document.getElementById('rightHud');
hudPlayers.slice(0,2).forEach(p=>lh.appendChild(buildPCard(p)));
hudPlayers.slice(2,4).forEach(p=>rh.appendChild(buildPCard(p)));

/* scoreboard mini icons */
function fillSbPup(elId, ids){
  const host = document.getElementById(elId);
  ids.forEach(id=>{
    const cv = document.createElement('canvas');
    renderInto(cv, (c)=>drawPup(c,id), 16, 16, 1.1);
    host.appendChild(cv);
  });
}
fillSbPup('sbpu1', ['bomb','bomb','fire','glove','shield']);
fillSbPup('sbpu2', ['bomb','fire','speed']);
fillSbPup('sbpu3', ['speed','remote']);
fillSbPup('sbpu4', ['kick']);

/* confetti */
const conf = document.getElementById('conf');
const palette=['#ff6b9d','#ffe79e','#9fe0b8','#7ec4ff','#d2b3ee','#ff7a3d'];
for(let i=0;i<60;i++){
  const c=document.createElement('div'); c.className='c';
  c.style.left = Math.random()*100+'%';
  c.style.background = palette[i%palette.length];
  c.style.animationDelay = (Math.random()*4)+'s';
  c.style.animationDuration = (3+Math.random()*3)+'s';
  if(i%3===0) c.style.borderRadius='50%';
  if(i%4===0){ c.style.width='6px'; c.style.height='14px'; }
  conf.appendChild(c);
}

/* timer */
let secs = 134;
setInterval(()=>{
  secs = Math.max(0, secs-1);
  const m = Math.floor(secs/60), s=String(secs%60).padStart(2,'0');
  const t = document.getElementById('timer'); if(t) t.textContent = `${m}:${s}`;
},1000);
