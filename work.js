/* Other work: a masonry grid whose cards open in a dialog rather than
   navigating to their own page.

   To add a project, add an entry to PROJECTS. Everything else, the grid, the
   dialog and the placeholder count, follows from it. */

const PROJECTS = [
    {
        title: 'Music Player',
        blurb:
            'A motion graphic where you can search for a song. Here I searched for Frank Ocean, one of my favorite artists.',
        tags: ['Motion', '2026'],
        meta: [
            { label: 'Category', value: 'Motion graphics' },
            { label: 'Year', value: '2026' }
        ],
        cover: {
            // small cut: the card is 384px wide and autoplays on page load
            video: '/images/music-player-card.mp4',
            poster: '/images/music-player-poster.webp',
            w: 800,
            h: 800
        },
        // full cut: only fetched once the dialog opens
        images: [
            { video: '/images/music-player.mp4', poster: '/images/music-player-poster.webp', sound: true }
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
    /* Grid clips are always silent, since muted is the only way browsers
       allow autoplay. In the dialog, a clip with a soundtrack starts audible. */
    const audible = !inGrid && !!item.sound;
    v.muted = !audible;
    v.loop = true;
    v.playsInline = true;
    if (!audible) v.setAttribute('muted', '');
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
        // started by startVideo rather than the autoplay attribute, so the
        // click that opened the dialog still counts as user activation
        v.preload = 'auto';
        // controls come from buildPlayer, not from the browser's own bar
    }
    return v;
}

/* Browsers only let a clip play with sound while the click that opened the
   dialog still counts as user activation, and refuse otherwise. Fall back to
   a silent play rather than leaving the visitor with a frozen frame. */
function startVideo(v) {
    const p = v.play();
    if (p && p.catch) {
        p.catch(() => {
            v.muted = true;
            v.play().catch(() => {});
        });
    }
}

/* ---------- video player ----------
   The browser's own control bar is a heavy black gradient, so clips with a
   soundtrack get this instead: play, a scrub bar, the time, and mute. */
const ICON = {
    /* both drawn soft: the triangle is stroked with a round join so its
       corners are blunt, and the pause bars are full pills */
    play: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 4.3 11.4 8 6 11.7z" fill="currentColor" stroke="currentColor" stroke-width="2.7" stroke-linejoin="round" stroke-linecap="round"/></svg>',
    pause: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3.9" y="3.3" width="3" height="9.4" rx="1.5" fill="currentColor"/><rect x="9.1" y="3.3" width="3" height="9.4" rx="1.5" fill="currentColor"/></svg>',
    /* the cone is filled and stroked with a round join, so it carries the
       same soft weight as the play triangle rather than reading as outline */
    loud: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M7.5 3.6 4.6 6.1H3v3.8h1.6l2.9 2.5z" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/><path d="M10.6 6.4a2.4 2.4 0 0 1 0 3.2" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/><path d="M12.9 4.5a5.2 5.2 0 0 1 0 7" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>',
    quiet: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M7.5 3.6 4.6 6.1H3v3.8h1.6l2.9 2.5z" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/><path d="m10.9 6.5 3.2 3.2M14.1 6.5l-3.2 3.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'
};

function clock(t) {
    if (!isFinite(t)) t = 0;
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
}

function buildPlayer(v) {
    const bar = document.createElement('div');
    bar.className = 'vplayer';
    bar.innerHTML =
        '<button type="button" class="vplayer__toggle"></button>' +
        '<div class="vplayer__track"><div class="vplayer__rail"></div>' +
        '<div class="vplayer__buffer"></div><div class="vplayer__fill"></div>' +
        '<div class="vplayer__knob"></div></div>' +
        '<span class="vplayer__time"></span>' +
        '<button type="button" class="vplayer__mute"></button>';

    const toggle = bar.querySelector('.vplayer__toggle');
    const mute = bar.querySelector('.vplayer__mute');
    const track = bar.querySelector('.vplayer__track');
    const buffer = bar.querySelector('.vplayer__buffer');
    const fill = bar.querySelector('.vplayer__fill');
    const knob = bar.querySelector('.vplayer__knob');
    const time = bar.querySelector('.vplayer__time');

    function paintToggle() {
        toggle.innerHTML = v.paused ? ICON.play : ICON.pause;
        toggle.setAttribute('aria-label', v.paused ? 'Play' : 'Pause');
    }
    function paintMute() {
        mute.innerHTML = v.muted ? ICON.quiet : ICON.loud;
        mute.setAttribute('aria-label', v.muted ? 'Unmute' : 'Mute');
    }
    function paint() {
        const d = v.duration;
        const pct = d ? (v.currentTime / d) * 100 : 0;
        fill.style.width = pct + '%';
        knob.style.left = pct + '%';
        if (v.buffered.length) {
            buffer.style.width = (d ? (v.buffered.end(v.buffered.length - 1) / d) * 100 : 0) + '%';
        }
        time.textContent = clock(v.currentTime) + ' / ' + clock(d);
    }

    // the clicks belong to the player, not to the stage behind it, which
    // would read them as "close the dialog"
    bar.addEventListener('click', e => e.stopPropagation());

    toggle.addEventListener('click', () => (v.paused ? startVideo(v) : v.pause()));
    mute.addEventListener('click', () => { v.muted = !v.muted; paintMute(); });

    /* scrubbing: pointer events so a drag works the same with a mouse,
       a trackpad or a finger */
    let scrubbing = false;
    function seekTo(e) {
        const r = track.getBoundingClientRect();
        const at = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
        if (v.duration) { v.currentTime = at * v.duration; paint(); }
    }
    track.addEventListener('pointerdown', e => {
        scrubbing = true;
        bar.classList.add('is-scrubbing');
        track.setPointerCapture(e.pointerId);
        seekTo(e);
    });
    track.addEventListener('pointermove', e => { if (scrubbing) seekTo(e); });
    track.addEventListener('pointerup', e => {
        scrubbing = false;
        bar.classList.remove('is-scrubbing');
        track.releasePointerCapture(e.pointerId);
    });

    v.addEventListener('play', paintToggle);
    v.addEventListener('pause', paintToggle);
    v.addEventListener('volumechange', paintMute);
    v.addEventListener('loadedmetadata', paint);

    /* a frame loop keeps the bar smooth between timeupdate events, and stops
       itself once the dialog has emptied the stage */
    (function tick() {
        if (!v.isConnected) return;
        paint();
        requestAnimationFrame(tick);
    })();

    paintToggle();
    paintMute();
    paint();
    return bar;
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
    if (el.tagName === 'VIDEO') {
        if (!reducedMotion) startVideo(el);
        // only clips with a soundtrack get a player; a short silent loop has
        // nothing worth scrubbing
        if (current.images[index].sound) frame.appendChild(buildPlayer(el));
    }
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
    // emptying the stage stops playback. Without this a clip keeps running,
    // and an audible one keeps playing, behind the closed dialog.
    document.getElementById('workStage').innerHTML = '';
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
