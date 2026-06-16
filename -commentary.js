(function () {

    // ── What scrolls in the header on non-home pages ─────────────────────────
    const BIO_TEXT = "Product designer with 4+ years building digital products at scale — from 0→1 launches to features used by 20M+ people. I design and build with code, focused right now on AI-driven products and experiences.";

    // ── Edit this to control what the tagline says on hover ──────────────────
    // Selectors that match inside .modal-overlay are automatically ignored.
    const COMMENTARY = [

        // ── Navigation ───────────────────────────────────────────────────────
        {
            selector: "a.nav-btn[href='projects.html'], a.nav-btn[href='../projects.html']",
            text: "11 case studies — product strategy, interaction design, and systems thinking."
        },
        {
            selector: "a.nav-btn[href='experiments.html'], a.nav-btn[href='../experiments.html']",
            text: "19 experiments in motion, generative design, and creative code."
        },
        {
            selector: "a.nav-btn[href='about.html'], a.nav-btn[href='../about.html']",
            text: "A bit about who I am and how I work."
        },
        {
            selector: ".header-block.logo-block",
            text: "Back to the home page."
        },

        // ── Home ─────────────────────────────────────────────────────────────
        {
            selector: ".pill-dark",
            text: "Download my resume — updated 2026."
        },
        {
            selector: ".pill-light",
            text: "Let's connect on LinkedIn."
        },
        {
            selector: ".hero-years-highlight",
            text: "Parsons, Digital Ocean, Noise, OnePlus — four years, four very different schools."
        },
        {
            selector: ".hero-previously-card",
            text: "Products shipped across EdTech, dev tools, consumer hardware, and mobile OS."
        },
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
            selector: ".projects-wrapper",
            text: "All projects, sorted by most recent."
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

    const isHome = !!document.querySelector('.home-hero');

    if (isHome) {
        taglineEl.textContent = 'hover on elements for insights';
        taglineEl.classList.add('tagline-blink');
    } else {
        // Set bio text explicitly — avoids DOM contamination from tooltip img alt texts
        taglineEl.textContent = BIO_TEXT;
        // initTaglineMarquee in each page's inline script fires at window.load
        // and correctly calculates --marquee-dist from the updated text
    }

    const defaultText = isHome ? 'hover on elements for insights' : BIO_TEXT;

    let revertTimer = null;
    let currentTarget = null;

    function setTagline(text) {
        clearTimeout(revertTimer);
        taglineEl.classList.remove('tagline-blink');
        taglineEl.style.transition = 'opacity 0.18s ease';
        taglineEl.style.opacity = '0';
        setTimeout(() => {
            taglineEl.textContent = text;
            taglineEl.style.opacity = '1';
        }, 180);
    }

    function revertTagline() {
        revertTimer = setTimeout(() => {
            taglineEl.style.transition = 'opacity 0.18s ease';
            taglineEl.style.opacity = '0';
            setTimeout(() => {
                taglineEl.textContent = defaultText;
                taglineEl.style.opacity = '1';
                if (isHome) taglineEl.classList.add('tagline-blink');
            }, 180);
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
