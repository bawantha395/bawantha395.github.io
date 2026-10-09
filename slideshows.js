(() => {
  'use strict';
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const controllers = [];

  document.querySelectorAll('[data-slideshow]').forEach(gallery => {
    let slides;
    try { slides = JSON.parse(gallery.querySelector('.slideshow-data').textContent); }
    catch { return; }
    if (!Array.isArray(slides) || !slides.length) return;

    const stage = gallery.querySelector('.slideshow-stage');
    const image = gallery.querySelector('.slideshow-image');
    const title = gallery.querySelector('.slideshow-title');
    const caption = gallery.querySelector('.slideshow-description');
    const position = gallery.querySelector('.slideshow-position');
    const state = gallery.querySelector('.slideshow-state');
    const toggle = gallery.querySelector('[data-slide-action="toggle"]');
    const enlarge = gallery.querySelector('[data-slide-action="fullscreen"]');
    const announcement = gallery.querySelector('.slideshow-announcement');
    const progress = gallery.querySelector('.slideshow-progress span');
    const error = gallery.querySelector('.slideshow-error');
    const heading = gallery.querySelector('h4').textContent;
    const interval = Math.max(3000, Number(gallery.dataset.interval) || 6000);
    gallery.style.setProperty('--slide-duration', `${interval}ms`);

    let current = 0, timer = null, visible = false;
    let paused = motion.matches || gallery.dataset.autoplay === 'false', hovered = false, focused = false;
    let fullscreenFallback = false;
    const isFullscreen = () => document.fullscreenElement === gallery || fullscreenFallback;
    const canPlay = () => !motion.matches && !paused && !document.hidden && !gallery.closest('[hidden]') &&
      (isFullscreen() || (visible && !hovered && !focused));

    const preloadNext = () => {
      const nextImage = new Image();
      nextImage.src = slides[(current + 1) % slides.length].src;
    };
    const schedule = () => {
      clearTimeout(timer);
      timer = null;
      if (gallery.closest('[data-walkthrough][hidden]')) paused = true;
      const playing = canPlay();
      gallery.dataset.playing = String(playing);
      toggle.textContent = paused ? 'Play' : 'Pause';
      toggle.setAttribute('aria-pressed', String(paused));
      toggle.setAttribute('aria-label', `${paused ? 'Play' : 'Pause'} ${heading}`);
      toggle.disabled = motion.matches;
      state.textContent = motion.matches ? 'Manual view' : (paused ? 'Paused' : (playing ? 'Playing' : 'Ready'));
      progress.style.animation = 'none';
      if (playing) {
        void progress.offsetWidth;
        progress.style.animation = '';
        preloadNext();
        timer = setTimeout(() => { render(current + 1); schedule(); }, interval);
      }
    };
    const render = (index, manual = false) => {
      current = (index + slides.length) % slides.length;
      const slide = slides[current];
      error.hidden = true;
      image.src = slide.src;
      image.alt = `${slide.title}. ${slide.caption}`;
      image.dataset.slideIndex = String(current);
      title.textContent = slide.title;
      caption.textContent = slide.caption;
      position.textContent = `${current + 1} / ${slides.length}`;
      const label = `Slide ${current + 1} of ${slides.length}`;
      stage.setAttribute('aria-label', label);
      position.setAttribute('aria-label', label);
      if (manual) announcement.textContent = `${label}: ${slide.title}`;
    };

    image.addEventListener('error', () => { error.hidden = false; });
    image.addEventListener('load', () => { error.hidden = true; });
    gallery.querySelector('[data-slide-action="previous"]').addEventListener('click', () => {
      render(current - 1, true); schedule();
    });
    gallery.querySelector('[data-slide-action="next"]').addEventListener('click', () => {
      render(current + 1, true); schedule();
    });
    toggle.addEventListener('click', () => {
      if (motion.matches) return;
      paused = !paused;
      // An explicit Play action should start even while its button has focus.
      if (!paused) { hovered = false; focused = false; }
      schedule();
    });

    const updateFullscreen = () => {
      const enlarged = isFullscreen();
      enlarge.textContent = enlarged ? 'Exit Full Screen' : 'Full Screen';
      enlarge.setAttribute('aria-label', `${enlarged ? 'Exit full screen for' : 'Show in full screen:'} ${heading}`);
      gallery.classList.toggle('is-enlarged', enlarged);
      schedule();
    };
    const exitFallback = () => {
      fullscreenFallback = false;
      document.body.classList.remove('slideshow-enlarged');
      updateFullscreen();
      enlarge.focus();
    };
    enlarge.addEventListener('click', async () => {
      if (fullscreenFallback) { exitFallback(); return; }
      if (document.fullscreenElement === gallery) {
        await document.exitFullscreen();
        return;
      }
      if (document.fullscreenElement) await document.exitFullscreen();
      try {
        if (!gallery.requestFullscreen) throw new Error('Fullscreen is unavailable');
        await gallery.requestFullscreen();
      } catch {
        // Safari and embedded browsers can use the same single-image overlay.
        fullscreenFallback = true;
        document.body.classList.add('slideshow-enlarged');
        updateFullscreen();
      }
    });
    document.addEventListener('fullscreenchange', updateFullscreen);
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && fullscreenFallback) exitFallback();
    });

    gallery.addEventListener('mouseenter', () => { hovered = true; schedule(); });
    gallery.addEventListener('mouseleave', () => { hovered = false; schedule(); });
    gallery.addEventListener('focusin', () => { focused = true; schedule(); });
    gallery.addEventListener('focusout', () => {
      queueMicrotask(() => { focused = gallery.contains(document.activeElement); schedule(); });
    });
    gallery.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        render(current + (event.key === 'ArrowLeft' ? -1 : 1), true);
        schedule();
      }
      if (event.key === 'Tab' && fullscreenFallback) {
        const buttons = [...gallery.querySelectorAll('button')];
        const first = buttons[0], last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    });

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        visible = entries[0].isIntersecting;
        schedule();
      }, {threshold: 0.1});
      observer.observe(stage);
    } else {
      const checkViewport = () => {
        const bounds = stage.getBoundingClientRect();
        visible = bounds.bottom > 0 && bounds.top < innerHeight;
        schedule();
      };
      window.addEventListener('scroll', checkViewport, {passive: true});
      window.addEventListener('resize', checkViewport);
      checkViewport();
    }
    document.addEventListener('visibilitychange', schedule);
    motion.addEventListener('change', event => { if (event.matches) paused = true; schedule(); });
    render(0);
    schedule();
    controllers.push({schedule, exit: () => { if (fullscreenFallback) exitFallback(); }});
  });

  // Navigation and category filters must never keep hidden project slides playing.
  const observer = new MutationObserver(() => controllers.forEach(controller => controller.schedule()));
  document.querySelectorAll('[data-page], [data-filter-category], [data-walkthrough]').forEach(node => {
    observer.observe(node, {attributes: true, attributeFilter: ['hidden']});
  });
})();
