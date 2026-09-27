/* Accordion gallery, ported from React Bits (AccordionGallery, JS-CSS variant)
   to a plain ES module so it runs on this static site without React or a build
   step. The layout maths, GSAP timeline and markup structure match the original;
   only the React state/effects were rewritten as plain DOM code. */

import { gsap } from 'https://esm.sh/gsap@3.13.0';

const DEFAULTS = {
  items: [],
  defaultIndex: 2,
  accentColor: '#ffffff',
  overlayColor: '#060010',
  textColor: '#ffffff',
  height: 460,
  gap: 10,
  radius: 16,
  expandRatio: 0.52,
  orientation: 'horizontal',
  duration: 0.6,
  ease: 'power3.out',
  parallax: 0.5,
  tilt: 8,
  stagger: 0.06,
  trigger: 'hover',
  showLabels: true,
  grayscale: true,
  dim: 0.35,
  onItemClick: null
};

/**
 * Builds an accordion gallery inside the given container.
 * @param {HTMLElement} root
 * @param {Partial<typeof DEFAULTS> & {items: {image: string, label?: string, alt?: string, link?: string}[]}} options
 * @returns {{destroy: () => void, setActive: (i: number) => void}}
 */
export function initAccordionGallery(root, options = {}) {
  const opts = { ...DEFAULTS, ...options };
  const items = opts.items;
  const count = items.length;
  if (!root || !count) return { destroy() {}, setActive() {} };

  const vertical = opts.orientation === 'vertical';
  const prefersReduced =
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  let active = Math.min(Math.max(opts.defaultIndex, 0), count - 1);
  let mediaSize = 320;
  let activeMediaSize = 320;
  let timeline = null;
  let firstRun = true;

  root.className =
    'accordion-gallery' + (vertical ? ' accordion-gallery--vertical' : '') + (opts.className ? ` ${opts.className}` : '');
  root.setAttribute('role', 'list');
  root.setAttribute('aria-label', 'Image accordion gallery');
  root.style.setProperty('--ag-accent', opts.accentColor);
  root.style.setProperty('--ag-overlay', opts.overlayColor);
  root.style.setProperty('--ag-text', opts.textColor);
  root.style.setProperty('--ag-gap', `${opts.gap}px`);
  root.style.setProperty('--ag-radius', `${opts.radius}px`);
  root.style.height = vertical ? `${Math.round(opts.height * 1.6)}px` : `${opts.height}px`;

  const panels = [];
  const medias = [];
  const bars = [];
  const texts = [];

  items.forEach((item, i) => {
    const panel = document.createElement(item.link ? 'a' : 'div');
    panel.className = 'ag-panel';
    panel.style.borderRadius = `${opts.radius}px`;
    if (item.link) panel.href = item.link;
    panel.setAttribute('role', 'listitem');
    panel.setAttribute('tabindex', '0');
    if (item.label) panel.setAttribute('aria-label', item.label);

    const frame = document.createElement('span');
    frame.className = 'ag-panel__frame';

    const media = document.createElement('span');
    media.className = 'ag-panel__media';

    const img = document.createElement('img');
    img.src = item.image;
    img.alt = item.alt || item.label || '';
    img.draggable = false;
    media.appendChild(img);

    const overlay = document.createElement('span');
    overlay.className = 'ag-panel__overlay';
    overlay.setAttribute('aria-hidden', 'true');

    frame.appendChild(media);
    frame.appendChild(overlay);
    panel.appendChild(frame);

    if (opts.showLabels) {
      const label = document.createElement('span');
      label.className = 'ag-panel__label';
      label.setAttribute('aria-hidden', 'true');
      const bar = document.createElement('span');
      bar.className = 'ag-panel__bar';
      const text = document.createElement('span');
      text.className = 'ag-panel__text';
      text.textContent = item.label || '';
      label.appendChild(bar);
      label.appendChild(text);
      panel.appendChild(label);
      bars[i] = bar;
      texts[i] = text;
    }

    root.appendChild(panel);
    panels[i] = panel;
    medias[i] = media;
  });

  function applyLayout(animate) {
    const r = Math.min(Math.max(opts.expandRatio, 0.2), 0.9);
    const grow = count > 1 ? (r * (count - 1)) / (1 - r) : 1;

    timeline?.kill();
    const dur = animate && !prefersReduced ? opts.duration : 0;
    const tl = gsap.timeline();

    panels.forEach((panel, i) => {
      if (!panel) return;
      const isActive = i === active;
      const media = medias[i];
      const bar = bars[i];
      const text = texts[i];

      const rot = isActive ? 0 : i < active ? opts.tilt : -opts.tilt;
      const rotProp = vertical ? { rotateX: -rot } : { rotateY: rot };

      panel.classList.toggle('ag-panel--active', isActive);
      if (isActive) panel.setAttribute('aria-current', 'true');
      else panel.removeAttribute('aria-current');

      // --ag-dim is set on the panel (not the media) so the overlay, which is a
      // sibling of the media, actually inherits it
      tl.to(
        panel,
        { flexGrow: isActive ? grow : 1, ...rotProp, '--ag-dim': isActive ? 0 : opts.dim, duration: dur, ease: opts.ease },
        0
      );

      if (media) {
        const drift = Math.max(-1.5, Math.min(1.5, active - i));
        const shift = drift * opts.parallax * mediaSize * 0.06;
        const gray = opts.grayscale ? (isActive ? 0 : 1) : 0;
        tl.to(
          media,
          {
            xPercent: -50,
            yPercent: -50,
            x: vertical ? 0 : isActive ? 0 : shift,
            y: vertical ? (isActive ? 0 : shift) : 0,
            ...(vertical
              ? { height: isActive ? activeMediaSize : mediaSize }
              : { width: isActive ? activeMediaSize : mediaSize }),
            '--ag-gray': gray,
            '--ag-dim': isActive ? 0 : opts.dim,
            duration: dur,
            ease: opts.ease
          },
          0
        );
      }

      if (opts.showLabels && bar && text) {
        if (isActive) {
          tl.to(
            [bar, text],
            { opacity: 1, x: 0, duration: dur, ease: opts.ease, stagger: prefersReduced ? 0 : opts.stagger },
            0
          );
        } else {
          tl.to([bar, text], { opacity: 0, x: -14, duration: dur * 0.6, ease: opts.ease }, 0);
        }
      }
    });

    timeline = tl;
  }

  function setActive(i) {
    const next = Math.min(Math.max(i, 0), count - 1);
    if (next === active) return;
    active = next;
    applyLayout(true);
  }

  function measure() {
    const rect = root.getBoundingClientRect();
    const total = vertical ? rect.height : rect.width;
    const usable = Math.max(total - opts.gap * (count - 1), 120);
    mediaSize = Math.max(140, usable * Math.min(Math.max(opts.expandRatio, 0.2), 0.9) * 1.22);
    root.style.setProperty('--ag-media-size', `${mediaSize}px`);
    // the open panel's own width, so its image can fill it without being cropped
    const r = Math.min(Math.max(opts.expandRatio, 0.2), 0.9);
    const grow = count > 1 ? (r * (count - 1)) / (1 - r) : 1;
    activeMediaSize = (usable * grow) / (grow + (count - 1));
    applyLayout(!firstRun);
  }

  const listeners = [];
  const on = (el, type, fn, opt) => {
    el.addEventListener(type, fn, opt);
    listeners.push(() => el.removeEventListener(type, fn, opt));
  };

  panels.forEach((panel, i) => {
    on(panel, 'mouseenter', () => {
      if (opts.trigger === 'hover') setActive(i);
    });
    on(panel, 'focus', () => setActive(i));
    on(panel, 'click', e => {
      if (i !== active) {
        e.preventDefault();
        setActive(i);
      } else if (opts.onItemClick) {
        e.preventDefault();
        opts.onItemClick(items[i], i);
      }
    });
    on(panel, 'keydown', e => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        setActive((i + 1) % count);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        setActive((i - 1 + count) % count);
      } else if ((e.key === 'Enter' || e.key === ' ') && opts.onItemClick) {
        e.preventDefault();
        opts.onItemClick(items[i], i);
      }
    });
  });

  measure();
  firstRun = false;

  const ro = new ResizeObserver(measure);
  ro.observe(root);

  return {
    setActive,
    destroy() {
      ro.disconnect();
      timeline?.kill();
      listeners.forEach(off => off());
      root.innerHTML = '';
    }
  };
}
