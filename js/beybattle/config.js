// ═══════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════
const canvas = document.getElementById('game');
let   ctx    = canvas.getContext('2d'); // let so preview draws can swap context

const BLADE_R           = 20;
const FRICTION          = 0.994;
const WALL_DAMP         = 0.72;
const RESTITUTION       = 0.82;
const MAX_SPEED         = 12;
const MAX_POWER         = 14;
const EDGE_START        = 0.82;   // fraction of arenaR where edge drain begins
const EDGE_DRAIN        = 0.18;
const HIT_DRAIN_BASE    = 7;
const AI_INTERVAL       = 0.55;
const BOOST_COOLDOWN = 3.5;
const BOOST_POWER    = 9;
const SPECIAL_CHARGE_TIME = 2.0;   // seconds to fully charge special
const SPECIAL_COOLDOWN    = 8.0;   // seconds between special uses

// atkR/defR/staR/spdR/bstR: display ratings 1-10 shown on select screen
// tier: NOVICE | APPRENTICE | ADVANCED | ELITE | CHAMPION | LEGENDARY | MYTHICAL
const CONFIGS = [
  { name:'IMPACT DRAKE',   type:'ATTACK',  color:'#cc2211', glow:'#ff4422', blades:4, shape:'drake',
    maxStamina:100, mass:1.40, defense:0.80, attackMult:1.40, burstResist:0.60, personality:'aggressive',
    desc:'Heavy rubber contact delivers crushing smash attacks. The balanced powerhouse of Beyblade X.',
    atkR:8, defR:5, staR:6, spdR:7, bstR:6, tier:'CHAMPION',
    special:{ name:'Drake Impact', desc:'+50% attack & repel burst', effect:'drakeImpact' } },

  { name:'DRAN SWORD',     type:'ATTACK',  color:'#ff6600', glow:'#ff3300', blades:3, shape:'dran',
    maxStamina:75,  mass:0.85, defense:0.75, attackMult:1.72, burstResist:0.28, personality:'aggressive',
    desc:'Three sword blades hit like a typhoon. Highest attack in the game — zero safety margin.',
    atkR:10, defR:3, staR:3, spdR:9, bstR:2, tier:'ELITE',
    special:{ name:'Dran Rush', desc:'Burst of double speed for 2s', effect:'dranRush' } },

  { name:'COBALT DRAGOON', type:'ATTACK',  color:'#1166cc', glow:'#2288ff', blades:4, shape:'dragoon',
    maxStamina:90,  mass:1.30, defense:0.72, attackMult:1.50, burstResist:0.50, personality:'aggressive',
    desc:'Left-spin dragon blade disrupts right-spin opponents. Cobalt blue attack force.',
    atkR:9, defR:4, staR:5, spdR:8, bstR:5, tier:'ELITE',
    special:{ name:'Dragoon Vortex', desc:'Pull all nearby foes inward for 2.5s', effect:'dragoonVortex' } },

  { name:'CRIMSON GARUDA', type:'BALANCE', color:'#cc1100', glow:'#ff2200', blades:4, shape:'garuda',
    maxStamina:115, mass:1.45, defense:0.62, attackMult:1.10, burstResist:0.68, personality:'aggressive',
    desc:'Wide feather blades adapt to any opponent. The scarlet bird of balance.',
    atkR:6, defR:7, staR:7, spdR:5, bstR:7, tier:'CHAMPION',
    special:{ name:'Gale Redirect', desc:'Instantly reverse velocity (feint)', effect:'galeRedirect' } },

  { name:'SAMURAI SABER',  type:'ATTACK',  color:'#2244aa', glow:'#3366cc', blades:2, shape:'saber',
    maxStamina:72,  mass:0.90, defense:0.65, attackMult:1.62, burstResist:0.35, personality:'aggressive',
    desc:'Dual retracting blades deliver devastating one-hit strikes. Samurai precision.',
    atkR:9, defR:3, staR:4, spdR:9, bstR:3, tier:'ADVANCED',
    special:{ name:'Flash Blade', desc:'Next 2 hits deal dmg but take none', effect:'flashBlade' } },

  { name:'HELLS CHAIN',   type:'DEFENSE', color:'#9933ff', glow:'#6600cc', blades:4, shape:'hells',
    maxStamina:145, mass:1.75, defense:0.52, attackMult:0.72, burstResist:0.92, personality:'defensive',
    desc:'Near-indestructible tank. Absorbs everything.',
    atkR:3, defR:8, staR:9, spdR:4, bstR:9, tier:'CHAMPION',
    special:{ name:'Chain Bind', desc:'Cap all foes to 40% speed for 3s', effect:'chainBind' } },

  { name:'KNIGHT SHIELD', type:'DEFENSE', color:'#4488ff', glow:'#2255cc', blades:3, shape:'knight',
    maxStamina:130, mass:1.60, defense:0.44, attackMult:0.60, burstResist:0.96, personality:'passive',
    desc:'Ultimate defense. Nearly impossible to burst.',
    atkR:2, defR:9, staR:8, spdR:2, bstR:10, tier:'ELITE',
    special:{ name:'Royal Guard', desc:'Immune to all damage for 2.5s', effect:'royalGuard' } },

  { name:'SHARK EDGE',    type:'ATTACK',  color:'#00ffcc', glow:'#00aa88', blades:5, shape:'claw',
    maxStamina:68,  mass:0.78, defense:0.82, attackMult:1.82, burstResist:0.18, personality:'aggressive',
    desc:'Fastest blade alive. One wrong hit and it\'s gone.',
    atkR:10, defR:2, staR:2, spdR:10, bstR:1, tier:'ADVANCED',
    special:{ name:'Hunting Speed', desc:'Lunge at nearest foe at max speed', effect:'huntingSpeed' } },

  { name:'LEON CLAW',     type:'ATTACK',  color:'#ffdd00', glow:'#cc9900', blades:4, shape:'claw',
    maxStamina:88,  mass:1.05, defense:0.72, attackMult:1.62, burstResist:0.42, personality:'aggressive',
    desc:'Fearless attacker with lion-claw contact points.',
    atkR:9, defR:4, staR:5, spdR:7, bstR:4, tier:'ELITE',
    special:{ name:'Pride Roar', desc:'Shockwave pushes all nearby foes away', effect:'prideRoar' } },

  { name:'WYVERN GALE',   type:'STAMINA', color:'#00ff66', glow:'#00aa44', blades:4, shape:'horn',
    maxStamina:148, mass:1.32, defense:0.50, attackMult:0.88, burstResist:0.80, personality:'defensive',
    desc:'High endurance wind-type. Outlasts everyone.',
    atkR:5, defR:6, staR:9, spdR:6, bstR:8, tier:'CHAMPION',
    special:{ name:'Wind Recovery', desc:'Restore 25 stamina instantly', effect:'windRecovery' } },

  { name:'UNICORN STING', type:'STAMINA', color:'#eeeeff', glow:'#aabbff', blades:3, shape:'wing',
    maxStamina:162, mass:1.15, defense:0.55, attackMult:0.82, burstResist:0.74, personality:'passive',
    desc:'Longest stamina in the arena. Wins by attrition.',
    atkR:4, defR:6, staR:10, spdR:5, bstR:7, tier:'ELITE',
    special:{ name:'Phantom Drive', desc:'Teleport to center + 20 stamina', effect:'phantomDrive' } },

  { name:'WIZARD ARROW',  type:'STAMINA', color:'#ff44cc', glow:'#cc0099', blades:3, shape:'wing',
    maxStamina:138, mass:1.20, defense:0.60, attackMult:0.80, burstResist:0.70, personality:'defensive',
    desc:'Magic-type stamina blade with unpredictable spin.',
    atkR:4, defR:7, staR:8, spdR:5, bstR:7, tier:'ADVANCED',
    special:{ name:'Mirror Spin', desc:'Next collision: zero stamina loss (3s)', effect:'mirrorSpin' } },

  { name:'TYRANNO BEAT',  type:'ATTACK',  color:'#ff4400', glow:'#cc2200', blades:4, shape:'horn',
    maxStamina:80,  mass:1.10, defense:0.72, attackMult:1.68, burstResist:0.32, personality:'aggressive',
    desc:'Dinosaur-type. Relentless crusher, but fragile under pressure.',
    atkR:9, defR:4, staR:4, spdR:8, bstR:3, tier:'ADVANCED',
    special:{ name:'Ground Stomp', desc:'Destabilize all foes (+wobble)', effect:'groundStomp' } },

  { name:'VIPER TAIL',    type:'ATTACK',  color:'#44ff44', glow:'#22cc22', blades:3, shape:'fang',
    maxStamina:70,  mass:0.80, defense:0.80, attackMult:1.78, burstResist:0.20, personality:'aggressive',
    desc:'Snake-strike speed. Fastest in the game — zero margin for error.',
    atkR:9, defR:2, staR:3, spdR:10, bstR:2, tier:'ELITE',
    special:{ name:'Venom Mark', desc:'Nearest foe takes 2× burst damage (4s)', effect:'venomMark' } },

  { name:'ROCK BISON',    type:'DEFENSE', color:'#bb7733', glow:'#884411', blades:4, shape:'hells',
    maxStamina:158, mass:1.92, defense:0.40, attackMult:0.62, burstResist:0.95, personality:'passive',
    desc:'Heaviest blade ever forged. Unmovable wall of earth.',
    atkR:2, defR:9, staR:10, spdR:1, bstR:9, tier:'LEGENDARY',
    special:{ name:'Tectonic Stance', desc:'Freeze 3s; next hit reflects back', effect:'tectonicStance' } },

  // ── NEW CHARACTERS ──
  { name:'DRACIEL SHELL', type:'DEFENSE', color:'#00aa88', glow:'#00ddbb', blades:4, shape:'knight',
    maxStamina:120, mass:1.70, defense:0.35, attackMult:0.50, burstResist:0.88, personality:'passive',
    desc:'Clamshell energy layer with aqua-teal finish. Round turtle blades absorb impacts from all angles.',
    atkR:1, defR:10, staR:7, spdR:2, bstR:8, tier:'NOVICE',
    special:{ name:'Shell Defense', desc:'+30 stamina & halve burst damage (3s)', effect:'shellDefense' } },

  { name:'STORM PEGASUS', type:'ATTACK',  color:'#ccd8ff', glow:'#88aaff', blades:3, shape:'wing',
    maxStamina:85,  mass:1.05, defense:0.68, attackMult:1.35, burstResist:0.45, personality:'aggressive',
    desc:'White-pearl energy layer with sky-blue wing blades. Classic left-spin rush attacker.',
    atkR:7, defR:4, staR:5, spdR:8, bstR:4, tier:'APPRENTICE',
    special:{ name:'Storm Ride', desc:'Chase last attacker at full speed', effect:'stormRide' } },

  { name:'PHOENIX BLAZE', type:'BALANCE', color:'#ff8800', glow:'#ffcc00', blades:4, shape:'garuda',
    maxStamina:120, mass:1.25, defense:0.60, attackMult:1.20, burstResist:0.62, personality:'aggressive',
    desc:'Flame-feather blades in molten red and gold. A phoenix reborn with every hit — attack and endurance combined.',
    atkR:7, defR:6, staR:7, spdR:6, bstR:6, tier:'ADVANCED',
    special:{ name:'Phoenix Ember', desc:'If stamina <50%: +25 stamina & +30% atk', effect:'phoenixEmber' } },

  { name:'WOLBORG ICE',   type:'DEFENSE', color:'#88ddff', glow:'#44aaee', blades:3, shape:'fang',
    maxStamina:140, mass:1.65, defense:0.46, attackMult:0.90, burstResist:0.90, personality:'defensive',
    desc:'Icy-blue fang blades with silver metallic finish. The wolf endures everything the arena throws at it.',
    atkR:5, defR:8, staR:8, spdR:4, bstR:9, tier:'CHAMPION',
    special:{ name:'Frozen Field', desc:'Slow all nearby foes for 3s', effect:'frozenField' } },

  { name:'HELL KERBECS',  type:'BALANCE', color:'#cc8800', glow:'#ff6600', blades:4, shape:'nemesis',
    maxStamina:175, mass:1.96, defense:0.38, attackMult:1.65, burstResist:0.93, personality:'aggressive',
    desc:'Tri-pronged shadow blades in deep violet and gold. Three heads of Cerberus forged into one unstoppable force. Cerberus does not fall.',
    atkR:10, defR:10, staR:10, spdR:8, bstR:9, tier:'MYTHICAL',
    special:{ name:'Dark Pull', desc:'Rush back to center at full speed', effect:'darkPull' } },

  { name:'DIABLO NEMESIS', type:'BALANCE', color:'#555566', glow:'#9900cc', blades:4, shape:'kerbecs',
    maxStamina:180, mass:2.00, defense:0.28, attackMult:2.00, burstResist:0.99, personality:'aggressive',
    desc:'The God of Destruction. Forged from the power of every Beyblade ever created — unmatched attack, impenetrable defense, infinite endurance. It cannot be burst.',
    atkR:10, defR:10, staR:10, spdR:10, bstR:10, tier:'MYTHICAL',
    special:{ name:'Zero-G Void', desc:'Drain 8 stamina from all foes', effect:'zeroGVoid' } },

  { name:'PHANTOM ORION', type:'STAMINA', color:'#c8d8f0', glow:'#66aaff', blades:5, shape:'orion',
    maxStamina:230, mass:2.15, defense:0.18, attackMult:1.90, burstResist:1.00, personality:'passive',
    desc:'The Eternal Phantom. Ball Driver spins without end — beyond gravity, beyond burst, beyond time itself. No force in existence can stop it. The greatest Beyblade ever forged.',
    atkR:9, defR:13, staR:15, spdR:10, bstR:15, tier:'TRANSCENDENT',
    special:{ name:'Phantom Orbit', desc:'Restore 50 stamina & immune to drain (5s)', effect:'phantomOrbit' } },

  { name:'BIG BANG PEGASIS F:D', type:'ATTACK', color:'#1a4acc', glow:'#88ccff', blades:4, shape:'pegasis',
    maxStamina:200, mass:2.05, defense:0.22, attackMult:2.20, burstResist:0.95, personality:'aggressive',
    desc:'The Final Evolution of Pegasus. The F:D Final Drive tip switches between raw speed and unstoppable momentum — shattering gods and destroyers alike. Born from the hope of every Blader, it transcends every limit ever known.',
    atkR:15, defR:5, staR:10, spdR:14, bstR:8, tier:'TRANSCENDENT',
    special:{ name:'Final Drive', desc:'Slam all foes & double attack power (4s)', effect:'finalDrive' } },

  { name:'METEOR FORGE',   type:'ATTACK',  color:'#ff7722', glow:'#ffcc66', blades:4, shape:'claw',
    maxStamina:150, mass:1.70, defense:0.40, attackMult:1.75, burstResist:0.75, personality:'aggressive',
    desc:'Celestial iron forged in a dying star. Rises before its strike — gravity follows its descent.',
    atkR:10, defR:7, staR:7, spdR:7, bstR:8, tier:'LEGENDARY',
    special:{ name:'Meteor Fall', desc:'Rise invuln 1s, then crash down for massive dmg', effect:'meteorFall' } },

  { name:'SERPENT COIL',   type:'STAMINA', color:'#44cc88', glow:'#88ff99', blades:3, shape:'fang',
    maxStamina:155, mass:1.22, defense:0.58, attackMult:1.15, burstResist:0.72, personality:'aggressive',
    desc:'Ophidian stamina-type that feeds on every strike it lands. The more it hits, the longer it lives.',
    atkR:6, defR:6, staR:9, spdR:7, bstR:7, tier:'ELITE',
    special:{ name:'Coil Drain', desc:'Lifesteal 50% of dmg dealt for 3s', effect:'coilDrain' } },

  { name:'ORACLE EYE',     type:'BALANCE', color:'#aa66ff', glow:'#ddbbff', blades:4, shape:'wing',
    maxStamina:130, mass:1.18, defense:0.65, attackMult:1.28, burstResist:0.70, personality:'defensive',
    desc:'Seer-blade that reads every attack before it lands. Visions whisper the path of each strike.',
    atkR:7, defR:7, staR:7, spdR:8, bstR:7, tier:'CHAMPION',
    special:{ name:'Foresight', desc:'Dodge next 2 incoming hits entirely', effect:'foresight' } },

  { name:'OBSIDIAN FANG',  type:'DEFENSE', color:'#221133', glow:'#8844ff', blades:4, shape:'fang',
    maxStamina:175, mass:1.90, defense:0.32, attackMult:0.95, burstResist:0.98, personality:'defensive',
    desc:'Volcanic glass blade crowned with thorned fangs. Every hit it takes carves the attacker in return.',
    atkR:5, defR:10, staR:9, spdR:4, bstR:10, tier:'MYTHICAL',
    special:{ name:'Thorn Armor', desc:'5s: foes hitting you take 30% dmg back', effect:'thornArmor' } },

  { name:'VOID REAPER',    type:'???',     color:'#334455', glow:'#66ffaa', blades:3, shape:'unknown',
    maxStamina:165, mass:1.50, defense:0.48, attackMult:1.65, burstResist:0.78, personality:'aggressive',
    desc:'A scythe that harvests the faltering. The weaker the prey, the hungrier the blade.',
    atkR:9, defR:6, staR:7, spdR:8, bstR:7, tier:'LEGENDARY',
    special:{ name:'Soul Harvest', desc:'Drain 30 stamina from weakest; execute if <20%', effect:'soulHarvest' } },

  { name:'INFERNO TITAN',  type:'ATTACK',  color:'#2a0a00', glow:'#ff6600', blades:4, shape:'titan',
    maxStamina:160, mass:1.85, defense:0.38, attackMult:1.80, burstResist:0.82, personality:'aggressive',
    desc:'Obsidian plates cracked with living magma. Leaves the arena floor burning in its wake.',
    atkR:10, defR:7, staR:8, spdR:6, bstR:8, tier:'LEGENDARY',
    special:{ name:'Eruption', desc:'Leave magma pools (5s) that burn foes', effect:'eruption' } },

  { name:'ABYSS LEVIATHAN', type:'STAMINA', color:'#1a0840', glow:'#00ddff', blades:6, shape:'abyss',
    maxStamina:185, mass:1.55, defense:0.52, attackMult:0.95, burstResist:0.85, personality:'passive',
    desc:'A kraken coiled from the blackest trench. Its pressure wave cripples anything that still breathes.',
    atkR:6, defR:8, staR:10, spdR:6, bstR:9, tier:'LEGENDARY',
    special:{ name:'Depth Charge', desc:'Slow foes 60% & +3s to their specials (4s)', effect:'depthCharge' } },

  { name:'THE UNKNOWN',         type:'???',     color:'#8844cc', glow:'#cc66ff', blades:3, shape:'unknown',
    maxStamina:160, mass:1.55, defense:0.46, attackMult:1.80, burstResist:0.72, personality:'chaotic',
    desc:"No origin. No records. No name. It appeared in the arena without warning — and no blade that has faced it has ever accurately described the encounter.",
    atkR:'???', defR:'???', staR:'???', spdR:'???', bstR:'???', tier:'UNKNOWN',
    special:{ name:"Fate's Hand", desc:'Chaos — one of four random effects fires', effect:'fatesHand' } },
];

