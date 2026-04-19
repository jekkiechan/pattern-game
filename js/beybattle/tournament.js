// ═══════════════════════════════════════════════════════════
// TOURNAMENT MODE
// ═══════════════════════════════════════════════════════════
const TIER_RANK = [
  'NOVICE','APPRENTICE','ADVANCED','ELITE','CHAMPION',
  'LEGENDARY','MYTHICAL','TRANSCENDENT','GOD','UNKNOWN'
];

const TOURNAMENT_ROUNDS = 3;
const SAVE_KEY = 'beybattleSave';

function tLoadSave() {
  try {
    return JSON.parse(localStorage.getItem(SAVE_KEY)) || { wins: 0 };
  } catch { return { wins: 0 }; }
}

function tSaveWin(playerIdx) {
  const s = tLoadSave();
  s.wins = (s.wins || 0) + 1;
  s.lastWinChar = CONFIGS[playerIdx].name;
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); } catch {}
  return s.wins;
}

function tTrophyCount() {
  return tLoadSave().wins || 0;
}

// Build a 3-round bracket of opponent indices, scaling with player tier.
function tGenerateBracket(playerIdx) {
  const playerTier = TIER_RANK.indexOf(CONFIGS[playerIdx].tier);
  const pool = CONFIGS.map((_, i) => i).filter(i => i !== playerIdx);
  const used = new Set();

  const pick = (n, filterFn) => {
    const avail = pool.filter(i => !used.has(i) && filterFn(CONFIGS[i]));
    const picks = [];
    while (picks.length < n && avail.length) {
      const j = Math.floor(Math.random() * avail.length);
      picks.push(avail.splice(j, 1)[0]);
    }
    // Fallback from anything unused
    if (picks.length < n) {
      const rem = pool.filter(i => !used.has(i) && !picks.includes(i));
      while (picks.length < n && rem.length) {
        const j = Math.floor(Math.random() * rem.length);
        picks.push(rem.splice(j, 1)[0]);
      }
    }
    picks.forEach(i => used.add(i));
    return picks;
  };

  const tierOf = c => TIER_RANK.indexOf(c.tier);
  const round1 = pick(3, c => tierOf(c) <= Math.max(2, playerTier - 1));
  const round2 = pick(3, c => Math.abs(tierOf(c) - playerTier) <= 1);
  const round3 = pick(3, c => tierOf(c) >= playerTier);
  return [round1, round2, round3];
}

function tStartTournament() {
  G.mode = 'tournament';
  G.tournament = {
    round: 0,                    // 1..3 after first advance
    bracket: tGenerateBracket(G.selectedChar),
    carryPct: 1.0,               // stamina % carried into next round
    victories: 0,
  };
}

function tShowBracket(onContinue) {
  const t = G.tournament;
  const wrap = document.getElementById('bracket-rounds');
  wrap.innerHTML = '';

  t.bracket.forEach((roundOpps, i) => {
    const done = i < t.round;
    const current = i === t.round;
    const row = document.createElement('div');
    row.className = 'bracket-round' + (done ? ' done' : '') + (current ? ' current' : '');
    const label = done ? 'WON' : current ? 'NEXT' : `R${i+1}`;
    const oppHTML = roundOpps.map(idx => {
      const c = CONFIGS[idx];
      return `<span class="bracket-foe" style="color:${c.color};border-color:${c.color}55">${c.name}</span>`;
    }).join('');
    row.innerHTML = `
      <div class="bracket-label">ROUND ${i+1} · ${label}</div>
      <div class="bracket-foes">${oppHTML}</div>`;
    wrap.appendChild(row);
  });

  const status = document.getElementById('bracket-status');
  if (t.round === 0) {
    status.textContent = 'STEP INTO THE ARENA';
    status.style.color = '#00d4ff';
  } else {
    const pct = Math.round(t.carryPct * 100);
    status.innerHTML = `ROUND ${t.round} CLEARED · STAMINA CARRIED <span style="color:#00ff88">${pct}%</span>`;
    status.style.color = '#667';
  }

  const nextBtn = document.getElementById('btn-next-round');
  nextBtn.textContent = t.round === 0 ? 'BEGIN ROUND 1 →' : `BEGIN ROUND ${t.round + 1} →`;
  nextBtn.onclick = () => {
    showScreen(null);
    tBeginNextRound();
  };

  showScreen('screen-bracket');
}

function tBeginNextRound() {
  const t = G.tournament;
  t.round++;
  G.selectedOpponents = t.bracket[t.round - 1].slice();
  startRound();
}

function tOnRoundEnd(playerWon, playerBlade) {
  const t = G.tournament;
  if (!playerWon) {
    tShowEliminated();
    return;
  }
  t.victories++;
  // Carry over stamina: current % + 20% recovery bonus, capped at 100%
  const cur = playerBlade ? playerBlade.stamina / playerBlade.maxStamina : 0;
  t.carryPct = Math.max(0.3, Math.min(1, cur + 0.20));

  if (t.round >= TOURNAMENT_ROUNDS) {
    const totalWins = tSaveWin(G.selectedChar);
    tShowChampion(totalWins);
  } else {
    tShowBracket();
  }
}

function tShowChampion(totalWins) {
  const sub = document.getElementById('champion-sub');
  const playerCfg = CONFIGS[G.selectedChar];
  sub.innerHTML = `${playerCfg.name} CLAIMS THE CROWN`;
  sub.style.color = playerCfg.color;

  document.getElementById('champion-trophies').textContent = totalWins;
  document.getElementById('champion-streak').textContent =
    totalWins === 1 ? 'FIRST VICTORY' : `${totalWins} TOURNAMENTS WON`;
  showScreen('screen-champion');
}

function tShowEliminated() {
  const t = G.tournament;
  const rT = document.getElementById('result-title');
  const rS = document.getElementById('result-sub');
  rT.textContent = 'ELIMINATED';
  rT.className = 'result-title lose';
  rS.textContent = `FELL IN ROUND ${t.round} OF ${TOURNAMENT_ROUNDS}`;
  // reuse screen-end but button takes you home instead of rematch
  showScreen('screen-end');
  document.getElementById('btn-restart').textContent = 'TRY AGAIN';
}

function tExit() {
  G.mode = 'single';
  G.tournament = null;
}

function tRefreshTrophyDisplay() {
  const el = document.getElementById('trophy-display');
  if (!el) return;
  const n = tTrophyCount();
  if (n > 0) {
    el.style.display = 'flex';
    el.innerHTML = `<span class="trophy-icon">♔</span><span>${n} TROPHY${n === 1 ? '' : 'S'}</span>`;
  } else {
    el.style.display = 'none';
  }
}
