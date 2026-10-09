/* Other work: a masonry grid whose cards open in a dialog rather than
   navigating to their own page.

   To add a project, add an entry to PROJECTS. Everything else, the grid, the
   dialog and the placeholder count, follows from it. */

const PROJECTS = [
    {
        title: 'Helvetica Type Specimen',
        blurb:
            "Postcard sets that showcase Helvetica's typeface anatomy, characteristics, and more.",
        tags: ['Typography', '2025'],
        meta: [
            { label: 'Category', value: 'Typography' },
            { label: 'Year', value: '2025' }
        ],
        cover: '/images/helvetica-hero-3.webp',
        images: [
            '/images/helvetica-hero-3.webp',
            '/images/helvetica-hero-1.webp',
            '/images/helvetica-hero-2.webp',
            '/images/helvetica-detail-1.webp',
            '/images/helvetica-detail-2.webp',
            '/images/helvetica-detail-3.webp',
            '/images/helvetica-detail-4.webp',
            '/images/helvetica-detail-5.webp',
            '/images/helvetica-detail-6.webp'
        ]
    },
    {
        title: 'Cortis',
        blurb: 'A video edit of GO, a music video by the band Cortis.',
        tags: ['Video', '2025'],
        meta: [
            { label: 'Category', value: 'Video edit' },
            { label: 'Year', value: '2025' }
        ],
        cover: { video: '/images/cortis-edit.mp4', poster: '/images/cortis-poster.webp', w: 1024, h: 576 },
        images: [
            { video: '/images/cortis-edit.mp4', poster: '/images/cortis-poster.webp' }
        ]
    },
    {
        title: 'Editorial Spreads',
        blurb:
            'A series of editorial spread designs reimagining a Stephen Curry article through varied visual approaches.',
        tags: ['Editorial', '2025'],
        // rows for the dialog's info rail. A value may be a string or an
        // array, which renders stacked and right aligned.
        meta: [
            { label: 'Category', value: 'Editorial' },
            { label: 'Year', value: '2025' }
        ],
        cover: '/images/editorial-cover.webp',
        images: [
            '/images/editorial-hero-1.webp',
            '/images/editorial-hero-2.webp',
            '/images/editorial-hero-3.webp',
            '/images/editorial-detail-1.webp',
            '/images/editorial-detail-2.webp',
            '/images/editorial-detail-3.webp',
            '/images/editorial-detail-4.webp',
            '/images/editorial-detail-5.webp',
            '/images/editorial-detail-6.webp'
        ]
    },
    {
        title: 'Sentimental Value',
        blurb: 'A poster series for Sentimental Value, a film by Joachim Trier.',
        tags: ['Poster', '2026'],
        meta: [
            { label: 'Category', value: 'Poster series' },
            { label: 'Year', value: '2026' }
        ],
        // the card cycles the whole series; the dialog steps through them one
        // at a time, so each poster can be looked at properly
        cover: {
            // small cuts: the card is 384px wide, and all seven load at once
            frames: [
                '/images/sv-1-card.webp',
                '/images/sv-2-card.webp',
                '/images/sv-3-card.webp',
                '/images/sv-4-card.webp',
                '/images/sv-5-card.webp',
                '/images/sv-6-card.webp',
                '/images/sv-7-card.webp'
            ],
            w: 800,
            h: 1132
        },
        // full cuts: the dialog loads one at a time
        images: [
            '/images/sv-1.webp',
            '/images/sv-2.webp',
            '/images/sv-3.webp',
            '/images/sv-4.webp',
            '/images/sv-5.webp',
            '/images/sv-6.webp',
            '/images/sv-7.webp'
        ]
    }
];

/* Empty slots so the grid reads as a grid while the real work is still
   arriving. Heights vary so the columns stagger. Delete entries as projects
   land, or set to 0 to turn them off. */
const PLACEHOLDER_HEIGHTS = [240, 180, 300, 210, 270, 190];

/* Sounds live in sound.js so the about page gallery uses the same ones.
   Falls back to a no-op if that file has not loaded. */
function boop(kind) {
    if (window.siteSound) window.siteSound.boop(kind);
}

/* ---------- media ---------- */
/* Build the element for a media entry. A string is an image, an object with
   .video is a clip, and an object with .frames is a run of stills that cycles
   like a gif. Clips autoplay muted and looping, which is the only form of
   autoplay browsers allow. Both kinds only run while they are on screen, and
   hold still when the visitor has asked for less motion. */
const reducedMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* how long each still in a sequence holds */
const FRAME_MS = 1200;

let seen = null;

/* Run el.__loop only while el is near the viewport, so offscreen cards cost
   nothing. */
function runWhileVisible(el) {
    if (!('IntersectionObserver' in window)) {
        el.__loop.start();
        return;
    }
    if (!seen) {
        seen = new IntersectionObserver(entries => {
            entries.forEach(en => {
                if (en.isIntersecting) en.target.__loop.start();
                else en.target.__loop.stop();
            });
        }, { rootMargin: '200px' });
    }
    seen.observe(el);
}

/* The stills are stacked and cross faded rather than swapped into one <img>,
   so a step never reflows and never waits on a decode. */
function framesEl(item, inGrid) {
    const box = document.createElement('div');
    box.className = 'work-frames';
    if (item.w) box.style.aspectRatio = item.w + ' / ' + item.h;

    const stills = item.frames.map((src, n) => {
        const img = document.createElement('img');
        img.src = src;
        img.alt = '';
        if (n === 0) img.className = 'is-on';
        box.appendChild(img);
        return img;
    });

    let at = 0;
    let timer = null;
    box.__loop = {
        start() {
            if (timer || reducedMotion || stills.length < 2) return;
            timer = setInterval(() => {
                stills[at].classList.remove('is-on');
                at = (at + 1) % stills.length;
                stills[at].classList.add('is-on');
            }, item.ms || FRAME_MS);
        },
        stop() {
            clearInterval(timer);
            timer = null;
        }
    };

    if (inGrid) runWhileVisible(box);
    else box.__loop.start();
    return box;
}

