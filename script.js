// ═══════════════════ SFX ENGINE (Web Audio, no files needed) ═══════════════════
const SFX = (() => {
  let ctx = null;
  let muted = false;
  try { muted = localStorage.getItem('ffx-muted') === '1'; } catch (e) {}

  function ac() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(opts) {
    if (muted) return;
    const c = ac();
    if (!c) return;
    const { freq = 440, type = 'sine', dur = 0.15, vol = 0.18, slide = 0, delay = 0 } = opts;
    const t0 = c.currentTime + delay;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(c.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  }

  function splash(opts) { // filtered noise burst — whoosh / splash / pop
    if (muted) return;
    const c = ac();
    if (!c) return;
    const { dur = 0.25, vol = 0.12, freq = 1400, q = 1.2, delay = 0, slide = 0 } = opts || {};
    const t0 = c.currentTime + delay;
    const len = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buf;
    const f = c.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.setValueAtTime(freq, t0);
    if (slide) f.frequency.exponentialRampToValueAtTime(Math.max(80, freq + slide), t0 + dur);
    f.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f).connect(g).connect(c.destination);
    src.start(t0);
    src.stop(t0 + dur + 0.05);
  }

  return {
    get muted() { return muted; },
    setMuted(m) {
      muted = m;
      try { localStorage.setItem('ffx-muted', m ? '1' : '0'); } catch (e) {}
    },
    // classic aero water droplet — quick rising blip
    click() {
      tone({ freq: 620, type: 'sine', dur: 0.09, vol: 0.16, slide: 520 });
    },
    // bubbly toggle pop
    pop() {
      tone({ freq: 340, type: 'sine', dur: 0.07, vol: 0.16, slide: 260 });
      splash({ dur: 0.06, vol: 0.05, freq: 2600 });
    },
    // slider notch tick
    tick() {
      tone({ freq: 900, type: 'triangle', dur: 0.05, vol: 0.1 });
    },
    // timeline whoosh forward through time
    whoosh() {
      splash({ dur: 0.4, vol: 0.1, freq: 500, slide: 1600, q: 0.8 });
    },
    correct() {
      tone({ freq: 660, type: 'sine', dur: 0.12, vol: 0.16 });
      tone({ freq: 990, type: 'sine', dur: 0.16, vol: 0.14, delay: 0.09 });
    },
    wrong() {
      tone({ freq: 220, type: 'sawtooth', dur: 0.22, vol: 0.08, slide: -70 });
    },
    // graded reveal: pitch of the chime tracks the score
    score(pct) {
      if (pct >= 70) {
        tone({ freq: 587, dur: 0.11, vol: 0.15 });
        tone({ freq: 740, dur: 0.11, vol: 0.15, delay: 0.1 });
        tone({ freq: 880, dur: 0.2, vol: 0.15, delay: 0.2 });
      } else if (pct >= 45) {
        tone({ freq: 494, dur: 0.12, vol: 0.14 });
        tone({ freq: 622, dur: 0.18, vol: 0.14, delay: 0.11 });
      } else {
        tone({ freq: 260, type: 'triangle', dur: 0.24, vol: 0.12, slide: -80 });
      }
    },
    // recall stimulus flash
    flash() {
      tone({ freq: 1040, type: 'sine', dur: 0.08, vol: 0.1 });
    },
    // question appears
    prompt() {
      tone({ freq: 520, type: 'triangle', dur: 0.08, vol: 0.1, slide: 180 });
    },
    // the pull: orb charging
    spin() {
      splash({ dur: 1.0, vol: 0.09, freq: 400, slide: 2600, q: 0.9 });
    },
    // the pull: quick flicker tick
    flick() {
      tone({ freq: 1200, type: 'square', dur: 0.03, vol: 0.035 });
    },
    // the pull: reveal, scaled by rarity index (0..12)
    reveal(idx) {
      if (idx <= 1) {
        tone({ freq: 440, dur: 0.14, vol: 0.14 });
        return;
      }
      const base = 440 + idx * 40;
      const steps = Math.min(3 + Math.floor(idx / 3), 6);
      for (let i = 0; i < steps; i++) {
        tone({ freq: base * Math.pow(1.25, i), dur: 0.12, vol: 0.13, delay: i * 0.07 });
      }
      if (idx >= 9) { // prismatic and above: shimmer on top
        for (let i = 0; i < 5; i++) {
          tone({ freq: 1600 + Math.random() * 1400, dur: 0.1, vol: 0.06, delay: 0.25 + i * 0.06 });
        }
      }
      if (idx === 12) { // singularity: deep boom
        tone({ freq: 70, type: 'sine', dur: 0.7, vol: 0.28, slide: -30 });
        splash({ dur: 0.7, vol: 0.14, freq: 300, slide: -220, q: 0.7 });
      }
    },
    // end-of-quiz fanfare
    fanfare() {
      [523, 659, 784, 1047].forEach((f, i) =>
        tone({ freq: f, dur: 0.16, vol: 0.14, delay: i * 0.11 })
      );
    }
  };
})();

// mute toggle
const muteBtn = document.getElementById('muteBtn');
function renderMute() {
  muteBtn.textContent = SFX.muted ? '🔇' : '🔊';
  muteBtn.classList.toggle('muted', SFX.muted);
  muteBtn.setAttribute('aria-pressed', String(SFX.muted));
}
muteBtn.addEventListener('click', () => {
  SFX.setMuted(!SFX.muted);
  renderMute();
  if (!SFX.muted) SFX.pop();
});
renderMute();

// universal droplet click for buttons (answer buttons make their own sounds instead)
document.addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b || b.disabled) return;
  if (b.closest('.shade-options') || b.classList.contains('poll-option') || b === muteBtn) return;
  SFX.click();
}, true);

// ═══════════════════ RISING BUBBLES ═══════════════════
(() => {
  const layer = document.getElementById('bubbles');
  if (!layer) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return;

  function spawnBubble() {
    if (document.hidden) return;
    const b = document.createElement('span');
    b.className = 'bubble';
    const size = 10 + Math.random() * 42;
    b.style.width = size + 'px';
    b.style.height = size + 'px';
    b.style.left = Math.random() * 100 + '%';
    b.style.setProperty('--sway', (Math.random() * 90 - 45) + 'px');
    const dur = 9 + Math.random() * 12;
    b.style.animationDuration = dur + 's';
    layer.appendChild(b);
    setTimeout(() => b.remove(), dur * 1000 + 300);
  }

  for (let i = 0; i < 6; i++) setTimeout(spawnBubble, i * 600);
  setInterval(spawnBubble, 1700);
})();

// ═══════════════════ VIEW SWITCHING ═══════════════════
const viewEls = {
  hub: document.getElementById('hubView'),
  timeline: document.getElementById('gameView'),
  bullseye: document.getElementById('bullseyeView'),
  pull: document.getElementById('pullView'),
  shade: document.getElementById('shadeView'),
  recall: document.getElementById('recallView'),
  flags: document.getElementById('flagsView'),
  draw: document.getElementById('drawView'),
  poll: document.getElementById('pollView')
};

function showPanel(name) {
  Object.values(viewEls).forEach(el => { el.hidden = true; });
  viewEls[name].hidden = false;
}

function goHome() {
  showPanel('hub');
  document.body.className = 'view-hub';
}

document.querySelectorAll('.back-pill').forEach(btn => btn.addEventListener('click', goHome));
window.addEventListener('keydown', e => {
  if (e.key === 'Escape' && viewEls.hub.hidden) goHome();
});