// ── ARENAS ──
const ARENAS = [
  { name:'BEY STADIUM',    sub:'The Classic Dish',
    rim:'#00aaff', glow:'#0066ff', bg:['#162230','#0a111c','#050a12'],
    grid:'rgba(0,160,255,0.03)', atm:'rgba(0,160,255,0.04)',
    friction:0.994, edgeDrain:0.18, wallDamp:0.72,
    desc:'Standard balanced arena. Fair ground for all types.',
    favors: null, penalizes: null, typeModifiers: null },
  { name:'VOLCANO CRATER', sub:'Lava Rim Burns All',
    rim:'#ff4400', glow:'#ff2200', bg:['#2a0800','#180400','#080100'],
    grid:'rgba(255,60,0,0.04)',  atm:'rgba(255,50,0,0.06)',
    friction:0.992, edgeDrain:0.36, wallDamp:0.68,
    desc:'Edges drain stamina 2× faster. Stay near center or die.',
    favors:'ATTACK', penalizes:'STAMINA',
    typeModifiers: {
      ATTACK:  { attackMult: 1.22 },
      STAMINA: { maxStamina: 0.72 },
      DEFENSE: { defense: 0.88 },
      BALANCE: {}
    }},
  { name:'CYBER GRID',     sub:'Zero-Friction Data Zone',
    rim:'#00ff88', glow:'#00cc55', bg:['#001510','#000e08','#000604'],
    grid:'rgba(0,255,120,0.055)', atm:'rgba(0,200,100,0.04)',
    friction:0.9986, edgeDrain:0.09, wallDamp:0.92,
    desc:'Near-zero friction. Blades maintain speed indefinitely.',
    favors:'STAMINA', penalizes:'DEFENSE',
    typeModifiers: {
      ATTACK:  { attackMult: 1.18, burstResist: 0.88 },
      STAMINA: { maxStamina: 1.28 },
      DEFENSE: { defense: 1.22 },
      BALANCE: { maxStamina: 1.10 }
    }},
  { name:'FROZEN TUNDRA',  sub:'The Ice Slick',
    rim:'#88ddff', glow:'#44aaee', bg:['#0a1828','#061018','#030810'],
    grid:'rgba(150,220,255,0.04)', atm:'rgba(100,180,255,0.04)',
    friction:0.9993, edgeDrain:0.07, wallDamp:0.96,
    desc:'Extreme slipperiness. Walls barely hurt. Pure momentum wars.',
    favors:'STAMINA', penalizes:'ATTACK',
    typeModifiers: {
      ATTACK:  { attackMult: 0.78 },
      STAMINA: { maxStamina: 1.35 },
      DEFENSE: { defense: 0.85, burstResist: 1.12 },
      BALANCE: { maxStamina: 1.12 }
    }},
  { name:'SHADOW VOID',    sub:'The Dark Dimension',
    rim:'#cc44ff', glow:'#8800bb', bg:['#100518','#080210','#040108'],
    grid:'rgba(180,50,255,0.04)', atm:'rgba(150,40,255,0.04)',
    friction:0.994, edgeDrain:0.06, wallDamp:0.74,
    desc:'Weakest edge drain. Long brutal stamina battles in the dark.',
    favors:'STAMINA · DEFENSE', penalizes: null,
    typeModifiers: {
      ATTACK:  { attackMult: 1.14 },
      STAMINA: { maxStamina: 1.22 },
      DEFENSE: { burstResist: 1.18, defense: 0.88 },
      BALANCE: { maxStamina: 1.10, attackMult: 1.08 }
    }},
];

