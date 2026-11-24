/**
 * Application entry point — hash-based deep linking (#now, #how, #famous/crowdstrike),
 * dark/light theme persistence (defaults to dark), and global progressive disclosure handler.
 */

import { initHeroCanvas } from './heroCanvas.js';
import { initNowView } from './views/nowView.js';
import { initHowView } from './views/howView.js';
import { initFamousView } from './views/famousView.js';

const VALID_VIEWS = new Set(['home', 'now', 'how', 'famous']);
let currentView = 'home';

const heroCanvas = initHeroCanvas(() => currentView);
const nowView = initNowView();
const howView = initHowView(() => currentView);
const famousView = initFamousView((slug) => {
  if (location.hash !== `#famous/${slug}`) {
    history.replaceState(null, '', `#famous/${slug}`);
  }
});

function openView(name, { updateHash = true, famousSlug = null } = {}) {
  const target = VALID_VIEWS.has(name) ? name : 'home';
  currentView = target;

  document.querySelectorAll('.view').forEach((v) => {
    v.classList.toggle('active', v.id === `view-${target}`);
  });

  document.querySelectorAll('.nav-link').forEach((link) => {
    link.classList.toggle('active', link.dataset.nav === target);
  });

  if (updateHash) {
    const hash =
      target === 'home'
        ? '#home'
        : target === 'famous' && famousSlug
          ? `#famous/${famousSlug}`
          : `#${target}`;
    if (location.hash !== hash) {
      history.pushState(null, '', hash);
    }
  }

  window.scrollTo({ top: 0, behavior: 'auto' });

  if (target === 'home') heroCanvas.resize();
  if (target === 'now') nowView.render();
  if (target === 'how') {
    howView.renderStage();
    howView.renderDots();
  }
  if (target === 'famous') {
    if (famousSlug) famousView.selectBySlug(famousSlug);
    else famousView.render();
  }
}

function parseHash() {
  const raw = location.hash.replace(/^#\/?/, '').trim();
  if (!raw || raw === 'home') return { view: 'home', slug: null };
  const [view, slug] = raw.split('/');
  if (VALID_VIEWS.has(view)) return { view, slug: slug || null };
  return { view: 'home', slug: null };
}

// Navigation buttons & links with data-open-view
document.addEventListener('click', (e) => {
  const navTarget = e.target.closest('[data-open-view]');
  if (navTarget) {
    e.preventDefault();
    openView(navTarget.dataset.openView);
    return;
  }

  // Global progressive disclosure handler
  const discBtn = e.target.closest('[data-disclosure]');
  if (discBtn) {
    e.stopPropagation();
    const expanded = discBtn.getAttribute('aria-expanded') === 'true';
    discBtn.setAttribute('aria-expanded', String(!expanded));
    const body = discBtn.nextElementSibling;
    if (body) body.classList.toggle('open', !expanded);
  }
});

// Browser back/forward & deep links
window.addEventListener('hashchange', () => {
  const { view, slug } = parseHash();
  openView(view, { updateHash: false, famousSlug: slug });
});

// Theme toggle (defaults to dark mode, remembers user choice)
const themeBtn = document.getElementById('theme-toggle');
const sunIcon = document.getElementById('icon-sun');
const moonIcon = document.getElementById('icon-moon');

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  if (sunIcon && moonIcon) {
    sunIcon.classList.toggle('hidden', theme === 'light');
    moonIcon.classList.toggle('hidden', theme !== 'light');
  }
}

const savedTheme = (() => {
  try {
    return localStorage.getItem('invisible-fires-theme');
  } catch {
    return null;
  }
})();
applyTheme(savedTheme === 'light' ? 'light' : 'dark');

if (themeBtn) {
  themeBtn.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    applyTheme(next);
    try {
      localStorage.setItem('invisible-fires-theme', next);
    } catch {
      // Ignore storage errors in private browsing
    }
  });
}

// Initial route boot
const initial = parseHash();
openView(initial.view, { updateHash: false, famousSlug: initial.slug });
