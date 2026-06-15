/**
 * page-transition.js
 *
 * ENTERING — waits for two conditions before fading content in:
 *   1. window 'load' (all images, scripts, fonts resolved)
 *   2. a minimum display time (MIN_MS) so the tagline sweep always
 *      completes its animation before we reveal content
 * Both must be satisfied; whichever finishes last triggers the reveal.
 * A hard cap (MAX_MS) ensures we never block longer than ~3 s on a
 * slow connection.
 *
 * LEAVING — on nav-link click, .page-content fades + floats up in
 * 180 ms before the browser navigates.
 *
 * The <header> (and the tagline sweep inside it) stays fully visible
 * throughout — it is a sibling of .page-content, not a child.
 */
(function () {
    'use strict';

    // ── Minimum time (ms) the sweep bar is shown before content appears.
    // Must be longer than the CSS sweep animation (0.52 s → 520 ms).
    var MIN_MS  = 650;
    var MAX_MS  = 3000;

    var startTime   = performance.now();
    var loadReady   = false;
    var timerReady  = false;
    var revealed    = false;

    function reveal() {
        if (revealed) return;
        revealed = true;
        requestAnimationFrame(function () {
            document.body.classList.remove('page-entering');
            document.body.classList.add('page-entered');
        });
    }

    function check() {
        if (loadReady && timerReady) reveal();
    }

    // Condition 1 — minimum display time
    var elapsed = performance.now() - startTime;
    setTimeout(function () {
        timerReady = true;
        check();
    }, Math.max(0, MIN_MS - elapsed));

    // Condition 2 — all resources loaded
    if (document.readyState === 'complete') {
        loadReady = true;
        check();
    } else {
        window.addEventListener('load', function () {
            loadReady = true;
            check();
        });
    }

    // Hard cap — never wait longer than MAX_MS
    setTimeout(reveal, MAX_MS);


    // ── OUTGOING ─────────────────────────────────────────────────────────
    document.addEventListener('click', function (e) {
        var link = e.target.closest('a.nav-btn');
        if (!link) return;

        var href = link.getAttribute('href');
        if (!href || href.startsWith('#') || href.startsWith('javascript')) return;
        if (link.classList.contains('active')) return;
        if (link.target === '_blank') return;

        e.preventDefault();
        if (document.body.classList.contains('page-leaving')) return;

        document.body.classList.add('page-leaving');

        // Wait for CSS fade-out to finish (0.18 s), then navigate
        setTimeout(function () {
            window.location.href = href;
        }, 200);

    }, true);

})();
