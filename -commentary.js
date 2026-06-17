(function () {

    // ── Edit this list — cycles through the tagline on all pages ─────────────
    const CYCLING_ITEMS = [
        "Currently listening to Post Malone: Tiny Desk Concert",
        "building something new",
        "This site is constantly evolving, expect frequent bugs and commits. Last updated: 15/Jun/2026",
    ];
    // ─────────────────────────────────────────────────────────────────────────

    // ── What the tagline says when hovering specific elements ─────────────────
    // Selectors that match inside .modal-overlay are automatically ignored.
    const COMMENTARY = [

        // ── Navigation ───────────────────────────────────────────────────────


        // ── Home ─────────────────────────────────────────────────────────────
        {
        {
            selector: "#hero-mosaic-container",
            text: "That's a live video mosaic. Hover around. Hit the camera button to use your webcam."
        },
        {
            selector: ".pm-cam-btn",
            text: "Switch to your webcam — the mosaic renders you in real time."
        },

        // ── Projects ─────────────────────────────────────────────────────────
        {
            selector: ".project-card-container",
            text: "Click to open the full case study."
        },
        {
        },

        // ── Experiments ──────────────────────────────────────────────────────
        {
            selector: ".experiment-item",
            text: "Click to watch it with sound."
        },
        {
            selector: ".experiment-carousel-card",
            text: "Click to watch it with sound."
        },
        {
            selector: "#experiments-count",
            text: "And counting — new experiments get added whenever something clicks."
        },

        // ── About ─────────────────────────────────────────────────────────────
        {
            selector: ".about-card-container",
            text: "A few things worth knowing."
        },
        {
            selector: ".about-link-row",
            text: "Feel free to reach out through any of these."
        },

        // ── Footer ────────────────────────────────────────────────────────────
        {
            selector: "a[href='mailto:pranavchaparala@gmail.com']",
            text: "Best way to reach me. I usually reply within a day."
        },
        {
            selector: ".theme-toggle-bar",
            text: "Switch between light and dark."
        }

    ];
    // ─────────────────────────────────────────────────────────────────────────

    const taglineEl = document.querySelector('.tagline-text');
    if (!taglineEl) return;

    // ── Cycling logic ─────────────────────────────────────────────────────────
    let cycleIndex = 0;
    let cycleTimer = null;

    function showItem(text, instant) {
        if (instant) {
            taglineEl.textContent = text;
            return;
        }
        taglineEl.style.transition = 'opacity 0.18s ease';
        taglineEl.style.opacity = '0';
        setTimeout(() => {
            taglineEl.textContent = text;
            taglineEl.style.opacity = '1';
        }, 180);
    }

    function advanceCycle() {
        cycleIndex = (cycleIndex + 1) % CYCLING_ITEMS.length;
        showItem(CYCLING_ITEMS[cycleIndex]);
    }

    function startCycling() {
        clearInterval(cycleTimer);
        cycleTimer = setInterval(advanceCycle, 4000);
    }

    function pauseCycling() {
        clearInterval(cycleTimer);
    }

    // Show first item immediately, then start cycling
    showItem(CYCLING_ITEMS[0], true);
    startCycling();
    // ─────────────────────────────────────────────────────────────────────────

    let revertTimer = null;
    let currentTarget = null;

    function setTagline(text) {
        pauseCycling();
        clearTimeout(revertTimer);
        showItem(text);
    }

    function revertTagline() {
        revertTimer = setTimeout(() => {
            showItem(CYCLING_ITEMS[cycleIndex]);
            startCycling();
        }, 80);
    }

    COMMENTARY.forEach(({ selector, text }) => {
        document.addEventListener('mouseover', e => {
            if (e.target.closest('.modal-overlay')) return;
            const el = e.target.closest(selector);
            if (!el) return;
            if (currentTarget === el) return;
            currentTarget = el;
            setTagline(text);
        }, { passive: true });

        document.addEventListener('mouseout', e => {
            if (e.target.closest('.modal-overlay')) return;
            const el = e.target.closest(selector);
            if (!el || el !== currentTarget) return;
            if (el.contains(e.relatedTarget)) return;
            currentTarget = null;
            revertTagline();
        }, { passive: true });
    });

})();
