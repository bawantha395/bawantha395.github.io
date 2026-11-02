/*
  Terminal windows: each section opens with a macOS-style Terminal that types the kubectl (or argocd) commands
  that suit that section. Every output line is built from facts already on this site; nothing here pretends to be
  live cluster telemetry. Markup inside strings: §g:green§ §y:yellow§ §c:cyan§ §m:magenta§ §r:red§ §d:dim§ §b:bold§ §p:pulsing dot§
*/
(() => {
  'use strict';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const yaml = (key, value) => '§c:' + key + ':§ §g:"' + value + '"§';

  const SCRIPTS = {
    about: {
      plain: "I am a Cloud and DevOps engineer. I help teams put software on the internet (on AWS) safely and automatically, and I am open to work.",
      ns: 'about',
      label: 'About',
      steps: [
        {cmd: 'kubectl describe pod bawantha -n about', out: [
          '§b:Name:§         bawantha',
          '§b:Namespace:§    about',
          '§b:Role:§         Cloud & DevOps Engineer',
          '§b:Certified:§    AWS Certified Solutions Architect – Associate',
          '§b:Focus:§        §c:DevOps§ · §c:GitOps§ · §c:MLOps§ · §c:LLMOps§',
          '§b:Location:§     Colombo, Sri Lanka',
          '§b:Containers:§',
          '  mitra-ai:   DevOps Engineer Intern · Apr 2026 – Oct 2026 · §d:completed§',
          '  pickme:     Software Development Engineer in Test Intern · Jul 2024 – Mar 2025',
          '  ruhuna:     B.Sc. (Hons) Computer Engineering · 2021 – 2025',
          '§b:Conditions:§',
          '  Type          Status',
          '  Ready         §g:True§',
          '  OpenToWork    §p:●§ §g:True§   §d:Cloud & DevOps Engineer roles§'
        ]},
        {cmd: 'kubectl get events -n about --sort-by=.lastTimestamp', out: [
          '§d:LAST SEEN   TYPE     REASON     MESSAGE§',
          '2026        Normal   Built      Stocklane: secure AWS platform with GitOps, MLOps and LLMOps',
          '2026        Normal   Built      AWS EKS GitOps platform with Terraform, Argo CD and Grafana',
          '2026        Normal   Deployed   Banking applications to staging on VMware Tanzu Kubernetes',
          '§g:now         Normal   Ready      Open to Cloud & DevOps Engineer roles§'
        ]}
      ]
    },
    experience: {
      plain: "Two internships: at PickMe I tested mobile apps, and at Mitra AI I helped release banking software to testing environments.",
      ns: 'experience',
      label: 'Experience',
      steps: [
        {cmd: 'kubectl rollout history deployment/career', out: [
          '§d:deployment.apps/career§',
          '§d:REVISION  CHANGE-CAUSE§',
          '1         PickMe · Software Development Engineer in Test Intern · Jul 2024 – Mar 2025',
          '2         Mitra AI · DevOps Engineer Intern, Sampath Bank project · Apr 2026 – Oct 2026'
        ]},
        {cmd: 'kubectl logs deployment/career --tail=7', out: [
          '§d:[PickMe]§    Built price automation frameworks with Java, TestNG, Maven, Selenium and Appium',
          '§d:[PickMe]§    Managed a physical device farm and kept daily pricing automation running',
          '§d:[PickMe]§    Ran smoke, sanity and regression checks for the Passenger App Revamp',
          '§d:[Mitra AI]§  Deployed banking applications to staging on VMware Tanzu Kubernetes',
          '§d:[Mitra AI]§  Investigated CrashLoopBackOff, startup and credential errors through pod logs',
          '§d:[Mitra AI]§  Deployed to Apache Tomcat, Oracle WebLogic and IIS, and published APIs in WSO2',
          '§g:[Mitra AI]§  Internship completed. §p:●§ §g:Open to Cloud & DevOps Engineer roles.§'
        ]}
      ]
    },
    projects: {
      plain: "Six projects. The biggest runs a workshop’s stock system on AWS: it releases itself, watches its own health, and uses AI that only suggests while a person approves.",
      ns: 'projects',
      label: 'Projects',
      steps: [
        {cmd: 'kubectl get deploy -n projects \\\n  -o custom-columns=NAME:.metadata.name,YEAR:.metadata.annotations.year,STACK:.metadata.annotations.stack', out: [
          '§d:NAME               YEAR   STACK§',
          '§g:stocklane§          2026   EKS · Terraform · Argo CD · SageMaker · Bedrock · Textract',
          '§g:issue-tracker-eks§  2026   EKS · Terraform · GitHub Actions · Argo CD · Prometheus · Grafana',
          '§g:issue-tracker-ec2§  2026   Jenkins · Docker · EC2 · CloudFront · Nginx · WAF · RDS',
          '§g:institute-system§   2025   React · Jenkins · Docker · Nginx · Cloudflare · LLMs and RAG',
          '§g:book-stall§         2025   Spring Boot · JWT · API Gateway · Docker Compose',
          '§g:fingerprint-iot§    2024   Arduino · MERN · Material UI'
        ]},
        {cmd: 'kubectl describe deploy stocklane -n projects', out: [
          '§b:Name:§         stocklane',
          '§b:Annotations:§  pipeline:      test → plan → apply → release → platform → frontend (11 min 22 sec run)',
          '               environments:  dev, staging and prod from one pipeline',
          '               gitops:        Argo CD keeps EKS in sync with Git',
          '               mlops:         pretrained Chronos-Bolt forecast, weekly SageMaker job for the photo matcher',
          '               llmops:        Textract and Bedrock suggest label details, a person approves',
          '§b:Conditions:§   Available  §g:True§'
        ]}
      ]
    },
    cloudlab: {
      plain: "Proof that it works: all five applications in my Stocklane project report Synced and Healthy, and one system grew from 1 to 5 copies under test load.",
      ns: 'argocd',
      label: 'Cloud Lab',
      steps: [
        {cmd: 'argocd app list', out: [
          '§d:NAME                               CLUSTER     NAMESPACE      STATUS   HEALTH§',
          'stocklane-dev                      in-cluster  argocd         §g:Synced§   §g:Healthy§',
          'stocklane-monitoring-dev           in-cluster  monitoring     §g:Synced§   §g:Healthy§',
          'stocklane-monitoring-operator-dev  in-cluster  monitoring     §g:Synced§   §g:Healthy§',
          'stocklane-platform-dev             in-cluster  kube-system    §g:Synced§   §g:Healthy§',
          'stocklane-workshop-dev             in-cluster  stocklane-dev  §g:Synced§   §g:Healthy§'
        ]},
        {cmd: 'kubectl describe hpa | tail -5', out: [
          '§d:# issue tracker on EKS, scaled under simulated load§',
          'Min replicas:  1',
          'Max replicas:  5',
          'Events:',
          '  §g:Normal§  SuccessfulRescale  New size: 5; reason: cpu resource utilization above target'
        ]}
      ]
    },
    skills: {
      plain: "My toolbox in one list: cloud (AWS), packaging and running apps, automatic releases, monitoring, security, and the languages I code in.",
      ns: 'skills',
      label: 'Skills',
      steps: [
        {cmd: 'kubectl get configmap skills -o yaml', out: [
          '§c:apiVersion:§ v1',
          '§c:kind:§ ConfigMap',
          '§c:metadata:§',
          '  §c:name:§ skills',
          '§c:data:§',
          '  ' + yaml('cloud', 'AWS, Terraform, CloudFormation, VPC, EKS, ECR, ALB, CloudFront'),
          '  ' + yaml('containers', 'Docker, Kubernetes, VMware Tanzu, Helm, Kustomize'),
          '  ' + yaml('delivery', 'Jenkins, GitHub Actions, Argo CD, AWS CodeBuild, Trivy'),
          '  ' + yaml('mlops-llmops', 'SageMaker, Bedrock, Textract, Chronos-Bolt, MobileNetV2'),
          '  ' + yaml('observability', 'Prometheus, Grafana, CloudWatch, Alertmanager'),
          '  ' + yaml('security', 'IAM, Cognito MFA, KMS, Secrets Manager, Pod Identity'),
          '  ' + yaml('languages', 'Java, Python, Bash, JavaScript, TypeScript')
        ]}
      ]
    },
    certifications: {
      plain: "Seven certificates and courses, led by AWS Certified Solutions Architect – Associate.",
      ns: 'certifications',
      label: 'Certifications',
      steps: [
        {cmd: 'kubectl get certificates', out: [
          '§d:NAME                                READY   ISSUER                         YEAR§',
          '§g:aws-solutions-architect-associate§   §g:True§    AWS Training & Certification   2026',
          'aws-cloud-practitioner-essentials   §g:True§    AWS Training & Certification   2026',
          'kubernetes-for-absolute-beginners   §g:True§    KodeKloud                      2026',
          'docker-for-the-absolute-beginner    §g:True§    KodeKloud                      2026',
          'terraform-basics                    §g:True§    KodeKloud                      2026',
          'creating-spring-boot-microservices  §g:True§    LinkedIn Learning              2026',
          'java-object-oriented-programming    §g:True§    LinkedIn Learning              2024'
        ]}
      ]
    },
    blog: {
      plain: "I write about what I learn: 13 articles on Medium covering cloud, Kubernetes and microservices.",
      ns: 'articles',
      label: 'Articles',
      steps: [
        {cmd: 'kubectl logs -l app=medium --tail=6', out: [
          '§d:[2026-07-07]§  Terraform Explained Simply',
          '§d:[2026-07-07]§  Kubernetes Architecture and Its Components',
          '§d:[2026-07-09]§  Kubernetes and Kustomize Through a Real Project',
          '§d:[2026-07-17]§  Understanding VMware Tanzu Kubernetes — From Physical Servers to Kubernetes',
          '§d:[2026-07-24]§  Reverse Proxies, Load Balancers and API Gateways',
          '§g:[2026-09-19]§  A Beginner’s Guide to WSO2 API Manager'
        ]},
        {cmd: 'kubectl get articles --no-headers | wc -l', out: ['§g:13§']}
      ]
    },
    contact: {
      plain: "Email is the best way to reach me. I am open to Cloud and DevOps Engineer roles and based in Colombo, Sri Lanka.",
      ns: 'contact',
      label: 'Contact',
      steps: [
        {cmd: 'kubectl get svc -l app=contact', out: [
          '§d:NAME       TYPE          ENDPOINT§',
          'email      LoadBalancer  rathnayakermbtm@gmail.com',
          'phone      LoadBalancer  +94 71 090 1846',
          'linkedin   ExternalName  linkedin.com/in/rathnayake-rmbtm',
          'github     ExternalName  github.com/bawantha395',
          'gitlab     ExternalName  gitlab.com/bawantha395',
          'medium     ExternalName  medium.com/@rathnayakermbtm'
        ]},
        {cmd: 'kubectl get pod bawantha \\\n  -o jsonpath=\'{.status.conditions[?(@.type=="OpenToWork")].status}\'', out: [
          '§g:True§',
          '§p:●§ §g:Open to work: Cloud & DevOps Engineer roles · Colombo, Sri Lanka§'
        ]}
      ]
    }
  };

  const escapeHtml = text => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const markup = text => escapeHtml(text).replace(/§([gycmrdbp]):([^§]*)§/g, (all, kind, inner) => '<span class="t-' + kind + '">' + inner + '</span>');
  const promptHtml = ns => '<span class="t-user">bawantha</span><span class="t-d">@</span><span class="t-host">macbook</span> '
    + '<span class="t-path">~/portfolio</span> <span class="t-ctx">(⎈ eks-portfolio:' + ns + ')</span> <span class="t-d">%</span> ';

  const sleep = (term, ms) => term._fast ? Promise.resolve() : new Promise(resolve => window.setTimeout(resolve, ms));

  async function play(term, animate) {
    const data = SCRIPTS[term.dataset.terminal];
    const body = term.querySelector('.k8s-terminal-body');
    const run = term._run = (term._run || 0) + 1;
    const alive = () => term._run === run;
    term._fast = !animate || reduceMotion.matches || document.documentElement.dataset.motion === 'off';
    term.classList.add('is-running');
    body.innerHTML = '';
    const scroll = () => { body.scrollTop = body.scrollHeight; };
    for (const step of data.steps) {
      const line = document.createElement('span');
      line.innerHTML = promptHtml(data.ns) + '<span class="t-cmd"></span>';
      body.append(line, '\n');
      const cmd = line.querySelector('.t-cmd');
      if (term._fast) cmd.textContent = step.cmd;
      else {
        for (const char of step.cmd) {
          cmd.textContent += char; scroll();
          await sleep(term, 10 + Math.random() * 14);
          if (!alive()) return;
        }
      }
      cmd.innerHTML = markup(step.cmd).replace(/^(kubectl|argocd)/, '<span class="t-bin">$1</span>');
      await sleep(term, 220); if (!alive()) return;
      for (const out of step.out) {
        const row = document.createElement('span'); row.innerHTML = markup(out);
        body.append(row, '\n'); scroll();
        await sleep(term, 38); if (!alive()) return;
      }
      await sleep(term, 260); if (!alive()) return;
    }
    const last = document.createElement('span');
    last.innerHTML = promptHtml(data.ns) + '<span class="t-caret"></span>';
    body.append(last); scroll();
    term.classList.remove('is-running'); term.classList.add('is-done');
  }

  const build = id => {
    const data = SCRIPTS[id];
    const term = document.createElement('section');
    term.className = 'k8s-terminal'; term.dataset.terminal = id;
    term.setAttribute('aria-label', 'Terminal-style summary for the ' + data.label + ' section');
    term.innerHTML =
      '<div class="k8s-terminal-bar">'
      + '<span class="k8s-lights"><i class="tl tl-r" aria-hidden="true"></i><button aria-expanded="true" aria-label="Collapse the terminal" class="tl tl-y" type="button"></button><i class="tl tl-g" aria-hidden="true"></i></span>'
      + '<span class="k8s-terminal-title" aria-hidden="true">bawantha — zsh — kubectl</span>'
      + '<button class="k8s-replay" type="button"><span aria-hidden="true">↻</span> Replay</button>'
      + '</div><p class="k8s-plain"><span class="k8s-plain-tag">In plain English</span><span>' + escapeHtml(data.plain) + '</span></p>'
      + '<pre aria-hidden="true" class="k8s-terminal-body"></pre>';
    const body = term.querySelector('.k8s-terminal-body');
    body.addEventListener('click', () => { if (term.classList.contains('is-running')) term._fast = true; });
    term.querySelector('.k8s-replay').addEventListener('click', () => { term.classList.remove('is-collapsed'); play(term, true); });
    const fold = term.querySelector('.tl-y');
    fold.addEventListener('click', () => {
      const collapsed = term.classList.toggle('is-collapsed');
      fold.setAttribute('aria-expanded', String(!collapsed));
      fold.setAttribute('aria-label', collapsed ? 'Expand the terminal' : 'Collapse the terminal');
    });
    return term;
  };

  const mount = (id, term) => {
    const page = document.getElementById(id);
    if (!page) return false;
    if (id === 'about') page.querySelector('.hero')?.after(term);
    else if (id === 'contact') page.querySelector('.contact-layout')?.after(term);
    else page.querySelector('.section-heading')?.after(term);
    return Boolean(term.parentElement);
  };

  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      play(entry.target, true);               // first visit types the commands out
    });
  }, {threshold: .3}) : null;

  Object.keys(SCRIPTS).forEach(id => {
    const term = build(id);
    if (!mount(id, term)) return;
    if (observer) observer.observe(term); else play(term, false);
  });
})();