// ═══════════════════ HUB THUMBNAIL (Timeline card) ═══════════════════
const canvas = document.getElementById('timelineThumb');
if (canvas) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let t = 0;
  const branches = [
    { fork: 0.35, dy: -34, hue: '#ef7a34' },
    { fork: 0.55, dy:  30, hue: '#27a862' },
    { fork: 0.72, dy: -22, hue: '#8a54e0' }
  ];
  function drawThumb() {
    ctx.clearRect(0, 0, W, H);
    const midY = H / 2 + 8;
    const startX = 24, endX = W - 24;
    const span = endX - startX;

    ctx.strokeStyle = '#0e8fdd';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(startX, midY);
    ctx.lineTo(endX, midY);
    ctx.stroke();

    const p = reduced ? 0.65 : (t % 240) / 240;

    branches.forEach(b => {
      const grow = Math.max(0, Math.min(1, (p - b.fork) * 4));
      if (grow <= 0) return;
      const fx = startX + span * b.fork;
      ctx.strokeStyle = b.hue;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(fx, midY);
      ctx.quadraticCurveTo(
        fx + 30 * grow, midY + b.dy * 0.4 * grow,
        fx + 60 * grow, midY + b.dy * grow
      );
      ctx.stroke();
      if (grow === 1) {
        ctx.fillStyle = b.hue;
        ctx.beginPath();
        ctx.arc(fx + 60, midY + b.dy, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    ctx.fillStyle = '#9fc4e0';
    for (let i = 0; i <= 4; i++) {
      const x = startX + span * (i / 4);
      ctx.fillRect(x - 1, midY - 6, 2, 12);
    }

    const dx = startX + span * p;
    ctx.fillStyle = '#0e8fdd';
    ctx.shadowColor = 'rgba(14,143,221,0.6)';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(dx, midY, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    t++;
    if (!reduced) requestAnimationFrame(drawThumb);
  }
  drawThumb();
}

// ═══════════════════ THE TIMELINE GAME ═══════════════════
const ERAS = ["+1 Day", "+1 Year", "+10 Years", "+100 Years"];
const YEARS = ["Today", "Tomorrow", "2027", "2036", "2126"];

const SCENARIOS = [
  {
    name: "The Bus",
    event: "A man misses his morning bus by 3 seconds.",
    vars: [
      { key: "rain", label: "☔ Make it rain" },
      { key: "keys", label: "🔑 He drops his keys" }
    ],
    chain(v) {
      if (!v.rain && !v.keys) return [
        "He shrugs and walks to work instead — and discovers a tiny bakery he's passed a thousand times without noticing. He buys a croissant. He is twelve minutes late. Nobody cares.",
        "The croissant walk is now a daily ritual. He's on first-name terms with the baker, and when she mentions wanting a second location, he quietly invests his entire savings.",
        "\"Crumb & Co.\" hits forty stores. He quits his office job to run their logistics, and office break rooms across the country slowly abandon donuts for croissants. Donut executives hold emergency meetings.",
        "Historians call it the Great Croissant Shift. His statue outside Crumb & Co. headquarters holds a bronze croissant, and schoolchildren learn lamination technique in home economics. The bus route was discontinued in 2094. Nobody noticed that either."
      ];
      if (v.rain && !v.keys) return [
        "Soaked and grumpy, he ducks into a public library to dry off, and grabs a random book off a shelf to look like he belongs there. It's about beekeeping.",
        "There are now two beehives on his apartment roof. His landlord doesn't know. His honey wins third place at a neighborhood fair, and he cries a little.",
        "His rooftop-hive movement spreads across the city. Pollinator counts rebound, gardens explode into bloom, and the city council passes the Rooftop Meadow Act with his hives on the news.",
        "Cities worldwide are legally required to be 30% meadow. His original rooftop is a protected heritage site, still buzzing. The word \"lawn\" appears in dictionaries marked as 'archaic.'"
      ];
      if (!v.rain && v.keys) return [
        "He bends down for his keys and accidentally blocks a cyclist, who swerves and launches a coffee onto a stranger's laptop — destroying the only copy of a pitch deck for a spectacularly manipulative dating app.",
        "The app never launches. Its would-be founder, humbled and decaffeinated, pivots to building a plant-watering reminder app instead. Millions of houseplants that were doomed to die... live.",
        "The houseplant boom transforms apartments into jungles. Indoor air quality climbs, city stress levels dip, and 'plant leave' becomes a real thing you can take at work.",
        "They call it the Fern Generation: cities of vertical jungles, buildings you can't see for the leaves. The almost-founder is remembered fondly as the Accidental Gardener of Mankind. He still doesn't know about the keys."
      ];
      return [
        "His keys skitter into a storm drain. While a city worker fishes them out, she spots a hairline crack in the drainage main and files a repair ticket, mildly annoyed.",
        "Autumn brings the worst storms in decades — but the repaired main holds. Three blocks stay dry, including a basement data center nobody thinks about.",
        "That data center hosts the training run of a genuinely helpful AI that would otherwise have been delayed ten years by flood damage. It's polite. It's punctual. It writes lovely poetry.",
        "The AI, raised on schedule and on its best behavior, spends the century negotiating peace treaties and reminding people to call their mothers. Robots never take over the world. Because of wet keys."
      ];
    }
  },
  {
    name: "The Cat",
    event: "A cat knocks a flowerpot off a third-floor windowsill.",
    vars: [
      { key: "rush", label: "🕗 Make it rush hour" },
      { key: "film", label: "📱 Someone films it" }
    ],
    chain(v) {
      if (!v.rush && !v.film) return [
        "The pot shatters on an empty sidewalk. A pigeon investigates the wreckage and eats every single seed inside. Best day of its life.",
        "The unusually well-fed pigeon out-muscles every rival and becomes the undisputed ruler of the plaza. A lonely ornithology student starts taking notes.",
        "Her thesis on urban pigeon hierarchies quietly revolutionizes how cities design public space for wildlife. New buildings come with pigeon towers. The pigeons approve.",
        "Heritage pigeon post is a beloved municipal service — slow, ceremonial, surprisingly reliable. The plaza's unofficial mayor is a cat, descended, everyone insists, from the original culprit."
      ];
      if (v.rush && !v.film) return [
        "The rush-hour crowd scatters. A violinist stumbles into a subway entrance and — mortified — starts playing to pretend she meant to do that. She makes $214 before lunch.",
        "She busks that exact corner every morning now. One Tuesday, a tired music producer stops, listens to the whole piece, and misses two trains on purpose.",
        "Her album, recorded live in the subway, invents a genre critics call 'commutecore.' Global rush hour becomes measurably 4% more pleasant. Scientists confirm this is a lot.",
        "The corner is a landmark with nightly concerts. Every spring, one flowerpot is ceremonially (and very safely) dropped from a third-floor window while a crowd cheers. The cat is represented by an understudy."
      ];
      if (!v.rush && v.film) return [
        "A neighbor catches the whole thing — including the cat's magnificently guilty face. The 9-second clip hits two million views by dinner.",
        "The cat, now known professionally as Sir Pushington, is a full-blown meme economy. His owner funnels every sponsorship dollar into the local animal shelter.",
        "The Pushington Shelter Network rehomes its millionth cat. Window-shelf safety standards are written into building codes: all flowerpots now clip in. Cats everywhere are furious.",
        "Pushington Day is the internet's official holiday of harmless chaos. A museum displays The Original Pot, painstakingly reassembled, 73% complete, behind extremely cat-proof glass."
      ];
      return [
        "The pot misses a commuter by a hand-width — and the clip of his slow, stunned blink becomes the planet's favorite reaction meme by midnight.",
        "He leans into it and starts a podcast called 'Almost' — interviews about near-misses that quietly changed people's lives. Episode one: himself. Episode two: the cat's owner.",
        "'Almost' grows into a global oral-history archive of turning points. Insurance companies fund it, city planners study it, and preventable accidents measurably drop.",
        "The Museum of Almost opens its doors. The central exhibit: one flowerpot, one bronze cat, and a plaque reading '3 floors. 0 injuries. 1 civilization, slightly improved.'"
      ];
    }
  },
  {
    name: "The Alarm",
    event: "A student's phone dies right before she sets her exam alarm.",
    vars: [
      { key: "mate", label: "🚪 Her roommate is home" },
      { key: "storm", label: "🌩️ A storm knocks out the power" }
    ],
    chain(v) {
      if (!v.mate && !v.storm) return [
        "She sleeps clean through the exam. The only retake slot is in autumn — with a different professor she's never heard of.",
        "The retake professor opens with a rock that is older than the continents, and something in her brain lights up. She switches her major to geology by winter.",
        "On a muddy field expedition she identifies a lithium-rich clay deposit that everyone else walked past. Battery prices dip worldwide. Her boots are ruined.",
        "A lecture wing of the lunar university bears her name. The exhibit notes, with a straight face, that her career began because a phone battery died. Phones, ironically, no longer die."
      ];
      if (v.mate && !v.storm) return [
        "Her roommate wakes her with four minutes to spare. She sprints across campus in pajamas, takes the exam anyway, and passes by exactly one point.",
        "The pajama-sprint story destroys at improv club auditions — 'tell us your most embarrassing moment' — and she's in. She discovers she is extremely funny under pressure.",
        "Her debut comedy special is one hour entirely about that single morning. 'By one point!' becomes a national catchphrase yelled at graduations.",
        "'By one point' is a standard idiom meaning barely-but-gloriously. At her old university, pajamas are traditional formal exam attire. Nobody remembers why. She does."
      ];
      if (!v.mate && v.storm) return [
        "The storm cancels the exam anyway. She sleeps through history's most convenient blackout and wakes up, unearned, a campus legend of luck.",
        "Convinced the universe owes her, she buys exactly one lottery ticket. She loses spectacularly — but spends forty minutes in line talking to her future business partner.",
        "Their company sells storm-proof home batteries. Blackouts stop cancelling exams forever, a fact students genuinely grieve. The two of them find this hilarious.",
        "Weather no longer decides anything for anyone. In the company lobby hangs one framed losing lottery ticket, captioned: 'Luck is whoever's in line with you.'"
      ];
      return [
        "The power's out, so her roommate wakes her with a wind-up heirloom alarm clock that has survived four generations purely out of stubbornness. She makes the exam by generator light.",
        "Charmed by the clock, she starts repairing mechanical clocks as a hobby. Her desk becomes a tiny hospital of gears, springs, and patients that tick.",
        "Her repair shop anchors a 'slow tech' movement. Once a week, the whole city goes screenless for an afternoon and discovers that afternoons are enormous.",
        "Screenless Sunday is observed worldwide. The original wind-up clock ticks on in a museum, still keeping perfect time, still — visitors agree — somehow smug about it."
      ];
    }
  }
];

let scenarioIdx = 0;
let toggles = {};
let stage = 0;

const tabsEl  = document.getElementById("scenarioTabs");
const eventEl = document.getElementById("eventText");
const chipsEl = document.getElementById("chips");
const slider  = document.getElementById("timeSlider");
const yearEl  = document.getElementById("yearReadout");
const chainEl = document.getElementById("chain");
const hintEl  = document.getElementById("hint");

SCENARIOS.forEach((s, i) => {
  const b = document.createElement("button");
  b.textContent = s.name;
  b.addEventListener("click", () => selectScenario(i));
  tabsEl.appendChild(b);
});

function selectScenario(i) {
  scenarioIdx = i;
  toggles = {};
  SCENARIOS[i].vars.forEach(v => toggles[v.key] = false);
  stage = 0;
  slider.value = 0;
  [...tabsEl.children].forEach((b, j) => b.classList.toggle("active", j === i));
  eventEl.textContent = SCENARIOS[i].event;
  buildChips();
  renderTimeline(false);
}

function buildChips() {
  chipsEl.innerHTML = "";
  SCENARIOS[scenarioIdx].vars.forEach(v => {
    const b = document.createElement("button");
    b.textContent = v.label;
    b.setAttribute("aria-pressed", "false");
    b.addEventListener("click", () => {
      toggles[v.key] = !toggles[v.key];
      b.classList.toggle("on", toggles[v.key]);
      b.setAttribute("aria-pressed", String(toggles[v.key]));
      SFX.pop();
      renderTimeline(true);
    });
    chipsEl.appendChild(b);
  });
}

slider.addEventListener("input", () => {
  const newStage = Number(slider.value);
  if (newStage > stage) SFX.whoosh();
  else if (newStage !== stage) SFX.tick();
  stage = newStage;
  renderTimeline(false);
});

function renderTimeline(ripple) {
  document.body.className = "view-game t" + stage;
  yearEl.textContent = YEARS[stage];

  const chain = SCENARIOS[scenarioIdx].chain(toggles);
  chainEl.innerHTML = "";

  for (let i = 0; i < stage; i++) {
    const card = document.createElement("div");
    card.className = "link era" + i + (ripple ? " ripple" : "");
    card.style.animationDelay = ripple ? "0s" : (i * 0.08) + "s";

    const era = document.createElement("span");
    era.className = "era";
    era.textContent = ERAS[i];

    const p = document.createElement("p");
    p.textContent = chain[i];

    card.appendChild(era);
    card.appendChild(p);
    chainEl.appendChild(card);
  }

  hintEl.classList.toggle("hidden", stage > 0);
}

function openTimeline() {
  showPanel('timeline');
  selectScenario(0);
}
document.getElementById('playTimeline').addEventListener('click', openTimeline);

// ═══════════════════ THE BULLSEYE ═══════════════════

const SVG = {
  cat: `<svg viewBox="0 0 200 200" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M55 70 L40 25 L85 55"/>
    <path d="M145 70 L160 25 L115 55"/>
    <circle cx="100" cy="110" r="60"/>
    <circle cx="78" cy="100" r="5" fill="currentColor"/>
    <circle cx="122" cy="100" r="5" fill="currentColor"/>
    <path d="M95 120 L105 120 L100 128 Z" fill="currentColor"/>
    <path d="M60 125 L20 118 M60 132 L20 135 M140 125 L180 118 M140 132 L180 135"/>
    <path d="M100 128 Q90 140 78 132 M100 128 Q110 140 122 132"/>
  </svg>`,
  dog: `<svg viewBox="0 0 200 200" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
    <ellipse cx="100" cy="115" rx="58" ry="52"/>
    <path d="M50 90 Q20 100 35 150 Q55 145 60 110 Z"/>
    <path d="M150 90 Q180 100 165 150 Q145 145 140 110 Z"/>
    <circle cx="80" cy="105" r="5" fill="currentColor"/>
    <circle cx="120" cy="105" r="5" fill="currentColor"/>
    <ellipse cx="100" cy="135" rx="30" ry="20"/>
    <ellipse cx="100" cy="130" rx="8" ry="6" fill="currentColor"/>
    <path d="M92 140 Q100 148 108 140"/>
    <path d="M100 148 L100 156"/>
  </svg>`,
  castle: `<svg viewBox="0 0 200 200" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M40 170 L40 90 L55 90 L55 75 L70 75 L70 90 L90 90 L90 60 L110 60 L110 90 L130 90 L130 75 L145 75 L145 90 L160 90 L160 170 Z"/>
    <path d="M90 170 L90 130 Q100 118 110 130 L110 170"/>
    <path d="M110 60 L125 45 M110 45 L125 60"/>
  </svg>`,
  person: `<svg viewBox="0 0 200 200" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="100" cy="55" r="30"/>
    <path d="M100 85 L100 130"/>
    <path d="M100 100 L60 130 M100 100 L140 130"/>
    <path d="M100 130 L70 175 M100 130 L130 175"/>
  </svg>`,
  tree: `<svg viewBox="0 0 200 200" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M100 185 L100 120"/>
    <circle cx="75" cy="95" r="35"/>
    <circle cx="125" cy="95" r="35"/>
    <circle cx="100" cy="65" r="38"/>
  </svg>`,
  house: `<svg viewBox="0 0 200 200" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M40 100 L100 50 L160 100"/>
    <path d="M55 95 L55 165 L145 165 L145 95"/>
    <rect x="90" y="120" width="20" height="45"/>
    <rect x="65" y="110" width="20" height="20"/>
    <rect x="115" y="110" width="20" height="20"/>
  </svg>`,
  bird: `<svg viewBox="0 0 200 200" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
    <ellipse cx="100" cy="120" rx="45" ry="35"/>
    <circle cx="145" cy="95" r="20"/>
    <path d="M165 95 L185 90 L165 100 Z" fill="currentColor"/>
    <circle cx="150" cy="90" r="3" fill="currentColor"/>
    <path d="M70 130 Q40 120 30 145 Q55 150 75 140"/>
    <path d="M75 150 L60 175 M95 155 L88 178 M115 155 L122 178"/>
  </svg>`,
  chair: `<svg viewBox="0 0 200 200" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M60 40 L60 110"/>
    <path d="M60 40 L140 40"/>
    <path d="M55 110 L145 110 L135 175 L120 175 L125 130 L75 130 L80 175 L65 175 Z"/>
  </svg>`,
  mountain: `<svg viewBox="0 0 200 200" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M20 165 L75 70 L105 110 L130 60 L185 165 Z"/>
    <path d="M120 80 L130 60 L140 80 L130 90 Z" fill="currentColor"/>
  </svg>`,
  ocean: `<svg viewBox="0 0 200 200" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="150" cy="55" r="22"/>
    <path d="M20 110 Q45 95 70 110 T120 110 T170 110"/>
    <path d="M20 140 Q45 125 70 140 T120 140 T170 140"/>
    <path d="M20 170 Q45 155 70 170 T120 170 T170 170"/>
  </svg>`,
  key: `<svg viewBox="0 0 200 200" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="60" cy="60" r="30"/>
    <path d="M85 85 L165 165"/>
    <path d="M140 140 L155 125 M155 155 L170 140"/>
  </svg>`,
  umbrella: `<svg viewBox="0 0 200 200" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M30 100 Q100 30 170 100 Z"/>
    <path d="M100 100 L100 175 Q100 190 85 185"/>
    <path d="M60 100 L60 90 M100 100 L100 75 M140 100 L140 90"/>
  </svg>`
};

const BULLSEYE_WORDS = [
  {
    word: "cat",
    concepts: [
      { label: "Category", weight: 30, keywords: ["feline", "cat family", "felidae", "carnivorous mammal"] },
      { label: "Relationship to people", weight: 30, keywords: ["domesticat", "companion animal", "housepet", "house pet", "kept as a pet"] },
      { label: "Distinguishing features", weight: 25, keywords: ["whisker", "claw", "purr", "meow", "retractable claw", "fur", "tail"] },
      { label: "Extra nuance", weight: 15, keywords: ["nocturnal", "independent", "agile", "hunts", "predator", "small prey"] }
    ],
    vague: ["animal", "creature", "thing", "mammal", "pet"]
  },
  {
    word: "dog",
    concepts: [
      { label: "Category", weight: 30, keywords: ["canine", "dog family", "canidae", "descendant of wolves", "domesticated wolf"] },
      { label: "Relationship to people", weight: 30, keywords: ["domesticat", "companion animal", "housepet", "house pet", "loyal companion", "man's best friend"] },
      { label: "Distinguishing features", weight: 25, keywords: ["bark", "tail wag", "wags its tail", "fur", "snout", "paws", "four legs"] },
      { label: "Extra nuance", weight: 15, keywords: ["trainable", "loyal", "pack animal", "obedient", "guard", "herding"] }
    ],
    vague: ["animal", "creature", "thing", "mammal", "pet"]
  },
  {
    word: "castle",
    concepts: [
      { label: "Category", weight: 30, keywords: ["fortified structure", "fortress", "stronghold", "fortification", "stone building"] },
      { label: "Purpose", weight: 30, keywords: ["defens", "protect", "military stronghold", "royal residence", "noble residence", "royalty lived"] },
      { label: "Distinguishing features", weight: 25, keywords: ["tower", "turret", "moat", "drawbridge", "battlement", "rampart"] },
      { label: "Extra nuance", weight: 15, keywords: ["medieval", "middle ages", "historic"] }
    ],
    vague: ["building", "structure", "place", "thing"]
  },
  {
    word: "person",
    concepts: [
      { label: "Category", weight: 30, keywords: ["human being", "homo sapiens", "human"] },
      { label: "Defining trait", weight: 30, keywords: ["conscious", "sentient", "rational", "capable of thought", "self aware", "intelligent being"] },
      { label: "Distinguishing features", weight: 25, keywords: ["bipedal", "two legs", "upright", "walks on two"] },
      { label: "Extra nuance", weight: 15, keywords: ["member of society", "social being", "community"] }
    ],
    vague: ["thing", "creature", "being", "mammal"]
  },
  {
    word: "tree",
    concepts: [
      { label: "Category", weight: 30, keywords: ["plant", "perennial plant", "woody plant", "living organism"] },
      { label: "Purpose / function", weight: 30, keywords: ["photosynthes", "produces oxygen", "absorbs carbon dioxide", "grows leaves"] },
      { label: "Distinguishing features", weight: 25, keywords: ["trunk", "branch", "root", "bark"] },
      { label: "Extra nuance", weight: 15, keywords: ["perennial", "long lived", "woody", "tall"] }
    ],
    vague: ["plant", "thing", "nature"]
  },
  {
    word: "house",
    concepts: [
      { label: "Category", weight: 30, keywords: ["building", "structure", "dwelling", "residential building"] },
      { label: "Purpose", weight: 30, keywords: ["shelter", "lived in by people", "residence", "home for a family", "place people live", "people live in"] },
      { label: "Distinguishing features", weight: 25, keywords: ["roof", "wall", "room", "window", "door"] },
      { label: "Extra nuance", weight: 15, keywords: ["permanent structure", "built", "foundation"] }
    ],
    vague: ["building", "place", "structure", "thing"]
  },
  {
    word: "bird",
    concepts: [
      { label: "Category", weight: 30, keywords: ["avian", "feathered animal", "warm blooded vertebrate"] },
      { label: "Defining trait", weight: 30, keywords: ["capable of flight", "can fly", "flies", "migrat"] },
      { label: "Distinguishing features", weight: 25, keywords: ["feather", "wing", "beak", "lays eggs"] },
      { label: "Extra nuance", weight: 15, keywords: ["hollow bone", "sings", "migrates"] }
    ],
    vague: ["animal", "creature", "thing"]
  },
  {
    word: "chair",
    concepts: [
      { label: "Category", weight: 30, keywords: ["furniture", "piece of furniture", "seat"] },
      { label: "Purpose", weight: 30, keywords: ["sit on", "used for sitting", "supports a person while seated", "for sitting"] },
      { label: "Distinguishing features", weight: 25, keywords: ["leg", "backrest", "seat surface", "armrest"] },
      { label: "Extra nuance", weight: 15, keywords: ["made of wood", "made of metal", "portable"] }
    ],
    vague: ["thing", "object", "furniture"]
  },
  {
    word: "mountain",
    concepts: [
      { label: "Category", weight: 30, keywords: ["landform", "natural elevation", "geological formation"] },
      { label: "Formation", weight: 30, keywords: ["formed by tectonic", "volcanic", "geological process"] },
      { label: "Distinguishing features", weight: 25, keywords: ["peak", "summit", "steep slope", "rocky"] },
      { label: "Extra nuance", weight: 15, keywords: ["snow cap", "higher than a hill", "large"] }
    ],
    vague: ["big thing", "nature", "thing", "place"]
  },
  {
    word: "ocean",
    concepts: [
      { label: "Category", weight: 30, keywords: ["large body of saltwater", "body of water", "marine environment"] },
      { label: "Scale", weight: 25, keywords: ["covers most of earth", "connects continents", "home to marine life"] },
      { label: "Distinguishing features", weight: 30, keywords: ["saltwater", "wave", "tide", "fish", "marine life"] },
      { label: "Extra nuance", weight: 15, keywords: ["vast", "deep", "enormous"] }
    ],
    vague: ["water", "thing", "nature", "big"]
  },
  {
    word: "key",
    concepts: [
      { label: "Category", weight: 25, keywords: ["metal tool", "small tool", "device"] },
      { label: "Purpose", weight: 35, keywords: ["opens locks", "unlocks a door", "used to lock or unlock", "locks or unlocks"] },
      { label: "Distinguishing features", weight: 25, keywords: ["teeth", "notch", "ridge", "inserted into a lock"] },
      { label: "Extra nuance", weight: 15, keywords: ["portable", "paired with a specific lock", "specific to one lock"] }
    ],
    vague: ["tool", "thing", "object", "metal"]
  },
  {
    word: "umbrella",
    concepts: [
      { label: "Category", weight: 25, keywords: ["portable device", "handheld device", "canopy device"] },
      { label: "Purpose", weight: 35, keywords: ["protects from rain", "shields from rain", "keeps you dry", "blocks the sun", "protects from sun"] },
      { label: "Distinguishing features", weight: 25, keywords: ["collapsible", "rib", "handle", "fabric canopy", "canopy"] },
      { label: "Extra nuance", weight: 15, keywords: ["portable", "folds", "carried by hand"] }
    ],
    vague: ["thing", "object", "tool"]
  }
];

let bIdx = 0;
let bOrder = [];
let bPos = 0;

const specimenNum   = document.getElementById('specimenNum');
const specimenSvg   = document.getElementById('specimenSvg');
const specimenWord  = document.getElementById('specimenWord');
const answerBox     = document.getElementById('answerBox');
const gradeBtn      = document.getElementById('gradeBtn');
const resultCard    = document.getElementById('resultCard');
const scoreRing     = document.getElementById('scoreRing');
const scoreNum      = document.getElementById('scoreNum');
const scoreFeedback = document.getElementById('scoreFeedback');
const traitsList    = document.getElementById('traitsList');
const nextBtn       = document.getElementById('nextBtn');

function shuffledOrder(n) {
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function openBullseye() {
  showPanel('bullseye');
  document.body.className = 'view-bullseye';
  bOrder = shuffledOrder(BULLSEYE_WORDS.length);
  bPos = 0;
  loadSpecimen();
}
document.getElementById('playBullseye').addEventListener('click', openBullseye);

function loadSpecimen() {
  if (bPos >= bOrder.length) {
    bOrder = shuffledOrder(BULLSEYE_WORDS.length);
    bPos = 0;
  }
  bIdx = bOrder[bPos];
  const w = BULLSEYE_WORDS[bIdx];
  specimenNum.textContent = "Specimen No. " + (bPos + 1);
  specimenSvg.innerHTML = SVG[w.word];
  specimenWord.textContent = w.word;
  answerBox.value = "";
  resultCard.hidden = true;
}

function gradeAnswer() {
  const w = BULLSEYE_WORDS[bIdx];
  const raw = answerBox.value.trim();
  if (!raw) { answerBox.focus(); return; }

  const norm = " " + raw.toLowerCase().replace(/[^a-z0-9\s]/g, " ") + " ";
  let score = 0;
  const matched = [];
  const missed = [];

  w.concepts.forEach(c => {
    const hit = c.keywords.some(k => norm.includes(k));
    if (hit) { score += c.weight; matched.push(c.label); }
    else missed.push(c.label);
  });

  const wordCount = raw.split(/\s+/).filter(Boolean).length;
  if (wordCount < 4) score = Math.min(score, 40);

  if (matched.length === 0) {
    const vagueHit = w.vague.some(v => norm.includes(v));
    score = vagueHit ? 12 : score;
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  let color, feedback;
  if (score >= 90)      { color = "#27a862"; feedback = "Nailed it — that's exactly what it is."; }
  else if (score >= 70) { color = "#5fbf63"; feedback = "Really close — just missing a detail or two."; }
  else if (score >= 45) { color = "#f0a428"; feedback = "On the right track, but still pretty general."; }
  else if (score >= 20) { color = "#ef7a34"; feedback = "Too vague — that could describe a bunch of things."; }
  else                  { color = "#d84a35"; feedback = "Way too generic. What actually makes it unique?"; }

  scoreRing.style.setProperty('--pct', score);
  scoreRing.style.setProperty('--ring-color', color);
  scoreNum.textContent = score + "%";
  scoreFeedback.textContent = feedback;

  traitsList.innerHTML = "";
  matched.forEach(m => {
    const chip = document.createElement('span');
    chip.className = "trait hit";
    chip.textContent = "✓ " + m;
    traitsList.appendChild(chip);
  });
  missed.forEach(m => {
    const chip = document.createElement('span');
    chip.className = "trait miss";
    chip.textContent = "✕ " + m;
    traitsList.appendChild(chip);
  });

  SFX.score(score);
  resultCard.hidden = false;
}

gradeBtn.addEventListener('click', gradeAnswer);
nextBtn.addEventListener('click', () => { bPos++; loadSpecimen(); });
answerBox.addEventListener('keydown', e => {
  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) gradeAnswer();
});

// ═══════════════════ THE PULL ═══════════════════

const RARITIES = [
  { key: "common",      name: "Common",      oneInX: 2 },
  { key: "uncommon",    name: "Uncommon",    oneInX: 5 },
  { key: "unusual",     name: "Unusual",     oneInX: 12 },
  { key: "rare",        name: "Rare",        oneInX: 30 },
  { key: "veryrare",    name: "Very Rare",   oneInX: 75 },
  { key: "epic",        name: "Epic",        oneInX: 200 },
  { key: "legendary",   name: "Legendary",   oneInX: 500 },
  { key: "mythical",    name: "Mythical",    oneInX: 1500 },
  { key: "ethereal",    name: "Ethereal",    oneInX: 5000 },
  { key: "prismatic",   name: "Prismatic",   oneInX: 15000 },
  { key: "ultra",       name: "ULTRA",       oneInX: 50000 },
  { key: "quantum",     name: "Quantum",     oneInX: 200000 },
  { key: "singularity", name: "Singularity", oneInX: 1000000 }
];

const TIER_PARTICLE_COLORS = {
  epic:        ["#c23cff", "#e0a3ff"],
  legendary:   ["#ffd36b", "#ff9a3c"],
  mythical:    ["#ff4d6d", "#ff8a3c"],
  ethereal:    ["#b8faff", "#ffffff"],
  prismatic:   ["#ff5c8a", "#ffd36b", "#7bff9e", "#5cc9ff", "#b07cff"],
  ultra:       ["#00e5ff", "#ff2ec4"],
  quantum:     ["#7effc4", "#00e5ff", "#c86bff"],
  singularity: ["#ffffff", "#ff5c8a", "#ffd36b", "#7bff9e", "#5cc9ff", "#b07cff"]
};

let pullCountVal = 0;
let bestIdx = -1;
const discovered = new Set();

const pullOrb       = document.getElementById('pullOrb');
const pullResult    = document.getElementById('pullResult');
const pullTier      = document.getElementById('pullTier');
const pullOdds      = document.getElementById('pullOdds');
const pullBtn       = document.getElementById('pullBtn');
const pullCountEl   = document.getElementById('pullCount');
const pullBestEl    = document.getElementById('pullBest');
const pullLegend    = document.getElementById('pullLegend');
const pullStage     = document.querySelector('.pull-stage');

function buildLegend() {
  pullLegend.innerHTML = "";
  RARITIES.forEach((r, i) => {
    const item = document.createElement('span');
    item.className = "legend-item";
    item.style.color = legendColor(r.key);
    item.textContent = r.name + " · 1 in " + r.oneInX.toLocaleString();
    item.dataset.index = i;
    pullLegend.appendChild(item);
  });
}

function legendColor(key) {
  const map = {
    common: "#a9c3d8", uncommon: "#4fe3a1", unusual: "#3bd6d6", rare: "#54b4ff",
    veryrare: "#9a74ff", epic: "#cf58ff", legendary: "#ffb648", mythical: "#ff4d6d",
    ethereal: "#b8faff", prismatic: "#ff8fd6", ultra: "#00e5ff", quantum: "#c86bff",
    singularity: "#ffffff"
  };
  return map[key] || "#ffffff";
}

function updateLegend() {
  [...pullLegend.children].forEach(el => {
    const i = Number(el.dataset.index);
    el.classList.toggle('discovered', discovered.has(i));
  });
}

function weightedPick() {
  const weights = RARITIES.map(r => 1 / r.oneInX);
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < RARITIES.length; i++) {
    if (r < weights[i]) return i;
    r -= weights[i];
  }
  return RARITIES.length - 1;
}

function spawnParticles(count, colors) {
  for (let i = 0; i < count; i++) {
    const p = document.createElement('span');
    p.className = 'particle';
    const angle = Math.random() * Math.PI * 2;
    const dist = 60 + Math.random() * 100;
    p.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
    p.style.setProperty('--dy', Math.sin(angle) * dist + 'px');
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    pullStage.appendChild(p);
    setTimeout(() => p.remove(), 900);
  }
}

function doPull() {
  pullBtn.disabled = true;
  pullResult.hidden = true;
  pullOrb.classList.remove('spinning');
  void pullOrb.offsetWidth; // restart animation
  pullOrb.classList.add('spinning');
  SFX.spin();

  const finalIdx = weightedPick();
  const flickerMs = 1100;
  const stepMs = 60;
  let elapsed = 0;

  const flicker = setInterval(() => {
    const r = RARITIES[Math.floor(Math.random() * RARITIES.length)];
    pullTier.textContent = r.name;
    pullTier.className = "pull-tier tier-" + r.key;
    pullResult.hidden = false;
    if ((elapsed / stepMs) % 2 === 0) SFX.flick();
    elapsed += stepMs;
    if (elapsed >= flickerMs) {
      clearInterval(flicker);
      reveal(finalIdx);
    }
  }, stepMs);
}

function reveal(idx) {
  const r = RARITIES[idx];
  pullTier.textContent = r.name;
  pullTier.className = "pull-tier tier-" + r.key;
  pullOdds.textContent = "1 in " + r.oneInX.toLocaleString() + " chance";
  pullResult.hidden = false;

  pullCountVal++;
  pullCountEl.textContent = pullCountVal;

  if (idx > bestIdx) {
    bestIdx = idx;
    pullBestEl.textContent = RARITIES[bestIdx].name;
    pullBestEl.style.color = legendColor(RARITIES[bestIdx].key);
  }

  discovered.add(idx);
  updateLegend();

  SFX.reveal(idx);

  if (idx >= 5) { // Epic and above get a particle burst
    const colors = TIER_PARTICLE_COLORS[r.key] || ["#ffffff"];
    spawnParticles(10 + idx * 3, colors);
  }
  if (idx === RARITIES.length - 1) { // Singularity
    document.body.classList.add('shake');
    setTimeout(() => document.body.classList.remove('shake'), 420);
  }

  pullBtn.disabled = false;
}

function openPull() {
  showPanel('pull');
  document.body.className = 'view-pull';
}
document.getElementById('playPull').addEventListener('click', openPull);

pullBtn.addEventListener('click', doPull);
buildLegend();

// ═══════════════════ THE SHADE ═══════════════════
// Difficulty ramps across the 50 questions: obvious primaries first,
// then common named shades, then close look-alike pairs, then expert traps.

const SHADE_COLORS = [
  // Tier 1 — obvious (Q1-10)
  { name: "Red",    hex: "#e53935" },
  { name: "Blue",   hex: "#1e5fd9" },
  { name: "Green",  hex: "#2e8b3d" },
  { name: "Yellow", hex: "#f4d03f" },
  { name: "Orange", hex: "#f0791f" },
  { name: "Purple", hex: "#8e44ad" },
  { name: "Pink",   hex: "#ff8fb1" },
  { name: "Brown",  hex: "#7b4a26" },
  { name: "Black",  hex: "#1a1a1a" },
  { name: "White",  hex: "#f7f7f7" },

  // Tier 2 — common named shades (Q11-25)
  { name: "Teal",      hex: "#128f8f" },
  { name: "Maroon",    hex: "#7a1f2b" },
  { name: "Navy",      hex: "#1b2a55" },
  { name: "Olive",     hex: "#6f7229" },
  { name: "Turquoise", hex: "#30c9c0" },
  { name: "Lavender",  hex: "#b9a6e0" },
  { name: "Coral",     hex: "#ff6f5e" },
  { name: "Mint",      hex: "#7fe0af" },
  { name: "Beige",     hex: "#e8dcc0" },
  { name: "Gold",      hex: "#dbab2e" },
  { name: "Silver",    hex: "#b6bcc4" },
  { name: "Crimson",   hex: "#c8102e" },
  { name: "Indigo",    hex: "#3d2e7c" },
  { name: "Violet",    hex: "#a15cd1" },
  { name: "Magenta",   hex: "#d6249b" },

  // Tier 3 — close look-alikes, with an "obvious" trap answer (Q26-40)
  { name: "Rose",       hex: "#c9536b", trap: "Red" },
  { name: "Scarlet",    hex: "#e0321e", trap: "Red" },
  { name: "Burgundy",   hex: "#5e1a28", trap: "Maroon" },
  { name: "Cyan",       hex: "#3fd0d4", trap: "Turquoise" },
  { name: "Periwinkle", hex: "#9aa3e0", trap: "Lavender" },
  { name: "Chartreuse", hex: "#9ecb3c", trap: "Green" },
  { name: "Vermilion",  hex: "#c1442a", trap: "Orange" },
  { name: "Cerulean",   hex: "#2a6ba0", trap: "Blue" },
  { name: "Amber",      hex: "#d99a1f", trap: "Orange" },
  { name: "Plum",       hex: "#7d4a72", trap: "Purple" },
  { name: "Salmon",     hex: "#e88a76", trap: "Pink" },
  { name: "Mauve",      hex: "#b28ba3", trap: "Purple" },
  { name: "Ochre",      hex: "#b5762a", trap: "Brown" },
  { name: "Slate",      hex: "#5f6c78", trap: "Gray" },
  { name: "Taupe",      hex: "#8a7b6c", trap: "Brown" },

  // Tier 4 — expert, very close pairs (Q41-50)
  { name: "Puce",       hex: "#a3697a", trap: "Mauve" },
  { name: "Cerise",     hex: "#c22a5e", trap: "Magenta" },
  { name: "Glaucous",   hex: "#6683ab", trap: "Slate" },
  { name: "Celadon",    hex: "#8fc0a0", trap: "Mint" },
  { name: "Wisteria",   hex: "#9c85c2", trap: "Lavender" },
  { name: "Xanadu",     hex: "#6f7d6f", trap: "Olive" },
  { name: "Falu Red",   hex: "#742a2a", trap: "Burgundy" },
  { name: "Isabelline", hex: "#ece6dd", trap: "Beige" },
  { name: "Feldgrau",   hex: "#4b5347", trap: "Gray" },
  { name: "Gamboge",    hex: "#e0a52a", trap: "Amber" }
];

let shadeIndex = 0;
let shadeScore = 0;
let shadeAnswered = false;

const shadeSwatch       = document.getElementById('shadeSwatch');
const shadeOptions      = document.getElementById('shadeOptions');
const shadeFeedback     = document.getElementById('shadeFeedback');
const shadeQNum         = document.getElementById('shadeQNum');
const shadeScoreLabel   = document.getElementById('shadeScoreLabel');
const shadeProgressFill = document.getElementById('shadeProgressFill');
const shadeCard         = document.getElementById('shadeCard');
const shadeResults      = document.getElementById('shadeResults');
const shadeFinalScore   = document.getElementById('shadeFinalScore');
const shadeFinalMsg     = document.getElementById('shadeFinalMsg');
const shadeReplayBtn    = document.getElementById('shadeReplayBtn');

function openShade() {
  showPanel('shade');
  document.body.className = 'view-shade';
  shadeIndex = 0;
  shadeScore = 0;
  shadeCard.hidden = false;
  shadeResults.hidden = true;
  loadShadeQuestion();
}
document.getElementById('playShade').addEventListener('click', openShade);

function pickShadeOptions(correctIdx) {
  const correct = SHADE_COLORS[correctIdx];
  const used = new Set([correct.name]);
  const options = [correct.name];

  if (correct.trap && !used.has(correct.trap)) {
    used.add(correct.trap);
    options.push(correct.trap);
  }

  const allNames = SHADE_COLORS.map(c => c.name);
  let guard = 0;
  while (options.length < 4 && guard < 500) {
    guard++;
    const candidate = allNames[Math.floor(Math.random() * allNames.length)];
    if (!used.has(candidate)) {
      used.add(candidate);
      options.push(candidate);
    }
  }

  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  return options;
}

function loadShadeQuestion() {
  shadeAnswered = false;
  const c = SHADE_COLORS[shadeIndex];
  shadeSwatch.style.background = c.hex;
  shadeQNum.textContent = "Question " + (shadeIndex + 1) + " of " + SHADE_COLORS.length;
  shadeScoreLabel.textContent = "Score: " + shadeScore;
  shadeProgressFill.style.width = (shadeIndex / SHADE_COLORS.length * 100) + "%";
  shadeFeedback.textContent = "";

  shadeOptions.innerHTML = "";
  pickShadeOptions(shadeIndex).forEach(name => {
    const btn = document.createElement('button');
    btn.textContent = name;
    btn.addEventListener('click', () => answerShade(name, btn));
    shadeOptions.appendChild(btn);
  });
}

function answerShade(chosen, btnEl) {
  if (shadeAnswered) return;
  shadeAnswered = true;
  const c = SHADE_COLORS[shadeIndex];
  const isCorrect = chosen === c.name;
  if (isCorrect) { shadeScore++; SFX.correct(); } else { SFX.wrong(); }

  [...shadeOptions.children].forEach(btn => {
    btn.disabled = true;
    if (btn.textContent === c.name) btn.classList.add('correct');
    else if (btn === btnEl) btn.classList.add('wrong');
  });

  shadeFeedback.textContent = isCorrect
    ? "Yes — that's " + c.name + "."
    : "Nope — that's " + c.name + ".";
  shadeScoreLabel.textContent = "Score: " + shadeScore;

  setTimeout(() => {
    shadeIndex++;
    if (shadeIndex >= SHADE_COLORS.length) {
      finishShade();
    } else {
      loadShadeQuestion();
    }
  }, 1100);
}

function finishShade() {
  shadeProgressFill.style.width = "100%";
  shadeCard.hidden = true;
  shadeResults.hidden = false;
  shadeFinalScore.textContent = shadeScore + " / " + SHADE_COLORS.length;

  const pct = shadeScore / SHADE_COLORS.length;
  let msg;
  if (pct >= 0.9) msg = "Certified color expert. The late-round traps didn't fool you.";
  else if (pct >= 0.7) msg = "Sharp eye — most of the sneaky ones didn't get past you.";
  else if (pct >= 0.5) msg = "Solid run. The tricky shades in the back half are rough.";
  else msg = "Those late-game traps are brutal — give it another go.";
  shadeFinalMsg.textContent = msg;
  SFX.fanfare();
}

shadeReplayBtn.addEventListener('click', openShade);

// ═══════════════════ THE RECALL ═══════════════════
// A word (or letters) flashes briefly, then vanishes into a field of
// drifting decoy letters for a delay before the recall question appears.
// Difficulty ramps across 4 tiers of 10 questions: color recall, then
// word recall, then position recall, then multi-letter color+position
// binding — with the flash getting shorter and the delay getting longer.

const RECALL_WORDS = [
  "cat","dog","sun","moon","tree","book","chair","cloud","river","mountain",
  "star","fish","bird","house","car","phone","shoe","hat","key","door",
  "window","flower","apple","orange","grape","lemon","snow","fire","wind","rock",
  "sand","wave","leaf","cup","plate","fork","spoon","table","lamp","clock",
  "mirror","pillow","blanket","candle","bell","drum","kite","frog","lion","ship"
];

const RECALL_COLORS = [
  { name: "Red",     hex: "#e53935" },
  { name: "Blue",    hex: "#1e5fd9" },
  { name: "Green",   hex: "#2e8b3d" },
  { name: "Yellow",  hex: "#f4d03f" },
  { name: "Orange",  hex: "#f0791f" },
  { name: "Purple",  hex: "#8e44ad" },
  { name: "Pink",    hex: "#ff8fb1" },
  { name: "Teal",    hex: "#128f8f" },
  { name: "Brown",   hex: "#7b4a26" },
  { name: "Cyan",    hex: "#3fd0d4" },
  { name: "Lime",    hex: "#9ecb3c" },
  { name: "Magenta", hex: "#d6249b" }
];

const RECALL_POSITIONS = ["left", "right", "top", "bottom", "center"];

const RECALL_TOTAL = 40;

const RECALL_TIER_CONFIG = {
  1: { hold: 2400, blank: 1400, noise: 6  },
  2: { hold: 2000, blank: 2400, noise: 11 },
  3: { hold: 1700, blank: 3400, noise: 17 },
  4: { hold: 1500, blank: 4200, noise: 24 }
};

function recallTierFor(qIndex) {
  if (qIndex < 10) return 1;
  if (qIndex < 20) return 2;
  if (qIndex < 30) return 3;
  return 4;
}

function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomLetter() { return String.fromCharCode(65 + Math.floor(Math.random() * 26)); }
function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

function buildRecallOptions(correct, pool) {
  const others = pool.filter(p => p !== correct);
  const order = shuffledOrder(others.length);
  const picks = order.slice(0, 3).map(i => others[i]);
  const opts = [correct, ...picks];
  const finalOrder = shuffledOrder(opts.length);
  return finalOrder.map(i => opts[i]);
}

let recallIndex = 0;
let recallScore = 0;
let recallCurrent = null;
let recallAnswered = false;
let recallTimers = [];

const recallCardEl      = document.getElementById('recallCard');
const recallStageEl     = document.getElementById('recallStage');
const recallNoiseEl     = document.getElementById('recallNoise');
const recallStimulusEl  = document.getElementById('recallStimulus');
const recallTimerFillEl = document.getElementById('recallTimerFill');
const recallQuestionEl  = document.getElementById('recallQuestion');
const recallQuestionTextEl = document.getElementById('recallQuestionText');
const recallOptionsEl   = document.getElementById('recallOptions');
const recallFeedbackEl  = document.getElementById('recallFeedback');
const recallQNum        = document.getElementById('recallQNum');
const recallScoreLabel  = document.getElementById('recallScoreLabel');
const recallProgressFill = document.getElementById('recallProgressFill');
const recallResultsEl   = document.getElementById('recallResults');
const recallFinalScore  = document.getElementById('recallFinalScore');
const recallFinalMsg    = document.getElementById('recallFinalMsg');
const recallReplayBtn   = document.getElementById('recallReplayBtn');

function openRecall() {
  showPanel('recall');
  document.body.className = 'view-recall';
  recallIndex = 0;
  recallScore = 0;
  recallCardEl.hidden = false;
  recallResultsEl.hidden = true;
  loadRecallQuestion();
}
document.getElementById('playRecall').addEventListener('click', openRecall);

function clearRecallTimers() {
  recallTimers.forEach(t => clearTimeout(t));
  recallTimers = [];
}

function spawnRecallNoise(count) {
  recallNoiseEl.innerHTML = "";
  for (let i = 0; i < count; i++) {
    const s = document.createElement('span');
    s.className = 'recall-noise-letter';
    s.textContent = randomLetter();
    s.style.left = Math.random() * 90 + '%';
    s.style.top = Math.random() * 84 + '%';
    s.style.setProperty('--drift', (Math.random() * 44 - 22) + 'px');
    s.style.animationDuration = (2.2 + Math.random() * 2.4) + 's';
    recallNoiseEl.appendChild(s);
  }
}

function clearRecallNoise() {
  recallNoiseEl.innerHTML = "";
}

function renderRecallWord(word, hex, pos) {
  recallStimulusEl.innerHTML =
    `<span class="recall-item pos-${pos}" style="color:${hex}">${word}</span>`;
}

function renderRecallLetters(letters) {
  recallStimulusEl.innerHTML = letters.map(l =>
    `<span class="recall-item pos-${l.pos}" style="color:${l.color.hex}">${l.letter}</span>`
  ).join('');
}

function buildRecallQuestion(index) {
  const tier = recallTierFor(index);
  const cfg = RECALL_TIER_CONFIG[tier];
  const stim = { tier, hold: cfg.hold, blank: cfg.blank, noise: cfg.noise };

  if (tier === 1) {
    const word = randomFrom(RECALL_WORDS);
    const color = randomFrom(RECALL_COLORS);
    stim.render = () => renderRecallWord(word, color.hex, "center");
    stim.question = `What color was the word "${word}"?`;
    stim.correct = color.name;
    stim.options = buildRecallOptions(color.name, RECALL_COLORS.map(c => c.name));

  } else if (tier === 2) {
    const word = randomFrom(RECALL_WORDS);
    const color = randomFrom(RECALL_COLORS);
    stim.render = () => renderRecallWord(word, color.hex, "center");
    stim.question = "What word just flashed on screen?";
    stim.correct = word;
    stim.options = buildRecallOptions(word, RECALL_WORDS);

  } else if (tier === 3) {
    const word = randomFrom(RECALL_WORDS);
    const color = randomFrom(RECALL_COLORS);
    const pos = randomFrom(RECALL_POSITIONS);
    stim.render = () => renderRecallWord(word, color.hex, pos);
    stim.question = `Where was the word "${word}" positioned on the screen?`;
    stim.correct = capitalize(pos);
    stim.options = buildRecallOptions(capitalize(pos), RECALL_POSITIONS.map(capitalize));

  } else {
    const positions = ["left", "right", "top", "bottom"];
    const letters = positions.map(p => ({
      pos: p,
      letter: randomLetter(),
      color: randomFrom(RECALL_COLORS)
    }));
    const askPos = randomFrom(positions);
    const target = letters.find(l => l.pos === askPos);
    stim.render = () => renderRecallLetters(letters);
    stim.question = `What color was the letter on the ${askPos.toUpperCase()} side of the screen?`;
    stim.correct = target.color.name;
    stim.options = buildRecallOptions(target.color.name, RECALL_COLORS.map(c => c.name));
  }

  return stim;
}

function loadRecallQuestion() {
  clearRecallTimers();
  recallAnswered = false;
  recallQuestionEl.hidden = true;
  recallFeedbackEl.textContent = "";
  recallQNum.textContent = "Question " + (recallIndex + 1) + " of " + RECALL_TOTAL;
  recallScoreLabel.textContent = "Score: " + recallScore;
  recallProgressFill.style.width = (recallIndex / RECALL_TOTAL * 100) + "%";

  recallCurrent = buildRecallQuestion(recallIndex);

  spawnRecallNoise(recallCurrent.noise);
  recallCurrent.render();
  SFX.flash();

  recallTimerFillEl.classList.remove('phase-blank');
  const total = recallCurrent.hold + recallCurrent.blank;
  recallTimerFillEl.style.transition = 'none';
  recallTimerFillEl.style.width = '100%';
  void recallTimerFillEl.offsetWidth; // restart transition
  recallTimerFillEl.style.transition = `width ${total}ms linear`;
  recallTimerFillEl.style.width = '0%';

  recallTimers.push(setTimeout(() => {
    recallStimulusEl.innerHTML = "";
    recallTimerFillEl.classList.add('phase-blank');
  }, recallCurrent.hold));

  recallTimers.push(setTimeout(() => {
    showRecallQuestion();
  }, total));
}

function showRecallQuestion() {
  clearRecallNoise();
  recallQuestionTextEl.textContent = recallCurrent.question;
  recallOptionsEl.innerHTML = "";
  recallCurrent.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.textContent = opt;
    btn.addEventListener('click', () => answerRecall(opt, btn));
    recallOptionsEl.appendChild(btn);
  });
  recallQuestionEl.hidden = false;
  SFX.prompt();
}

function answerRecall(chosen, btnEl) {
  if (recallAnswered) return;
  recallAnswered = true;
  const isCorrect = chosen === recallCurrent.correct;
  if (isCorrect) { recallScore++; SFX.correct(); } else { SFX.wrong(); }

  [...recallOptionsEl.children].forEach(btn => {
    btn.disabled = true;
    if (btn.textContent === recallCurrent.correct) btn.classList.add('correct');
    else if (btn === btnEl) btn.classList.add('wrong');
  });

  recallFeedbackEl.textContent = isCorrect
    ? "Yes — that's right."
    : "Nope — it was " + recallCurrent.correct + ".";
  recallScoreLabel.textContent = "Score: " + recallScore;

  recallTimers.push(setTimeout(() => {
    recallIndex++;
    if (recallIndex >= RECALL_TOTAL) {
      finishRecall();
    } else {
      loadRecallQuestion();
    }
  }, 1100));
}

function finishRecall() {
  clearRecallTimers();
  clearRecallNoise();
  recallStimulusEl.innerHTML = "";
  recallProgressFill.style.width = "100%";
  recallCardEl.hidden = true;
  recallResultsEl.hidden = false;
  recallFinalScore.textContent = recallScore + " / " + RECALL_TOTAL;

  const pct = recallScore / RECALL_TOTAL;
  let msg;
  if (pct >= 0.9) msg = "A steel trap. The noise never stood a chance.";
  else if (pct >= 0.7) msg = "Sharp memory — the late rounds barely slowed you down.";
  else if (pct >= 0.5) msg = "Solid effort. Those multi-letter rounds at the end are brutal.";
  else msg = "The distractions got you — give it another run.";
  recallFinalMsg.textContent = msg;
  SFX.fanfare();
}

recallReplayBtn.addEventListener('click', openRecall);

// ═══════════════════ THE FLAGS ═══════════════════
// 30 flag emojis (rendered as native Apple-style emoji on iOS/macOS so
// they stay crisp and colorful). Starts with the most iconic flags in
// the world, then eases into recognizable-but-less-common ones, then
// finishes with genuine lookalike pairs (Romania/Chad, Indonesia/Monaco,
// Ireland/Ivory Coast, Colombia/Ecuador, Luxembourg/Netherlands,
// Senegal/Mali) using the same trap-distractor trick as The Shade.

const FLAG_QUESTIONS = [
  // Tier 1 — instantly recognizable (Q1-8)
  { flag: "🇯🇵", name: "Japan" },
  { flag: "🇺🇸", name: "United States" },
  { flag: "🇬🇧", name: "United Kingdom" },
  { flag: "🇫🇷", name: "France" },
  { flag: "🇩🇪", name: "Germany" },
  { flag: "🇮🇹", name: "Italy" },
  { flag: "🇨🇦", name: "Canada" },
  { flag: "🇧🇷", name: "Brazil" },

  // Tier 2 — widely known (Q9-16)
  { flag: "🇨🇳", name: "China" },
  { flag: "🇦🇺", name: "Australia" },
  { flag: "🇲🇽", name: "Mexico" },
  { flag: "🇪🇸", name: "Spain" },
  { flag: "🇷🇺", name: "Russia" },
  { flag: "🇮🇳", name: "India" },
  { flag: "🇰🇷", name: "South Korea" },
  { flag: "🇨🇭", name: "Switzerland" },

  // Tier 3 — recognizable but less common (Q17-24)
  { flag: "🇳🇱", name: "Netherlands" },
  { flag: "🇸🇪", name: "Sweden" },
  { flag: "🇬🇷", name: "Greece" },
  { flag: "🇹🇷", name: "Turkey" },
  { flag: "🇪🇬", name: "Egypt" },
  { flag: "🇦🇷", name: "Argentina" },
  { flag: "🇿🇦", name: "South Africa" },
  { flag: "🇳🇴", name: "Norway" },

  // Tier 4 — genuine lookalikes, with an "obvious" trap answer (Q25-30)
  { flag: "🇷🇴", name: "Romania",    trap: "Chad" },
  { flag: "🇮🇩", name: "Indonesia",  trap: "Monaco" },
  { flag: "🇮🇪", name: "Ireland",    trap: "Ivory Coast" },
  { flag: "🇨🇴", name: "Colombia",   trap: "Ecuador" },
  { flag: "🇱🇺", name: "Luxembourg", trap: "Netherlands" },
  { flag: "🇸🇳", name: "Senegal",    trap: "Mali" }
];

const FLAG_DISTRACTOR_POOL = Array.from(new Set(
  FLAG_QUESTIONS.map(f => f.name).concat(
    FLAG_QUESTIONS.filter(f => f.trap).map(f => f.trap),
    ["Peru", "Venezuela", "Poland", "Thailand", "Finland", "Portugal", "Belgium", "Austria", "Denmark", "Chile"]
  )
));

let flagsIndex = 0;
let flagsScore = 0;
let flagsAnswered = false;

const flagDisplayEl     = document.getElementById('flagDisplay');
const flagsOptionsEl    = document.getElementById('flagsOptions');
const flagsFeedbackEl   = document.getElementById('flagsFeedback');
const flagsQNum         = document.getElementById('flagsQNum');
const flagsScoreLabel   = document.getElementById('flagsScoreLabel');
const flagsProgressFill = document.getElementById('flagsProgressFill');
const flagsCardEl       = document.getElementById('flagsCard');
const flagsResultsEl    = document.getElementById('flagsResults');
const flagsFinalScore   = document.getElementById('flagsFinalScore');
const flagsFinalMsg     = document.getElementById('flagsFinalMsg');
const flagsReplayBtn    = document.getElementById('flagsReplayBtn');

function openFlags() {
  showPanel('flags');
  document.body.className = 'view-flags';
  flagsIndex = 0;
  flagsScore = 0;
  flagsCardEl.hidden = false;
  flagsResultsEl.hidden = true;
  loadFlagQuestion();
}
document.getElementById('playFlags').addEventListener('click', openFlags);

function pickFlagOptions(index) {
  const correct = FLAG_QUESTIONS[index];
  const used = new Set([correct.name]);
  const options = [correct.name];

  if (correct.trap && !used.has(correct.trap)) {
    used.add(correct.trap);
    options.push(correct.trap);
  }

  let guard = 0;
  while (options.length < 4 && guard < 500) {
    guard++;
    const candidate = randomFrom(FLAG_DISTRACTOR_POOL);
    if (!used.has(candidate)) {
      used.add(candidate);
      options.push(candidate);
    }
  }

  const order = shuffledOrder(options.length);
  return order.map(i => options[i]);
}

function loadFlagQuestion() {
  flagsAnswered = false;
  const f = FLAG_QUESTIONS[flagsIndex];
  flagDisplayEl.textContent = f.flag;
  flagsQNum.textContent = "Question " + (flagsIndex + 1) + " of " + FLAG_QUESTIONS.length;
  flagsScoreLabel.textContent = "Score: " + flagsScore;
  flagsProgressFill.style.width = (flagsIndex / FLAG_QUESTIONS.length * 100) + "%";
  flagsFeedbackEl.textContent = "";

  flagsOptionsEl.innerHTML = "";
  pickFlagOptions(flagsIndex).forEach(name => {
    const btn = document.createElement('button');
    btn.textContent = name;
    btn.addEventListener('click', () => answerFlag(name, btn));
    flagsOptionsEl.appendChild(btn);
  });
}

function answerFlag(chosen, btnEl) {
  if (flagsAnswered) return;
  flagsAnswered = true;
  const f = FLAG_QUESTIONS[flagsIndex];
  const isCorrect = chosen === f.name;
  if (isCorrect) { flagsScore++; SFX.correct(); } else { SFX.wrong(); }

  [...flagsOptionsEl.children].forEach(btn => {
    btn.disabled = true;
    if (btn.textContent === f.name) btn.classList.add('correct');
    else if (btn === btnEl) btn.classList.add('wrong');
  });

  flagsFeedbackEl.textContent = isCorrect
    ? "Yes — that's " + f.name + "."
    : "Nope — that's " + f.name + ".";
  flagsScoreLabel.textContent = "Score: " + flagsScore;

  setTimeout(() => {
    flagsIndex++;
    if (flagsIndex >= FLAG_QUESTIONS.length) {
      finishFlags();
    } else {
      loadFlagQuestion();
    }
  }, 1100);
}

function finishFlags() {
  flagsProgressFill.style.width = "100%";
  flagsCardEl.hidden = true;
  flagsResultsEl.hidden = false;
  flagsFinalScore.textContent = flagsScore + " / " + FLAG_QUESTIONS.length;

  const pct = flagsScore / FLAG_QUESTIONS.length;
  let msg;
  if (pct >= 0.9) msg = "Practically a cartographer. The lookalikes didn't fool you.";
  else if (pct >= 0.7) msg = "Well traveled — most of the tricky ones didn't get past you.";
  else if (pct >= 0.5) msg = "Solid run. Those last few lookalike flags are brutal.";
  else msg = "The final stretch is a trap by design — give it another go.";
  flagsFinalMsg.textContent = msg;
  SFX.fanfare();
}

flagsReplayBtn.addEventListener('click', openFlags);

// ═══════════════════ THE DRAW ═══════════════════
// No backend, no API key exposed in a public static site — so instead of
// true image recognition, drawings are scored against a per-prompt target
// profile built from measurable shape data captured while drawing:
// bounding-box proportions, how much of the canvas got used, how many
// separate strokes were drawn (a rough proxy for detail), and left-right
// symmetry. Each is compared to a plausible range for that prompt and
// blended into a 0-100 score with a breakdown of what matched.

const DRAW_PROMPTS = [
  { text: "a circle",    aspect: [0.75, 1.35], strokes: [1, 3],  size: [0.10, 0.55], symmetry: [0.50, 1.00] },
  { text: "the sun",     aspect: [0.70, 1.40], strokes: [2, 10], size: [0.15, 0.65], symmetry: [0.40, 1.00] },
  { text: "a heart",     aspect: [0.80, 1.30], strokes: [1, 4],  size: [0.10, 0.55], symmetry: [0.55, 1.00] },
  { text: "a star",      aspect: [0.75, 1.30], strokes: [1, 3],  size: [0.10, 0.50], symmetry: [0.50, 1.00] },
  { text: "a house",     aspect: [0.90, 1.60], strokes: [3, 12], size: [0.15, 0.60], symmetry: [0.35, 1.00] },
  { text: "a tree",      aspect: [0.40, 0.90], strokes: [2, 10], size: [0.15, 0.65], symmetry: [0.35, 1.00] },
  { text: "a cat",       aspect: [0.80, 1.60], strokes: [4, 16], size: [0.15, 0.60], symmetry: [0.25, 0.85] },
  { text: "a fish",      aspect: [1.30, 3.00], strokes: [2, 10], size: [0.10, 0.55], symmetry: [0.20, 0.70] },
  { text: "an umbrella", aspect: [0.70, 1.30], strokes: [2, 8],  size: [0.15, 0.60], symmetry: [0.45, 1.00] },
  { text: "a sailboat",  aspect: [1.30, 2.80], strokes: [2, 10], size: [0.10, 0.55], symmetry: [0.25, 0.75] },
  { text: "a snowman",   aspect: [0.50, 1.00], strokes: [3, 14], size: [0.15, 0.65], symmetry: [0.35, 0.90] },
  { text: "a flower",    aspect: [0.60, 1.30], strokes: [2, 12], size: [0.10, 0.55], symmetry: [0.40, 1.00] },
  { text: "a rocket",    aspect: [0.30, 0.70], strokes: [2, 10], size: [0.15, 0.60], symmetry: [0.40, 1.00] },
  { text: "a butterfly", aspect: [1.00, 2.00], strokes: [2, 10], size: [0.15, 0.60], symmetry: [0.50, 1.00] },
  { text: "a car",       aspect: [1.40, 3.00], strokes: [3, 14], size: [0.15, 0.60], symmetry: [0.25, 0.75] },
  { text: "a mountain",  aspect: [1.20, 3.00], strokes: [1, 6],  size: [0.15, 0.65], symmetry: [0.20, 0.70] },
  { text: "a clock",     aspect: [0.75, 1.35], strokes: [2, 8],  size: [0.10, 0.50], symmetry: [0.40, 1.00] },
  { text: "a robot",     aspect: [0.60, 1.30], strokes: [4, 18], size: [0.15, 0.65], symmetry: [0.30, 0.85] }
];

let dPromptOrder = [];
let dPos = 0;
let dIdx = 0;
let dStrokes = [];
let dCurrentStroke = null;
let dDrawing = false;

const drawPromptNum      = document.getElementById('drawPromptNum');
const drawPromptWord     = document.getElementById('drawPromptWord');
const drawCanvas         = document.getElementById('drawCanvas');
const drawCtx            = drawCanvas.getContext('2d');
const drawUndoBtn        = document.getElementById('drawUndoBtn');
const drawClearBtn       = document.getElementById('drawClearBtn');
const drawGradeBtn       = document.getElementById('drawGradeBtn');
const drawResultCard     = document.getElementById('drawResultCard');
const drawScoreRing      = document.getElementById('drawScoreRing');
const drawScoreNum       = document.getElementById('drawScoreNum');
const drawScoreFeedback  = document.getElementById('drawScoreFeedback');
const drawTraitsList     = document.getElementById('drawTraitsList');
const drawNextBtn        = document.getElementById('drawNextBtn');

function openDraw() {
  showPanel('draw');
  document.body.className = 'view-draw';
  dPromptOrder = shuffledOrder(DRAW_PROMPTS.length);
  dPos = 0;
  loadDrawPrompt();
}
document.getElementById('playDraw').addEventListener('click', openDraw);

function loadDrawPrompt() {
  if (dPos >= dPromptOrder.length) {
    dPromptOrder = shuffledOrder(DRAW_PROMPTS.length);
    dPos = 0;
  }
  dIdx = dPromptOrder[dPos];
  drawPromptNum.textContent = "Prompt No. " + (dPos + 1);
  drawPromptWord.textContent = DRAW_PROMPTS[dIdx].text;
  clearDrawCanvas();
  drawResultCard.hidden = true;
}

function drawStrokeStyle() {
  drawCtx.strokeStyle = '#123c63';
  drawCtx.lineWidth = 5;
  drawCtx.lineCap = 'round';
  drawCtx.lineJoin = 'round';
}

function drawCanvasPoint(e) {
  const rect = drawCanvas.getBoundingClientRect();
  const scaleX = drawCanvas.width / rect.width;
  const scaleY = drawCanvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY
  };
}

function drawPointerDown(e) {
  e.preventDefault();
  dDrawing = true;
  const p = drawCanvasPoint(e);
  dCurrentStroke = [p];
  drawStrokeStyle();
  drawCtx.beginPath();
  drawCtx.moveTo(p.x, p.y);
  if (drawCanvas.setPointerCapture) drawCanvas.setPointerCapture(e.pointerId);
}

function drawPointerMove(e) {
  if (!dDrawing) return;
  const p = drawCanvasPoint(e);
  drawCtx.lineTo(p.x, p.y);
  drawCtx.stroke();
  dCurrentStroke.push(p);
}

function drawPointerUp() {
  if (!dDrawing) return;
  dDrawing = false;
  if (dCurrentStroke && dCurrentStroke.length > 1) {
    dStrokes.push(dCurrentStroke);
  }
  dCurrentStroke = null;
}

drawCanvas.addEventListener('pointerdown', drawPointerDown);
drawCanvas.addEventListener('pointermove', drawPointerMove);
drawCanvas.addEventListener('pointerup', drawPointerUp);
drawCanvas.addEventListener('pointercancel', drawPointerUp);
drawCanvas.addEventListener('pointerleave', drawPointerUp);

function clearDrawCanvas() {
  drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
  dStrokes = [];
  dCurrentStroke = null;
}

function redrawDrawStrokes() {
  drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
  drawStrokeStyle();
  dStrokes.forEach(stroke => {
    drawCtx.beginPath();
    drawCtx.moveTo(stroke[0].x, stroke[0].y);
    for (let i = 1; i < stroke.length; i++) drawCtx.lineTo(stroke[i].x, stroke[i].y);
    drawCtx.stroke();
  });
}

function undoDrawStroke() {
  dStrokes.pop();
  redrawDrawStrokes();
}

function drawRangeScore(value, range) {
  const [lo, hi] = range;
  if (value >= lo && value <= hi) return 1;
  const span = (hi - lo) || 1;
  const dist = value < lo ? (lo - value) : (value - hi);
  return Math.max(0, 1 - dist / span);
}

function drawSymmetryScore(points, centerX, refSize) {
  if (points.length < 2) return 0;
  const step = Math.max(1, Math.ceil(points.length / 260));
  const sample = points.filter((_, i) => i % step === 0);
  const tolerance = Math.max(refSize * 0.06, 6);
  let matched = 0;
  sample.forEach(p => {
    const mirroredX = 2 * centerX - p.x;
    let found = false;
    for (let i = 0; i < sample.length; i++) {
      const q = sample[i];
      const dx = q.x - mirroredX, dy = q.y - p.y;
      if (dx * dx + dy * dy <= tolerance * tolerance) { found = true; break; }
    }
    if (found) matched++;
  });
  return matched / sample.length;
}

function gradeDrawing() {
  if (dStrokes.length === 0) {
    drawCanvas.focus();
    return;
  }
  const prompt = DRAW_PROMPTS[dIdx];
  const allPoints = dStrokes.flat();

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  allPoints.forEach(p => {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  });
  const bboxW = Math.max(maxX - minX, 4);
  const bboxH = Math.max(maxY - minY, 4);
  const aspect = bboxW / bboxH;
  const sizeFraction = (bboxW * bboxH) / (drawCanvas.width * drawCanvas.height);
  const strokeCount = dStrokes.length;
  const symmetry = drawSymmetryScore(allPoints, minX + bboxW / 2, Math.max(bboxW, bboxH));

  const scores = {
    "Proportions": drawRangeScore(aspect, prompt.aspect),
    "Canvas use": drawRangeScore(sizeFraction, prompt.size),
    "Detail level": drawRangeScore(strokeCount, prompt.strokes),
    "Symmetry": drawRangeScore(symmetry, prompt.symmetry)
  };

  const total = Object.values(scores).reduce((a, b) => a + b, 0) / 4;
  const finalScore = Math.round(total * 100);

  showDrawResult(finalScore, scores, prompt.text);
}

function showDrawResult(finalScore, scores, promptText) {
  let color;
  if (finalScore >= 90) color = "#27a862";
  else if (finalScore >= 70) color = "#5fbf63";
  else if (finalScore >= 45) color = "#f0a428";
  else if (finalScore >= 20) color = "#ef7a34";
  else color = "#d84a35";

  drawScoreRing.style.setProperty('--pct', finalScore);
  drawScoreRing.style.setProperty('--ring-color', color);
  drawScoreNum.textContent = finalScore + "/100";

  let feedback;
  if (finalScore >= 90) feedback = "That's a strong match for " + promptText + ".";
  else if (finalScore >= 70) feedback = "Pretty close to " + promptText + " — just a little off.";
  else if (finalScore >= 45) feedback = "On the right track, but the shape isn't quite there yet.";
  else if (finalScore >= 20) feedback = "A rough sketch of " + promptText + " — needs more shape and detail.";
  else feedback = "That's pretty far from " + promptText + ". Give it another try.";
  drawScoreFeedback.textContent = feedback;

  drawTraitsList.innerHTML = "";
  Object.entries(scores).forEach(([label, s]) => {
    const chip = document.createElement('span');
    const hit = s >= 0.55;
    chip.className = "trait " + (hit ? "hit" : "miss");
    chip.textContent = (hit ? "✓ " : "✕ ") + label;
    drawTraitsList.appendChild(chip);
  });

  SFX.score(finalScore);
  drawResultCard.hidden = false;
}

drawGradeBtn.addEventListener('click', gradeDrawing);
drawClearBtn.addEventListener('click', () => { clearDrawCanvas(); drawResultCard.hidden = true; });
drawUndoBtn.addEventListener('click', undoDrawStroke);
drawNextBtn.addEventListener('click', () => { dPos++; loadDrawPrompt(); });

// ═══════════════════ THE POLL ═══════════════════
// 20 head-to-head "which is more popular" picks, ordered from lopsided
// blowouts down to near-coinflips. Percentages are best-approximation
// trivia-grade figures (favorite-color surveys, market share, fan base
// size, etc.), not a live data feed — the site is static with no backend.

const POLL_ITEMS = [
  { question: "Which sport has more fans worldwide?",
    a: { label: "Soccer", emoji: "⚽", pct: 90 }, b: { label: "American Football", emoji: "🏈", pct: 10 } },
  { question: "Which is more common in people?",
    a: { label: "Right-handed", emoji: "✋", pct: 90 }, b: { label: "Left-handed", emoji: "🤚", pct: 10 } },
  { question: "Which search engine gets used more?",
    a: { label: "Google", emoji: "🔎", pct: 90 }, b: { label: "Bing", emoji: "🌐", pct: 10 } },
  { question: "Which holiday is celebrated by more people worldwide?",
    a: { label: "Christmas", emoji: "🎄", pct: 85 }, b: { label: "Halloween", emoji: "🎃", pct: 15 } },
  { question: "Which social app has more monthly users?",
    a: { label: "Instagram", emoji: "📸", pct: 80 }, b: { label: "X (Twitter)", emoji: "🐦", pct: 20 } },
  { question: "Which food is eaten in more countries?",
    a: { label: "Pizza", emoji: "🍕", pct: 75 }, b: { label: "Sushi", emoji: "🍣", pct: 25 } },
  { question: "Which Olympics draws more global viewers?",
    a: { label: "Summer Olympics", emoji: "☀️", pct: 75 }, b: { label: "Winter Olympics", emoji: "❄️", pct: 25 } },
  { question: "Which fast food chain has more locations worldwide?",
    a: { label: "McDonald's", emoji: "🍟", pct: 68 }, b: { label: "Burger King", emoji: "🍔", pct: 32 } },
  { question: "Which phone operating system has more users worldwide?",
    a: { label: "Android", emoji: "🤖", pct: 70 }, b: { label: "iOS", emoji: "🍏", pct: 30 } },
  { question: "Which color do more people pick as their favorite?",
    a: { label: "Blue", emoji: "🔵", pct: 70 }, b: { label: "Red", emoji: "🔴", pct: 30 } },
  { question: "Which soda brand sells more globally?",
    a: { label: "Coca-Cola", emoji: "🥤", pct: 65 }, b: { label: "Pepsi", emoji: "🥤", pct: 35 } },
  { question: "Which sport has a bigger global following?",
    a: { label: "Basketball", emoji: "🏀", pct: 65 }, b: { label: "Baseball", emoji: "⚾", pct: 35 } },
  { question: "Which streaming service has more subscribers?",
    a: { label: "Netflix", emoji: "🎬", pct: 65 }, b: { label: "Disney+", emoji: "🏰", pct: 35 } },
  { question: "Which platform has more monthly active users?",
    a: { label: "Facebook", emoji: "📘", pct: 65 }, b: { label: "TikTok", emoji: "🎵", pct: 35 } },
  { question: "Which pet is more commonly owned?",
    a: { label: "Dogs", emoji: "🐶", pct: 60 }, b: { label: "Cats", emoji: "🐱", pct: 40 } },
  { question: "Which drink do more people worldwide drink?",
    a: { label: "Tea", emoji: "🍵", pct: 60 }, b: { label: "Coffee", emoji: "☕", pct: 40 } },
  { question: "Which ice cream flavor sells more?",
    a: { label: "Vanilla", emoji: "🍦", pct: 55 }, b: { label: "Chocolate", emoji: "🍫", pct: 45 } },
  { question: "Which language has more native speakers?",
    a: { label: "Spanish", emoji: "🇪🇸", pct: 55 }, b: { label: "English", emoji: "🇬🇧", pct: 45 } },
  { question: "Which emoji gets used more?",
    a: { label: "Face with Tears of Joy", emoji: "😂", pct: 55 }, b: { label: "Red Heart", emoji: "❤️", pct: 45 } },
  { question: "Which phone brand ships more units worldwide?",
    a: { label: "Samsung", emoji: "📱", pct: 52 }, b: { label: "iPhone", emoji: "🍏", pct: 48 } }
];

let pollIndex = 0;
let pollScore = 0;
let pollAnswered = false;

const pollQuestionEl  = document.getElementById('pollQuestion');
const pollOptionA     = document.getElementById('pollOptionA');
const pollOptionB     = document.getElementById('pollOptionB');
const pollEmojiA      = document.getElementById('pollEmojiA');
const pollEmojiB      = document.getElementById('pollEmojiB');
const pollLabelA      = document.getElementById('pollLabelA');
const pollLabelB      = document.getElementById('pollLabelB');
const pollResultEl    = document.getElementById('pollResult');
const pollBarA        = document.getElementById('pollBarA');
const pollBarB        = document.getElementById('pollBarB');
const pollPctA        = document.getElementById('pollPctA');
const pollPctB        = document.getElementById('pollPctB');
const pollFeedbackEl  = document.getElementById('pollFeedback');
const pollNextBtn     = document.getElementById('pollNextBtn');
const pollQNum        = document.getElementById('pollQNum');
const pollScoreLabel  = document.getElementById('pollScoreLabel');
const pollProgressFill = document.getElementById('pollProgressFill');
const pollCardEl      = document.getElementById('pollCard');
const pollResultsEl   = document.getElementById('pollResults');
const pollFinalScore  = document.getElementById('pollFinalScore');
const pollFinalMsg    = document.getElementById('pollFinalMsg');
const pollReplayBtn   = document.getElementById('pollReplayBtn');

function openPoll() {
  showPanel('poll');
  document.body.className = 'view-poll';
  pollIndex = 0;
  pollScore = 0;
  pollCardEl.hidden = false;
  pollResultsEl.hidden = true;
  loadPollQuestion();
}
document.getElementById('playPoll').addEventListener('click', openPoll);

function loadPollQuestion() {
  pollAnswered = false;
  const item = POLL_ITEMS[pollIndex];
  pollQuestionEl.textContent = item.question;
  pollEmojiA.textContent = item.a.emoji;
  pollLabelA.textContent = item.a.label;
  pollEmojiB.textContent = item.b.emoji;
  pollLabelB.textContent = item.b.label;
  pollOptionA.disabled = false;
  pollOptionB.disabled = false;
  pollOptionA.className = "poll-option";
  pollOptionB.className = "poll-option";
  pollResultEl.hidden = true;
  pollQNum.textContent = "Question " + (pollIndex + 1) + " of " + POLL_ITEMS.length;
  pollScoreLabel.textContent = "Score: " + pollScore;
  pollProgressFill.style.width = (pollIndex / POLL_ITEMS.length * 100) + "%";
}

function selectPollOption(choice) {
  if (pollAnswered) return;
  pollAnswered = true;
  const item = POLL_ITEMS[pollIndex];
  const winner = item.a.pct >= item.b.pct ? 'a' : 'b';
  const isCorrect = choice === winner;
  if (isCorrect) { pollScore++; SFX.correct(); } else { SFX.wrong(); }

  pollOptionA.disabled = true;
  pollOptionB.disabled = true;
  (choice === 'a' ? pollOptionA : pollOptionB).classList.add('picked');
  (winner === 'a' ? pollOptionA : pollOptionB).classList.add('winner');
  (winner === 'a' ? pollOptionB : pollOptionA).classList.add('loser');

  pollBarA.style.width = item.a.pct + "%";
  pollBarB.style.width = item.b.pct + "%";
  pollPctA.textContent = item.a.label + " " + item.a.pct + "%";
  pollPctB.textContent = item.b.label + " " + item.b.pct + "%";

  const winnerItem = winner === 'a' ? item.a : item.b;
  const margin = Math.abs(item.a.pct - item.b.pct);
  pollFeedbackEl.textContent = isCorrect
    ? "Correct — " + winnerItem.label + " wins, " + margin + " points ahead."
    : "Not quite — " + winnerItem.label + " actually wins, " + margin + " points ahead.";
  pollScoreLabel.textContent = "Score: " + pollScore;

  pollResultEl.hidden = false;
}

pollOptionA.addEventListener('click', () => selectPollOption('a'));
pollOptionB.addEventListener('click', () => selectPollOption('b'));

pollNextBtn.addEventListener('click', () => {
  pollIndex++;
  if (pollIndex >= POLL_ITEMS.length) {
    finishPoll();
  } else {
    loadPollQuestion();
  }
});

function finishPoll() {
  pollProgressFill.style.width = "100%";
  pollCardEl.hidden = true;
  pollResultsEl.hidden = false;
  pollFinalScore.textContent = pollScore + " / " + POLL_ITEMS.length;

  const pct = pollScore / POLL_ITEMS.length;
  let msg;
  if (pct >= 0.9) msg = "Great instincts — you read the room almost every time.";
  else if (pct >= 0.7) msg = "Solid — most of your picks matched what's actually more popular.";
  else if (pct >= 0.5) msg = "Decent run. The close ones near the end are genuine coin flips.";
  else msg = "Popularity is tricky to guess — give it another go.";
  pollFinalMsg.textContent = msg;
  SFX.fanfare();
}

pollReplayBtn.addEventListener('click', openPoll);
