import * as title    from './screens/title.js';
import * as lobby    from './screens/lobby.js';
import * as onlineLobby from './screens/online-lobby.js';
import * as game     from './screens/game.js';
import * as roundend from './screens/roundend.js';
import { createMatch, recordRoundResult, isMatchOver } from './game/match.js';

const SCREENS = { title, lobby, 'online-lobby': onlineLobby, game, roundend };
const app = document.getElementById('app');

const ctx = {
  app,
  lobby: lobby.defaultLobbyState(),
  match: null,
  lastRound: null,
  net: null,           // { role: 'host'|'client', host?, client?, code, ... }
  navigate(name){ route(name); },
  recordRound(result){
    ctx.lastRound = result;
    if(ctx.match) recordRoundResult(ctx.match, result);
  },
};

let currentScreen = null;

function route(name){
  if(currentScreen && SCREENS[currentScreen].teardown){
    SCREENS[currentScreen].teardown();
  }
  app.innerHTML = '';

  if(name === 'game'){
    if(!ctx.match || isMatchOver(ctx.match)){
      ctx.match = createMatch(ctx.lobby);
      ctx.lastRound = null;
    }
  } else if(name === 'title'){
    /* Drop networking + match state when going home. */
    ctx.match = null;
    ctx.lastRound = null;
    if(ctx.net){
      try { (ctx.net.host || ctx.net.client)?.close?.(); } catch {}
      ctx.net = null;
    }
  }

  currentScreen = name;
  SCREENS[name].render(ctx);
  window.scrollTo(0, 0);
}

route('title');
