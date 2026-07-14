// ── open / close the game in-page ──────────────────────────
const overlay = document.getElementById('gameOverlay');
const frame = document.getElementById('gameFrame');
const exitBtn = document.getElementById('exitGameBtn');

document.getElementById('chromaCard').addEventListener('click', () => {
  frame.src = 'chromatic/index.html';
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
});
exitBtn.addEventListener('click', closeGame);
function closeGame() {
  overlay.classList.remove('open');
  frame.src = '';                 // fully stops the game + its music
  document.body.style.overflow = '';
}
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && overlay.classList.contains('open')) closeGame();
});

// ── live thumbnail: mini rainbow ball ──────────────────────
(function () {
  const cv = document.getElementById('chromaThumb');
  const c = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  const cx = W / 2, cy = H / 2, R = Math.min(W, H) * 0.42;
  const ballR = 7;
  let hue = 0;
  let ball = { x: cx, y: cy, vx: 1.6, vy: -2.1 };
  const trail = [];
  const G = 0.05;

  function tick() {
    c.fillStyle = 'rgba(29,43,69,0.28)';
    c.fillRect(0, 0, W, H);

    hue = (hue + 1.2) % 360;
    trail.push({ x: ball.x, y: ball.y, hue });
    if (trail.length > 60) trail.shift();
    for (let i = 0; i < trail.length; i++) {
      const t = trail[i], a = i / trail.length;
      c.beginPath();
      c.arc(t.x, t.y, Math.max(1, ballR * a), 0, Math.PI * 2);
      c.fillStyle = `hsla(${t.hue},100%,60%,${a * 0.6})`;
      c.fill();
    }

    c.beginPath();
    c.arc(cx, cy, R, 0, Math.PI * 2);
    c.strokeStyle = `hsl(${hue},80%,60%)`;
    c.lineWidth = 2;
    c.stroke();

    ball.vy += G;
    ball.x += ball.vx;
    ball.y += ball.vy;
    const dx = ball.x - cx, dy = ball.y - cy;
    const d = Math.sqrt(dx * dx + dy * dy);
    const maxD = R - ballR;
    if (d >= maxD) {
      const nx = dx / d, ny = dy / d;
      const dot = ball.vx * nx + ball.vy * ny;
      ball.vx -= 2 * dot * nx;
      ball.vy -= 2 * dot * ny;
      ball.x = cx + nx * (maxD - 1);
      ball.y = cy + ny * (maxD - 1);
    }

    c.beginPath();
    c.arc(ball.x, ball.y, ballR, 0, Math.PI * 2);
    c.fillStyle = `hsl(${hue},100%,70%)`;
    c.fill();

    requestAnimationFrame(tick);
  }
  tick();
})();
