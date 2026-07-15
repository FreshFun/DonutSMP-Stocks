// ═══════════════════ VIEW SWITCHING ═══════════════════
const hubView  = document.getElementById('hubView');
const gameView = document.getElementById('gameView');
const backBtn  = document.getElementById('backBtn');
const playBtn  = document.getElementById('playTimeline');

function openGame() {
  hubView.hidden = true;
  gameView.hidden = false;
  document.body.className = 'view-game t0';
  selectScenario(0);
}
function closeGame() {
  gameView.hidden = true;
  hubView.hidden = false;
  document.body.className = 'view-hub';
}
playBtn.addEventListener('click', openGame);
backBtn.addEventListener('click', closeGame);
window.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !gameView.hidden) closeGame();
});

// ═══════════════════ HUB THUMBNAIL ═══════════════════
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
  render(false);
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
      render(true);
    });
    chipsEl.appendChild(b);
  });
}

slider.addEventListener("input", () => {
  stage = Number(slider.value);
  render(false);
});

function render(ripple) {
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
