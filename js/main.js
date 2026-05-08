import * as title    from './screens/title.js';
import * as lobby    from './screens/lobby.js';
import * as game     from './screens/game.js';
import * as roundend from './screens/roundend.js';

const SCREENS = { title, lobby, game, roundend };
const app = document.getElementById('app');

let lobbyState = lobby.defaultLobbyState();
let currentScreen = null;

function navigate(name){
  if(currentScreen && SCREENS[currentScreen].teardown){
    SCREENS[currentScreen].teardown();
  }
  app.innerHTML = '';
  currentScreen = name;
  SCREENS[name].render(app, navigate, lobbyState);
  window.scrollTo(0, 0);
}

navigate('title');
