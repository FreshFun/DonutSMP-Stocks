// ═══════════════════ VIEW SWITCHING ═══════════════════
const viewEls = {
  hub: document.getElementById('hubView'),
  timeline: document.getElementById('gameView'),
  bullseye: document.getElementById('bullseyeView'),
  pull: document.getElementById('pullView'),
  shade: document.getElementById('shadeView')
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
    { fork: 0.35, dy: -34, hue: '#ff8a5c' },
    { fork: 0.55, dy:  30, hue: '#3ecf8e' },
    { fork: 0.72, dy: -22, hue: '#b07cff' }
  ];
  function drawThumb() {
    ctx.clearRect(0, 0, W, H);
    const midY = H / 2 + 8;
    const startX = 24, endX = W - 24;
    const span = endX - startX;

    ctx.strokeStyle = '#2f8fff';
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

    ctx.fillStyle = '#c3cfe0';
    for (let i = 0; i <= 4; i++) {
      const x = startX + span * (i / 4);
      ctx.fillRect(x - 1, midY - 6, 2, 12);
    }

    const dx = startX + span * p;
    ctx.fillStyle = '#2f8fff';
    ctx.shadowColor = 'rgba(47,143,255,0.6)';
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
      renderTimeline(true);
    });
    chipsEl.appendChild(b);
  });
}

slider.addEventListener("input", () => {
  stage = Number(slider.value);
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
  if (score >= 90)      { color = "#3ecf8e"; feedback = "Nailed it — that's exactly what it is."; }
  else if (score >= 70) { color = "#7bc86c"; feedback = "Really close — just missing a detail or two."; }
  else if (score >= 45) { color = "#ffb648"; feedback = "On the right track, but still pretty general."; }
  else if (score >= 20) { color = "#ff8a5c"; feedback = "Too vague — that could describe a bunch of things."; }
  else                  { color = "#e8604c"; feedback = "Way too generic. What actually makes it unique?"; }

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

const pullOrb      = document.getElementById('pullOrb');
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
    common: "#9aa4b2", uncommon: "#3ecf8e", unusual: "#2bc4c4", rare: "#2f8fff",
    veryrare: "#8a5cff", epic: "#c23cff", legendary: "#ffb648", mythical: "#ff4d6d",
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

  const finalIdx = weightedPick();
  const flickerMs = 1100;
  const stepMs = 60;
  let elapsed = 0;

  const flicker = setInterval(() => {
    const r = RARITIES[Math.floor(Math.random() * RARITIES.length)];
    pullTier.textContent = r.name;
    pullTier.className = "pull-tier tier-" + r.key;
    pullResult.hidden = false;
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
  if (isCorrect) shadeScore++;

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
}

shadeReplayBtn.addEventListener('click', openShade);
