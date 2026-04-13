import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

const MQ_DESKTOP = window.matchMedia('(min-width: 900px)');

/* ─── Helpers ─────────────────────────────────────────────────────────── */

function toggleAllSections(navSections, expanded = false) {
  navSections
    ?.querySelectorAll('.nav-sections .default-content-wrapper > ul > li')
    .forEach((s) => s.setAttribute('aria-expanded', expanded));
}

function toggleMenu(nav, navSections, forceExpanded = null) {
  const isDesktop = MQ_DESKTOP.matches;
  const expanded =
    forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';

  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  nav.classList.toggle('nav-open', !expanded && !isDesktop);
  document.body.style.overflowY = !expanded && !isDesktop ? 'hidden' : '';

  toggleAllSections(navSections, expanded || isDesktop ? 'false' : 'true');

  const btn = nav.querySelector('.nav-hamburger button');
  if (btn) btn.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');

  navSections?.querySelectorAll('.nav-drop').forEach((drop) => {
    if (isDesktop) {
      if (!drop.hasAttribute('tabindex')) {
        drop.setAttribute('tabindex', 0);
        drop.addEventListener('focus', () =>
          drop.addEventListener('keydown', onNavDropKeydown)
        );
      }
    } else {
      drop.removeAttribute('tabindex');
    }
  });

  if (!expanded || isDesktop) {
    window.addEventListener('keydown', onEscapeKey);
    nav.addEventListener('focusout', onFocusLost);
  } else {
    window.removeEventListener('keydown', onEscapeKey);
    nav.removeEventListener('focusout', onFocusLost);
  }
}

/* ─── Event handlers ──────────────────────────────────────────────────── */

function onEscapeKey(e) {
  if (e.code !== 'Escape') return;
  const nav = document.getElementById('nav');
  const navSections = nav?.querySelector('.nav-sections');
  if (!navSections) return;

  const expanded = navSections.querySelector('[aria-expanded="true"]');
  if (expanded && MQ_DESKTOP.matches) {
    toggleAllSections(navSections);
    expanded.focus();
  } else if (!MQ_DESKTOP.matches) {
    toggleMenu(nav, navSections);
    nav.querySelector('button')?.focus();
  }
}

function onFocusLost(e) {
  const nav = e.currentTarget;
  if (nav.contains(e.relatedTarget)) return;
  const navSections = nav.querySelector('.nav-sections');
  if (!navSections) return;

  if (MQ_DESKTOP.matches) {
    toggleAllSections(navSections, false);
  } else {
    toggleMenu(nav, navSections, false);
  }
}

function onNavDropKeydown(e) {
  const focused = document.activeElement;
  if (focused.className !== 'nav-drop') return;
  if (e.code !== 'Enter' && e.code !== 'Space') return;

  const isExpanded = focused.getAttribute('aria-expanded') === 'true';
  toggleAllSections(focused.closest('.nav-sections'));
  focused.setAttribute('aria-expanded', isExpanded ? 'false' : 'true');
}

function buildLogos() {
  const desktop = document.createElement('img');
  desktop.src = '/icons/logo-ey-icon.svg';
  desktop.alt = 'EY – Shape the future with confidence';
  desktop.className = 'nav-logo nav-logo--desktop';

  const mobile = document.createElement('img');
  mobile.src = '/icons/ey-icon-small.svg';
  mobile.alt = 'EY';
  mobile.className = 'nav-logo nav-logo--mobile';
  
  return { desktop, mobile };
}

/* ─── Main decorator ──────────────────────────────────────────────────── */

export default async function decorate(block) {
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  ['brand', 'sections', 'tools'].forEach((cls, i) => {
    nav.children[i]?.classList.add(`nav-${cls}`);
  });

  // ── Brand / logos ──────────────────────────────────────────────────────
  const navBrand = nav.querySelector('.nav-brand');
  if (navBrand) {
    const brandLink = navBrand.querySelector('.button');
    if (brandLink) {
      brandLink.className = '';
      brandLink.closest('.button-container').className = '';
    }
    const { desktop, mobile } = buildLogos();
    navBrand.prepend(mobile);
    navBrand.prepend(desktop);
  }

  // ── Nav section dropdowns ──────────────────────────────────────────────
  const navSections = nav.querySelector('.nav-sections');
  navSections
    ?.querySelectorAll(':scope .default-content-wrapper > ul > li')
    .forEach((item) => {
      if (item.querySelector('ul')) item.classList.add('nav-drop');
      item.addEventListener('click', () => {
        if (!MQ_DESKTOP.matches) return;
        const isExpanded = item.getAttribute('aria-expanded') === 'true';
        toggleAllSections(navSections);
        item.setAttribute('aria-expanded', isExpanded ? 'false' : 'true');
      });
    });

  // ── Hamburger ──────────────────────────────────────────────────────────
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `
    <button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav, navSections));
  nav.prepend(hamburger);

  // ── Init ───────────────────────────────────────────────────────────────
  nav.setAttribute('aria-expanded', 'false');
  toggleMenu(nav, navSections, MQ_DESKTOP.matches);
  MQ_DESKTOP.addEventListener('change', () => {
    if (MQ_DESKTOP.matches) {
      nav.classList.remove('nav-open');
      document.body.style.overflowY = '';
    }
    toggleMenu(nav, navSections, MQ_DESKTOP.matches);
  });

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.textContent = '';
  block.append(navWrapper);
}