// Small, self-hosted demonstrations shared by the guide and both games.
const moves = {
  launch: ['Launch', 'Tap in the blue zone.', 'Space / Launch', 'The marker moves across the meter. Tap Launch when it reaches the blue center for bonus energy.'],
  dash: ['Dash', 'Tap to rush your rival.', 'Q / Dash', 'Tap Dash. Your blue blade rushes toward the orange rival automatically.'],
  guard: ['Guard', 'Orange warning? Get ready. Then block!', 'E / Guard', 'The orange rival winds up, then rushes. Tap Guard as the rush arrives to block it.'],
  special: ['Special', 'Full gold bar? Tap Special!', 'Space / Special', 'The gold energy bar fills. Tap Special once it is full to unleash your move.'],
  steer: ['Steer', 'Hold left or right. Bounce!', '← → / A D', 'Your blade bounces automatically. Hold a side of the arena or a left or right button to steer onto the next platform.'],
  charge: ['Charge', 'New center landings fill Burst.', 'Land in the center', 'Bounce onto the bright center of three new platforms to fill the Burst meter. Stars add charge too.'],
  burst: ['Air burst', 'Full bar? Jump again in midair!', 'Space / Burst', 'With a full gold bar, tap Burst in midair for one extra jump to reach a higher platform.'],
  drop: ['Drop', 'Hold to drop. Let go to land.', '↓ / S / Drop', 'Hold Drop to pass through a platform. Release Drop to land on the platform below.']
};

function blade(x, y, who) {
  return `<g transform="translate(${x} ${y})"><g class="demo-${who}"><g class="demo-spin"><path d="M0-20 8-14 19-9 16 1 18 13 6 16-3 21-11 13-20 7-16-5-13-17-3-15Z"/><circle r="12"/><path d="m0-8 7 12H-7Z"/></g></g></g>`;
}
function scene(move) {
  if (move === 'launch') return `<text x="144" y="38" text-anchor="middle">BLUE ZONE</text><rect class="demo-track" x="24" y="62" width="240" height="18" rx="9"/><rect class="demo-blue" x="120" y="62" width="48" height="18" rx="3"/><g class="demo-marker"><path d="M30 54v34"/></g><text class="demo-success" x="144" y="112" text-anchor="middle">+14 ENERGY</text>`;
  if (['dash', 'guard', 'special'].includes(move)) return `<ellipse class="demo-arena" cx="144" cy="90" rx="124" ry="45"/><path class="demo-path" d="M68 90H220"/>${move === 'guard' ? '<text class="demo-warning" x="144" y="30" text-anchor="middle">RUSH INCOMING</text><circle class="demo-shield" cx="68" cy="90" r="30"/>' : ''}${move === 'special' ? '<rect class="demo-track" x="40" y="21" width="208" height="9" rx="4"/><path class="demo-energy" d="M40 25.5H248"/><g transform="translate(68 90)"><circle class="demo-wave" r="28"/></g>' : ''}${blade(68, 90, 'player')}${blade(220, 90, 'rival')}<g transform="translate(${move === 'guard' ? 104 : 188} 90)"><path class="demo-hit" d="M-12-20 0-8 12-20 7-3 23 0 7 5 12 20 0 9-12 20-7 4-23 0-7-4Z"/></g>`;
  const platforms = move === 'drop'
    ? '<path class="demo-platform" d="M48 55H240M48 127H240"/><path class="demo-path" d="M144 62v54"/>'
    : '<path class="demo-platform" d="M20 132H95M105 96H180M196 70H271"/><path class="demo-centers" d="M45 132H70M130 96H155M221 70H246"/>';
  return `${platforms}${move === 'burst' || move === 'charge' ? '<rect class="demo-track" x="20" y="12" width="130" height="8" rx="4"/><path class="demo-energy" d="M20 16H150"/>' : ''}${move === 'burst' ? '<text class="demo-success" x="178" y="20">↑ BURST</text>' : ''}${blade(move === 'drop' ? 144 : 56, move === 'drop' ? 32 : 110, 'player')}${move === 'steer' ? '<text x="213" y="126" text-anchor="middle">→</text>' : ''}`;
}

class MoveDemo extends HTMLElement {
  static observedAttributes = ['move'];
  connectedCallback() { this.render(); }
  attributeChangedCallback() { if (this.isConnected) this.render(); }
  render() {
    const move = this.getAttribute('move');
    if (!moves[move]) return;
    const [title, cue, key, description] = moves[move];
    this.classList.remove('demo-paused');
    this.innerHTML = `<figure class="move-demo demo-${move}"><figcaption><b>${title}</b><span>${cue}</span></figcaption><svg viewBox="0 0 288 154" role="img" aria-label="${description}">${scene(move)}<g class="demo-tap" transform="translate(144 140)"><circle r="11"/><path d="M0-6v8m-4-3 4 5 4-5"/></g></svg><div class="demo-footer"><span>${key}</span><button type="button" class="demo-toggle" aria-label="Pause ${title} animation">Pause</button><button type="button" class="demo-replay" aria-label="Replay ${title} animation">Replay</button></div></figure>`;
    const toggle = this.querySelector('.demo-toggle');
    toggle.onclick = () => {
      const paused = this.classList.toggle('demo-paused');
      toggle.textContent = paused ? 'Play' : 'Pause';
      toggle.setAttribute('aria-label', `${paused ? 'Play' : 'Pause'} ${title} animation`);
    };
    this.querySelector('.demo-replay').onclick = () => {
      // Restart without replacing the focused control.
      this.classList.add('demo-restarting');
      void this.offsetWidth;
      this.classList.remove('demo-restarting', 'demo-paused');
      toggle.textContent = 'Pause';
      toggle.setAttribute('aria-label', `Pause ${title} animation`);
    };
  }
}
customElements.define('move-demo', MoveDemo);