function mediaEl(item, inGrid) {
    if (typeof item === 'string') {
        const img = document.createElement('img');
        img.src = item;
        img.alt = '';
        return img;
    }
    if (item.frames) return framesEl(item, inGrid);
    const v = document.createElement('video');
    v.src = item.video;
    if (item.poster) v.poster = item.poster;
    if (item.w) { v.width = item.w; v.height = item.h; }
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    v.setAttribute('muted', '');
    v.setAttribute('playsinline', '');
    v.__loop = {
        start() { v.play().catch(() => {}); },
        stop() { v.pause(); }
    };
    if (inGrid) {
        v.preload = 'metadata';
        if (!reducedMotion) {
            // only spend decode time on clips that are actually on screen
            v.autoplay = true;
            runWhileVisible(v);
        }
    } else {
        // short silent loop, so controls would only be clutter
        v.autoplay = !reducedMotion;
        v.preload = 'auto';
    }
    return v;
}

/* ---------- grid ---------- */
function buildGrid(root) {
    PROJECTS.forEach((p, i) => {
        const card = document.createElement('button');
        card.className = 'work-card';
        card.type = 'button';
        card.setAttribute('aria-haspopup', 'dialog');

        const media = document.createElement('div');
        media.className = 'work-card__media';
        const el = mediaEl(p.cover, true);
        if (el.tagName === 'IMG') {
            el.alt = p.title;
            el.loading = i > 1 ? 'lazy' : 'eager';
        }
        media.appendChild(el);

        // no caption on the card, the title and tags live in the dialog
        card.setAttribute('aria-label', p.title);
        card.appendChild(media);
        card.addEventListener('click', () => {
            boop('open');
            openDialog(p);
        });
        root.appendChild(card);
    });

    PLACEHOLDER_HEIGHTS.forEach(hgt => {
        const ph = document.createElement('div');
        ph.className = 'work-card work-card--empty';
        ph.style.height = hgt + 'px';
        ph.setAttribute('aria-hidden', 'true');
        const label = document.createElement('span');
        label.textContent = 'More soon';
        ph.appendChild(label);
        root.appendChild(ph);
    });
}

/* ---------- dialog ----------
   Two panes: a fixed info rail on the left, and a stage on the right
   showing one image at a time. The arrows step through that project's
   images rather than between projects. */
let lastFocused = null;
let current = null;
let index = 0;

function renderMeta(p) {
    const tbl = document.getElementById('workMeta');
    tbl.innerHTML = '';
    const rows = (p.meta || []).slice();
    if (p.images.length > 1) rows.push({ label: 'Pieces', value: String(p.images.length) });
    rows.forEach(r => {
        const row = document.createElement('div');
        row.className = 'work-meta__row';
        const k = document.createElement('span');
        k.className = 'work-meta__k';
        k.textContent = r.label;
        const v = document.createElement('span');
        v.className = 'work-meta__v';
        (Array.isArray(r.value) ? r.value : [r.value]).forEach(val => {
            const line = document.createElement('span');
            line.textContent = val;
            v.appendChild(line);
        });
        row.appendChild(k);
        row.appendChild(v);
        tbl.appendChild(row);
    });
}

function showImage(i) {
    if (!current) return;
    const n = current.images.length;
    index = (i + n) % n;
    const stage = document.getElementById('workStage');
    stage.innerHTML = '';
    const frame = document.createElement('div');
    frame.className = 'work-stage__frame';
    const el = mediaEl(current.images[index], false);
    if (el.tagName === 'IMG') el.alt = current.title + ', image ' + (index + 1) + ' of ' + n;
    frame.appendChild(el);
    stage.appendChild(frame);
    document.getElementById('workCount').textContent = n > 1 ? (index + 1) + ' / ' + n : '';
}

function openDialog(p) {
    const dlg = document.getElementById('workDialog');
    lastFocused = document.activeElement;
    current = p;

    dlg.querySelector('.work-dialog__title').textContent = p.title;
    dlg.querySelector('.work-dialog__blurb').textContent = p.blurb;
    renderMeta(p);
    showImage(0);

    dlg.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    dlg.querySelector('.work-rail__scroll').scrollTop = 0;
    dlg.querySelector('.work-dialog__close').focus();
}

function closeDialog() {
    const dlg = document.getElementById('workDialog');
    if (!dlg.classList.contains('is-open')) return;
    boop('close');
    dlg.classList.remove('is-open');
    document.body.style.overflow = '';
    current = null;
    if (lastFocused) lastFocused.focus();
}

function init() {
    const grid = document.getElementById('workGrid');
    if (grid) buildGrid(grid);

    const dlg = document.getElementById('workDialog');
    dlg.querySelector('.work-dialog__close').addEventListener('click', closeDialog);
    dlg.querySelector('.work-nav__prev').addEventListener('click', () => { boop('tick'); showImage(index - 1); });
    dlg.querySelector('.work-nav__next').addEventListener('click', () => { boop('tick'); showImage(index + 1); });
    // clicking the stage background closes, same as the backdrop
    document.getElementById('workStage').addEventListener('click', e => {
        if (e.target.id === 'workStage') closeDialog();
    });
    document.addEventListener('keydown', e => {
        if (!dlg.classList.contains('is-open')) return;
        if (e.key === 'Escape') closeDialog();
        else if (e.key === 'ArrowRight') { boop('tick'); showImage(index + 1); }
        else if (e.key === 'ArrowLeft') { boop('tick'); showImage(index - 1); }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
