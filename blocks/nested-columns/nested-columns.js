import { loadBlock } from '../../scripts/aem.js';

function getNestedColumnSide(section) {
  if (!section?.dataset) return null;
  if (section.dataset.nestedColumnLeft) return 'left';
  if (section.dataset.nestedColumnRight) return 'right';
  return null;
}

function isSection(el) {
  return el && el.classList && el.classList.contains('section');
}

function isSkippableEmptySection(section) {
  // AEM authoring sometimes injects empty `<div class="section">` nodes between
  // the nested-columns container section and the left/right sections.
  // If a section has no nested-column metadata and no authored content,
  // we can safely ignore it while scanning.
  if (!isSection(section)) return false;
  if (getNestedColumnSide(section)) return false;
  return section.innerHTML.trim() === '';
}

/**
 * Decorates a nested-columns block by grouping adjacent sections
 * into left/right columns based on section dataset attributes.
 *
 * The expected authoring contract matches `accordion`:
 * - `nested-columns` sits inside its own `.section`
 * - adjacent sibling `.section` elements carry
 *   `data-nested-column-left="true"` or `data-nested-column-right="true"`
 * - nested blocks (including `accordion`) remain inside their sections
 *   so their own sibling-based logic can still work.
 *
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const containerSection = block.closest('.section');
  if (!containerSection) return;

  const containerSide = getNestedColumnSide(containerSection);
  const directChildren = [...containerSection.children].filter(
    (child) => child !== block.parentElement && !isSection(child),
  );
  const directChildrenBlocks = directChildren.flatMap((el) => [...el.querySelectorAll('div.block')]);

  // Collect contiguous sibling sections with nested-column metadata.
  // Stop at the first non-matching `.section` in each direction.
  const adjacentSections = [];

  let cursor = containerSection.previousElementSibling;
  while (isSection(cursor)) {
    const side = getNestedColumnSide(cursor);
    if (side) {
      adjacentSections.unshift(cursor);
      cursor = cursor.previousElementSibling;
    } else if (isSkippableEmptySection(cursor)) {
      cursor = cursor.previousElementSibling;
    } else {
      break;
    }
  }

  cursor = containerSection.nextElementSibling;
  while (isSection(cursor)) {
    const side = getNestedColumnSide(cursor);
    if (side) {
      adjacentSections.push(cursor);
      cursor = cursor.nextElementSibling;
    } else if (isSkippableEmptySection(cursor)) {
      cursor = cursor.nextElementSibling;
    } else {
      break;
    }
  }
  // If there are no adjacent column sections, we can still render using any
  // direct block wrappers in the container section.

  const leftSections = adjacentSections.filter((s) => getNestedColumnSide(s) === 'left');
  const rightSections = adjacentSections.filter((s) => getNestedColumnSide(s) === 'right');

  if (!leftSections.length && !rightSections.length && directChildren.length === 0) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'nested-columns';

  const leftColumn = document.createElement('div');
  leftColumn.className = 'nested-columns-col nested-columns-col-left';

  const rightColumn = document.createElement('div');
  rightColumn.className = 'nested-columns-col nested-columns-col-right';

  const blocksToLoad = new Set([...directChildrenBlocks]);

  // When direct block wrappers (like `profile-card-wrapper`) are authored as
  // direct children of the container section, we don't have their own
  // `data-nested-column-left/right`. Use container-side as the primary hint,
  // but fall back to the side that actually has adjacent column sections.
  let directChildrenTargetSide = containerSide;
  if (directChildrenTargetSide === 'right' && !rightSections.length && leftSections.length) {
    directChildrenTargetSide = 'left';
  } else if (directChildrenTargetSide === 'left' && !leftSections.length && rightSections.length) {
    directChildrenTargetSide = 'right';
  } else if (!directChildrenTargetSide) {
    if (leftSections.length) {
      directChildrenTargetSide = 'left';
    } else if (rightSections.length) {
      directChildrenTargetSide = 'right';
    } else {
      directChildrenTargetSide = null;
    }
  }

  if (leftColumn) {
    leftSections.forEach((s) => {
      const blocksInSection = [...s.querySelectorAll('div.block')];
      blocksInSection.forEach((b) => blocksToLoad.add(b));

      const isPlainSection = s.className.trim() === 'section';
      if (isPlainSection) {
        [...s.children].forEach((child) => leftColumn.appendChild(child));
        s.remove();
      } else {
        leftColumn.appendChild(s);
      }
    });
  }

  if (rightSections.length || containerSide === 'right') {
    rightSections.forEach((s) => {
      const blocksInSection = [...s.querySelectorAll('div.block')];
      blocksInSection.forEach((b) => blocksToLoad.add(b));

      const isPlainSection = s.className.trim() === 'section';
      if (isPlainSection) {
        [...s.children].forEach((child) => rightColumn.appendChild(child));
        s.remove();
      } else {
        rightColumn.appendChild(s);
      }
    });
  }

  if (directChildren.length && directChildrenTargetSide) {
    const targetColumn = directChildrenTargetSide === 'left' ? leftColumn : rightColumn;
    directChildren.forEach((child) => targetColumn.appendChild(child));
  }

  // Only append columns that actually have content.
  if (leftColumn.children.length) wrapper.appendChild(leftColumn);
  if (rightColumn.children.length) wrapper.appendChild(rightColumn);

  block.replaceChildren(wrapper);

  await Promise.all([...blocksToLoad].map((panelBlock) => loadBlock(panelBlock)));
}
