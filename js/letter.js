/**
 * letter.js
 * Handles the "open the bottle" interaction and typewriter reveal.
 * Letter text comes from OCEAN_SETTINGS.letterParagraphs (config/settings.js).
 */
(function (window, document) {
  'use strict';

  const OCEAN    = window.OCEAN;
  const SETTINGS = window.OCEAN_SETTINGS || {};

  const LETTER_PARAGRAPHS = (SETTINGS.letterParagraphs && SETTINGS.letterParagraphs.length)
    ? SETTINGS.letterParagraphs
    : [
        'I wanted to send this the way old sailors used to send word home — sealed up, set adrift, and trusted to find its way to you.',
        "Today is your day, and I hope it feels exactly like that: unhurried, warm, and full of small good things. You deserve every bit of it.",
        'Thank you for being the kind of person whose presence makes ordinary days feel like something worth remembering. This little corner of the internet is just a small way of saying so.',
        "However you spend today, I hope it's surrounded by people who love you as much as I do. Happy birthday."
      ];

  let typed = false;

  function typeParagraphs(container, paragraphs, onDone) {
    if (OCEAN.config.prefersReducedMotion) {
      container.innerHTML = paragraphs.map((p) => `<p>${p}</p>`).join('');
      onDone?.();
      return;
    }

    container.innerHTML = '';
    let pIndex = 0;
    let cIndex = 0;
    let currentP  = null;
    let textNode  = null;
    const caret = document.createElement('span');
    caret.className = 'letter__caret';

    function typeChar() {
      if (pIndex >= paragraphs.length) {
        caret.remove();
        onDone?.();
        return;
      }
      if (!currentP) {
        currentP = document.createElement('p');
        textNode = document.createTextNode('');
        currentP.appendChild(textNode);
        currentP.appendChild(caret);
        container.appendChild(currentP);
      }

      const text = paragraphs[pIndex];
      cIndex++;
      textNode.data = text.slice(0, cIndex);

      if (cIndex >= text.length) {
        pIndex++;
        cIndex = 0;
        currentP = null;
        setTimeout(typeChar, 320);
      } else {
        const lastChar = text[cIndex - 1];
        let delay = 13 + Math.random() * 16;
        if ('.!?'.includes(lastChar))  delay += 220;
        else if (',;:—'.includes(lastChar)) delay += 110;
        setTimeout(typeChar, delay);
      }
    }

    typeChar();
  }

  function initLetter() {
    const stage = document.querySelector('.letter__bottle-stage');
    const panel = document.querySelector('.letter__panel');
    const body  = document.querySelector('.letter__body');

    if (!stage || !panel || !body) return;

    function openLetter() {
      if (typed) return;
      typed = true;
      stage.classList.add('is-opened');
      panel.classList.add('is-open');
      setTimeout(() => {
        typeParagraphs(body, LETTER_PARAGRAPHS, () => {
          OCEAN.bus.emit('letter:revealed');
        });
      }, OCEAN.config.prefersReducedMotion ? 0 : 380);
    }

    stage.addEventListener('click', openLetter);
    stage.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLetter();
      }
    });
    stage.setAttribute('role', 'button');
    stage.setAttribute('tabindex', '0');
    stage.setAttribute('aria-label', 'Open the letter');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLetter);
  } else {
    initLetter();
  }
})(window, document);
