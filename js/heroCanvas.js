/**
 * Living interactive "Surface vs. Underneath" canvas for the Landing page.
 * Tapping anywhere below the green surface line sparks an invisible fire
 * that blooms in warm ember and gets quietly contained without disturbing
 * the calm unbroken line above.
 */

export function initHeroCanvas(getCurrentView) {
  const canvas = document.getElementById('hero-canvas');
  const counterEl = document.getElementById('hero-spark-counter');
  const sparkBtn = document.getElementById('hero-spark-btn');
  if (!canvas) return { resize() {} };

  const ctx = canvas.getContext('2d');
  let sparks = [];
  let extinguished = 3;
  let pulseX = 0;

  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawnSpark(x, y) {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) return;
    const surfaceY = rect.height * 0.36;
    const clampedY = Math.max(surfaceY + 42, Math.min(rect.height - 28, y));
    const clampedX = Math.max(36, Math.min(rect.width - 110, x));
    sparks.push({ x: clampedX, y: clampedY, age: 0, life: 118, counted: false });
  }

  function triggerRandomSpark() {
    const rect = canvas.getBoundingClientRect();
    spawnSpark(
      rect.width * (0.14 + Math.random() * 0.58),
      rect.height * (0.56 + Math.random() * 0.28)
    );
  }

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    spawnSpark(e.clientX - rect.left, e.clientY - rect.top);
  });

  if (sparkBtn) {
    sparkBtn.addEventListener('click', triggerRandomSpark);
  }

  setInterval(() => {
    if (getCurrentView() === 'home' && sparks.length < 3) {
      triggerRandomSpark();
    }
  }, 2900);

  function draw() {
    if (getCurrentView() === 'home') {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      if (w > 10 && h > 10) {
        ctx.clearRect(0, 0, w, h);

        const ink3 = cssVar('--ink-3') || '#686c7a';
        const ink2 = cssVar('--ink-2') || '#a5a8b3';
        const calm = cssVar('--calm') || '#4ade80';
        const ember = cssVar('--ember') || '#ea6a32';
        const hairline = cssVar('--hairline') || 'rgba(255,255,255,0.08)';
        const surfaceY = h * 0.36;

        ctx.font = '600 11px Manrope, -apple-system, sans-serif';
        ctx.fillStyle = ink3;
        ctx.fillText('WHAT YOU SEE · CALM & UNBROKEN', 24, surfaceY - 24);
        ctx.fillText('UNDERNEATH · INVISIBLE FIRES HANDLED AUTOMATICALLY', 24, surfaceY + 34);

        // Steady calm top line
        ctx.beginPath();
        ctx.moveTo(24, surfaceY);
        ctx.lineTo(w - 24, surfaceY);
        ctx.strokeStyle = calm;
        ctx.globalAlpha = 0.65;
        ctx.lineWidth = 1.6;
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Gliding light pulse
        pulseX = (pulseX + 1.35) % Math.max(1, w - 48);
        const px = 24 + pulseX;
        const grad = ctx.createRadialGradient(px, surfaceY, 0, px, surfaceY, 26);
        grad.addColorStop(0, calm);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.globalAlpha = 0.32;
        ctx.beginPath();
        ctx.arc(px, surfaceY, 26, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        ctx.fillStyle = calm;
        ctx.beginPath();
        ctx.arc(px, surfaceY, 3, 0, Math.PI * 2);
        ctx.fill();

        // Subtle infrastructure lines beneath
        [0.60, 0.78].forEach((ratio) => {
          ctx.beginPath();
          ctx.setLineDash([2, 7]);
          ctx.moveTo(24, h * ratio);
          ctx.lineTo(w - 24, h * ratio);
          ctx.strokeStyle = hairline;
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.setLineDash([]);
        });

        // Animate invisible fire sparks
        sparks.forEach((s) => {
          s.age += 1;
          const t = s.age / s.life;
          const contained = t > 0.52;

          if (contained && !s.counted) {
            s.counted = true;
            extinguished += 1;
            if (counterEl) counterEl.textContent = `${extinguished} fires quietly put out`;
          }

          const fade = t < 0.14 ? t / 0.14 : t > 0.78 ? (1 - t) / 0.22 : 1;
          const ringR = 6 + t * 34;

          ctx.beginPath();
          ctx.arc(s.x, s.y, ringR, 0, Math.PI * 2);
          ctx.strokeStyle = contained ? calm : ember;
          ctx.globalAlpha = Math.max(0, fade * 0.45);
          ctx.lineWidth = 1.25;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(s.x, s.y, contained ? 3.5 : 4.5, 0, Math.PI * 2);
          ctx.fillStyle = contained ? calm : ember;
          ctx.globalAlpha = Math.max(0, fade);
          ctx.fill();

          ctx.font = '500 11.5px Manrope, -apple-system, sans-serif';
          ctx.fillStyle = contained ? calm : ink2;
          ctx.fillText(contained ? 'Contained ✓' : 'Spark detected…', s.x + 12, s.y + 4);
          ctx.globalAlpha = 1;
        });

        sparks = sparks.filter((s) => s.age < s.life);
      }
    }
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  resize();
  triggerRandomSpark();
  requestAnimationFrame(draw);

  return { resize, triggerRandomSpark };
}
