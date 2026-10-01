/*
  SHOE INTERACTIVE DEMO
  ---------------------
  Pure vanilla JS. No framework, no build step.

  The important product decision is that the last Reel frame is the FIRST webpage visual.
  The Reel itself is therefore never replayed from 0:00.
*/

(() => {
  'use strict';

  // ================================
  // EASY EXPERIMENT CONSTANTS
  // ================================
  const HANDOFF_DELAY = 300;            // ms after hero is painted before the continuation starts
  const CONTINUATION_DURATION = 800;    // ms for the tiny camera push
  const INTERACTION_REVEAL_DELAY = 650; // ms after continuation starts before the experience is tappable

  // Image composition controls. Start with 1 / 0 / 0 to preserve the source frame exactly.
  // IMAGE_X and IMAGE_Y are pixels. Positive X moves right; positive Y moves down.
  const IMAGE_SCALE = 1.000;
  const IMAGE_X = 0;
  const IMAGE_Y = 0;

  // Small product-response controls.
  const TAP_HIGHLIGHT_DURATION = 220;

  // Debug mode: /?debug=1
  const DEBUG_MODE = new URLSearchParams(window.location.search).get('debug') === '1';

  const STATES = Object.freeze({
    BOOT: 'BOOT',
    HERO_VISIBLE: 'HERO_VISIBLE',
    HANDOFF: 'HANDOFF',
    INTERACTIVE_READY: 'INTERACTIVE_READY',
    PRODUCT_TAPPED: 'PRODUCT_TAPPED',
    COLOUR_SELECTED: 'COLOUR_SELECTED',
    SHOP: 'SHOP'
  });

  let state = STATES.BOOT;
  const startedAt = performance.now();
  let heroLoadedAt = null;
  let heroDecodedAt = null;
  let interactiveAt = null;
  let selectedColor = 'white';

  const visual = document.getElementById('visual');
  const heroImage = document.getElementById('heroImage');
  const recolorLayer = document.getElementById('recolorLayer');
  const shoeHotspot = document.getElementById('shoeHotspot');
  const hint = document.getElementById('hint');
  const controls = document.getElementById('controls');
  const closeControls = document.getElementById('closeControls');
  const shopButton = document.getElementById('shopButton');
  const debug = document.getElementById('debug');
  const swatches = [...document.querySelectorAll('.swatch')];

  visual.style.setProperty('--continuation-duration', `${CONTINUATION_DURATION}ms`);
  document.documentElement.style.setProperty('--image-scale', String(IMAGE_SCALE));
  document.documentElement.style.setProperty('--image-x', `${IMAGE_X}px`);
  document.documentElement.style.setProperty('--image-y', `${IMAGE_Y}px`);

  function setState(nextState) {
    state = nextState;
    visual.dataset.state = state;

    visual.classList.toggle('is-continuing', state === STATES.HANDOFF || state === STATES.INTERACTIVE_READY || state === STATES.PRODUCT_TAPPED || state === STATES.COLOUR_SELECTED);
    visual.classList.toggle('is-ready', state === STATES.INTERACTIVE_READY || state === STATES.PRODUCT_TAPPED || state === STATES.COLOUR_SELECTED);
    visual.classList.toggle('is-exploring', state === STATES.PRODUCT_TAPPED || state === STATES.COLOUR_SELECTED || state === STATES.SHOP);

    if (state !== STATES.INTERACTIVE_READY) {
      hint.setAttribute('aria-hidden', 'true');
    } else {
      hint.setAttribute('aria-hidden', 'false');
    }

    const controlsVisible = state === STATES.PRODUCT_TAPPED || state === STATES.COLOUR_SELECTED || state === STATES.SHOP;
    controls.setAttribute('aria-hidden', String(!controlsVisible));
  }

  function activateHero() {
    setState(STATES.HERO_VISIBLE);

    window.setTimeout(() => {
      setState(STATES.HANDOFF);

      window.setTimeout(() => {
        interactiveAt = performance.now();
        setState(STATES.INTERACTIVE_READY);
        updateDebug();
      }, INTERACTION_REVEAL_DELAY);
    }, HANDOFF_DELAY);
  }

  function markHeroReady() {
    heroLoadedAt = performance.now();

    // decode() gives us a better signal than load alone: the image has actually been decoded.
    const decodePromise = typeof heroImage.decode === 'function'
      ? heroImage.decode().catch(() => undefined)
      : Promise.resolve();

    decodePromise.finally(() => {
      heroDecodedAt = performance.now();

      // Only the actual hero frame controls the handoff. Nothing waits for the Reel/video.
      if (state === STATES.BOOT) {
        requestAnimationFrame(() => activateHero());
      }
      updateDebug();
    });
  }

  function productTap() {
    if (state !== STATES.INTERACTIVE_READY) return;

    // Tiny visual response — no modal, no card, no page change.
    recolorLayer.classList.remove('is-black', 'is-white', 'is-red');
    recolorLayer.classList.add('is-highlighted');
    window.setTimeout(() => recolorLayer.classList.remove('is-highlighted'), TAP_HIGHLIGHT_DURATION);

    setState(STATES.PRODUCT_TAPPED);
    requestAnimationFrame(() => {
      const active = document.querySelector('.swatch.is-active');
      active?.focus({ preventScroll: true });
    });
    updateDebug();
  }

  function chooseColor(color) {
    selectedColor = color;

    swatches.forEach((button) => {
      const isActive = button.dataset.color === color;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });

    recolorLayer.classList.remove('is-highlighted', 'is-black', 'is-white', 'is-red');
    recolorLayer.classList.add(`is-${color}`);

    setState(STATES.COLOUR_SELECTED);
    updateDebug();
  }

  function closeProductControls() {
    recolorLayer.classList.remove('is-highlighted', 'is-black', 'is-red');
    recolorLayer.classList.add('is-white');
    selectedColor = 'white';

    swatches.forEach((button) => {
      const isActive = button.dataset.color === 'white';
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });

    setState(STATES.INTERACTIVE_READY);
    updateDebug();
  }

  function goToShop() {
    setState(STATES.SHOP);
    updateDebug();

    // Prototype behavior only. Replace this with the real product URL later.
    window.setTimeout(() => {
      window.alert(`Shop flow placeholder — selected ${selectedColor.toUpperCase()}.`);
      setState(STATES.COLOUR_SELECTED);
    }, 80);
  }

  shoeHotspot.addEventListener('click', productTap, { passive: true });
  closeControls.addEventListener('click', closeProductControls, { passive: true });
  shopButton.addEventListener('click', goToShop, { passive: true });

  swatches.forEach((button) => {
    button.addEventListener('click', () => chooseColor(button.dataset.color), { passive: true });
  });

  heroImage.addEventListener('error', () => {
    // The user supplied image is supposed to exist at this path. Keep the fallback silent —
    // there is no spinner or error overlay because that would violate the transition goal.
    updateDebug('hero image error');
  }, { once: true });

  if (heroImage.complete && heroImage.naturalWidth > 0) {
    markHeroReady();
  } else {
    heroImage.addEventListener('load', markHeroReady, { once: true });
  }

  // ================================
  // DEVELOPMENT VIDEO PRELOAD
  // ================================
  // The video is intentionally NOT inserted into the visible experience.
  // Later, if you add a true continuation clip, use it after the hero frame has painted.
  const preloadContinuationVideo = () => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.src = 'assets/reel.mp4';
    video.setAttribute('aria-hidden', 'true');
    video.style.display = 'none';
    document.body.appendChild(video);

    video.addEventListener('loadedmetadata', updateDebug, { once: true });
    video.addEventListener('error', () => updateDebug('reel.mp4 not found yet'), { once: true });
  };

  // Start loading the Reel in the background without allowing it to block first paint.
  window.setTimeout(preloadContinuationVideo, Math.max(700, HANDOFF_DELAY + 250));

  // ================================
  // DEBUG PANEL
  // ================================
  function getFirstContentfulPaint() {
    const entries = performance.getEntriesByName('first-contentful-paint');
    return entries.length ? entries[0].startTime : null;
  }

  function formatMs(value) {
    return value == null ? '—' : `${value.toFixed(0)} ms`;
  }

  function updateDebug(extra = '') {
    if (!DEBUG_MODE) return;

    const now = performance.now();
    const heroPaint = heroDecodedAt ?? heroLoadedAt;
    const tti = interactiveAt ? interactiveAt - startedAt : null;
    const fcp = getFirstContentfulPaint();

    debug.innerText = [
      `state: ${state}`,
      `hero loaded: ${heroLoadedAt != null ? 'YES' : 'NO'}`,
      `hero decoded: ${heroDecodedAt != null ? 'YES' : 'NO'}`,
      `video element: ${document.querySelector('video') ? 'YES' : 'NO'}`,
      `video ready: ${document.querySelector('video')?.readyState >= 1 ? 'YES' : 'NO'}`,
      `hero visual: ${formatMs(heroPaint)}`,
      `browser FCP: ${formatMs(fcp)}`,
      `time to interactive: ${formatMs(tti)}`,
      `handoff delay: ${HANDOFF_DELAY} ms`,
      `continuation: ${CONTINUATION_DURATION} ms`,
      `interaction reveal: ${INTERACTION_REVEAL_DELAY} ms`,
      extra ? `note: ${extra}` : ''
    ].filter(Boolean).join('\n');
  }

  if (DEBUG_MODE) {
    debug.classList.add('is-visible');
    debug.setAttribute('aria-hidden', 'false');
    updateDebug();

    const debugTimer = window.setInterval(updateDebug, 100);
    window.addEventListener('beforeunload', () => window.clearInterval(debugTimer), { once: true });
  }

  // Helpful for manual console testing.
  window.ShoeDemo = Object.freeze({
    STATES,
    getState: () => state,
    constants: {
      HANDOFF_DELAY,
      CONTINUATION_DURATION,
      INTERACTION_REVEAL_DELAY,
      IMAGE_SCALE,
      IMAGE_X,
      IMAGE_Y
    }
  });
})();
