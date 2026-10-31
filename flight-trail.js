(() => {
  'use strict';
  const canvas = document.getElementById('flight-trail');
  if (!canvas || !window.matchMedia('(hover: hover) and (pointer: fine)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const ctx = canvas.getContext('2d');
  const points = [];
  let width = 0, height = 0, dpr = 1, raf = 0, lastX = 0, lastY = 0, angle = 0;
  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth; height = window.innerHeight;
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    canvas.style.width = width + 'px'; canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  const draw = () => {
    ctx.clearRect(0, 0, width, height);
    for (let i = points.length - 1; i >= 0; i--) {
      const p = points[i]; p.life -= .012;
      if (p.life <= 0) { points.splice(i, 1); continue; }
      const alpha = p.life * .24;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (1.2 - p.life * .25), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(115,190,255,${alpha})`; ctx.shadowBlur = 12; ctx.shadowColor = 'rgba(115,190,255,.45)'; ctx.fill(); ctx.shadowBlur = 0;
    }
    if (points.length) {
      const p = points[points.length - 1];
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(angle + Math.PI / 2);
      ctx.font = '20px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(37,126,220,.35)'; ctx.shadowBlur = 12; ctx.fillStyle = 'rgba(30,91,160,.82)'; ctx.fillText('✈', 0, 0); ctx.restore();
    }
    if (points.length) raf = requestAnimationFrame(draw); else raf = 0;
  };
  window.addEventListener('resize', resize, {passive:true}); resize();
  window.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch') return;
    const dx = event.clientX - lastX, dy = event.clientY - lastY;
    if (Math.hypot(dx, dy) > 1) angle = Math.atan2(dy, dx);
    lastX = event.clientX; lastY = event.clientY;
    points.push({x:event.clientX, y:event.clientY, life:1, size:2 + Math.random() * 2.5});
    if (points.length > 85) points.splice(0, points.length - 85);
    if (!raf) raf = requestAnimationFrame(draw);
  }, {passive:true});
})();
