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
  const P = (cmd) => `<span class="t-p">bawantha@macbook</span> <span class="t-path">~/portfolio</span> % <span class="t-cmd">${esc(cmd)}</span>`;
  const bar = title => `<div class="term-bar"><i class="r"></i><i class="y"></i><i class="g"></i><span class="term-title">${esc(title)}</span></div>`;
  const pad = (s, n) => String(s).padEnd(n, ' ');
  const status = s => ({Running: 't-ok', Completed: 't-ok', Ready: 't-ok', ContainerCreating: 't-warn', Pending: 't-warn', Terminating: 't-dim', Synced: 't-ok', Healthy: 't-ok'}[s] || '');

  /* ------------------------------------------------------------ hero terminal: types itself, then loops one line */
  const hero = document.getElementById('hero-term');
  if (hero) {
    hero.innerHTML = bar('bawantha@macbook — zsh') + '<div class="term-body" role="log" aria-label="Terminal output"></div>';
    const body = hero.querySelector('.term-body');
    const photoNode = document.querySelector('.hero-photo-content');
    const line = html => { const d = document.createElement('div'); d.className = 'term-line'; d.innerHTML = html; body.appendChild(d); body.scrollTop = body.scrollHeight; return d; };
    const typeCmd = async text => {
      const d = line(P('')); const span = d.querySelector('.t-cmd');
      if (reduce.matches) { span.textContent = text; return d; }
      const caret = document.createElement('span'); caret.className = 'term-caret'; d.appendChild(caret);
      for (const ch of text) { span.textContent += ch; await sleepRaw(16 + Math.random() * 18); }
      await sleepRaw(180); caret.remove(); return d;
    };
    const pods = [['certified-kubernetes-administrator', '0/1', 'ContainerCreating', '#certifications'], ['claude-certified-architect-foundations', '1/1', 'Running', '#certifications'],
      ['aws-solutions-architect-associate', '1/1', 'Completed', '#certifications'], ['stocklane-eks-gitops-mlops-llmops', '1/1', 'Completed', '#projects'],
      ['issue-tracker-eks-gitops', '1/1', 'Completed', '#projects'], ['issue-tracker-jenkins-cicd', '1/1', 'Completed', '#projects']];
    const log = [['a3f9c21', '<span class="t-info">(HEAD -&gt; main, tag: open-to-work)</span> Built Stocklane on AWS EKS'], ['7d21b8e', 'Completed the DevOps internship at Mitra AI'],
      ['c40e5a9', 'Passed AWS Certified Solutions Architect Associate'], ['91b6f3d', 'Built the Issue Tracker platform on EKS with Argo CD'], ['5be02c1', 'Joined Mitra AI as a DevOps intern'], ['e2c7a04', 'Joined PickMe as an SDET intern']];
    const who = [['Degree:', 'BSc Eng (Hons), Computer Engineering'], ['Uni:', 'Faculty of Engineering, University of Ruhuna'], ['Focus:', 'AWS · Kubernetes · CI/CD · IaC'], ['Location:', 'Colombo, Sri Lanka'], ['Status:', 'open to Cloud / DevOps roles']];
    const PHRASE = 'open to Cloud and DevOps Engineer roles';
    let loopTimer = 0;
    const loop = d => {
      const span = d.querySelector('.t-cmd');
      if (reduce.matches) { span.textContent = PHRASE; return; }
      const caret = document.createElement('span'); caret.className = 'term-caret'; d.appendChild(caret);
      let i = 0;
      const step = () => {
        if (document.hidden || !hero.isConnected) { loopTimer = setTimeout(step, 600); return; }
        if (i < PHRASE.length) { i++; span.textContent = PHRASE.slice(0, i); loopTimer = setTimeout(step, 48 + Math.random() * 30); }
        else { loopTimer = setTimeout(() => { i = 0; span.textContent = ''; loopTimer = setTimeout(step, 450); }, 2600); }
        body.scrollTop = body.scrollHeight;
      };
      step();
    };
    const gap = () => { const d = document.createElement('div'); d.className = 'term-gap'; body.appendChild(d); };
    const cmd = text => { const d = line(P('')); d.querySelector('.t-cmd').textContent = text; return d; };
    const demo = () => {
      cmd('whoami');
      const w = line(''); w.classList.add('term-whoami');
      w.innerHTML = '<div class="term-photo"></div><div class="term-who">' + who.map(r => `<span class="who-k">${r[0]}</span><span class="who-v${r[0] === 'Status:' ? ' t-ok' : ''}">${r[1]}</span>`).join('') + '</div>';
      if (photoNode) w.querySelector('.term-photo').appendChild(photoNode);
      gap();
      cmd('kubectl get pods -n about');
      line(`<span class="t-hd">${pad('NAME', 42)}${pad('READY', 7)}STATUS</span>`);
      for (const r of pods) line(`<a class="term-link" href="${r[3]}">${pad(r[0], 42)}${pad(r[1], 7)}<span class="${status(r[2])}">${r[2]}</span></a>`);
      line('&nbsp;');
      cmd('git log --oneline');
      for (const r of log) line(`<span class="t-warn">${r[0]}</span> ${r[1]}`);
      gap();
      loop(line(P('')));
    };
    demo();
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
      '<span class="t-dim"># Five Stocklane Argo CD apps are Synced and Healthy. The issue tracker scaled from 1 to 5 replicas.</span>',
      P('argocd app list'),
      ...rowsT(pad('NAME', 36) + pad('NAMESPACE', 12) + pad('STATUS', 9) + 'HEALTH', [['stocklane-dev', 'argocd'], ['stocklane-monitoring-dev', 'monitoring'], ['stocklane-monitoring-operator-dev', 'monitoring'], ['stocklane-platform-dev', 'kube-system'], ['stocklane-workshop-dev', 'stocklane']]
        .map(r => `${pad(r[0], 36)}${pad(r[1], 12)}<span class="t-ok">${pad('Synced', 9)}Healthy</span>`)),
      '',
      P('kubectl describe hpa -n issue-app'),
      `${pad('Min replicas:', 16)}1`, `${pad('Max replicas:', 16)}5`, 'Events:',
      `  <span class="t-ok">SuccessfulRescale</span>  New size: 5; reason: cpu resource utilization above target`
    ],
    skills: [
      '<span class="t-dim"># Click any skill below to see where I used it.</span>',
      P('kubectl get configmap skills -n about -o yaml'),
      'data:',
      ...[['cloud', 'AWS, Terraform, CloudFormation, VPC, EKS, ECR, ALB, CloudFront'], ['containers', 'Docker, Kubernetes, VMware Tanzu, Helm, Kustomize'], ['delivery', 'Jenkins, GitHub Actions, Argo CD, AWS CodeBuild, Trivy'],
        ['mlops-llmops', 'SageMaker, Bedrock, Textract, Chronos-Bolt, MobileNetV2'], ['observability', 'Prometheus, Grafana, CloudWatch, Alertmanager'], ['security', 'IAM, Cognito MFA, KMS, Secrets Manager, Pod Identity'], ['languages', 'Java, Python, Bash, JavaScript, TypeScript']]
        .map(r => `  <span class="t-info">${pad(r[0] + ':', 15)}</span><span class="t-ok">"${r[1]}"</span>`)
    ]
  };

  /* type a line's text character by character, keeping its markup */
  const typeLine = async (d, html, fast) => {
    d.innerHTML = html || '&nbsp;';
    const w = document.createTreeWalker(d, NodeFilter.SHOW_TEXT), nodes = [];
    while (w.nextNode()) nodes.push([w.currentNode, w.currentNode.nodeValue]);
    nodes.forEach(n => { n[0].nodeValue = ''; });
    const isCmd = !!d.querySelector('.t-cmd'), step = isCmd ? 1 : 4, ms = isCmd ? 22 : 7;
    for (const [n, full] of nodes) { for (let i = step; i < full.length + step; i += step) { n.nodeValue = full.slice(0, i); await sleepRaw(ms); } n.nodeValue = full; }
  };
  /* reserve the final height first so typing never pushes the page */
  const reserve = (body, lines) => {
    body.innerHTML = lines.map(l => `<div class="term-line">${l || '&nbsp;'}</div>`).join('');
    body.style.minHeight = body.scrollHeight + 'px'; body.innerHTML = '';
  };
  document.querySelectorAll('.page-term[data-term]').forEach(el => {
    const lines = DATA[el.dataset.term]; if (!lines) return;
    el.innerHTML = bar('bawantha@macbook — kubectl') + '<div class="term-body" role="region" aria-label="Terminal output"></div>';
    const b = el.querySelector('.term-body');
    const paint = async () => {
      for (const l of lines) { const d = document.createElement('div'); d.className = 'term-line'; b.appendChild(d); d.innerHTML = l || '&nbsp;'; }
    };

    if ('IntersectionObserver' in window && !reduce.matches) { const io = new IntersectionObserver(es => { if (es.some(x => x.isIntersecting)) { io.disconnect(); paint(); } }); io.observe(el); }
    else lines.forEach(l => { const d = document.createElement('div'); d.className = 'term-line'; d.innerHTML = l || '&nbsp;'; b.appendChild(d); });
  });
})();
