(function () {

    // Tagline is hidden on mobile; hover commentary doesn't apply on touch devices.
    if (window.matchMedia('(hover: none)').matches) return;

    const CYCLING_ITEMS = [
        "Currently focused right now on AI-driven products and experiences",
        "I design and build with code, prototyping AI experiences that feel intuitive not unpredictable",
        "This site is constantly evolving with new projects and refinements",
    ];

    const COMMENTARY = [
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
        {
            selector: ".pill-dark",
            text: "Download my resume — updated 2026."
        },
        {
            selector: ".pill-light",
            text: "Let's connect on LinkedIn."
        },
        //{
        //  selector: ".hero-years-highlight",
        //text: "Parsons, Digital Ocean, Noise, OnePlus — four years, four very different schools."
        //},
        {
            selector: ".hero-previously-card",
            text: "Products shipped across EdTech, dev tools, consumer hardware, and mobile OS."
        },
        //{
        //   selector: "#hero-mosaic-container",
        //  text: "That's a live video mosaic. Hover around. Hit the camera button to use your webcam."
        //},
        {
            selector: ".pm-cam-btn",
            text: "Switch to your webcam — the mosaic renders you in real time."
        },
        {
            selector: ".project-card-container",
            text: "Click to open the full case study."
        },
        {
            selector: ".projects-wrapper",
            text: "All projects, sorted by most recent."
        },
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
        {
            selector: ".about-card-container",
            text: "A few things worth knowing."
        },
        {
            selector: ".about-link-row",
            text: "Feel free to reach out through any of these."
        },
        {
            selector: "a[href='mailto:pranavchaparala@gmail.com']",
            text: "Best way to reach me. I usually reply within a day."
        },
        {
            selector: ".theme-toggle-bar",
            text: "Switch between light and dark."
        }
    ];

    const taglineEl = document.querySelector('.tagline-text');
    if (!taglineEl) return;

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

    function startCycling() {
        clearInterval(cycleTimer);
        cycleTimer = setInterval(() => {
            cycleIndex = (cycleIndex + 1) % CYCLING_ITEMS.length;
            showItem(CYCLING_ITEMS[cycleIndex]);
        }, 4000);
    }

    function pauseCycling() {
        clearInterval(cycleTimer);
    }

    showItem(CYCLING_ITEMS[0], true);
    startCycling();

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

    document.addEventListener('mouseover', e => {
        if (e.target.closest('.modal-overlay')) return;
        for (const { selector, text } of COMMENTARY) {
            const el = e.target.closest(selector);
            if (el && el !== currentTarget) {
                currentTarget = el;
                setTagline(text);
                return;
            }
        }
    }, { passive: true });

    document.addEventListener('mouseout', e => {
        if (!currentTarget) return;
        if (e.target.closest('.modal-overlay')) return;
        if (currentTarget.contains(e.relatedTarget)) return;
        for (const { selector } of COMMENTARY) {
            const el = e.target.closest(selector);
            if (el && el === currentTarget) {
                currentTarget = null;
                revertTagline();
                return;
            }
        }
    }, { passive: true });

})();
