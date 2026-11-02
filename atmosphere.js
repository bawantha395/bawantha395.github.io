/*
  Atmosphere: macOS-style glass wallpaper extras for the portfolio.
  1. Theme toggle (light glass / dark terminal), remembered in localStorage.
  2. A "cluster" canvas behind the page: DevOps tool icons drift as nodes, with packets
     travelling along the real delivery path (GitHub Actions / Jenkins -> Docker -> AWS -> Kubernetes ...).
  3. An Argo CD icon that follows the mouse pointer (fine pointers only).
  Everything respects prefers-reduced-motion, pauses when the tab is hidden and falls back to a
  static frame on small screens or if drawing becomes slow.
*/
(() => {
  'use strict';
  const root = document.documentElement;
  const mq = query => window.matchMedia(query);
  const reduceMotion = mq('(prefers-reduced-motion: reduce)');
  const finePointer = mq('(hover: hover) and (pointer: fine)');
  const compact = mq('(max-width: 760px)');
  const statusRegion = document.getElementById('status-message');

  /* ---------------------------------------------------------------- theme */
  const THEME_KEY = 'portfolio-theme';
  const toggle = document.querySelector('[data-theme-toggle]');
  let redrawStatic = () => {};
  const setTheme = (theme, save) => {
    if (theme === 'dark') root.dataset.theme = 'dark'; else delete root.dataset.theme;
    if (toggle) {
      const label = toggle.querySelector('.theme-toggle-label');
      if (label) label.textContent = theme === 'dark' ? 'Light glass' : 'Dark terminal';
    }
    if (save) { try { localStorage.setItem(THEME_KEY, theme); } catch (error) { /* storage unavailable */ } }
    redrawStatic();
  };
  setTheme(root.dataset.theme === 'dark' ? 'dark' : 'light', false);
  toggle?.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    setTheme(next, true);
    if (statusRegion) statusRegion.textContent = next === 'dark' ? 'Dark terminal theme on.' : 'Light glass theme on.';
  });

  /* --------------------------------------------------------- motion toggle */
  const MOTION_KEY = 'portfolio-motion';
  const motionButton = document.querySelector('[data-motion-toggle]');
  const setMotion = (state, save) => {
    if (state === 'off') root.dataset.motion = 'off'; else delete root.dataset.motion;
    if (motionButton) {
      const label = motionButton.querySelector('.theme-toggle-label');
      if (label) label.textContent = state === 'off' ? 'Play motion' : 'Pause motion';
    }
    if (save) { try { localStorage.setItem(MOTION_KEY, state); } catch (error) { /* storage unavailable */ } }
    window.__clusterMotion?.refresh();
  };
  try { if (localStorage.getItem(MOTION_KEY) === 'off') root.dataset.motion = 'off'; } catch (error) { /* storage unavailable */ }
  setMotion(root.dataset.motion === 'off' ? 'off' : 'on', false);
  motionButton?.addEventListener('click', () => {
    const next = root.dataset.motion === 'off' ? 'on' : 'off';
    setMotion(next, true);
    if (statusRegion) statusRegion.textContent = next === 'off' ? 'Background motion paused.' : 'Background motion playing.';
  });

  /* -------------------------------------------------------- cluster canvas */
  const canvas = document.getElementById('cluster-bg');
  const ctx = canvas?.getContext('2d');
  const pointer = {x: -9999, y: -9999, tx: -9999, ty: -9999, active: false};
  const forceMotion = /[?&]motion=force/.test(window.location.search);   // developer switch: never auto-pause
  const motionOn = () => !reduceMotion.matches && root.dataset.motion !== 'off' && !compact.matches;
  if (canvas && ctx) {
    const NODES = [
      {id: 'gha', icon: 'githubactions.svg', x: .09, y: .17, s: 54, z: .85, sp: .31, ax: 16, ay: 12, ph: .4},
      {id: 'jenkins', icon: 'jenkins.svg', x: .07, y: .64, s: 52, z: .72, sp: .27, ax: 14, ay: 16, ph: 2.1},
      {id: 'docker', icon: 'docker.svg', x: .25, y: .40, s: 58, z: 1, sp: .24, ax: 18, ay: 14, ph: 1.2},
      {id: 'terraform', icon: 'terraform.svg', x: .31, y: .86, s: 52, z: .78, sp: .29, ax: 15, ay: 12, ph: 3.3},
      {id: 'aws', icon: 'aws.svg', x: .45, y: .18, s: 60, z: .95, sp: .22, ax: 20, ay: 12, ph: .9},
      {id: 'k8s', icon: 'kubernetes.svg', x: .60, y: .52, s: 86, z: 1.1, sp: .18, ax: 14, ay: 14, ph: 4.2},
      {id: 'prom', icon: 'prometheus.svg', x: .79, y: .22, s: 54, z: .82, sp: .33, ax: 16, ay: 14, ph: 5},
      {id: 'grafana', icon: 'grafana.svg', x: .93, y: .46, s: 56, z: .9, sp: .26, ax: 13, ay: 16, ph: 2.7},
      {id: 'argocd', icon: 'argocd.svg', x: .76, y: .82, s: 62, z: 1, sp: .21, ax: 17, ay: 13, ph: 1.7}
    ];
    // Direction of each edge follows the delivery path: build, ship, run, observe.
    const EDGES = [['gha', 'docker'], ['jenkins', 'docker'], ['docker', 'aws'], ['terraform', 'aws'],
      ['aws', 'k8s'], ['argocd', 'k8s'], ['k8s', 'prom'], ['prom', 'grafana']];
    const byId = {};
    NODES.forEach(node => {
      node.cx = node.x * window.innerWidth; node.cy = node.y * window.innerHeight; node.pulse = 0;
      node.img = new Image(); node.img.decoding = 'async'; node.img.src = 'assets/tool-icons/' + node.icon;
      node.img.addEventListener('load', () => redrawStatic());
      byId[node.id] = node;
    });
    const edges = EDGES.map(([from, to], index) => ({a: byId[from], b: byId[to], next: 900 + index * 650, bend: (index % 2 ? 1 : -1) * .12}));
    const packets = [];
    let W = 0, H = 0, dpr = 1, last = 0, raf = 0, animated = false, slowFrames = 0, minGap = 0;

    const isDark = () => root.dataset.theme === 'dark';
    const curvePoint = (edge, t) => {
      const {a, b} = edge, mx = (a.cx + b.cx) / 2, my = (a.cy + b.cy) / 2;
      const dx = b.cx - a.cx, dy = b.cy - a.cy;
      const qx = mx - dy * edge.bend, qy = my + dx * edge.bend, u = 1 - t;
      return {x: u * u * a.cx + 2 * u * t * qx + t * t * b.cx, y: u * u * a.cy + 2 * u * t * qy + t * t * b.cy, qx, qy};
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, compact.matches ? 1 : 1.5);
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!animated) frame(0, 0);
    };

    const drawNode = (node, dark) => {
      const radius = node.s * .72 * node.z, size = radius * 1.18;
      ctx.save();
      ctx.globalAlpha = Math.min(.96, .5 + .42 * node.z);
      const glow = ctx.createRadialGradient(node.cx - radius * .35, node.cy - radius * .45, radius * .1, node.cx, node.cy, radius);
      glow.addColorStop(0, dark ? 'rgba(255,255,255,.24)' : 'rgba(255,255,255,.96)');
      glow.addColorStop(1, dark ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.58)');
      ctx.fillStyle = glow;
      ctx.shadowColor = dark ? 'rgba(0,0,0,.55)' : 'rgba(30,55,95,.2)';
      ctx.shadowBlur = 20; ctx.shadowOffsetY = 7;
      ctx.beginPath(); ctx.arc(node.cx, node.cy, radius, 0, Math.PI * 2); ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.lineWidth = 1; ctx.strokeStyle = dark ? 'rgba(255,255,255,.24)' : 'rgba(255,255,255,.95)'; ctx.stroke();
      if (node.img.complete && node.img.naturalWidth) ctx.drawImage(node.img, node.cx - size / 2, node.cy - size / 2, size, size);
      if (node.pulse > .02) {
        ctx.globalAlpha = node.pulse * .4; ctx.lineWidth = 1.5;
        ctx.strokeStyle = dark ? '#7cf0d2' : '#1f8f7c';
        ctx.beginPath(); ctx.arc(node.cx, node.cy, radius * (1 + (1 - node.pulse) * .7), 0, Math.PI * 2); ctx.stroke();
      }
      ctx.restore();
    };

    function frame(now, dt) {
      const t = now / 1000, dark = isDark();
      ctx.clearRect(0, 0, W, H);
      pointer.x += (pointer.tx - pointer.x) * .04; pointer.y += (pointer.ty - pointer.y) * .04;
      const px = pointer.active ? pointer.x / W - .5 : 0, py = pointer.active ? pointer.y / H - .5 : 0;
      NODES.forEach(node => {
        let bx = node.x * W + Math.sin(t * node.sp * .5 + node.ph) * node.ax * .6 + px * 10 * node.z;
        let by = node.y * H + Math.cos(t * node.sp * .4 + node.ph) * node.ay * .6 + py * 8 * node.z;
        node.cx += (bx - node.cx) * (dt ? .05 : 1); node.cy += (by - node.cy) * (dt ? .05 : 1);
        node.pulse = Math.max(0, node.pulse - (dt || 0) / 1500);
      });
      // edges
      edges.forEach(edge => {
        const mid = curvePoint(edge, .5);
        const near = 0;
        ctx.beginPath(); ctx.moveTo(edge.a.cx, edge.a.cy); ctx.quadraticCurveTo(mid.qx, mid.qy, edge.b.cx, edge.b.cy);
        ctx.lineWidth = 1.4; ctx.setLineDash([2, 7]);
        ctx.strokeStyle = dark ? 'rgba(124,240,210,' + (.2 + near * .35) + ')' : 'rgba(30,115,102,' + (.24 + near * .35) + ')';
        ctx.stroke(); ctx.setLineDash([]);
      });
      // packets travel along the edges (only while animating)
      if (animated && dt) {
        edges.forEach(edge => {
          if (now > edge.next && packets.length < 5) {
            packets.push({edge, p: 0, v: .00010 + Math.random() * .00008});
            edge.next = now + 4200 + Math.random() * 5200;
          }
        });
        for (let i = packets.length - 1; i >= 0; i--) {
          const packet = packets[i]; packet.p += packet.v * dt;
          if (packet.p >= 1) { packet.edge.b.pulse = 1; packets.splice(i, 1); continue; }
          for (let k = 0; k < 4; k++) {
            const q = curvePoint(packet.edge, Math.max(0, packet.p - k * .018));
            ctx.beginPath(); ctx.arc(q.x, q.y, 3.2 - k * .65, 0, Math.PI * 2);
            ctx.fillStyle = dark ? 'rgba(124,240,210,' + (.8 - k * .2) + ')' : 'rgba(25,135,115,' + (.8 - k * .2) + ')';
            ctx.shadowColor = dark ? '#7cf0d2' : '#1f8f7c'; ctx.shadowBlur = k ? 0 : 9; ctx.fill();
          }
          ctx.shadowBlur = 0;
        }
      }
      NODES.forEach(node => drawNode(node, dark));
    }

    // Frame-pacing guard: if the device cannot hold a comfortable frame rate (blurred glass over moving pixels is
    // GPU-heavy), pause the background motion automatically instead of letting the page stutter.
    let paceStart = 0, paceLast = 0; const pace = [];
    const watchPace = now => {
      if (!paceStart) { paceStart = now; paceLast = now; return; }
      const gap = now - paceLast; paceLast = now;
      if (forceMotion || now - paceStart < 2500 || gap > 400) return;
      pace.push(gap); if (pace.length > 90) pace.shift();
      if (pace.length >= 90 && pace.slice().sort((x, y) => x - y)[45] > 50) {
        setMotion('off', false);
        if (statusRegion) statusRegion.textContent = 'Background motion paused to keep the page smooth. Choose Play motion to resume.';
      }
    };
    const loop = now => {
      raf = window.requestAnimationFrame(loop);
      watchPace(now);
      if (now - last < minGap) return;                 // starts at the display rate; drops to ~30 fps only if drawing is slow
      const dt = Math.min(now - last, 80), started = performance.now();
      last = now; frame(now, dt);
      slowFrames = performance.now() - started > 14 ? slowFrames + 1 : Math.max(0, slowFrames - 1);
      if (slowFrames > 40 && !minGap) { minGap = 33; slowFrames = 0; }
      else if (slowFrames > 90) stop();            // still too slow: freeze on a static frame
    };
    function start() {
      if (animated || !motionOn() || document.hidden) return;
      animated = true; last = performance.now(); paceStart = 0; pace.length = 0; raf = window.requestAnimationFrame(loop);
    }
    function stop() {
      animated = false; window.cancelAnimationFrame(raf); packets.length = 0;
      frame(performance.now(), 0);
    }
    redrawStatic = () => { if (!animated) frame(performance.now(), 0); };

    window.addEventListener('resize', () => { window.clearTimeout(resize.timer); resize.timer = window.setTimeout(resize, 120); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else start(); });
    const refresh = () => { stop(); resize(); start(); };
    reduceMotion.addEventListener?.('change', refresh); compact.addEventListener?.('change', refresh);
    window.addEventListener('pointermove', event => {
      if (event.pointerType === 'touch') return;
      pointer.tx = event.clientX; pointer.ty = event.clientY;
      if (!pointer.active) { pointer.x = pointer.tx; pointer.y = pointer.ty; }
      pointer.active = true;
    }, {passive: true});
    document.documentElement.addEventListener('mouseleave', () => { pointer.active = false; });
    resize(); start();
    window.requestAnimationFrame(() => canvas.classList.add('is-ready'));
    window.__clusterMotion = {refresh};
  }

  /* ----------------------------------------------- Argo CD cursor follower */
  if (finePointer.matches && !reduceMotion.matches) {
    const follower = document.createElement('div');
    follower.className = 'argo-cursor'; follower.setAttribute('aria-hidden', 'true');
    follower.innerHTML = '<span class="argo-cursor-ring"></span><img alt="" height="30" src="assets/tool-icons/argocd.svg" width="30"/><span class="argo-cursor-tip">Synced ✓</span>';
    document.body.append(follower);
    let x = -100, y = -100, tx = -100, ty = -100, tilt = 0, ticking = false, syncTimer = 0;
    const tick = () => {
      const dx = tx - x, dy = ty - y;
      x += dx * .14; y += dy * .14; tilt += (Math.max(-10, Math.min(10, dx * .25)) - tilt) * .14;
      follower.style.transform = 'translate3d(' + (x + 16) + 'px,' + (y + 16) + 'px,0) rotate(' + tilt.toFixed(1) + 'deg)';
      if (Math.abs(dx) > .3 || Math.abs(dy) > .3 || Math.abs(tilt) > .3) window.requestAnimationFrame(tick); else ticking = false;
    };
    window.addEventListener('pointermove', event => {
      if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
      tx = event.clientX; ty = event.clientY;
      if (!follower.classList.contains('is-visible')) { x = tx; y = ty; follower.classList.add('is-visible'); }
      follower.classList.toggle('is-hot', Boolean(event.target.closest?.('a,button,summary,input,select,textarea,label,[role="button"]')));
      if (!ticking) { ticking = true; window.requestAnimationFrame(tick); }
    }, {passive: true});
    document.documentElement.addEventListener('mouseleave', () => follower.classList.remove('is-visible'));
    window.addEventListener('pointerdown', () => follower.classList.add('is-down'));
    window.addEventListener('pointerup', () => follower.classList.remove('is-down'));
    document.addEventListener('click', event => {
      follower.classList.toggle('show-tip', Boolean(event.target.closest?.('a,button,summary')));
      follower.classList.remove('is-sync'); void follower.offsetWidth; follower.classList.add('is-sync');
      window.clearTimeout(syncTimer); syncTimer = window.setTimeout(() => follower.classList.remove('is-sync', 'show-tip'), 950);
    });
  }
})();
