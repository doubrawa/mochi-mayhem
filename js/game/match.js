/* Match state — a sequence of rounds with cumulative scoring.
   The shape is the same regardless of how many players or rounds. */

export function createMatch(lobby){
  const active = lobby.players.filter(p => p.mode !== 'off');
  return {
    rounds: lobby.rounds,
    timeLimit: lobby.timeLimit,
    fieldSize: lobby.fieldSize,
    goodieFreq: lobby.goodieFreq,
    current: 1,                            // 1-indexed
    /* Snapshot of the active players when the match started.
       We keep their config (id, name, mode) here so screen rendering doesn't
       depend on lobby UI state being unchanged between rounds. */
    players: active.map((p, i) => ({
      idx: i,
      id: p.id,
      name: p.name || p.id.toUpperCase(),
      mode: p.mode,
      score: 0,                             // round wins
      ko: 0,                                // total kills across the match
    })),
    history: [],   // per-round: { round, winnerIdx, durationSec, kos: Map<idx,count> }
  };
}

export function recordRoundResult(match, result){
  match.history.push(result);
  if(result.winnerIdx != null){
    const w = match.players.find(p => p.idx === result.winnerIdx);
    if(w) w.score += 1;
  }
  if(result.kos){
    for(const [idx, count] of result.kos.entries()){
      const p = match.players.find(x => x.idx === idx);
      if(p) p.ko += count;
    }
  }
  match.current += 1;
}

export function isMatchOver(match){
  return match.current > match.rounds;
}

/* Final standings: sort by score desc then ko desc. */
export function rankings(match){
  return [...match.players].sort((a, b) => {
    if(b.score !== a.score) return b.score - a.score;
    return b.ko - a.ko;
  });
}

/* Champion of the whole match, or null if a tie at top. */
export function matchChampion(match){
  const r = rankings(match);
  if(r.length === 0) return null;
  if(r.length > 1 && r[0].score === r[1].score && r[0].ko === r[1].ko) return null;
  return r[0];
}
