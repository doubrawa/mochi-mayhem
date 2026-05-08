import * as title    from './screens/title.js';
import * as lobby    from './screens/lobby.js';
import * as game     from './screens/game.js';
import * as roundend from './screens/roundend.js';
import { createMatch, recordRoundResult, isMatchOver } from './game/match.js';

const SCREENS = { title, lobby, game, roundend };
const app = document.getElementById('app');

/* Global app context.  Each screen reads what it needs from ctx and
   navigates via ctx.navigate(name). */
const ctx = {
  app,
  lobby: lobby.defaultLobbyState(),
  match: null,         // active match, set when entering 'game'
  lastRound: null,     // most recent round result, set when round ends
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

  /* Pre-flight transitions. */
  if(name === 'game'){
    /* Start a fresh match if there isn't one or the previous one finished. */
    if(!ctx.match || isMatchOver(ctx.match)){
      ctx.match = createMatch(ctx.lobby);
      ctx.lastRound = null;
    }
  } else if(name === 'title'){
    /* Discard any in-flight match when returning to the title. */
    ctx.match = null;
    ctx.lastRound = null;
  }

  currentScreen = name;
  SCREENS[name].render(ctx);
  window.scrollTo(0, 0);
}

route('title');
