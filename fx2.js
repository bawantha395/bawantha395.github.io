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
  const P = cmd => `<span class="t-p">bawantha@cloud-devops</span> <span class="t-path">~/portfolio</span> % <span class="t-cmd">${esc(cmd)}</span>`;
  const bar = t => `<div class="term-bar"><i class="r"></i><i class="y"></i><i class="g"></i><span class="term-title">${esc(t)}</span></div>`;
  const slug = t => t.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  /* type a line's text character by character, keeping its markup */
  const typeLine = async (d, html, fast) => {
    d.innerHTML = html || '&nbsp;';
    const w = document.createTreeWalker(d, NodeFilter.SHOW_TEXT), nodes = [];
    while (w.nextNode()) nodes.push([w.currentNode, w.currentNode.nodeValue]);
    nodes.forEach(n => { n[0].nodeValue = ''; });
    const isCmd = !!d.querySelector('.t-cmd'), step = isCmd ? 1 : 4, ms = isCmd ? 22 : 7;
    for (const [n, full] of nodes) { for (let i = step; i < full.length + step; i += step) { n.nodeValue = full.slice(0, i); await sleep(ms); } n.nodeValue = full; }
  };
  /* reserve the final height first so typing never pushes the page */
  const reserve = (body, lines) => {
    body.innerHTML = lines.map(l => `<div class="term-line">${l || '&nbsp;'}</div>`).join('');
    body.style.minHeight = body.scrollHeight + 'px'; body.innerHTML = '';
  };
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
      const lines = build(arg).concat(['', P('') + '<span class="term-caret"></span>']);
      const ds = lines.map(l => { const d = document.createElement('div'); d.className = 'term-line'; d.innerHTML = l || '&nbsp;'; if (first && !reduce.matches) d.style.visibility = 'hidden'; body.appendChild(d); return d; });
      if (first && !reduce.matches) {
        body.style.minHeight = body.offsetHeight + 'px';
        for (const d of ds) { if (my !== token) return; d.style.visibility = ''; await sleep(75); }
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

  const plain = html => html;
  const T = {
    experience: el => mount(el, 'bawantha@cloud-devops — kubectl', () => [
      '<span class="t-dim"># Mitra AI, Sampath Bank staging. Service names are examples, real client names are not shown.</span>',
      P('kubectl get pods -n staging'),
      '<span class="t-hd">' + pad('NAME', 34) + pad('READY', 8) + pad('STATUS', 20) + 'RESTARTS</span>',
      `${pad('app-service-7c9d6b-x2k4p', 34)}${pad('0/1', 8)}<span class="t-err">${pad('CrashLoopBackOff', 20)}</span>5`,
      `${pad('web-frontend-5b8f4d-q9w2z', 34)}${pad('1/1', 8)}<span class="t-ok">${pad('Running', 20)}</span>0`,
      '',
      P('kubectl logs app-service-7c9d6b-x2k4p -n staging'),
      '<span class="t-err">ERROR could not decrypt the database credential</span>',
      '',
      P('kubectl describe configmap app-service-config -n staging'),
      '<span class="t-dim">  (fixed the value in the YAML manifest, ConfigMap and Secret)</span>',
      '',
      P('kubectl rollout restart deployment app-service -n staging'),
      'deployment.apps/app-service restarted',
      '',
      P('kubectl get pods -n staging'),
      '<span class="t-hd">' + pad('NAME', 34) + pad('READY', 8) + pad('STATUS', 20) + 'RESTARTS</span>',
      `${pad('app-service-6d5f8c-m3t7r', 34)}${pad('1/1', 8)}<span class="t-ok">${pad('Running', 20)}</span>0`,
      `${pad('web-frontend-5b8f4d-q9w2z', 34)}${pad('1/1', 8)}<span class="t-ok">${pad('Running', 20)}</span>0`
    ]),
    certifications: el => mount(el, 'bawantha@cloud-devops — kubectl', () => {
      const items = [];
      $$('.certification-featured, .certification-card, article[class*="certification"]').forEach(c => {
        const h = $('h3', c), y = ($('.certification-provider', c) || {}).textContent || '';
        if (h) items.push({name: h.textContent.trim(), year: (y.match(/\d{4}/) || [''])[0]});
      });
      const seen = new Set(), rows = items.filter(i => !seen.has(i.name) && seen.add(i.name));
      return [
        P('kubectl get certificates -n learning'),
        '<span class="t-hd">' + pad('NAME', 52) + pad('READY', 8) + pad('STATUS', 10) + 'YEAR</span>',
        ...rows.map(r => `${pad(slug(r.name), 52)}<span class="t-ok">${pad('True', 8)}${pad('Issued', 10)}</span>${r.year}`),
        ...[['certified-kubernetes-administrator', 'Preparing'], ['claude-certified-architect-foundations', 'Issuing']].map(r => `${pad(r[0], 52)}<span class="t-warn">${pad('False', 8)}${r[1]}</span>`)
      ];
    }),
    articles: el => {
      const all = $$('.article-row').map(a => ({name: ($('.article-name', a) || {}).textContent, date: ($('.article-date', a) || {}).textContent}));
      mount(el, 'bawantha@cloud-devops — kubectl', () => [P('kubectl get jobs -n medium'), '<span class="t-hd">' + pad('STATUS', 11) + 'NAME</span>',
        ...all.map(r => `<span class="t-ok">${pad('Completed', 11)}</span>${esc(r.name)} <span class="t-dim">${esc(r.date)}</span>`)]);
    },
    contact: el => mount(el, 'bawantha@cloud-devops — kubectl', () => [
      P('kubectl get svc -n contact'),
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

  /* ------------------------------------------------------------ workflow opens only when asked */
  const wf = $('#delivery-pipeline');
  if (wf) {
    const open = () => { wf.classList.remove('wf-collapsed'); setTimeout(() => { const y = wf.getBoundingClientRect().top + window.scrollY - 72; window.scrollTo({top: y, behavior: reduce.matches ? 'auto' : 'smooth'}); }, 60); };
    document.addEventListener('click', e => { const a = e.target.closest('a[href="#delivery-pipeline"]'); if (a) { e.preventDefault(); open(); history.replaceState(null, '', '#delivery-pipeline'); } });
    window.addEventListener('hashchange', () => { if (location.hash === '#delivery-pipeline') open(); });
    if (location.hash === '#delivery-pipeline') wf.classList.remove('wf-collapsed');
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
    pop.innerHTML = bar('bawantha@cloud-devops — kubectl') + '<button class="skill-pop-x" type="button" aria-label="Close">×</button><div class="term-body">' +
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

  /* ------------------------------------------------------------ Dock effect on the sidebar */
  const nav = $('#navigation');
  if (nav && window.matchMedia('(hover: hover) and (pointer: fine)').matches && !reduce.matches) {
    const links = $$('a', nav);
    const set = (a, v) => { a.style.setProperty('--ds', v.toFixed(3)); };
    nav.addEventListener('pointermove', e => links.forEach(a => { const r = a.getBoundingClientRect(), d = Math.abs(e.clientY - (r.top + r.height / 2)); set(a, 1 + Math.max(0, 1 - d / 120) * .09); }));
    nav.addEventListener('pointerleave', () => links.forEach(a => set(a, 1)));
  }
  // quiet the background while the page scrolls, so nothing moves behind the text
  let scrollTimer = 0;
  window.addEventListener('scroll', () => { document.documentElement.classList.add('is-scrolling'); clearTimeout(scrollTimer); scrollTimer = setTimeout(() => document.documentElement.classList.remove('is-scrolling'), 160); }, {passive: true});

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
