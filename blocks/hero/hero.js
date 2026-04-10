/**
 * loads and decorates the hero block
 * @param {Element} block The hero block element
 */
export default function decorate(block) {
  const imageSrc = '/blocks/images/template1-hero.jpg';
  const eyebrowHTML = 'COMPANY NAME + EY';
  const title = 'Strengthened by purpose, driven by vision';
  const descriptionHTML = '20XX year in review';
  const buttonLabel = 'Start the journey';
  const buttonHref = 'https://www.google.com';

  if (imageSrc) {
    block.style.setProperty('--hero-background-image', `url("${imageSrc}")`);
  }

  const content = document.createElement('div');
  content.className = 'hero-content';

  if (eyebrowHTML) {
    const eyebrow = document.createElement('p');
    eyebrow.className = 'hero-eyebrow';
    eyebrow.innerHTML = eyebrowHTML;
    content.append(eyebrow);
  }

  if (title) {
    const heading = document.createElement('h1');
    heading.className = 'hero-title';
    heading.textContent = title;
    content.append(heading);
  }

  if (descriptionHTML) {
    const description = document.createElement('div');
    description.className = 'hero-description';
    description.innerHTML = descriptionHTML;
    content.append(description);
  }

  if (buttonLabel && buttonHref) {
    const cta = document.createElement('a');
    cta.className = 'hero-cta';
    cta.href = buttonHref;
    cta.textContent = buttonLabel;
    content.append(cta);
  }

  block.replaceChildren(content);
}
