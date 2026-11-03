/* Decorative effects and the simulated terminal.
   Nothing here talks to a server. The terminal is a simulation modelled on the Stocklane cluster. */
(() => {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  const root = document.documentElement;
  const sleepRaw = ms => new Promise(r => setTimeout(r, ms));
  const esc = s => String(s).replace(/[&<>]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;'}[c]));

  /* ------------------------------------------------------------ theme toggle */
  const store = {get(k){try{return localStorage.getItem(k)}catch(e){return null}}, set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
  const applyTheme = t => {
    root.dataset.theme = t;
    const b = document.querySelector('.theme-toggle');
    if (b) { b.setAttribute('aria-pressed', String(t === 'dark')); b.setAttribute('aria-label', t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'); }
  };
  applyTheme(store.get('theme') === 'dark' ? 'dark' : 'light');
  document.addEventListener('click', e => {
    if (!e.target.closest('.theme-toggle')) return;
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next); store.set('theme', next);
  });

  /* ------------------------------------------------------------ floating tool icons */
  // [file, left %, top %, width px, opacity, blur px, depth 0..1]
  const ICONS = [
    ['kubernetes', 7, 12, 190, .24, 5, .15], ['terraform', 74, 60, 160, .22, 4, .15], ['python', 44, 78, 130, .26, 3, .2],
    ['githubactions', 31, 42, 84, .34, 1.5, .5], ['jenkins', 63, 10, 76, .34, 1.5, .5], ['argocd', 17, 68, 80, .34, 1.5, .5], ['helm', 90, 34, 70, .3, 1, .5],
    ['docker', 40, 6, 54, .5, 0, .9], ['prometheus', 85, 84, 52, .5, 0, .9], ['grafana', 22, 90, 54, .5, 0, .9], ['kubernetes', 68, 38, 44, .42, 0, .9]
  ];
  const holder = document.createElement('div');
  holder.id = 'fx-icons'; holder.setAttribute('aria-hidden', 'true');
  const small = window.matchMedia('(max-width: 650px)').matches;
  const items = [];
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  ICONS.slice(0, small ? 6 : ICONS.length).forEach(([name, l, t, w, o, b, depth]) => {
    const el = document.createElement('div'); el.className = 'fxi';
    el.style.cssText = `left:${l}vw;top:${t}vh;width:${w}px;opacity:${o}`;
    el.style.setProperty('--dur', (60 + rnd() * 35).toFixed(0) + 's');
    el.style.setProperty('--delay', '-' + (rnd() * 40).toFixed(0) + 's');
    el.style.setProperty('--fx', ((rnd() - .5) * 40).toFixed(0) + 'px');
    el.style.setProperty('--fy', ((rnd() - .5) * 44).toFixed(0) + 'px');
    el.style.setProperty('--r0', ((rnd() - .5) * 14).toFixed(0) + 'deg');
    el.style.setProperty('--r1', ((rnd() - .5) * 14).toFixed(0) + 'deg');
    const img = new Image(); img.alt = ''; img.decoding = 'async'; img.src = 'assets/tool-icons/' + name + '.svg';
    if (b) img.style.filter = `blur(${b}px)`;
    el.appendChild(img); holder.appendChild(el);
    items.push({el, depth, cx: 0, cy: 0, ox: 0, oy: 0});
  });
  document.body.prepend(holder);
  const measure = () => items.forEach(it => { const r = it.el.getBoundingClientRect(); it.cx = r.left + r.width / 2 - it.ox; it.cy = r.top + r.height / 2 - it.oy; });
  window.addEventListener('resize', measure); requestAnimationFrame(measure);

  /* ------------------------------------------------------------ cursor wake, Argo CD follower, icon drift */
  let mx = -9999, my = -9999, lastMove = 0, raf = 0, hasPointer = false;
  const wake = document.createElement('canvas'); wake.id = 'fx-wake'; wake.setAttribute('aria-hidden', 'true');
  const wctx = wake.getContext('2d'); const SC = .5; let pts = []; const LIFE = 1500;
  const sizeWake = () => { wake.width = Math.ceil(innerWidth * SC); wake.height = Math.ceil(innerHeight * SC); };
  const follower = document.createElement('div'); follower.className = 'argo-cursor'; follower.setAttribute('aria-hidden', 'true');
  follower.innerHTML = '<img alt="" src="assets/tool-icons/argocd.svg">';
  let fx = 0, fy = 0;
  const motionOk = () => !reduce.matches && fine.matches;
  if (motionOk()) { sizeWake(); document.body.prepend(wake); document.body.appendChild(follower); window.addEventListener('resize', sizeWake); }

  const frame = now => {
    raf = 0;
    const active = motionOk();
    let busy = now - lastMove < 2200;
    // icon drift: gentle push away from the pointer, long easing
    items.forEach(it => {
      let tx = 0, ty = 0;
      if (active && hasPointer) {
        const dx = it.cx - mx, dy = it.cy - my, d = Math.hypot(dx, dy) || 1, R = 240;
        if (d < R) { const k = Math.pow(1 - d / R, 2) * (10 + it.depth * 14); tx += dx / d * k; ty += dy / d * k; }
        tx -= (mx / innerWidth - .5) * 12 * (.3 + it.depth);
        ty -= (my / innerHeight - .5) * 12 * (.3 + it.depth);
      }
      it.ox += (tx - it.ox) * .06; it.oy += (ty - it.oy) * .06;
      if (Math.abs(tx - it.ox) > .04 || Math.abs(ty - it.oy) > .04) busy = true;
      it.el.style.setProperty('--px', it.ox.toFixed(2) + 'px'); it.el.style.setProperty('--py', it.oy.toFixed(2) + 'px');
    });
    if (active) {
      // Argo CD follower with a soft lag
      fx += (mx + 14 - fx) * .2; fy += (my + 14 - fy) * .2;
      follower.style.transform = `translate3d(${fx.toFixed(1)}px,${fy.toFixed(1)}px,0)`;
      if (Math.abs(mx + 14 - fx) > .4 || Math.abs(my + 14 - fy) > .4) busy = true;
      // wake: a soft contrail that fades out
      wctx.clearRect(0, 0, wake.width, wake.height);
      wctx.globalCompositeOperation = 'lighter';
      pts = pts.filter(p => now - p.t < LIFE);
      pts.forEach((p, i) => {
        const a = 1 - (now - p.t) / LIFE, r = (16 + 40 * a) * SC * 2;
        const g = wctx.createRadialGradient(p.x * SC, p.y * SC, 0, p.x * SC, p.y * SC, r);
        const c = i % 2 ? '110,226,190' : '120,190,255';
        g.addColorStop(0, `rgba(${c},${(.17 * a * a).toFixed(3)})`); g.addColorStop(1, `rgba(${c},0)`);
        wctx.fillStyle = g; wctx.fillRect(p.x * SC - r, p.y * SC - r, r * 2, r * 2);
      });
      if (pts.length) busy = true;
    }
    if (busy && !document.hidden) raf = requestAnimationFrame(frame);
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
  window.addEventListener('pointermove', e => {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    if (!hasPointer) { fx = e.clientX; fy = e.clientY; hasPointer = true; measure(); }
    const last = pts[pts.length - 1];
    mx = e.clientX; my = e.clientY; lastMove = performance.now();
    if (!last || Math.hypot(last.x - mx, last.y - my) > 9) { pts.push({x: mx, y: my, t: lastMove}); if (pts.length > 70) pts.shift(); }
    document.body.classList.add('fx-cursor-on');
    const hot = e.target.closest && e.target.closest('a,button,input,textarea,select,summary,[role=button]');
    document.body.classList.toggle('fx-cursor-hot', !!hot);
    kick();
  }, {passive: true});
  document.documentElement.addEventListener('mouseleave', () => { document.body.classList.remove('fx-cursor-on'); mx = my = -9999; hasPointer = false; kick(); });
  window.addEventListener('pointerdown', () => document.body.classList.add('fx-cursor-down'));
  window.addEventListener('pointerup', () => document.body.classList.remove('fx-cursor-down'));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) kick(); });
  reduce.addEventListener('change', () => { document.body.classList.remove('fx-cursor-on'); kick(); });

  /* ------------------------------------------------------------ terminal helpers */
  const P = (cmd) => `<span class="t-p">bawantha@macbook</span> <span class="t-path">~</span> % <span class="t-cmd">${esc(cmd)}</span>`;
  const bar = title => `<div class="term-bar"><i class="r"></i><i class="y"></i><i class="g"></i><span class="term-title">${esc(title)}</span>${title.indexOf('zsh') > -1 ? '<button class="term-replay" type="button" aria-label="Replay the terminal demo">↻ replay</button>' : ''}</div>`;
  const pad = (s, n) => String(s).padEnd(n, ' ');
  const status = s => ({Running: 't-ok', Completed: 't-ok', Ready: 't-ok', ContainerCreating: 't-warn', Pending: 't-warn', Terminating: 't-dim', Synced: 't-ok', Healthy: 't-ok'}[s] || '');

  /* ------------------------------------------------------------ hero terminal (simulated cluster) */
  const hero = document.getElementById('hero-term');
  if (hero) {
    hero.innerHTML = bar('bawantha@macbook — zsh') + '<div class="term-body" tabindex="0" role="log" aria-label="Terminal output, simulated Kubernetes cluster"></div>' +
      '<div class="term-chips" aria-label="Try a command"></div><div class="term-cap">Simulated cluster, modelled on my Stocklane setup. Type a command or tap one.</div>';
    const body = hero.querySelector('.term-body'), chips = hero.querySelector('.term-chips');
    let skip = false, busy = false, engaged = false, history = [], hIdx = 0;
    const sleep = ms => skip ? Promise.resolve() : sleepRaw(ms);
    const scroll = () => { body.scrollTop = body.scrollHeight; };
    const line = html => { const d = document.createElement('div'); d.className = 'term-line'; d.innerHTML = html; body.appendChild(d); scroll(); return d; };
    const gen = () => Math.random().toString(36).slice(2, 7);

    // ----- model
    const baseName = 'inventory-6f9c7d-';
    let pods;
    const resetPods = () => {
      pods = [
        {n: baseName + '4kx2p', app: 'inventory', ready: '1/1', st: 'Running', age: '2d', rows: []},
        {n: 'workshop-7b84d5-hx9vl', app: 'workshop', ready: '1/1', st: 'Running', age: '2d', rows: []},
        {n: 'vision-5c6f88-q3t7r', app: 'vision', ready: '1/1', st: 'Running', age: '2d', rows: []},
        {n: 'forecast-84d9b6-z6j4k', app: 'forecast', ready: '1/1', st: 'Running', age: '2d', rows: []}
      ];
    };
    resetPods();
    const live = () => pods.filter(p => p.st !== 'Terminating');
    const invCount = () => pods.filter(p => p.app === 'inventory' && p.st !== 'Terminating').length;
    const rowHtml = p => `${pad(p.n, 30)}${pad(p.ready, 8)}<span class="${status(p.st)}">${pad(p.st, 19)}</span>${p.age}`;
    const refresh = p => p.rows.forEach(r => { r.innerHTML = rowHtml(p); });
    const progress = p => {
      const steps = {Pending: ['ContainerCreating', 900], ContainerCreating: ['Running', 1500]};
      const s = steps[p.st]; if (!s) return;
      setTimeout(() => {
        if (p.st === 'Terminating') return;
        p.st = s[0]; if (p.st === 'Running') { p.ready = '1/1'; p.age = '4s'; }
        refresh(p); progress(p);
      }, skip ? 80 : s[1]);
    };
    const addPod = () => { const p = {n: baseName + gen(), app: 'inventory', ready: '0/1', st: 'Pending', age: '0s', rows: []}; pods.push(p); progress(p); return p; };
    const killPod = p => { p.st = 'Terminating'; refresh(p); setTimeout(() => { pods = pods.filter(x => x !== p); }, 900); };

    // ----- commands
    const table = (head, rows) => { line(`<span class="t-hd">${head}</span>`); rows.forEach(r => line(r)); };
    const help = () => {
      ['Commands you can try:', '  kubectl get nodes | pods | deployments | hpa', '  kubectl scale deploy/inventory --replicas=5', '  kubectl delete pod <pod-name>',
        '  argocd app list', '  whoami   ls   open projects   clear   help'].forEach((t, i) => line(i ? `<span class="t-info">${esc(t)}</span>` : esc(t)));
    };
    const pages = ['about', 'experience', 'projects', 'cloudlab', 'skills', 'certifications', 'blog', 'contact'];
    const runCore = async raw => {
      const cmd = raw.trim().replace(/\s+/g, ' ');
      if (!cmd) return;
      const a = cmd.split(' ');
      if (cmd === 'clear') { body.innerHTML = ''; return; }
      if (cmd === 'help') return help();
      if (cmd === 'whoami') { line('Bawantha Rathnayake'); line('Cloud &amp; DevOps Engineer · AWS Certified · Colombo, Sri Lanka'); line('<span class="t-ok">Open to Cloud / DevOps roles</span>'); return; }
      if (cmd === 'ls') { line('about  experience  projects  cloudlab  skills  certifications  articles  contact'); return; }
      if (a[0] === 'open') { const t = (a[1] || '').replace('articles', 'blog').replace('lab', 'cloudlab').replace('cloudcloudlab', 'cloudlab'); if (pages.includes(t)) { line(`<span class="t-dim">opening ${esc(a[1])}…</span>`); setTimeout(() => { location.hash = '#' + t; }, 350); } else line(`<span class="t-err">open: no such page: ${esc(a[1] || '')}</span>`); return; }
      if (a[0] === 'argocd' && a[1] === 'app' && a[2] === 'list') {
        table(pad('NAME', 34) + pad('NAMESPACE', 12) + pad('STATUS', 9) + 'HEALTH', [['stocklane-platform-dev', 'kube-system'], ['stocklane-monitoring-operator-dev', 'monitoring'], ['stocklane-monitoring-dev', 'monitoring'], ['stocklane-workshop-dev', 'stocklane'], ['stocklane-dev', 'argocd']]
          .map(r => `${pad(r[0], 34)}${pad(r[1], 12)}<span class="t-ok">${pad('Synced', 9)}Healthy</span>`)); return;
      }
      if (a[0] !== 'kubectl') { line(`<span class="t-err">zsh: command not found: ${esc(a[0])}</span> <span class="t-dim">(type help)</span>`); return; }
      const verb = a[1], what = a[2] || '';
      if (verb === 'get') {
        if (/^nodes?$/.test(what)) { table(pad('NAME', 20) + pad('STATUS', 8) + pad('ROLES', 8) + pad('AGE', 5) + 'VERSION', [['ip-10-42-10-21', 'Ready'], ['ip-10-42-11-47', 'Ready']].map(r => `${pad(r[0], 20)}<span class="t-ok">${pad(r[1], 8)}</span>${pad('<none>', 8).replace('<','&lt;').replace('>','&gt;')}${pad('2d', 5)}v1.31`)); return; }
        if (/^pods?$/.test(what)) {
          line(`<span class="t-hd">${pad('NAME', 30)}${pad('READY', 8)}${pad('STATUS', 19)}AGE</span>`);
          pods.forEach(p => { const r = line(rowHtml(p)); p.rows.push(r); });
          return;
        }
        if (/^(deploy|deployments?)$/.test(what)) {
          const n = invCount(), up = live().filter(p => p.app === 'inventory' && p.st === 'Running').length;
          table(pad('NAME', 12) + pad('READY', 8) + pad('UP-TO-DATE', 12) + pad('AVAILABLE', 11) + 'AGE', [[`inventory`, `${up}/${n}`, n, up], ['workshop', '1/1', 1, 1], ['vision', '1/1', 1, 1], ['forecast', '1/1', 1, 1]].map(r => `${pad(r[0], 12)}${pad(r[1], 8)}${pad(r[2], 12)}${pad(r[3], 11)}2d`)); return;
        }
        if (what === 'hpa') { const n = invCount(); table(pad('NAME', 12) + pad('REFERENCE', 24) + pad('TARGETS', 11) + pad('MIN', 5) + pad('MAX', 5) + 'REPLICAS', [`${pad('inventory', 12)}${pad('Deployment/inventory', 24)}${pad(n > 1 ? '34%/70%' : '66%/70%', 11)}${pad('1', 5)}${pad('5', 5)}${n}`]); return; }
        line(`<span class="t-err">error: the server doesn't have a resource type "${esc(what)}"</span>`); return;
      }
      if (verb === 'scale') {
        const m = cmd.match(/--replicas[= ](\d+)/); const target = m ? +m[1] : NaN;
        if (!/inventory/.test(cmd)) { line('<span class="t-err">error: try: kubectl scale deploy/inventory --replicas=5</span>'); return; }
        if (!(target >= 1 && target <= 8)) { line('<span class="t-err">error: choose between 1 and 8 replicas</span>'); return; }
        line('deployment.apps/inventory scaled');
        let n = invCount();
        while (n < target) { addPod(); n++; }
        while (n > target) { const victim = [...pods].reverse().find(p => p.app === 'inventory' && p.st !== 'Terminating'); killPod(victim); n--; }
        return;
      }
      if (verb === 'delete' && /^pods?$/.test(what)) {
        const p = pods.find(x => x.n === a[3] && x.st !== 'Terminating');
        if (!p) { line(`<span class="t-err">Error from server (NotFound): pods "${esc(a[3] || '')}" not found</span>`); return; }
        line(`pod "${esc(p.n)}" deleted`); killPod(p); if (p.app === 'inventory') setTimeout(addPod, 500); return;
      }
      line(`<span class="t-err">error: unknown command "${esc(a.slice(1).join(' '))}" for "kubectl"</span> <span class="t-dim">(type help)</span>`);
    };

    const run = async raw => { await runCore(raw); const c = raw.trim(); if (c && c !== 'clear') line('&nbsp;'); };

    // ----- prompt + typing
    let inputEl = null;
    const newPrompt = () => {
      const d = line(P('') ); const span = d.querySelector('.t-cmd');
      inputEl = document.createElement('input'); inputEl.className = 'term-input'; inputEl.type = 'text';
      inputEl.setAttribute('aria-label', 'Terminal command'); inputEl.autocomplete = 'off'; inputEl.spellcheck = false; inputEl.autocapitalize = 'off';
      span.appendChild(inputEl);
      inputEl.addEventListener('keydown', async e => {
        if (e.key === 'Enter') {
          e.preventDefault(); const v = inputEl.value; inputEl.disabled = true; span.textContent = v;
          if (v.trim()) { history.push(v); hIdx = history.length; }
          await run(v); newPrompt();
        } else if (e.key === 'ArrowUp') { e.preventDefault(); if (hIdx > 0) inputEl.value = history[--hIdx]; }
        else if (e.key === 'ArrowDown') { e.preventDefault(); inputEl.value = hIdx < history.length - 1 ? history[++hIdx] : (hIdx = history.length, ''); }
        else if (e.key === 'Tab') { e.preventDefault(); const opts = ['kubectl get nodes', 'kubectl get pods', 'kubectl get deployments', 'kubectl get hpa', 'kubectl scale deploy/inventory --replicas=5', 'argocd app list', 'whoami', 'help', 'clear', 'open projects']; const m = opts.find(o => o.startsWith(inputEl.value) && o !== inputEl.value); if (m) inputEl.value = m; }
        else if (e.ctrlKey && e.key.toLowerCase() === 'l') { e.preventDefault(); body.innerHTML = ''; newPrompt(); }
      });
      inputEl.addEventListener('focus', () => { skip = true; engaged = true; });
      if (engaged && !busy) inputEl.focus({preventScroll: true});
      scroll();
    };
    const typeCmd = async text => {
      const d = line(P('')); const span = d.querySelector('.t-cmd');
      if (skip || reduce.matches) { span.textContent = text; } else {
        const caret = document.createElement('span'); caret.className = 'term-caret'; d.appendChild(caret);
        for (const ch of text) { if (skip) { span.textContent = text; break; } span.textContent += ch; await sleepRaw(18 + Math.random() * 22); }
        caret.remove();
      }
      span.textContent = text;
    };
    const demo = async () => {
      busy = true; skip = false; resetPods(); body.innerHTML = '';
      const steps = ['kubectl get nodes', 'kubectl scale deploy/inventory --replicas=5', 'kubectl get pods'];
      for (const c of steps) { await sleep(420); await typeCmd(c); await run(c); }
      await sleep(250); busy = false; newPrompt();
    };
    // visitor input stops the demo and leaves the prompt ready
    body.addEventListener('pointerdown', () => { skip = true; engaged = true; });
    body.addEventListener('click', () => { const sel = window.getSelection(); if (inputEl && !inputEl.disabled && (!sel || sel.isCollapsed)) inputEl.focus({preventScroll: true}); });
    hero.querySelector('.term-replay').addEventListener('click', () => { skip = true; setTimeout(demo, 60); });
    [['Nodes', 'kubectl get nodes'], ['Pods', 'kubectl get pods'], ['Scale to 5', 'kubectl scale deploy/inventory --replicas=5'], ['Argo CD apps', 'argocd app list'], ['Who am I', 'whoami'], ['Help', 'help']].forEach(([label, c]) => {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = label; b.title = c; chips.appendChild(b);
      b.addEventListener('click', async () => { if (busy) return; skip = true; engaged = true; if (inputEl) { inputEl.disabled = true; inputEl.closest('.term-line').remove(); } await typeCmd(c); await run(c); newPrompt(); });
    });
    const start = () => demo();
    if ('IntersectionObserver' in window) { const io = new IntersectionObserver(es => { if (es.some(x => x.isIntersecting)) { io.disconnect(); start(); } }); io.observe(hero); } else start();
  }

  /* ------------------------------------------------------------ static terminals on Projects / Cloud Lab / Skills */
  const rowsT = (head, rows) => ['<span class="t-hd">' + head + '</span>', ...rows];
  const DATA = {
    projects: [
      '<span class="t-dim"># Six industry-level projects, from AWS EKS GitOps platforms to MLOps and LLMOps workflows.</span>',
      P('kubectl get deployments -n projects'),
      ...rowsT(pad('NAME', 20) + pad('READY', 7) + pad('YEAR', 6) + 'STACK', [
        ['stocklane', '2026', 'EKS · Terraform · Argo CD · SageMaker · Bedrock · Textract'],
        ['issue-tracker-eks', '2026', 'EKS · Terraform · GitHub Actions · Argo CD · Prometheus · Grafana · Helm'],
        ['issue-tracker-ec2', '2026', 'Jenkins · Docker · EC2 · Nginx · WAF · RDS'],
        ['institute-system', '2025', 'React · Jenkins · Nginx · Cloudflare · LLMs and RAG'],
        ['book-stall', '2025', 'Spring Boot · JWT · API Gateway · Docker Compose'],
        ['fingerprint-iot', '2024', 'React · MERN · Material UI']].map(r => `${pad(r[0], 20)}<span class="t-ok">${pad('1/1', 7)}</span>${pad(r[1], 6)}${r[2]}`)),
      '',
      P('kubectl describe deployment stocklane'),
      `${pad('Name:', 14)}stocklane`,
      `${pad('Pipeline:', 14)}test → plan → apply → release → platform → frontend (11 min 22 sec run)`,
      `${pad('Environments:', 14)}dev, staging and prod from one pipeline`,
      `${pad('GitOps:', 14)}Argo CD keeps EKS in sync with Git`,
      `${pad('MLOps:', 14)}pretrained Chronos-Bolt forecast, weekly SageMaker job for the photo matcher`,
      `${pad('LLMOps:', 14)}Textract and Bedrock suggest label details, a person approves`
    ],
    cloudlab: [
      '<span class="t-dim"># Evidence: five Stocklane Argo CD apps are Synced and Healthy; the issue tracker scaled from 1 to 5 replicas.</span>',
      P('argocd app list'),
      ...rowsT(pad('NAME', 36) + pad('NAMESPACE', 12) + pad('STATUS', 9) + 'HEALTH', [['stocklane-dev', 'argocd'], ['stocklane-monitoring-dev', 'monitoring'], ['stocklane-monitoring-operator-dev', 'monitoring'], ['stocklane-platform-dev', 'kube-system'], ['stocklane-workshop-dev', 'stocklane']]
        .map(r => `${pad(r[0], 36)}${pad(r[1], 12)}<span class="t-ok">${pad('Synced', 9)}Healthy</span>`)),
      '',
      P('kubectl describe hpa'),
      `${pad('Min replicas:', 16)}1`, `${pad('Max replicas:', 16)}5`, 'Events:',
      `  <span class="t-ok">SuccessfulRescale</span>  New size: 5; reason: cpu resource utilization above target`
    ],
    skills: [
      '<span class="t-dim"># The tools I use across cloud, delivery, observability, security and AI.</span>',
      P('kubectl get configmap skills -o yaml'),
      'data:',
      ...[['cloud', 'AWS, Terraform, CloudFormation, VPC, EKS, ECR, ALB, CloudFront'], ['containers', 'Docker, Kubernetes, VMware Tanzu, Helm, Kustomize'], ['delivery', 'Jenkins, GitHub Actions, Argo CD, AWS CodeBuild, Trivy'],
        ['mlops-llmops', 'SageMaker, Bedrock, Textract, Chronos-Bolt, MobileNetV2'], ['observability', 'Prometheus, Grafana, CloudWatch, Alertmanager'], ['security', 'IAM, Cognito MFA, KMS, Secrets Manager, Pod Identity'], ['languages', 'Java, Python, Bash, JavaScript, TypeScript']]
        .map(r => `  <span class="t-info">${pad(r[0] + ':', 15)}</span><span class="t-ok">"${r[1]}"</span>`)
    ]
  };
  document.querySelectorAll('.page-term[data-term]').forEach(el => {
    const lines = DATA[el.dataset.term]; if (!lines) return;
    el.innerHTML = bar('bawantha@macbook — kubectl') + '<div class="term-body" role="region" aria-label="Terminal output"></div>';
    const b = el.querySelector('.term-body');
    const paint = async () => {
      for (const l of lines) { const d = document.createElement('div'); d.className = 'term-line'; d.innerHTML = l || '&nbsp;'; b.appendChild(d); if (!reduce.matches) await sleepRaw(38); }
    };
    if ('IntersectionObserver' in window && !reduce.matches) { const io = new IntersectionObserver(es => { if (es.some(x => x.isIntersecting)) { io.disconnect(); paint(); } }); io.observe(el); }
    else lines.forEach(l => { const d = document.createElement('div'); d.className = 'term-line'; d.innerHTML = l || '&nbsp;'; b.appendChild(d); });
  });
})();
