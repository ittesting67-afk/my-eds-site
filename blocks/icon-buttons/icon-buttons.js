import { decorateIcons } from '../../scripts/aem.js';

export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  const imageRow = rows.shift();
  const picture = imageRow?.querySelector('picture');
  if (!picture) return;

  const media = document.createElement('div');
  media.className = 'icon-buttons-media';
  media.append(picture);

  const list = document.createElement('div');
  list.className = 'icon-buttons-list';

  rows.forEach((row) => {
    const [iconCell, labelCell] = [...row.children];
    const iconContent = iconCell?.querySelector(':scope > .icon, :scope > img, :scope > svg, :scope > p > .icon, :scope > p > img, :scope > p > svg')
      || iconCell?.firstElementChild
      || iconCell;
    const labelMarkup = labelCell?.innerHTML?.trim();
    if (!iconContent && !labelMarkup) return;

    const item = document.createElement('article');
    item.className = 'icon-buttons-item';

    const icon = document.createElement('div');
    icon.className = 'icon-buttons-icon';
    if (iconContent) icon.append(iconContent);

    const label = document.createElement('p');
    label.className = 'icon-buttons-label';
    label.innerHTML = labelMarkup || '';

    item.append(icon, label);
    list.append(item);
  });

  block.replaceChildren(media, list);
  decorateIcons(block);

  block.querySelectorAll('.icon-buttons-icon .icon img').forEach((img) => {
    img.width = 80;
    img.height = 80;
  });
}
