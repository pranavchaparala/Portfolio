/**
 * page-transition.js — Cross-page transition animator
 *
 * Outgoing: Intercepts nav-btn clicks, fades page content out quickly but gently,
 *           keeping the navigation bar completely stable.
 * Incoming: tagline block sweeps with a #CBD1D7 loading bar from left to right,
 *           then dissolves (fades out) as the rest of the content fades/slides in.
 */
(function () {
    // ---- INCOMING TRANSITION ----
    window.addEventListener('DOMContentLoaded', function () {
        const tagline = document.querySelector('.tagline-block');
        
        // Start tagline loading sweep immediately on load
        if (tagline) {
            tagline.classList.add('tagline-loading');
        }

        // Wait for the sweep animation, then dissolve loading bar and fade content in
        setTimeout(function () {
            if (tagline) {
                tagline.classList.remove('tagline-loading');
                tagline.classList.add('tagline-dissolving');
            }
            document.body.classList.remove('page-entering');
            document.body.classList.add('page-entered');
            
            // Clean up dissolve class after it fades out
            setTimeout(function() {
                if (tagline) tagline.classList.remove('tagline-dissolving');
            }, 400);
        }, 1200); // 1200ms loading sweep duration (slow and noticeable)
    });

    // ---- OUTGOING TRANSITION ----
    document.addEventListener('click', function (e) {
        const link = e.target.closest('a.nav-btn');
        if (!link) return;

        const href = link.getAttribute('href');
        if (!href || href.startsWith('#') || href.startsWith('javascript')) return;

        // Don't intercept if it's the current page (active link)
        if (link.classList.contains('active')) return;

        // Don't intercept external links
        if (link.target === '_blank') return;

        e.preventDefault();

        // Already transitioning?
        if (document.body.classList.contains('page-leaving')) return;

        document.body.classList.add('page-leaving');

        // Navigate after content fades out quickly but gently
        setTimeout(function () {
            window.location.href = href;
        }, 220); // Quick 220ms fade out of content
    }, true);
})();
