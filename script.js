(() => {
  const menuButton = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('#navigation');
  const closeMenu = () => {
    menuButton.setAttribute('aria-expanded', 'false');
    navigation.classList.remove('is-open');
  };
  menuButton.addEventListener('click', () => {
    const opened = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(opened));
    navigation.classList.toggle('is-open', opened);
  });
  navigation.addEventListener('click', (event) => {
    if (event.target.closest('a')) closeMenu();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      menuButton.focus();
    }
  });
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.site-header')) closeMenu();
  });
  const desktopQuery = window.matchMedia('(min-width: 961px)');
  desktopQuery.addEventListener('change', (event) => { if (event.matches) closeMenu(); });

  const tabs = [...document.querySelectorAll('.lab-tabs [role="tab"]')];
  const chooseTab = (tab, focus = false) => {
    tabs.forEach((item) => {
      const selected = item === tab;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
      document.getElementById(item.getAttribute('aria-controls')).hidden = !selected;
    });
    if (focus) tab.focus();
  };
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => chooseTab(tab));
    tab.addEventListener('keydown', (event) => {
      let nextIndex;
      if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') nextIndex = 0;
      if (event.key === 'End') nextIndex = tabs.length - 1;
      if (nextIndex !== undefined) {
        event.preventDefault();
        chooseTab(tabs[nextIndex], true);
      }
    });
  });

  document.querySelectorAll('[data-lab-target]').forEach((link) => {
    link.addEventListener('click', () => {
      const tab = document.getElementById('tab-' + link.dataset.labTarget);
      if (tab) chooseTab(tab);
    });
  });

  const filterButtons = [...document.querySelectorAll('[data-project-filter]')];
  const projectItems = [...document.querySelectorAll('[data-project-category]')];
  const projectCount = document.getElementById('project-count');
  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const filter = button.dataset.projectFilter;
      let count = 0;
      projectItems.forEach((project) => {
        const visible = filter === 'all' || project.dataset.projectCategory === filter;
        project.hidden = !visible;
        if (visible) count++;
      });
      filterButtons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
      projectCount.textContent = filter === 'all' ? 'Showing all 5 projects' : `Showing ${count} projects`;
    });
  });

  let scrollTicking = false;
  const updateReadingProgress = () => {
    const available = document.documentElement.scrollHeight - window.innerHeight;
    const progress = available > 0 ? Math.max(0, Math.min(100, window.scrollY / available * 100)) : 0;
    document.documentElement.style.setProperty('--reading-progress', progress + '%');
    scrollTicking = false;
  };
  window.addEventListener('scroll', () => {
    if (!scrollTicking) {
      scrollTicking = true;
      window.requestAnimationFrame(updateReadingProgress);
    }
  }, { passive: true });
  window.addEventListener('resize', updateReadingProgress);
  updateReadingProgress();

  const copyButton = document.querySelector('.copy-email');
  const copyLabel = copyButton.querySelector('span');
  const status = document.getElementById('status-message');
  let copyTimeout;
  copyButton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText('rathnayakermbtm@gmail.com');
      copyLabel.textContent = 'Email copied';
      status.textContent = 'Email address copied to your clipboard.';
      clearTimeout(copyTimeout);
      copyTimeout = setTimeout(() => { copyLabel.textContent = 'Copy email'; }, 3000);
    } catch {
      copyLabel.textContent = 'Select email to copy';
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(document.querySelector('.email-link'));
      selection.removeAllRanges();
      selection.addRange(range);
      status.textContent = 'The email address is selected. Use your device copy command.';
    }
  });

  if ('IntersectionObserver' in window) {
    const navLinks = [...navigation.querySelectorAll('a[href^="#"]')];
    const observer = new IntersectionObserver((entries) => {
      const entry = entries.filter((item) => item.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!entry) return;
      navLinks.forEach((link) => {
        if (link.getAttribute('href') === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }, { rootMargin: '-12% 0px -64% 0px', threshold: 0 });
    document.querySelectorAll('main > section[id], main > section[id] > .container').forEach((section) => {
      if (section.id) observer.observe(section);
    });
  }
})();
