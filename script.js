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
  const renderRoute = (hash, focus = false) => {
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
    if (focus) page.focus({preventScroll:true});
    frame = window.requestAnimationFrame(() => {
      const y = target ? Math.max(0, target.getBoundingClientRect().top + window.scrollY - 100) : (positions.get(active) || 0);
      window.scrollTo({top:y, behavior:'instant'});
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
    renderRoute(hash, true);
  });
  window.addEventListener('popstate', () => renderRoute(window.location.hash, true));
  window.addEventListener('hashchange', () => renderRoute(window.location.hash, true));
  window.addEventListener('scroll', () => {if (active && !navigating) positions.set(active, window.scrollY);}, {passive:true});
  document.querySelector('.back-to-top').addEventListener('click', () => window.scrollTo({top:0, behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'}));
  renderRoute(window.location.hash);
  const animatedSections = document.querySelectorAll('.workflow-visual, .direction-flow');
  if (animatedSections.length) {
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => {
      animatedSections.forEach(section => section.classList.toggle('motion-enabled', !motionPreference.matches));
    };
    motionPreference.addEventListener('change', updateMotion);
    updateMotion();
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

})();
