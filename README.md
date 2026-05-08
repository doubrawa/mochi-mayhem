# Boom Buddies

A cute pixel-art Bomberman clone for the browser. Pure HTML/CSS/JS — no build step, no framework. Designed to be hosted on GitHub Pages.

## Run locally

ES modules require a server (`file://` won't work).

```sh
npx serve .
# or
python -m http.server 8080
```

Then open http://localhost:8080/

## Roadmap

- [x] **1.** Skeleton + screen routing
- [ ] **2.** Player movement, walls, boxes
- [ ] **3.** Bombs and explosions
- [ ] **4.** Power-ups (12 effects)
- [ ] **5.** Local multiplayer (2–4 on one keyboard)
- [ ] **6.** Round end + scoring + match flow
- [ ] **7.** Online multiplayer via WebRTC room codes
- [ ] **8.** Polish: sounds, particles, simple CPU AI

## Layout

```
index.html
css/style.css
js/
  main.js          # screen router
  sprites.js       # pixel-SVG sprite library
  screens/
    title.js
    lobby.js
    game.js
    roundend.js
reference/
  mockup.html      # original visual mockup from Claude Design
```
