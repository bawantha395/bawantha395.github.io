/* Page terminals, skill clicks, interactive AWS diagram, Dock, context chip and build badge.
   Everything is decorative or navigational. No data leaves the page. */
(() => {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  const pad = (s, n) => String(s).padEnd(n, ' ');
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const P = cmd => `<span class="t-p">bawantha@macbook</span> <span class="t-path">~/portfolio</span> % <span class="t-cmd">${esc(cmd)}</span>`;
  const bar = t => `<div class="term-bar"><i class="r"></i><i class="y"></i><i class="g"></i><span class="term-title">${esc(t)}</span></div>`;
  const slug = t => t.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const go = hash => { location.hash = hash; };

  /* ------------------------------------------------------------ clickable rows */
  const row = (html, attrs = '') => `<a class="term-link" role="link" tabindex="0" ${attrs}>${html}</a>`;
  document.addEventListener('click', e => {
    const a = e.target.closest('.term-link[data-href],.term-link[data-copy],.term-link[data-scroll],.term-link[data-hash]');
    if (!a) return;
    e.preventDefault();
    if (a.dataset.href) window.open(a.dataset.href, '_blank', 'noopener');
    else if (a.dataset.hash) go(a.dataset.hash);
    else if (a.dataset.scroll) { const t = $(a.dataset.scroll); if (t) t.scrollIntoView({behavior: reduce.matches ? 'auto' : 'smooth', block: 'center'}); }
    else if (a.dataset.copy) {
      const done = () => { a.classList.add('copied'); setTimeout(() => a.classList.remove('copied'), 1600); };
      if (navigator.clipboard) navigator.clipboard.writeText(a.dataset.copy).then(done, done); else done();
    }
  });
  document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('term-link')) { e.preventDefault(); e.target.click(); } });

  /* ------------------------------------------------------------ static page terminals */
  const mount = (el, title, build, chipsSpec) => {
    el.innerHTML = bar(title) + '<div class="term-body" role="region" aria-label="Terminal output"></div>' + (chipsSpec ? '<div class="term-chips" aria-label="Filter"></div>' : '');
    const body = $('.term-body', el), chips = $('.term-chips', el);
    let first = true, token = 0;
    const paint = async arg => {
      const my = ++token; body.innerHTML = '';
      const lines = build(arg);
      for (const l of lines) {
        if (my !== token) return;
        const d = document.createElement('div'); d.className = 'term-line'; d.innerHTML = l || '&nbsp;'; body.appendChild(d);
        if (first && !reduce.matches) await sleep(34);
      }
      first = false;
    };
    if (chipsSpec) chipsSpec.forEach((label, i) => {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = label; b.setAttribute('aria-pressed', i === 0 ? 'true' : 'false'); chips.appendChild(b);
      b.addEventListener('click', () => { $$('button', chips).forEach(x => x.setAttribute('aria-pressed', String(x === b))); paint(i); });
    });
    const start = () => paint(0);
    if ('IntersectionObserver' in window && !reduce.matches) { const io = new IntersectionObserver(es => { if (es.some(x => x.isIntersecting)) { io.disconnect(); start(); } }); io.observe(el); } else start();
  };

  const T = {
    experience: el => mount(el, 'bawantha@macbook — kubectl', () => [
      P('kubectl rollout history deployment/career'),
      '<span class="t-hd">' + pad('REVISION', 10) + 'CHANGE-CAUSE</span>',
      row(`${pad('1', 10)}PickMe, SDET intern (July 2024 to March 2025), mobile test automation`, 'data-scroll=".experience-previous"'),
      row(`${pad('2', 10)}Mitra AI, DevOps intern (April 2026 to October 2026), Sampath Bank staging deployments`, 'data-scroll=".experience-current"'),
      '',
      P('kubectl describe deployment mitra-ai'),
      'Containers',
      ...[['vmware-tanzu-kubernetes', 'staging deployments, pod and service health checks'], ['linux', 'Python applications and background processes'], ['finacle', 'core banking deployments and checks after release'],
        ['weblogic-and-tomcat', 'artifact deployments and server configuration'], ['wso2-api-manager', 'API definitions, policies and endpoints'], ['iis', 'web applications and application pools']]
        .map(r => row(`  <span class="t-info">${pad(r[0], 26)}</span>${r[1]}`, 'data-scroll=".experience-current"'))
    ]),
    certifications: el => mount(el, 'bawantha@macbook — kubectl', () => {
      const items = [];
      $$('.certification-featured, .certification-card, article[class*="certification"]').forEach(c => {
        const h = $('h3', c), a = $('a[href^="http"]', c), y = ($('.certification-provider', c) || {}).textContent || '';
        if (h) items.push({name: h.textContent.trim(), href: a ? a.href : '', year: (y.match(/\d{4}/) || [''])[0]});
      });
      const seen = new Set(), rows = items.filter(i => !seen.has(i.name) && seen.add(i.name));
      return [
        P('kubectl get certificates -n learning'),
        '<span class="t-hd">' + pad('NAME', 52) + pad('READY', 8) + pad('STATUS', 10) + 'YEAR</span>',
        ...rows.map(r => row(`${pad(slug(r.name), 52)}<span class="t-ok">${pad('True', 8)}${pad('Issued', 10)}</span>${r.year}`, r.href ? `data-href="${esc(r.href)}"` : '')),
        ...[['certified-kubernetes-administrator', 'Preparing'], ['claude-certified-architect-foundations', 'Issuing']].map(r => `${pad(r[0], 52)}<span class="t-warn">${pad('False', 8)}${r[1]}</span>`),
        '<span class="t-dim"># Click a row to open the credential.</span>'
      ];
    }),
    articles: el => {
      const groups = $$('.article-group').map(g => ({title: ($('h2', g) || {}).textContent || 'Articles', rows: $$('.article-row', g).map(a => ({name: ($('.article-name', a) || {}).textContent, date: ($('.article-date', a) || {}).textContent, href: a.href}))}));
      const all = groups.flatMap(g => g.rows.map(r => ({...r, topic: g.title})));
      mount(el, 'bawantha@macbook — kubectl', i => {
        const g = i === 0 ? null : groups[i - 1], list = g ? g.rows : all;
        return [P(g ? `kubectl get jobs -l topic=${slug(g.title)}` : 'kubectl get jobs -n medium'),
          '<span class="t-hd">' + pad('STATUS', 11) + 'NAME</span>',
          ...list.map((r, k) => row(`<span class="t-ok">${pad('Completed', 11)}</span>${esc(r.name)} <span class="t-dim">${esc(r.date)}</span>`, `data-href="${esc(r.href)}"`)),
          `<span class="t-dim"># ${list.length} articles. Click a row to read it on Medium.</span>`];
      }, ['All', ...groups.map(g => g.title)]);
    },
    contact: el => mount(el, 'bawantha@macbook — kubectl', () => [
      P('kubectl get svc bawantha'),
      '<span class="t-hd">' + pad('NAME', 10) + pad('TYPE', 14) + 'EXTERNAL-IP</span>',
      row(`${pad('email', 10)}${pad('LoadBalancer', 14)}<span class="t-ok">rathnayakermbtm@gmail.com</span> <span class="t-dim copied-tip">click to copy</span>`, 'data-copy="rathnayakermbtm@gmail.com"'),
      row(`${pad('phone', 10)}${pad('LoadBalancer', 14)}+94 71 090 1846`, 'data-href="tel:+94710901846"'),
      row(`${pad('linkedin', 10)}${pad('ExternalName', 14)}linkedin.com/in/rathnayake-rmbtm`, 'data-href="https://linkedin.com/in/rathnayake-rmbtm"'),
      row(`${pad('github', 10)}${pad('ExternalName', 14)}github.com/bawantha395`, 'data-href="https://github.com/bawantha395"'),
      row(`${pad('gitlab', 10)}${pad('ExternalName', 14)}gitlab.com/bawantha395`, 'data-href="https://gitlab.com/bawantha395"'),
      row(`${pad('medium', 10)}${pad('ExternalName', 14)}medium.com/@rathnayakermbtm`, 'data-href="https://medium.com/@rathnayakermbtm"')
    ])
  };
  $$('.page-term[data-term]').forEach(el => { const f = T[el.dataset.term]; if (f) f(el); });

  /* ------------------------------------------------------------ Cloud Lab: Grafana style panels, pipeline strip, Argo CD tree */
  const labEl = $('#lab-dash');
  if (labEl) {
    const gauge = '<svg viewBox="0 0 80 80" class="g-ring" aria-hidden="true"><circle cx="40" cy="40" r="32" class="g-bg"/><circle cx="40" cy="40" r="32" class="g-fg" pathLength="100"/></svg>';
    const stepGraph = '<svg viewBox="0 0 160 56" class="g-step" aria-hidden="true"><polyline points="0,50 40,50 40,38 70,38 70,26 100,26 100,14 130,14 130,6 160,6" /></svg>';
    const stages = ['Commit', 'Test', 'Plan', 'Apply', 'Release', 'Platform', 'Frontend', 'Healthy'];
    const stageNote = ['push to GitHub', 'tests and Trivy', 'saved to S3', 'exact saved plan', 'images to ECR', 'Argo CD installed', 'web app published', 'all apps synced'];
    labEl.innerHTML =
      '<div class="gf-row" aria-label="Key numbers">' +
        '<div class="gf-panel"><h4>Deploy run</h4><strong class="gf-big">11 min 22 sec</strong><div class="gf-seg" aria-hidden="true">' + '<i></i>'.repeat(6) + '</div><small>Stocklane, test to frontend</small></div>' +
        '<div class="gf-panel"><h4>Argo CD applications</h4><div class="gf-gauge">' + gauge + '<strong>5 of 5</strong></div><small>Synced and Healthy</small></div>' +
        '<div class="gf-panel"><h4>Automated tests</h4><strong class="gf-big">159</strong><small>Python tests, plus Java tests</small></div>' +
        '<div class="gf-panel"><h4>Autoscaling</h4>' + stepGraph + '<strong class="gf-mid">1 to 5 replicas</strong><small>EKS issue tracker, simulated load</small></div>' +
        '<div class="gf-panel"><h4>Release gates</h4><ul class="gf-list"><li>Forecast error 60% or less</li><li>Photo precision 0.98 or more</li><li>Label fields approved by a person</li></ul></div>' +
        '<div class="gf-panel"><h4>CI run</h4><strong class="gf-big">3 min 41 sec</strong><small>EKS issue tracker, build and push</small></div>' +
      '</div>' +
      '<div class="pipe-card" aria-label="How a change ships"><div class="pipe-title"><strong>How a change ships</strong><span>Recorded Stocklane deploy run</span></div><ol class="pipe">' +
        stages.map((s, i) => `<li><i>✓</i><b>${s}</b><small>${stageNote[i]}</small></li>`).join('') + '</ol></div>' +
      '<div class="argo-wrap"><div class="argo-head"><strong>Argo CD resource trees</strong><span>Both platforms as Argo CD shows them. The panel below walks through each node by itself.</span></div>' +
        '<div class="argo-body"><div class="argo-trees"></div><aside class="argo-detail" aria-live="off"><h4></h4><p class="ad-kind"></p><p class="ad-text"></p><div class="ad-badges"></div><div class="ad-dots"></div></aside></div></div>';

    const TREES = [
      {title: 'Stocklane on EKS', root: {n: 'stocklane-dev', k: 'Application, argocd', t: 'The parent application. It watches the main branch and creates the child applications in order.', kids: [
        {n: 'stocklane-platform-dev', k: 'Application, wave 0', t: 'Installs the controllers and the secret store first, because everything else depends on them.', kids: [{n: 'controllers', k: 'Deployment'}, {n: 'secret-store', k: 'ClusterSecretStore'}]},
        {n: 'stocklane-monitoring-operator-dev', k: 'Application, wave 10', t: 'Installs the Prometheus Operator so monitoring objects can exist.', kids: [{n: 'prometheus-operator', k: 'Deployment'}]},
        {n: 'stocklane-monitoring-dev', k: 'Application, wave 20', t: 'Prometheus, Grafana and Alertmanager watch the cluster.', kids: [{n: 'prometheus', k: 'StatefulSet'}, {n: 'grafana', k: 'Deployment'}, {n: 'alertmanager', k: 'StatefulSet'}]},
        {n: 'stocklane-workshop-dev', k: 'Application, wave 30', t: 'The four services and the model index job. This is the last wave, so everything it needs is already running.', kids: [{n: 'inventory', k: 'Deployment'}, {n: 'workshop', k: 'Deployment'}, {n: 'vision', k: 'Deployment'}, {n: 'forecast', k: 'Deployment'}, {n: 'model-index', k: 'Job, hook'}]}]}},
      {title: 'Issue tracker on EKS', root: {n: 'issue-tracker', k: 'Argo CD applications', t: 'Argo CD watches the Git branch and applies the Kustomize overlays. Helm installs the monitoring stack.', kids: [
        {n: 'application-dev', k: 'Application, dev', t: 'Four services synced from the dev overlay with prune and self-heal turned on.', kids: [{n: 'frontend-service', k: 'Deployment'}, {n: 'api-gateway', k: 'Deployment'}, {n: 'auth-service', k: 'Deployment'}, {n: 'issue-service', k: 'Deployment'}]},
        {n: 'monitoring-stack', k: 'Application, Helm chart', t: 'The kube-prometheus-stack chart with Prometheus, Grafana and Alertmanager.', kids: [{n: 'prometheus', k: 'StatefulSet'}, {n: 'grafana', k: 'Deployment'}]},
        {n: 'monitoring-addons', k: 'Application', t: 'Service monitors for three services and an alert when one is down for two minutes.', kids: [{n: 'service-monitors', k: 'ServiceMonitor'}, {n: 'service-down-alert', k: 'PrometheusRule'}]}]}}
    ];
    const nodes = [];
    const card = (d, depth) => {
      const el = document.createElement('div'); el.className = 'ac'; el.tabIndex = 0; el.setAttribute('role', 'button');
      el.innerHTML = `<span class="ac-i">${depth === 0 ? '<img alt="" src="assets/tool-icons/argocd.svg">' : esc(d.k[0])}</span><span class="ac-t"><b>${esc(d.n)}</b><small>${esc(d.k)}</small></span><span class="ac-s"><em class="b-prog">Syncing</em><em class="b-ok">Healthy</em></span>`;
      nodes.push({el, d, depth}); return el;
    };
    const list = (d, depth) => {
      const li = document.createElement('li'); li.appendChild(card(d, depth));
      if (d.kids && d.kids.length) { const ul = document.createElement('ul'); d.kids.forEach(k => ul.appendChild(list(k, depth + 1))); li.appendChild(ul); }
      return li;
    };
    const holder = $('.argo-trees', labEl);
    TREES.forEach(t => { const w = document.createElement('div'); w.className = 'argo-tree-one'; w.innerHTML = `<h4>${esc(t.title)}</h4>`; const ul = document.createElement('ul'); ul.className = 'at'; ul.appendChild(list(t.root, 0)); w.appendChild(ul); holder.appendChild(w); });

    // detail panel + gentle auto walk
    const det = $('.argo-detail', labEl), ads = $('.ad-dots', det);
    const walk = nodes.filter(x => x.d.t); let cur = -1, timer = 0, paused = false;
    walk.forEach((_, i) => { const d = document.createElement('i'); ads.appendChild(d); });
    const show = i => {
      cur = (i + walk.length) % walk.length; const n = walk[cur];
      nodes.forEach(x => x.el.classList.toggle('ac-on', x === n));
      $('h4', det).textContent = n.d.n; $('.ad-kind', det).textContent = n.d.k; $('.ad-text', det).textContent = n.d.t;
      $('.ad-badges', det).innerHTML = '<span class="b-ok2">Synced</span><span class="b-ok2">Healthy</span>';
      $$('i', ads).forEach((d, k) => d.classList.toggle('on', k === cur));
    };
    const play = () => { clearInterval(timer); if (reduce.matches) return; timer = setInterval(() => { if (!paused && !document.hidden) show(cur + 1); }, 4200); };
    nodes.forEach(x => { x.el.addEventListener('click', () => { const i = walk.indexOf(x); if (i > -1) { show(i); play(); } }); x.el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); x.el.click(); } }); });
    labEl.addEventListener('pointerenter', () => { paused = true; }); labEl.addEventListener('pointerleave', () => { paused = false; });
    labEl.addEventListener('focusin', () => { paused = true; }); labEl.addEventListener('focusout', () => { paused = false; });
    show(0);

    // reveal: panels, pipeline, then every tree node in sync order
    const reveal = async () => {
      labEl.classList.add('lab-ready');
      if (reduce.matches) { labEl.classList.add('lab-done'); nodes.forEach(x => x.el.classList.add('ac-show', 'ac-ok')); $$('.pipe li', labEl).forEach(li => li.classList.add('p-ok')); return; }
      for (const li of $$('.pipe li', labEl)) { li.classList.add('p-ok'); await sleep(230); }
      labEl.classList.add('lab-done');
      for (const x of nodes) { x.el.classList.add('ac-show'); await sleep(90); setTimeout(() => x.el.classList.add('ac-ok'), 650); }
      play();
    };
    if ('IntersectionObserver' in window) { const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); reveal(); } }, {threshold: .1}); io.observe(labEl); } else reveal();
  }

  /* ------------------------------------------------------------ skills: click a skill, see where it was used */
  const NAMES = {stocklane: 'stocklane', eks: 'issue-tracker-eks', issue: 'issue-tracker-ec2', tcms: 'institute-system', book: 'book-stall', attendance: 'fingerprint-iot', mitra: 'mitra-ai-internship', pickme: 'pickme-internship'};
  const projects = $$('[id$="-project"]').map(a => ({key: a.id.replace('-project', '').replace('issue-tracker', 'issue').replace('book-fair', 'book'), tags: $$('.tags li span', a).map(x => x.textContent.trim().toLowerCase())}));
  const MITRA = ['vmware tanzu', 'kubernetes', 'linux', 'python', 'oracle weblogic', 'apache tomcat', 'wso2 api manager', 'iis', 'finacle'];
  const PICKME = ['java', 'testng', 'maven', 'selenium', 'appium', 'lambdatest', 'gauge', 'gitlab', 'jira'];
  const ALIAS = {aws: ['aws', 'eks', 'ec2', 's3', 'rds', 'ecr', 'cloudfront', 'vpc', 'cognito', 'sqs', 'sagemaker', 'bedrock', 'textract', 'lambda', 'alb'], kubernetes: ['kubernetes', 'aws eks', 'eks'], 'aws eks': ['aws eks', 'eks'], eks: ['aws eks', 'eks'],
    docker: ['docker'], 'amazon sagemaker': ['sagemaker'], 'amazon bedrock': ['bedrock'], 'amazon textract': ['textract'], 'iam policies': ['iam'], 'cognito mfa': ['cognito'], 'llms and rag': ['llms and rag', 'rag'], 'amazon cloudwatch': ['cloudwatch']};
  const NOTES = {
    terraform: {stocklane: 'ten modules, a plan saved to S3 and applied exactly', eks: 'five modules, remote state in S3 with DynamoDB locking'},
    helm: {eks: 'installs the monitoring stack, the AWS Load Balancer Controller and External Secrets'},
    'argo cd': {stocklane: 'syncs EKS from Git in ordered waves', eks: 'syncs and self-heals dev and prod'},
    'github actions': {stocklane: 'test, plan, apply, release and frontend jobs plus nightly and weekly jobs', eks: 'plans and applies Terraform, builds four images and commits the new tags'},
    jenkins: {issue: 'parallel builds, Docker images, S3 upload and a rolling deploy to EC2', tcms: 'builds, tests and deploys every GitLab push to EC2'},
    prometheus: {stocklane: 'cluster dashboards and root-cause alerts', eks: 'service monitors and a two-minute service-down alert'},
    grafana: {stocklane: 'cluster monitoring dashboards', eks: 'workload and cluster dashboards'},
    kubernetes: {mitra: 'pod and service health on VMware Tanzu', eks: 'four services on EKS with autoscaling from 1 to 5 replicas'},
    sagemaker: {stocklane: 'a weekly processing job trains the photo matcher'}, bedrock: {stocklane: 'suggests label fields through tool use'}, textract: {stocklane: 'reads label text first'},
    python: {stocklane: 'forecast job, bootstrap scripts and tests', mitra: 'deployed Python applications on Linux servers'}, trivy: {stocklane: 'scans code and images for vulnerabilities and secrets'},
    kustomize: {stocklane: 'environment overlays for every service', eks: 'overlays for dev, staging and prod'}
  };
  const matches = skill => {
    const k = skill.toLowerCase(), alias = ALIAS[k] || [k], out = [];
    projects.forEach(p => { if (p.tags.some(t => alias.some(a => t === a || t.includes(a)))) out.push(p.key); });
    if (alias.some(a => MITRA.includes(a) || MITRA.includes(k))) out.push('mitra');
    if (alias.some(a => PICKME.includes(a) || PICKME.includes(k))) out.push('pickme');
    Object.keys((NOTES[k] || {})).forEach(x => { if (!out.includes(x)) out.push(x); });
    return [...new Set(out)];
  };
  const pop = document.createElement('div'); pop.className = 'skill-pop'; pop.hidden = true; pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', 'Where I used this skill');
  document.body.appendChild(pop);
  const closePop = () => { pop.hidden = true; };
  const showSkill = name => {
    const list = matches(name), notes = NOTES[name.toLowerCase()] || {};
    const rows = list.length ? list.map(k => `<div class="term-line"><span class="t-info">${pad(NAMES[k], 24)}</span><span class="t-ok">${pad(k === 'mitra' || k === 'pickme' ? 'Completed' : 'Completed', 11)}</span>${esc(notes[k] || 'used in this project')}</div>`).join('')
      : '<div class="term-line t-dim">No project tags yet. See Experience and Projects for the full picture.</div>';
    pop.innerHTML = bar('bawantha@macbook — kubectl') + '<button class="skill-pop-x" type="button" aria-label="Close">×</button><div class="term-body">' +
      `<div class="term-line">${P('kubectl get pods -l uses=' + slug(name))}</div>` + (list.length ? `<div class="term-line t-hd">${pad('NAME', 24)}${pad('STATUS', 11)}WHAT I DID</div>` : '') + rows + '</div>';
    pop.hidden = false;
    $('.skill-pop-x', pop).addEventListener('click', closePop);
  };
  $$('.skill-tags li').forEach(li => { li.setAttribute('role', 'button'); li.tabIndex = 0; li.title = 'Click to see where I used it'; });
  document.addEventListener('click', e => { const li = e.target.closest('.skill-tags li'); if (li) { showSkill($('span', li).textContent.trim()); return; } if (!pop.hidden && !e.target.closest('.skill-pop')) closePop(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closePop(); const li = e.target.closest && e.target.closest('.skill-tags li'); if (li && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); showSkill($('span', li).textContent.trim()); } });
  window.addEventListener('hashchange', closePop);

  /* ------------------------------------------------------------ interactive AWS diagram */
  // [x, y] in the 2640 x 1790 picture, title, plain description
  const SPOTS = [
    [340, 190, 'CloudFront', 'Serves the web app over HTTPS from a private S3 bucket. The bucket is not public.'], [520, 190, 'S3 web bucket', 'Holds the built React app. Only CloudFront can read it.'],
    [700, 190, 'ACM (us-east-1)', 'Certificate for CloudFront. CloudFront only accepts certificates from us-east-1.'], [890, 190, 'Route 53', 'DNS for the site and the API. The hosted zone is kept after Destroy.'],
    [1210, 190, 'ACM (Sydney)', 'Certificates for the API and admin hostnames on the load balancer.'], [1400, 190, 'Cognito', 'Sign-in with MFA. Users are created by an admin.'],
    [330, 470, 'Internet gateway', 'The only door between the VPC and the internet.'], [480, 470, 'Application Load Balancer', 'Internet-facing, HTTPS only. Sends requests to the pods.'],
    [700, 470, 'NAT gateway', 'Lets private pods call out to AWS services. Nothing can call in.'], [880, 470, 'Elastic IP', 'The fixed public address of the NAT gateway.'],
    [1090, 470, 'Public route table', 'Sends internet traffic from the public subnets to the internet gateway.'], [1300, 470, 'Load balancer, second zone', 'The same load balancer spread over a second availability zone.'],
    [480, 710, 'EKS control plane', 'Managed Kubernetes. The API is limited to the operator IP.'], [640, 710, 'Managed node group', 'Two to six EC2 workers that run the pods.'],
    [960, 710, 'EBS volumes', 'Disk for Prometheus data, added by the EBS CSI driver.'], [1130, 710, 'Cluster logs', 'Control plane logs sent to CloudWatch.'],
    [670, 870, 'App pods', 'Inventory, workshop, vision and forecast. Each has its own IAM role.'], [1000, 945, 'Platform add-ons', 'Argo CD, load balancer controller, External Secrets, Fluent Bit and the monitoring stack.'],
    [480, 1050, 'RDS PostgreSQL', 'The stock ledger. Encrypted, with backups, reachable only from the cluster.'], [700, 1050, 'ElastiCache Redis', 'Cache and the daily AI limit. TLS and a password.'],
    [960, 1050, 'CodeBuild', 'Runs inside the VPC to install Argo CD, so the cluster API stays closed.'], [1190, 1050, 'S3 gateway endpoint', 'A private path to S3, so file traffic skips the NAT gateway.'],
    [1410, 1050, 'Private route table', 'Sends outbound traffic to the NAT gateway and S3 traffic to the endpoint.'],
    [1790, 440, 'S3 media bucket', 'Photos of parts and labels. Encrypted and private.'], [1910, 440, 'S3 models bucket', 'Model files and the published forecast.'],
    [1760, 665, 'SQS queues', 'Stock and catalogue events between services, each with a dead-letter queue.'], [1780, 880, 'KMS keys', 'Encrypt the buckets, queues, database and alerts.'],
    [2040, 880, 'Secrets Manager', 'Database credentials and service tokens. Nothing is stored in Git.'], [1770, 1210, 'ECR', 'One private repository per image, with immutable tags.'],
    [1780, 1385, 'Textract', 'Reads the text on a photographed label.'], [1970, 1385, 'SageMaker', 'A weekly job trains the photo matcher. The model registry tracks versions.'],
    [1850, 1560, 'Bedrock (us-east-1)', 'Nova Lite suggests label fields. A person approves every suggestion.'],
    [2220, 425, 'CloudWatch logs', 'Logs from the cluster, the apps, the build and the Lambda.'], [2380, 425, 'CloudWatch alarms', 'Alarms on errors, restarts, the database and the queues.'],
    [2220, 560, 'SNS topic', 'Sends alert emails. Encrypted with its own KMS key.'], [2380, 560, 'EventBridge rule', 'Starts the Lambda when an alarm goes off.'], [2540, 560, 'Lambda alarm_rca', 'Writes a short root-cause summary for each alarm.'],
    [2380, 665, 'AWS Budgets', 'Emails a warning when the monthly cost rises.'], [2540, 665, 'DynamoDB', 'Keeps the history of alarm summaries.'],
    [2220, 850, 'GitHub OIDC', 'GitHub proves who it is to AWS, so no access keys are stored.'], [2380, 850, 'GitHub roles', 'Separate roles for release, training and platform jobs.'], [2540, 850, 'Pod roles', 'One role per service, each limited by a permissions boundary.'],
    [2220, 1340, 'Terraform state', 'The S3 bucket that holds state and saved plans. Kept after Destroy.'], [2380, 1340, 'CloudFormation', 'Creates the CI roles and the permissions boundary once.'], [2540, 1340, 'Hosted zone', 'The Route 53 zone, kept so the DNS never changes.']
  ];
  $$('[data-hotspots]').forEach(stage => {
    const tip = document.createElement('div'); tip.className = 'spot-tip'; tip.hidden = true; stage.appendChild(tip);
    SPOTS.forEach(([x, y, t, d]) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'spot'; b.style.left = (x / 2640 * 100) + '%'; b.style.top = (y / 1790 * 100) + '%';
      b.setAttribute('aria-label', t + '. ' + d);
      const show = () => { tip.innerHTML = `<strong>${esc(t)}</strong><span>${esc(d)}</span>`; tip.hidden = false; const left = x / 2640 * 100; tip.style.left = Math.min(Math.max(left, 14), 86) + '%'; tip.style.top = (y / 1790 * 100) + '%'; tip.classList.toggle('below', y < 300); };
      b.addEventListener('mouseenter', show); b.addEventListener('focus', show); b.addEventListener('click', show);
      b.addEventListener('mouseleave', () => { tip.hidden = true; }); b.addEventListener('blur', () => { tip.hidden = true; });
      stage.appendChild(b);
    });
  });

  /* ------------------------------------------------------------ Dock */
  const DOCK = [
    ['Terminal', '#about', 'term', 'term'], ['Projects', '#projects', 'icon-grid', 'int'], ['Cloud Lab', '#cloudlab', 'icon-monitor', 'int'],
    ['GitHub', 'https://github.com/bawantha395', 'assets/tool-icons/github.svg', 'ext'], ['LinkedIn', 'https://linkedin.com/in/rathnayake-rmbtm', 'assets/tool-icons/linkedin.svg', 'ext'], ['Medium', 'https://medium.com/@rathnayakermbtm', 'assets/tool-icons/medium.svg', 'ext']
  ];
  const dock = document.createElement('nav'); dock.className = 'dock'; dock.setAttribute('aria-label', 'Quick links');
  dock.innerHTML = '<ul>' + DOCK.map(([label, href, icon, kind]) => {
    const glyph = kind === 'ext' ? `<img alt="" src="${icon}" width="26" height="26">` : kind === 'term' ? '<span class="dock-term">&gt;_</span>' : `<svg aria-hidden="true" viewBox="0 0 24 24" class="icon"><use href="#${icon}"></use></svg>`;
    return `<li><a href="${href}" ${kind === 'ext' ? 'target="_blank" rel="noopener noreferrer"' : ''} data-dock="${kind}" aria-label="${label}">${glyph}<span class="dock-label">${label}</span></a></li>`;
  }).join('') + '</ul>';
  document.body.appendChild(dock);
  dock.addEventListener('click', e => {
    const a = e.target.closest('a[data-dock="term"]'); if (!a) return;
    e.preventDefault();
    const focusTerm = () => { const t = $('#hero-term'); if (t) { t.scrollIntoView({behavior: reduce.matches ? 'auto' : 'smooth', block: 'center'}); const i = $('.term-input', t); if (i && !i.disabled) setTimeout(() => i.focus({preventScroll: true}), 350); } };
    if (location.hash !== '#about' && location.hash !== '') { go('#about'); setTimeout(focusTerm, 450); } else focusTerm();
  });
  // magnification on pointer devices
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches && !reduce.matches) {
    const items = $$('li', dock);
    dock.addEventListener('pointermove', e => items.forEach(li => { const r = li.getBoundingClientRect(), d = Math.abs(e.clientX - (r.left + r.width / 2)); li.style.setProperty('--s', (1 + Math.max(0, 1 - d / 110) * .5).toFixed(3)); }));
    dock.addEventListener('pointerleave', () => items.forEach(li => li.style.setProperty('--s', 1)));
  }

  /* ------------------------------------------------------------ context chip (namespace) and build badge */
  const pageName = $('#page-name');
  if (pageName) {
    const chip = document.createElement('span'); chip.className = 'ns-chip'; chip.setAttribute('aria-hidden', 'true'); pageName.after(chip);
    const upd = () => { chip.textContent = 'namespace/' + slug(pageName.textContent || 'about'); };
    upd(); new MutationObserver(upd).observe(pageName, {childList: true, characterData: true, subtree: true});
  }
  const footer = $('.footer');
  if (footer) {
    const badge = document.createElement('span'); badge.className = 'build-badge'; badge.textContent = 'Hosted on GitHub Pages'; footer.appendChild(badge);
    fetch('build.json', {cache: 'no-cache'}).then(r => r.ok ? r.json() : null).then(b => {
      if (!b || !b.run) return;
      const parts = ['Deployed by GitHub Actions'];
      if (b.run) parts.push('build ' + b.run);
      if (b.sha) parts.push(b.sha);
      if (b.lighthouse && b.lighthouse.performance != null) parts.push('Lighthouse ' + b.lighthouse.performance + ' performance, ' + b.lighthouse.accessibility + ' accessibility');
      badge.textContent = parts.join(' · ');
      if (b.url) { const a = document.createElement('a'); a.href = b.url; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = badge.textContent; badge.textContent = ''; badge.appendChild(a); }
    }).catch(() => {});
  }
})();
