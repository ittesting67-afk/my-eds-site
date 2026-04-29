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
