function getCell(rows, index) {
  return rows[index]?.querySelector(':scope > div') || null;
}

function getCellText(cell) {
  return cell?.textContent?.trim() || '';
}

function getHref(cell) {
  const authoredLink = cell?.querySelector('a[href]');
  if (authoredLink) return authoredLink.getAttribute('href');
  return getCellText(cell);
}

function isLikelyHref(value) {
  if (!value) return false;
  return /^(https?:\/\/|\/|\.\/|\.\.\/|#|mailto:|tel:)/i.test(value.trim());
}

function isExternalUrl(href) {
  try {
    const url = new URL(href, window.location.href);
    return url.origin !== window.location.origin;
  } catch {
    return false;
  }
}

function createCta(text, href, variant) {
  if (!text || !href || !isLikelyHref(href)) return null;
  const cta = document.createElement('a');
  cta.className = 'hero-cta';
  if (variant === 'secondary') cta.classList.add('secondary');
  cta.href = href;
  cta.textContent = text;
  if (isExternalUrl(href)) {
    cta.target = '_blank';
    cta.rel = 'noopener noreferrer';
  }
  return cta;
}

function decorateFromSimpleContent(rows, content) {
  const imageRow = rows.find((row) => row.querySelector('picture img'));
  const contentRow = rows.find(
    (row) => row !== imageRow && row.querySelector('p, h1, h2, h3, h4, h5, h6, a'),
  ) || rows.find((row) => row.querySelector('p, h1, h2, h3, h4, h5, h6, a'));
  const contentCell = contentRow?.querySelector(':scope > div') || contentRow;
  const contentNodes = contentCell
    ? [...contentCell.children].filter((node) => node.tagName !== 'PICTURE')
    : [];

  if (!contentNodes.length) return;

  const isHeading = (el) => /^H[1-6]$/.test(el.tagName);
  let titleIndex = 0;

  if (contentNodes.length > 1 && !isHeading(contentNodes[0])) {
    contentNodes[0].classList.add('hero-eyebrow');
    content.append(contentNodes[0]);
    titleIndex = 1;
  }

  const titleSource = contentNodes[titleIndex];
  if (titleSource) {
    if (isHeading(titleSource)) {
      titleSource.classList.add('hero-title');
      content.append(titleSource);
    } else {
      const heading = document.createElement('h1');
      heading.className = 'hero-title';
      heading.innerHTML = titleSource.innerHTML;
      content.append(heading);
    }
  }

  const ctaSource = [...contentNodes].reverse().find((node) => {
    const links = node.querySelectorAll('a[href]');
    return links.length === 1 && node.textContent.trim() === links[0].textContent.trim();
  });

  const descriptionNodes = contentNodes.filter((node, index) => index > titleIndex && node !== ctaSource);
  if (descriptionNodes.length) {
    const description = document.createElement('div');
    description.className = 'hero-description';
    descriptionNodes.forEach((node) => {
      description.append(node);
    });
    content.append(description);
  }

  if (ctaSource) {
    const cta = ctaSource.querySelector('a[href]');
    cta.classList.add('hero-cta');
    content.append(cta);
  }
}

/**
 * loads and decorates the hero block
 * @param {Element} block The hero block element
 */
export default function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  const imageCell = getCell(rows, 0);
  const imageAltCell = getCell(rows, 1);
  const eyebrowCell = getCell(rows, 2);
  const titleCell = getCell(rows, 3);
  const descriptionCell = getCell(rows, 4);
  const primaryTextCell = getCell(rows, 5);
  const primaryHrefCell = getCell(rows, 6);
  const secondaryTextCell = getCell(rows, 7);
  const secondaryHrefCell = getCell(rows, 8);

  const picture = imageCell?.querySelector('picture');
  const heroImage = picture?.querySelector('img');
  const backgroundSrc = heroImage?.currentSrc || heroImage?.src;
  if (backgroundSrc) {
    block.style.setProperty('--hero-background-image', `url("${backgroundSrc}")`);
    heroImage.loading = 'eager';
    heroImage.fetchPriority = 'high';
  }

  const authoredAlt = getCellText(imageAltCell);
  if (heroImage && authoredAlt) {
    heroImage.setAttribute('alt', authoredAlt);
  }

  const content = document.createElement('div');
  content.className = 'hero-content';

  const hasIndexedContent = !!(
    getCellText(eyebrowCell)
    || getCellText(titleCell)
    || getCellText(descriptionCell)
    || getCellText(primaryTextCell)
    || getCellText(secondaryTextCell)
  );

  if (!hasIndexedContent) {
    decorateFromSimpleContent(rows, content);
    block.replaceChildren(content);
    return;
  }

  if (getCellText(eyebrowCell)) {
    const eyebrow = document.createElement('p');
    eyebrow.className = 'hero-eyebrow';
    eyebrow.textContent = getCellText(eyebrowCell);
    content.append(eyebrow);
  }

  if (titleCell) {
    const headingSource = titleCell.querySelector('h1, h2, h3, h4, h5, h6');
    if (headingSource) {
      headingSource.classList.add('hero-title');
      content.append(headingSource);
    } else if (getCellText(titleCell)) {
      const heading = document.createElement('h1');
      heading.className = 'hero-title';
      heading.textContent = getCellText(titleCell);
      content.append(heading);
    }
  }

  if (descriptionCell && getCellText(descriptionCell)) {
    const description = document.createElement('div');
    description.className = 'hero-description';
    description.innerHTML = descriptionCell.innerHTML;
    content.append(description);
  }

  const primaryCta = createCta(getCellText(primaryTextCell), getHref(primaryHrefCell), 'primary');
  const secondaryCta = createCta(getCellText(secondaryTextCell), getHref(secondaryHrefCell), 'secondary');
  if (primaryCta || secondaryCta) {
    const actions = document.createElement('div');
    actions.className = 'hero-actions';
    if (primaryCta) actions.append(primaryCta);
    if (secondaryCta) actions.append(secondaryCta);
    content.append(actions);
  }

  block.replaceChildren(content);
}
