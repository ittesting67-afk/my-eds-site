import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  const firstRow = block.querySelector(':scope > div:first-child');
  if (!firstRow) return;

  const imageCell = firstRow.querySelector(':scope > div:first-child');
  const nameCell = firstRow.querySelector(':scope > div:nth-child(2)');
  const positionCell = block.querySelector(':scope > div:nth-child(2) > div:first-child');

  const image = imageCell?.querySelector('img');
  const nameMarkup = nameCell?.innerHTML?.trim();
  const positionMarkup = positionCell?.innerHTML?.trim();
  if (!image && !nameMarkup && !positionMarkup) return;

  const card = document.createElement('article');
  card.className = 'profile-card-item';

  if (image?.src) {
    const media = document.createElement('div');
    media.className = 'profile-card-media';
    media.append(createOptimizedPicture(image.src, image.alt || '', false, [{ width: '200' }]));
    card.append(media);
  }

  const content = document.createElement('div');
  content.className = 'profile-card-content';

  if (nameMarkup) {
    const name = document.createElement('div');
    name.className = 'profile-card-name';
    name.innerHTML = nameMarkup;
    content.append(name);
  }

  if (positionMarkup) {
    const position = document.createElement('div');
    position.className = 'profile-card-position';
    position.innerHTML = positionMarkup;
    content.append(position);
  }

  if (content.children.length) card.append(content);
  block.replaceChildren(card);
}
