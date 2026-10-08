/* Other work: a masonry grid whose cards open in a dialog rather than
   navigating to their own page.

   To add a project, add an entry to PROJECTS. Everything else, the grid, the
   dialog and the placeholder count, follows from it. */

const PROJECTS = [
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
        title: 'Helvetica Type Specimen',
        blurb:
            "Postcard sets that showcase Helvetica's typeface anatomy, characteristics, and more.",
        tags: ['Typography', '2025'],
        meta: [
            { label: 'Category', value: 'Typography' },
            { label: 'Year', value: '2025' }
        ],
        cover: '/images/helvetica-hero-1.webp',
        images: [
            '/images/helvetica-hero-1.webp',
            '/images/helvetica-hero-2.webp',
            '/images/helvetica-hero-3.webp',
            '/images/helvetica-detail-1.webp',
            '/images/helvetica-detail-2.webp',
            '/images/helvetica-detail-3.webp',
            '/images/helvetica-detail-4.webp',
            '/images/helvetica-detail-5.webp',
            '/images/helvetica-detail-6.webp'
        ]
    }
];

/* Empty slots so the grid reads as a grid while the real work is still
   arriving. Heights vary so the columns stagger. Delete entries as projects
   land, or set to 0 to turn them off. */
const PLACEHOLDER_HEIGHTS = [240, 180, 300, 210, 270, 190];

/* ---------- sound ----------
   Synthesised rather than loaded, so there is no audio file to ship. The
   context is created on the first click, which is the user gesture browsers
   require before audio may start.

   Pitch direction carries the meaning: rising to open, falling to close.
   A flat tick for stepping sideways through images. */
let audioCtx = null;
let muted = false;

function ctx() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!audioCtx) audioCtx = new AC();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
}

/* one sine sweep with an exponential envelope */
function tone(ac, t, from, to, peak, dur, delay) {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    const t0 = t + (delay || 0);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(from, t0);
    osc.frequency.exponentialRampToValueAtTime(to, t0 + dur * 0.75);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
}

const SOUNDS = {
    // opening: rising, with a fifth above it for body, so it feels like more
    open: ac => {
        const t = ac.currentTime;
        tone(ac, t, 400, 760, 0.15, 0.22);
        tone(ac, t, 600, 1140, 0.055, 0.18, 0.015);
    },
    // closing: falling, shorter and quieter, so it reads as the way out
    close: ac => tone(ac, ac.currentTime, 620, 340, 0.09, 0.14),
    // stepping sideways: a flat, quiet tick
    tick: ac => tone(ac, ac.currentTime, 520, 495, 0.06, 0.07)
};

function boop(kind) {
    if (muted) return;
    try {
        const ac = ctx();
        if (ac) (SOUNDS[kind] || SOUNDS.open)(ac);
    } catch (e) {
        /* sound is a flourish, never let it break the click */
    }
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
        const img = document.createElement('img');
        img.src = p.cover;
        img.alt = p.title;
        img.loading = i > 1 ? 'lazy' : 'eager';
        media.appendChild(img);

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
    const rows = (p.meta || []).concat([
        { label: 'Pieces', value: String(p.images.length) }
    ]);
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
    const im = document.createElement('img');
    im.src = current.images[index];
    im.alt = current.title + ', image ' + (index + 1) + ' of ' + n;
    frame.appendChild(im);
    stage.appendChild(frame);
    document.getElementById('workCount').textContent = (index + 1) + ' / ' + n;
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

    const mute = document.getElementById('workMute');
    if (mute) {
        mute.addEventListener('click', () => {
            muted = !muted;
            mute.classList.toggle('is-muted', muted);
            mute.setAttribute('aria-pressed', String(muted));
            mute.setAttribute('aria-label', muted ? 'Unmute click sound' : 'Mute click sound');
            if (!muted) boop('open');
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
