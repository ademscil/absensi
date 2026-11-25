/**
 * Motion & Animation Sequencing Utility
 * Powered by Anime.js for fluid spatial reveals and micro-interactions
 */

import anime from 'animejs';

/**
 * Spatial Tilt Physics Clamping
 * @param {number} angle 
 * @param {number} min 
 * @param {number} max 
 * @returns {number}
 */
export function clampTiltAngle(angle, min = -15, max = 15) {
  if (typeof angle !== 'number' || isNaN(angle)) return 0;
  return Math.max(min, Math.min(max, angle));
}

/**
 * Choreographed Anime.js login entrance sequence.
 * Sequentially reveals: background -> brand crest -> card unfold -> staggered inputs/demo pills -> submit button.
 * 
 * @param {HTMLElement|null} containerRef
 * @param {Object} elements
 * @returns {object} Anime.js timeline instance
 */
export function animateLoginSequence(containerRef, elements = {}) {
  const {
    background,
    brandCrest,
    header,
    formCard,
    inputs,
    pills,
    submitBtn,
  } = elements;

  const timeline = anime.timeline({
    easing: 'easeOutExpo',
    duration: 650,
  });

  // 1. Background ambient reveal
  if (background) {
    timeline.add({
      targets: background,
      opacity: [0, 1],
      duration: 500,
      easing: 'linear',
    });
  }

  // 2. Brand crest spring dampening reveal
  if (brandCrest) {
    timeline.add(
      {
        targets: brandCrest,
        opacity: [0, 1],
        scale: [0.75, 1],
        rotate: [-6, 0],
        duration: 700,
        easing: 'spring(1, 80, 10, 0)',
      },
      background ? '-=350' : 0
    );
  }

  // 3. Header title / tagline
  if (header) {
    timeline.add(
      {
        targets: header,
        opacity: [0, 1],
        translateY: [-20, 0],
        duration: 500,
        easing: 'easeOutCubic',
      },
      '-=450'
    );
  }

  // 4. Glass card unfold
  const cardTarget = formCard || (containerRef && containerRef.querySelector ? containerRef.querySelector('.spatial-card') : null);
  if (cardTarget) {
    timeline.add(
      {
        targets: cardTarget,
        opacity: [0, 1],
        translateY: [25, 0],
        scale: [0.96, 1],
        duration: 600,
        easing: 'easeOutBack',
      },
      '-=350'
    );
  }

  // 5. Staggered input fields
  if (inputs && inputs.length > 0) {
    timeline.add(
      {
        targets: inputs,
        opacity: [0, 1],
        translateX: [-18, 0],
        delay: anime.stagger(90),
        duration: 400,
        easing: 'easeOutQuad',
      },
      '-=300'
    );
  }

  // 6. Demo credential pills
  if (pills) {
    timeline.add(
      {
        targets: pills.querySelectorAll ? pills.querySelectorAll('button') : pills,
        opacity: [0, 1],
        scale: [0.85, 1],
        delay: anime.stagger(60),
        duration: 350,
        easing: 'easeOutBack',
      },
      '-=250'
    );
  }

  // 7. Submit button
  if (submitBtn) {
    timeline.add(
      {
        targets: submitBtn,
        opacity: [0, 1],
        translateY: [12, 0],
        scale: [0.95, 1],
        duration: 400,
        easing: 'easeOutCubic',
      },
      '-=200'
    );
  }

  return timeline;
}

/**
 * Backward compatibility alias for playLoginEntranceAnimation
 */
export function playLoginEntranceAnimation(targets = {}) {
  return animateLoginSequence(null, targets);
}

/**
 * Haptic Spring Micro-Interaction for Buttons
 * Creates a tactile physical bounce upon user press / click.
 * 
 * @param {HTMLElement} element
 * @returns {object} Anime.js instance
 */
export function pulseButton(element) {
  if (!element) return null;
  return anime({
    targets: element,
    scale: [1, 0.94, 1.04, 1],
    duration: 360,
    easing: 'spring(1, 80, 10, 0)',
  });
}

/**
 * Stroke-dashoffset SVG Checkmark Drawing
 * Dynamically draws checkmark path for attendance confirmation.
 * 
 * @param {SVGPathElement} svgPathElement
 * @param {number} duration
 * @returns {object} Anime.js instance
 */
export function animateCheckmark(svgPathElement, duration = 650) {
  if (!svgPathElement) return null;
  return anime({
    targets: svgPathElement,
    strokeDashoffset: [anime.setDashoffset, 0],
    easing: 'easeInOutSine',
    duration,
  });
}

/**
 * Clean animation cancellation / cleanup utility
 * @param {object} animInstance
 */
export function cancelAnimation(animInstance) {
  if (animInstance) {
    if (typeof animInstance.pause === 'function') {
      animInstance.pause();
    }
    if (animInstance.targets && typeof anime.remove === 'function') {
      anime.remove(animInstance.targets);
    }
  }
}
