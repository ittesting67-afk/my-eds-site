import { loadBlock, toClassName } from '../../scripts/aem.js';

let accordionIdx = 0;

function toggleAccordion(e) {
  const button = e.currentTarget;
  const panelId = button.getAttribute('aria-controls');
  const panel = document.getElementById(panelId);
  const expanded = button.getAttribute('aria-expanded') === 'true';

  button.setAttribute('aria-expanded', String(!expanded));
  if (panel) panel.hidden = expanded;

  button.closest('.accordion-item')?.classList.toggle('is-open', !expanded);
}

export default async function decorate(block) {
  const accordionSections = [];
  const section = block.closest('.section');
  if (section?.classList?.contains('accordion-container')) {
    const hasColumnLeft = block.classList.contains('column-left');
    const hasColumnRight = block.classList.contains('column-right');
    const hasColumnLayout = hasColumnLeft || hasColumnRight;

    // Only turn on the desktop two-column layout when explicitly authored.
    section.classList.toggle('has-column-layout', hasColumnLayout);
    section.classList.toggle('is-accordion-left', hasColumnLeft);

    // Create a single wrapper that controls max-width + grid layout.
    if (hasColumnLayout) {
      const existingInner = section.querySelector(':scope > .accordion-columns-inner');
      if (!existingInner) {
        const defaultContent = section.querySelector(':scope > .default-content-wrapper');
        const accordionWrapper = section.querySelector(':scope > .accordion-wrapper');
        if (defaultContent && accordionWrapper) {
          const inner = document.createElement('div');
          inner.className = 'accordion-columns-inner';
          inner.append(defaultContent, accordionWrapper);
          section.append(inner);
        }
      }
    }
  }

  let nextSection = section.nextElementSibling;
  while (nextSection) {
    const { accordionItemLabel } = nextSection.dataset;

    if (accordionItemLabel) {
      accordionSections.push([accordionItemLabel, nextSection]);
      nextSection = nextSection.nextElementSibling;
    } else {
      break;
    }
  }

  const accordionPrefix = `accordion-${++accordionIdx}`;
  const accordion = document.createElement('div');
  accordion.className = 'accordion';
  const panelBlocks = [];

  accordionSections.forEach(([label, sourceSection], i) => {
    const isOpenByDefault = i === 0;
    const safeLabel = toClassName(label);
    const buttonId = `${accordionPrefix}-button-${safeLabel}-${i}`;
    const panelId = `${accordionPrefix}-panel-${safeLabel}-${i}`;

    const item = document.createElement('div');
    item.className = 'accordion-item';

    const heading = document.createElement('h3');
    heading.className = 'accordion-heading';

    const button = document.createElement('button');
    button.type = 'button';
    button.id = buttonId;
    button.className = 'accordion-trigger';
    button.setAttribute('aria-expanded', String(isOpenByDefault));
    button.setAttribute('aria-controls', panelId);
    button.textContent = label;
    button.addEventListener('click', toggleAccordion);

    heading.appendChild(button);

    const panel = document.createElement('div');
    panel.id = panelId;
    panel.className = 'accordion-panel';
    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-labelledby', buttonId);
    panel.hidden = !isOpenByDefault;

    [...sourceSection.children].forEach((child) => {
      panel.appendChild(child);
    });
    panelBlocks.push(...panel.querySelectorAll('div.block'));

    sourceSection.remove();

    item.classList.toggle('is-open', isOpenByDefault);
    item.append(heading, panel);
    accordion.appendChild(item);
  });

  block.replaceChildren(accordion);

  await Promise.all(
    [...new Set(panelBlocks)].map((panelBlock) => loadBlock(panelBlock)),
  );
}
