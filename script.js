(() => {
  'use strict';
  const pages = [...document.querySelectorAll('[data-page]')];
  const navigation = document.getElementById('navigation');
  const sidebar = document.getElementById('sidebar');
  const menu = document.querySelector('.menu-toggle');
  const backdrop = document.querySelector('.menu-backdrop');
  const mobile = window.matchMedia('(max-width: 900px)');
  const status = document.getElementById('status-message');
  const pageName = document.getElementById('page-name');
  const positions = new Map();
  const names = {about:'About', experience:'Experience', projects:'Projects', cloudlab:'Cloud Lab', skills:'Skills', certifications:'Certifications', blog:'Articles', contact:'Contact'};
  const aliases = {top:'about', resume:'contact', homelab:'cloudlab', 'cloud-lab':'cloudlab'};
  let active = '', menuOpen = false, navigating = false, frame = 0;
  let returningFromCapture = false;
  document.documentElement.classList.add('js');
  if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
  const setMenu = (open, focusMenu = true) => {
    menuOpen = open && mobile.matches;
    document.body.classList.toggle('menu-open', menuOpen);
    menu.setAttribute('aria-expanded', String(menuOpen));
    sidebar.inert = mobile.matches && !menuOpen;
    backdrop.hidden = !menuOpen;
    if (menuOpen && focusMenu) (navigation.querySelector('[aria-current="page"]') || navigation.querySelector('a')).focus();
  };
  const closeMenu = () => {setMenu(false); menu.focus();};
  menu.addEventListener('click', () => setMenu(!menuOpen));
  sidebar.querySelector('.sidebar-close').addEventListener('click', closeMenu);
  backdrop.addEventListener('click', closeMenu);
  mobile.addEventListener('change', () => setMenu(false, false));
  setMenu(false, false);
  const filterControllers = new Map();
  document.querySelectorAll('[data-filter-page]').forEach(bar => {
    const page = document.getElementById(bar.dataset.filterPage);
    const groups = [...page.querySelectorAll('[data-filter-category]')];
    const buttons = [...bar.querySelectorAll('[data-filter]')];
    const apply = (choice, announce = false) => {
      const category = buttons.some(button => button.dataset.filter === choice) ? choice : 'all';
      buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === category)));
      groups.forEach(group => {group.hidden = category !== 'all' && group.dataset.filterCategory !== category;});
      if (announce) {
        const selector = page.id === 'projects' ? '.project' : '.article-row';
        const count = groups.filter(group => !group.hidden).reduce((total, group) => total + group.querySelectorAll(selector).length, 0);
        status.textContent = count + (page.id === 'projects' ? ' projects' : ' articles') + ' shown.';
      }
    };
    buttons.forEach(button => button.addEventListener('click', () => apply(button.dataset.filter, true)));
    filterControllers.set(page.id, {apply});
    apply('all');
  });
  const targetFor = hash => {
    let id;
    try {id = decodeURIComponent(hash.replace(/^#/, '')) || 'about';} catch {id = 'about';}
    const known = pages.find(page => page.id === id);
    if (known) return {page:known, target:null};
    if (aliases[id]) return {page:pages.find(page => page.id === aliases[id]), target:null};
    const target = document.getElementById(id), page = target?.closest('[data-page]');
    return {page:page || pages[0], target:page ? target : null};
  };
  const renderRoute = (hash, focus = false, smooth = false) => {
    const {page, target} = targetFor(hash), changed = active !== page.id;
    if (active && !navigating) positions.set(active, window.scrollY);
    navigating = true;
    if (frame) window.cancelAnimationFrame(frame);
    pages.forEach(item => {item.hidden = item !== page;});
    active = page.id;
    document.body.dataset.page = active;
    pageName.textContent = names[active];
    document.title = names[active] + ' | Bawantha Rathnayake';
    navigation.querySelectorAll('a').forEach(link => {
      if (link.dataset.nav === active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    const group = target?.closest('[data-filter-category]');
    if (group?.hidden) filterControllers.get(page.id)?.apply(group.dataset.filterCategory);
    setMenu(false, false);
    if (focus) (target?.id === 'delivery-pipeline' ? target : page).focus({preventScroll:true});
    frame = window.requestAnimationFrame(() => {
      const y = target ? Math.max(0, target.getBoundingClientRect().top + window.scrollY - 100) : (positions.get(active) || 0);
      const animateScroll = smooth && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({top:y, behavior:animateScroll ? 'smooth' : 'instant'});
      frame = window.requestAnimationFrame(() => {
        positions.set(active, window.scrollY);
        navigating = false;
        frame = 0;
        if (focus && changed) status.textContent = names[active] + ' section opened.';
      });
    });
  };
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const hash = link.getAttribute('href');
    if (link.classList.contains('brand') || link.classList.contains('mobile-brand')) {
      event.preventDefault();
      window.history.replaceState(null, '', '#about');
      window.scrollTo({top:0, behavior:'instant'});
      window.location.reload();
      return;
    }
    if (hash === '#main') {
      event.preventDefault();
      document.getElementById('main').focus({preventScroll:true});
      window.scrollTo({top:0, behavior:'instant'});
      return;
    }
    event.preventDefault();
    if (!navigating && active) positions.set(active, window.scrollY);
    if (window.location.hash !== hash) window.history.pushState(null, '', hash);
    renderRoute(hash, true, link.matches('.hero-ship-link, .hero-contact, .topbar-contact'));
  });
  window.addEventListener('popstate', () => {
    // A capture adds a history entry on the same route. Closing it should
    // preserve focus on the evidence link rather than refocusing the page.
    const samePage = targetFor(window.location.hash).page.id === active;
    const captureOpen = document.getElementById('lab-evidence-viewer')?.open;
    if (samePage && (captureOpen || returningFromCapture)) {
      returningFromCapture = false;
      return;
    }
    returningFromCapture = false;
    renderRoute(window.location.hash, true);
  });
  window.addEventListener('hashchange', () => renderRoute(window.location.hash, true));
  window.addEventListener('scroll', () => {if (active && !navigating) positions.set(active, window.scrollY);}, {passive:true});
  document.querySelector('.back-to-top').addEventListener('click', () => window.scrollTo({top:0, behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'}));
  renderRoute(window.location.hash);
  const animatedSections = document.querySelectorAll('.workflow-visual, .direction-flow, .hero-ship-link');
  if (animatedSections.length) {
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => {
      animatedSections.forEach(section => section.classList.toggle('motion-enabled', !motionPreference.matches));
    };
    motionPreference.addEventListener('change', updateMotion);
    updateMotion();
  }

  // Decorative motion runs only while its target is visible. It does not represent a live deployment.
  const workflowVisual = document.querySelector('.workflow-visual');
  const workflowTrack = workflowVisual?.querySelector('.workflow-track');
  const attentionTargets = [workflowVisual, document.querySelector('.hero-ship-link')].filter(Boolean);
  const attentionMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const attentionVisible = new Map(attentionTargets.map(target => [target, false]));
  const updateAttention = () => {
    attentionTargets.forEach(target => target.classList.toggle('is-motion-active',
      !attentionMotion.matches && !document.hidden && attentionVisible.get(target)));
  };
  if ('IntersectionObserver' in window) {
    const attentionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => attentionVisible.set(entry.target === workflowTrack ? workflowVisual : entry.target, entry.isIntersecting));
      updateAttention();
    });
    attentionTargets.forEach(target => attentionObserver.observe(target === workflowVisual ? workflowTrack : target));
  } else {
    attentionTargets.forEach(target => attentionVisible.set(target, true));
  }
  document.addEventListener('visibilitychange', updateAttention);
  attentionMotion.addEventListener('change', updateAttention);
  updateAttention();

  // Measure icon centers so the same connector works across the horizontal and mobile layouts.
  const measureWorkflow = () => {
    if (!workflowTrack || !workflowTrack.getClientRects().length) return;
    const icons = [...workflowTrack.querySelectorAll('.workflow-icon')];
    const bounds = workflowTrack.getBoundingClientRect();
    const centers = icons.map(icon => {
      const rect = icon.getBoundingClientRect();
      return {x: rect.left + rect.width / 2 - bounds.left, y: rect.top + rect.height / 2 - bounds.top};
    });
    const first = centers[0], last = centers[centers.length - 1];
    if (!first || !last) return;
    const dx = last.x - first.x, dy = last.y - first.y;
    const vertical = Math.abs(dy) > Math.abs(dx);
    const variables = {
      '--workflow-line-x': first.x - (vertical ? 1 : 0),
      '--workflow-line-y': first.y - (vertical ? 0 : 1),
      '--workflow-line-width': vertical ? 2 : dx,
      '--workflow-line-height': vertical ? dy : 2,
      '--workflow-dot-x': first.x, '--workflow-dot-y': first.y,
      '--workflow-distance-x': dx, '--workflow-distance-y': dy,
    };
    Object.entries(variables).forEach(([name, value]) => workflowTrack.style.setProperty(name, value + 'px'));
    const length = Math.hypot(dx, dy);
    icons.forEach((icon, index) => icon.style.setProperty('--workflow-stage-delay',
      (length ? Math.hypot(centers[index].x - first.x, centers[index].y - first.y) / length * 6 : 0) + 's'));
  };
  if (workflowTrack && 'ResizeObserver' in window) new ResizeObserver(measureWorkflow).observe(workflowTrack);
  window.addEventListener('resize', measureWorkflow);
  new MutationObserver(measureWorkflow).observe(document.body, {attributes: true, attributeFilter: ['data-page']});
  if (document.fonts?.ready) document.fonts.ready.then(measureWorkflow);
  measureWorkflow();

  // Measure the marker centers so the traveller stays inside its own rail,
  // even when summaries wrap differently on a phone or after fonts load.
  const directionFlow = document.querySelector('.direction-flow');
  const directionTrack = directionFlow?.querySelector('.direction-timeline-track');
  const measureDirection = () => {
    if (!directionTrack || !directionFlow.getClientRects().length) return;
    const markers = [...directionFlow.querySelectorAll('.direction-marker')];
    const flowBounds = directionFlow.getBoundingClientRect();
    const first = markers[0].getBoundingClientRect();
    const last = markers[markers.length - 1].getBoundingClientRect();
    const start = first.top + first.height / 2 - flowBounds.top;
    const length = last.top + last.height / 2 - flowBounds.top - start;
    directionTrack.style.top = start + 'px';
    directionTrack.style.height = length + 'px';
    directionTrack.style.setProperty('--direction-travel', Math.max(0, length - 6) + 'px');
  };
  if (directionTrack) {
    if ('ResizeObserver' in window) new ResizeObserver(measureDirection).observe(directionFlow);
    window.addEventListener('resize', measureDirection);
    document.fonts?.ready.then(measureDirection);
    measureDirection();
  }

  // Keep every card readable without JavaScript or with reduced motion.
  const revealCards = [...document.querySelectorAll(
    '.direction-card, .interests-card, .education, .credential, .profile-lab-card, ' +
    '.experience-current, .experience-previous, .project, .skill-card, ' +
    '.lab-overview, .lab-card, .certification-featured, .certification-card, ' +
    '.article-group, .contact-layout'
  )];
  const revealMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let revealObserver;
  const revealCard = card => {
    card.classList.add('is-revealed');
    revealObserver?.unobserve(card);
  };
  const setupReveals = () => {
    if (revealMotion.matches || !('IntersectionObserver' in window)) {
      revealObserver?.disconnect();
      document.documentElement.classList.remove('reveal-ready');
      revealCards.forEach(revealCard);
      return;
    }
    if (!revealObserver) {
      revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => { if (entry.isIntersecting) revealCard(entry.target); });
      }, {threshold: 0.04, rootMargin: '0px 0px -20px 0px'});
    }
    revealCards.forEach(card => {
      card.classList.add('reveal-card');
      if (!card.classList.contains('is-revealed')) revealObserver.observe(card);
    });
    document.documentElement.classList.add('reveal-ready');
  };
  revealCards.forEach(card => card.addEventListener('focusin', () => revealCard(card)));
  revealMotion.addEventListener('change', setupReveals);
  setupReveals();

  document.querySelectorAll('[data-walkthrough-toggle]').forEach(button => {
    const walkthrough = document.getElementById(button.getAttribute('aria-controls'));
    button.addEventListener('click', () => {
      const expanded = button.getAttribute('aria-expanded') !== 'true';
      walkthrough.hidden = !expanded;
      button.setAttribute('aria-expanded', String(expanded));
      button.textContent = expanded ? 'Hide the walkthrough' : 'Watch the walkthrough';
      walkthrough.dispatchEvent(new CustomEvent('walkthrough:toggle', {detail: {expanded}}));
    });
  });

  const hero = document.querySelector('.hero');
  if (hero) {
    const heroMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const heroSmallScreen = window.matchMedia('(max-width: 650px)');
    const moreToggle = document.getElementById('hero-more-toggle');
    const moreCopy = document.getElementById('hero-research-copy');
    const updateMore = () => {
      moreCopy.hidden = heroSmallScreen.matches && moreToggle.getAttribute('aria-expanded') !== 'true';
    };
    moreToggle.addEventListener('click', () => {
      const expanded = moreToggle.getAttribute('aria-expanded') !== 'true';
      moreToggle.setAttribute('aria-expanded', String(expanded));
      moreToggle.textContent = expanded ? 'Less about me' : 'More about me';
      updateMore();
    });
    heroSmallScreen.addEventListener('change', updateMore);
    updateMore();

    hero.querySelectorAll('[data-hero-order]').forEach(element => {
      element.style.setProperty('--hero-delay', Math.min(Number(element.dataset.heroOrder) * .07, .56) + 's');
    });
    if (!heroMotion.matches) hero.classList.add('hero-ready');

    const counters = [...hero.querySelectorAll('[data-hero-counter]')];
    const setHeroNumbers = progress => counters.forEach(element => {
      if (element.dataset.heroCounter === 'time') {
        const seconds = Math.round(Number(element.dataset.final) * progress);
        element.textContent = Math.floor(seconds / 60) + ' min ' + String(seconds % 60).padStart(2, '0') + ' sec';
      } else {
        element.textContent = Math.round(1 + (Number(element.dataset.final) - 1) * progress) + ' replicas';
      }
    });
    let counterFrame = 0, counterDelay = 0, numbersStarted = false;
    const startHeroNumbers = () => {
      if (numbersStarted) return;
      numbersStarted = true;
      if (heroMotion.matches) { setHeroNumbers(1); return; }
      setHeroNumbers(0);
      counterDelay = window.setTimeout(() => {
        const started = performance.now();
        const advance = now => {
          const progress = Math.min(1, (now - started) / 600);
          setHeroNumbers(1 - Math.pow(1 - progress, 3));
          if (progress < 1 && !heroMotion.matches) counterFrame = requestAnimationFrame(advance);
          else setHeroNumbers(1);
        };
        counterFrame = requestAnimationFrame(advance);
      }, 850);
    };
    if ('IntersectionObserver' in window) {
      const heroNumberObserver = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) { startHeroNumbers(); heroNumberObserver.disconnect(); }
      });
      heroNumberObserver.observe(hero);
    } else startHeroNumbers();

    const contactButton = document.querySelector('.topbar-contact');
    const updateTopContact = () => {
      const contentEnd = Math.max(...[...hero.children].map(element => element.getBoundingClientRect().bottom));
      const visible = active !== 'about' || contentEnd <= document.querySelector('.page-topbar').offsetHeight;
      contactButton.classList.toggle('is-visible', visible);
      contactButton.setAttribute('aria-hidden', String(!visible));
      contactButton.tabIndex = visible ? 0 : -1;
    };
    window.addEventListener('scroll', updateTopContact, {passive:true});
    window.addEventListener('resize', updateTopContact);
    new MutationObserver(updateTopContact).observe(document.body, {attributes:true, attributeFilter:['data-page']});
    if ('ResizeObserver' in window) new ResizeObserver(updateTopContact).observe(hero);
    updateTopContact();

    const portrait = hero.querySelector('.portrait-frame');
    const photoSurface = hero.querySelector('.hero-photo-content');
    const mouseDesktop = window.matchMedia('(min-width: 901px) and (hover: hover) and (pointer: fine)');
    let portraitFrame = 0;
    const resetPortrait = () => {
      cancelAnimationFrame(portraitFrame);
      portrait.style.setProperty('--portrait-x', '0px');
      portrait.style.setProperty('--portrait-y', '0px');
    };
    photoSurface.addEventListener('pointermove', event => {
      if (!mouseDesktop.matches || heroMotion.matches || event.pointerType !== 'mouse') return;
      const bounds = photoSurface.getBoundingClientRect();
      const x = Math.max(-1, Math.min(1, (event.clientX - bounds.left) / bounds.width * 2 - 1)) * 4;
      const y = Math.max(-1, Math.min(1, (event.clientY - bounds.top) / bounds.height * 2 - 1)) * 4;
      cancelAnimationFrame(portraitFrame);
      portraitFrame = requestAnimationFrame(() => {
        portrait.style.setProperty('--portrait-x', x + 'px');
        portrait.style.setProperty('--portrait-y', y + 'px');
      });
    });
    photoSurface.addEventListener('pointerleave', resetPortrait);
    mouseDesktop.addEventListener('change', resetPortrait);
    heroMotion.addEventListener('change', event => {
      if (!event.matches) return;
      hero.classList.remove('hero-ready');
      clearTimeout(counterDelay);
      cancelAnimationFrame(counterFrame);
      setHeroNumbers(1);
      resetPortrait();
    });
  }
  document.addEventListener('keydown', event => {
    if (!menuOpen) return;
    if (event.key === 'Escape') {event.preventDefault(); closeMenu();}
    if (event.key !== 'Tab') return;
    const links = [...sidebar.querySelectorAll('a, button')].filter(item => !item.hidden), first = links[0], last = links[links.length-1];
    if (event.shiftKey && document.activeElement === first) {event.preventDefault(); last.focus();}
    else if (!event.shiftKey && document.activeElement === last) {event.preventDefault(); first.focus();}
  });

  const copyButton = document.querySelector('.copy-email');
  const copyIcon = copyButton.querySelector('use');
  let copyTimeout;
  const resetCopy = () => {
    copyIcon.setAttribute('href', '#icon-copy');
    copyButton.setAttribute('aria-label', 'Copy email address');
    copyButton.setAttribute('title', 'Copy email address');
    copyButton.classList.remove('copied');
  };
  copyButton.addEventListener('click',async () => {
    try{
      await navigator.clipboard.writeText('rathnayakermbtm@gmail.com');
      copyIcon.setAttribute('href', '#icon-check');
      copyButton.setAttribute('aria-label', 'Email address copied');
      copyButton.setAttribute('title', 'Email copied');
      copyButton.classList.add('copied');
      status.textContent='Email address copied to your clipboard.';
      clearTimeout(copyTimeout);copyTimeout=setTimeout(resetCopy,3000);
    }catch{
      const range=document.createRange();range.selectNodeContents(document.querySelector('.email-link'));
      const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);
      resetCopy();
      copyButton.setAttribute('aria-label', 'Email address selected. Use your copy command.');
      copyButton.setAttribute('title', 'Email selected');
      status.textContent='The email address is selected. Use your device copy command.';
    }
  });

  // Cloud Lab captures open without leaving the current portfolio page.
  const captureDialog = document.getElementById('lab-evidence-viewer');
  const captureSource = document.querySelector('[data-slideshow="eks"] .slideshow-data');
  if (captureDialog && captureSource) {
    const captures = JSON.parse(captureSource.textContent);
    const captureImage = document.getElementById('lab-evidence-image');
    const captureTitle = document.getElementById('lab-evidence-title');
    const captureCaption = document.getElementById('lab-evidence-caption');
    const captureOrigin = document.getElementById('lab-evidence-origin');
    const returnButton = captureDialog.querySelector('.lab-evidence-close');
    let captureOpener = null, captureScroll = 0, captureHistoryKey = '', captureCounter = 0;

    document.querySelectorAll('a[data-evidence]').forEach(link => {
      link.addEventListener('click', event => {
        if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        if (typeof captureDialog.showModal !== 'function') return;
        const capture = captures[Number(link.dataset.evidence)];
        if (!capture) return;
        event.preventDefault();
        captureOpener = link;
        captureScroll = window.scrollY;
        const origin = link.closest('[data-page]')?.id;
        const returnName = origin === 'cloudlab' ? 'Cloud Lab' : (names[origin] || 'Portfolio');
        captureOrigin.textContent = returnName;
        returnButton.textContent = origin === 'about' ? 'Close' : 'Back to '+returnName;
        captureImage.src = capture.src;
        captureImage.alt = capture.title+'. '+capture.caption;
        captureTitle.textContent = capture.title;
        captureCaption.textContent = capture.caption;
        captureHistoryKey = 'portfolio-capture-'+Date.now()+'-'+(++captureCounter);
        captureDialog.showModal();
        document.body.classList.add('lab-evidence-open');
        window.history.pushState({...window.history.state, portfolioCapture:captureHistoryKey}, '', window.location.href);
        returnButton.focus({preventScroll:true});
      });
    });
    returnButton.addEventListener('click', () => captureDialog.close());
    captureDialog.addEventListener('click', event => {
      if (event.target !== captureDialog) return;
      const bounds = captureDialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right ||
          event.clientY < bounds.top || event.clientY > bounds.bottom) captureDialog.close();
    });
    captureDialog.addEventListener('close', () => {
      document.body.classList.remove('lab-evidence-open');
      // Remove only this viewer's history entry, so the browser Back button
      // and the visible return button both restore the same portfolio view.
      if (window.history.state?.portfolioCapture === captureHistoryKey) {
        returningFromCapture = true;
        window.history.back();
      }
      captureOpener?.focus({preventScroll:true});
      window.requestAnimationFrame(() => window.scrollTo({top:captureScroll, behavior:'instant'}));
    });
    window.addEventListener('popstate', () => {
      if (captureDialog.open && window.history.state?.portfolioCapture !== captureHistoryKey) captureDialog.close();
    });
  }

})();
