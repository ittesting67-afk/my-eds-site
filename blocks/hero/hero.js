export default function decorate(block) {
  const rows = [...block.children];
  const cells = rows.map((row) => row.querySelector(':scope > div') || row);
  const text = (i) => cells[i]?.textContent?.trim() || '';
  const href = (i) => cells[i]?.querySelector('a[href]')?.getAttribute('href') || text(i);
  const validHref = (value) => /^(https?:\/\/|\/|\.\/|\.\.\/|#|mailto:|tel:)/i.test(value || '');
  const toCta = (label, url, secondary = false) => {
    if (!label || !validHref(url)) return null;
    const cta = document.createElement('a');
    cta.className = secondary ? 'hero-cta secondary' : 'hero-cta';
    cta.href = url;
    cta.textContent = label;
    try {
      if (new URL(url, window.location.href).origin !== window.location.origin) {
        cta.target = '_blank';
        cta.rel = 'noopener noreferrer';
      }
    } catch {
      // ignore invalid authored urls
    }
    return cta;
  };

  const heroImage = cells[0]?.querySelector('picture img');
  const backgroundSrc = heroImage?.currentSrc || heroImage?.src;
  if (backgroundSrc) {
    block.style.setProperty('--hero-background-image', `url("${backgroundSrc}")`);
    heroImage.loading = 'eager';
    heroImage.fetchPriority = 'high';
  }
  if (heroImage && text(1)) heroImage.setAttribute('alt', text(1));

  const content = document.createElement('div');
  content.className = 'hero-content';
  const usesMappedRows = [2, 3, 4, 5, 7].some((i) => text(i));

  if (usesMappedRows) {
    if (text(2)) {
      const eyebrow = document.createElement('p');
      eyebrow.className = 'hero-eyebrow';
      eyebrow.textContent = text(2);
      content.append(eyebrow);
    }

    const headingSource = cells[3]?.querySelector('h1, h2, h3, h4, h5, h6');
    if (headingSource) {
      headingSource.classList.add('hero-title');
      content.append(headingSource);
    } else if (text(3)) {
      const title = document.createElement('h1');
      title.className = 'hero-title';
      title.textContent = text(3);
      content.append(title);
    }

    if (text(4)) {
      const description = document.createElement('div');
      description.className = 'hero-description';
      description.innerHTML = cells[4].innerHTML;
      content.append(description);
    }

    const primary = toCta(text(5), href(6));
    const secondary = toCta(text(7), href(8), true);
    if (primary || secondary) {
      const actions = document.createElement('div');
      actions.className = 'hero-actions';
      if (primary) actions.append(primary);
      if (secondary) actions.append(secondary);
      content.append(actions);
    }
  } else {
    const sourceRow = rows.find(
      (row) => !row.querySelector('picture img') && row.querySelector('p, h1, h2, h3, h4, h5, h6, a'),
    ) || rows.find((row) => row.querySelector('p, h1, h2, h3, h4, h5, h6, a'));
    const source = sourceRow?.querySelector(':scope > div') || sourceRow;
    const nodes = source ? [...source.children].filter((node) => node.tagName !== 'PICTURE') : [];

    if (nodes.length > 1 && !/^H[1-6]$/.test(nodes[0].tagName)) {
      nodes[0].classList.add('hero-eyebrow');
      content.append(nodes.shift());
    }

    const titleNode = nodes.shift();
    if (titleNode) {
      if (/^H[1-6]$/.test(titleNode.tagName)) {
        titleNode.classList.add('hero-title');
        content.append(titleNode);
      } else {
        const title = document.createElement('h1');
        title.className = 'hero-title';
        title.innerHTML = titleNode.innerHTML;
        content.append(title);
      }
    }

    const ctaSource = [...nodes].reverse().find((node) => {
      const link = node.querySelector('a[href]');
      return link && node.textContent.trim() === link.textContent.trim();
    });

    const descriptionNodes = nodes.filter((node) => node !== ctaSource);
    if (descriptionNodes.length) {
      const description = document.createElement('div');
      description.className = 'hero-description';
      descriptionNodes.forEach((node) => description.append(node));
      content.append(description);
    }

    if (ctaSource) {
      const cta = ctaSource.querySelector('a[href]');
      cta.classList.add('hero-cta');
      content.append(cta);
    }
  }

  block.replaceChildren(content);
}
