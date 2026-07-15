// ── Fullscreen overlay ──────────────────────────────
const overlay = document.getElementById('gameOverlay');
const frame   = document.getElementById('gameFrame');
const backBtn = document.getElementById('backBtn');

document.querySelectorAll('.game-card[data-game]').forEach(card => {
  card.addEventListener('click', () => {
    frame.src = card.dataset.game;
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  });
});

function closeGame() {
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  frame.src = ''; // fully stop the game
  document.body.style.overflow = '';
}
backBtn.addEventListener('click', closeGame);
window.addEventListener('keydown', e => {
  if (e.key === 'Escape' && overlay.classList.contains('open')) closeGame();
});

// ── Live thumbnail: a dot travelling a branching timeline ──
const canvas = document.getElementById('timelineThumb');
if (canvas) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let t = 0;

  // branch definitions: each forks off the main line
  const branches = [
    { fork: 0.35, dy: -34, hue: '#ff8a5c' },
    { fork: 0.55, dy:  30, hue: '#3ecf8e' },
    { fork: 0.72, dy: -22, hue: '#b07cff' }
  ];

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const midY = H / 2 + 8;
    const startX = 24, endX = W - 24;
    const span = endX - startX;

    // main timeline
    ctx.strokeStyle = '#2f8fff';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(startX, midY);
    ctx.lineTo(endX, midY);
    ctx.stroke();

    // progress of the travelling dot (0..1 loop)
    const p = reduced ? 0.65 : (t % 240) / 240;

    // branches grow once the dot passes their fork point
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
      // little end-node
      if (grow === 1) {
        ctx.fillStyle = b.hue;
        ctx.beginPath();
        ctx.arc(fx + 60, midY + b.dy, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // tick marks
    ctx.fillStyle = '#c3cfe0';
    for (let i = 0; i <= 4; i++) {
      const x = startX + span * (i / 4);
      ctx.fillRect(x - 1, midY - 6, 2, 12);
    }

    // travelling dot
    const dx = startX + span * p;
    ctx.fillStyle = '#2f8fff';
    ctx.shadowColor = 'rgba(47,143,255,0.6)';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(dx, midY, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    t++;
    if (!reduced) requestAnimationFrame(draw);
  }
  draw();
}
