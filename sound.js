/* Shared UI sounds.

   Synthesised rather than loaded, so there is no audio file to ship. The
   context is created on the first call, which is the user gesture browsers
   require before audio may start.

   Pitch direction carries the meaning: rising to open, falling to close,
   and a flat tick for stepping sideways.

   Used by the other-work grid and the about page photo gallery. Exposed on
   window rather than as a module so plain <script> pages can use it. */

(function (w) {
    'use strict';

    let audioCtx = null;

    function ctx() {
        const AC = w.AudioContext || w.webkitAudioContext;
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

    /* Rapid clicks must not pile up into a drone, so a sound of the same kind
       will not retrigger until the previous one has essentially decayed. */
    const lastPlayed = Object.create(null);
    const MIN_GAP = { open: 160, close: 120, tick: 55 };

    function boop(kind) {
        try {
            const name = SOUNDS[kind] ? kind : 'open';
            const now = (w.performance || Date).now();
            if (now - (lastPlayed[name] || 0) < (MIN_GAP[name] || 60)) return;
            lastPlayed[name] = now;
            const ac = ctx();
            if (ac) SOUNDS[name](ac);
        } catch (e) {
            /* sound is a flourish, never let it break the interaction */
        }
    }

    w.siteSound = { boop };
})(window);
