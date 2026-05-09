/* WebRTC wrapper around PeerJS for host + client roles.
   PeerJS itself is loaded via a script tag in index.html and exposes
   window.Peer.  We deliberately keep the surface small: the rest of the
   app talks to a peer through `send()` and the `onMessage` callback. */

import { encode, decode, MSG_JOIN, MSG_LEAVE, MSG_WELCOME } from './protocol.js';

/* Public PeerJS broker prefix.  Add a project namespace so we don't clash
   with someone else's hobby project on the same broker. */
const ID_PREFIX = 'boombuddies-';
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   // no I/O/0/1 — easier to read

export function generateRoomCode(){
  let s = '';
  for(let i = 0; i < 4; i++) s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return s;
}

function peerIdFor(code){
  return ID_PREFIX + code.toUpperCase();
}

/* ============ HOST ============
   The host registers a deterministic peer ID derived from the room code so
   clients can connect by typing the code.  Each new client connection becomes
   a 'guest' object the host can send messages to. */
export function createHost(roomCode, hooks){
  if(typeof window.Peer !== 'function'){
    return Promise.reject(new Error('PeerJS not loaded — check the CDN script tag.'));
  }
  const id = peerIdFor(roomCode);
  const peer = new window.Peer(id, { debug: 1 });
  const guests = new Map();    // peerId -> { conn, name, charId, idx, ready }

  const host = {
    role: 'host',
    code: roomCode,
    peer,
    guests,
    broadcast(msg){
      const wire = encode(msg);
      for(const g of guests.values()){
        try { g.conn.send(wire); } catch {}
      }
    },
    sendTo(target, msg){
      const g = typeof target === 'string' ? guests.get(target) : target;
      if(!g) return;
      try { g.conn.send(encode(msg)); } catch {}
    },
    close(){
      for(const g of guests.values()){
        try { g.conn.close(); } catch {}
      }
      guests.clear();
      try { peer.destroy(); } catch {}
    },
  };

  return new Promise((resolve, reject) => {
    let opened = false;
    peer.on('open', () => { opened = true; resolve(host); });
    peer.on('error', (err) => {
      if(!opened){ reject(err); return; }
      hooks.onError?.(err);
    });
    peer.on('connection', (conn) => {
      const guest = { conn, name: null, charId: null, idx: null, ready: false };
      conn.on('open', () => {
        guests.set(conn.peer, guest);
        hooks.onGuestConnect?.(guest);
      });
      conn.on('data', (raw) => {
        const msg = decode(raw);
        if(!msg) return;
        if(msg.t === MSG_JOIN){
          guest.name = msg.name || 'Buddy';
          guest.charId = msg.charId || 'mochi';
        }
        hooks.onMessage?.(guest, msg);
      });
      conn.on('close', () => {
        guests.delete(conn.peer);
        hooks.onGuestDisconnect?.(guest);
      });
    });
  });
}

/* ============ CLIENT ============
   The client opens a fresh peer, then connects to the host's deterministic ID. */
export function createClient(roomCode, hooks){
  if(typeof window.Peer !== 'function'){
    return Promise.reject(new Error('PeerJS not loaded — check the CDN script tag.'));
  }
  const peer = new window.Peer({ debug: 1 });
  const targetId = peerIdFor(roomCode);

  return new Promise((resolve, reject) => {
    let timeout = setTimeout(() => reject(new Error('Connection timed out — bad code or host offline?')), 12000);
    peer.on('open', () => {
      const conn = peer.connect(targetId, { reliable: true });
      conn.on('open', () => {
        clearTimeout(timeout);
        const client = {
          role: 'client',
          code: roomCode,
          peer,
          conn,
          send(msg){ try { conn.send(encode(msg)); } catch {} },
          close(){
            try { conn.close(); } catch {}
            try { peer.destroy(); } catch {}
          },
        };
        conn.on('data', (raw) => {
          const msg = decode(raw);
          if(msg) hooks.onMessage?.(msg);
        });
        conn.on('close', () => {
          hooks.onDisconnect?.();
        });
        conn.on('error', (e) => hooks.onError?.(e));
        resolve(client);
      });
      conn.on('error', (e) => {
        clearTimeout(timeout);
        reject(e);
      });
    });
    peer.on('error', (e) => {
      clearTimeout(timeout);
      reject(e);
    });
  });
}
