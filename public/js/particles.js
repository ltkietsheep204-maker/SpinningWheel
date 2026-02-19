// ========================
// PARTICLE CANVAS ANIMATION
// ========================

(function() {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let w, h;
  const particles = [];
  const PARTICLE_COUNT = 45;

  function resize() {
    w = canvas.width  = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }

  window.addEventListener('resize', resize);
  resize();

  // Create particles
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 2.5 + 0.5,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -Math.random() * 0.4 - 0.1,
      alpha: Math.random() * 0.5 + 0.15,
      color: Math.random() > 0.3
        ? `rgba(212,160,23,${Math.random() * 0.4 + 0.1})`
        : `rgba(139,0,0,${Math.random() * 0.3 + 0.1})`,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.02 + 0.005
    });
  }

  function animate() {
    ctx.clearRect(0, 0, w, h);

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.pulse += p.pulseSpeed;

      // Wrap around
      if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
      if (p.x < -10) p.x = w + 10;
      if (p.x > w + 10) p.x = -10;

      const glowAlpha = p.alpha + Math.sin(p.pulse) * 0.1;

      // Glow
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
      ctx.fillStyle = p.color.replace(/[\d.]+\)$/, (glowAlpha * 0.3).toFixed(2) + ')');
      ctx.fill();

      // Core
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color.replace(/[\d.]+\)$/, glowAlpha.toFixed(2) + ')');
      ctx.fill();
    });

    requestAnimationFrame(animate);
  }

  animate();
})();
