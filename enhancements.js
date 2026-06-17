/**
 * enhancements.js — additive layer, safe to remove.
 *
 * Undo paths:
 *  - Flip any flag below to `false` to disable just that feature.
 *  - Delete the <script src="enhancements.js"> and matching <link> tag from a
 *    page to remove all of it from that page only. Nothing else in the site
 *    depends on this file.
 */
(function () {
    'use strict';

    const ENH = {
        cursor: true,
        easterEggs: true,
        pixelEchoes: false,
        smoothScroll: false
    };

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouch = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;

    if (ENH.pixelEchoes) {
        document.documentElement.classList.add('enh-pixel-echoes');
    }

    if (ENH.cursor && !reduceMotion && !isTouch) {
        initMagneticCursor();
    }

    if (ENH.easterEggs) {
        initEasterEggs();
    }

    if (ENH.smoothScroll && !reduceMotion && !isTouch) {
        initSmoothScroll();
    }

    // ── Magnetic iPadOS-style cursor ────────────────────────────────────────
    // Ported from github.com/SpyC0der77/ipados-cursor-nextjs: the cursor
    // morphs to envelop whatever's under it while the target itself shifts
    // slightly toward the pointer.
    //
    // Position is driven entirely from the `mousemove` event (no rAF loop),
    // with a CSS `transition` doing the smoothing. That matters specifically
    // on the home page: pixel-mosaic.js blocks the main thread in irregular
    // bursts every frame (full-canvas getImageData twice), so a JS rAF lerp
    // — which assumes evenly-spaced ticks to look smooth — visibly stutters
    // there even though the rest of the page feels fine. A CSS transition is
    // handled by the compositor, so it keeps animating smoothly between
    // however-irregularly our mousemove updates land.
    function initMagneticCursor() {
        document.body.classList.add('enh-cursor-active');

        // Only true buttons get the cursor morphing to envelop their exact
        // shape. Everything else (cards, plain links) still gets the
        // magnetic pan on the element itself — that's the part that read as
        // "image panning" and was worth keeping — but the cursor just grows
        // into a bigger plain dot that follows the pointer, rather than
        // ballooning into the shape of an entire card.
        const BUTTON_SELECTOR = 'button, .nav-btn, .pill, .theme-btn, .logo-block';
        const OTHER_SELECTOR = 'a, [role="button"], [onclick], label[for], summary';
        const EXCLUDE_SELECTOR = '.project-card-container, .experiment-item, .experiment-carousel-card';

        const cursor = document.createElement('div');
        cursor.id = 'enh-cursor';
        const light = document.createElement('span');
        light.id = 'enh-cursor-light';
        cursor.appendChild(light);
        document.body.appendChild(cursor);

        const MAGNETIC_STRENGTH = 0.045;       // buttons: how much of the offset gets applied (0-1)
        const MAGNETIC_LIMIT = 0.032;          // buttons: clamp, as a fraction of the target's own *smaller* dimension
        const OTHER_MAGNETIC_STRENGTH = 0.012; // cards/links: barely-there nudge — perceptible, not a feature
        const OTHER_MAGNETIC_LIMIT = 0.01;
        const LIGHT_MULT = 2;            // how far the inner highlight drifts vs. the pull
        const DEFAULT_SIZE = 14;
        const OTHER_INDICATOR_SIZE = 48;

        let active = null; // { el, isButton, offX, offY }
        let isDown = false;

        cursor.style.width = DEFAULT_SIZE + 'px';
        cursor.style.height = DEFAULT_SIZE + 'px';
        cursor.style.borderRadius = '999px';

        function setShape(target, width, height, isButton) {
            if (target && isButton) {
                cursor.style.width = width + 'px';
                cursor.style.height = height + 'px';
                cursor.style.borderRadius = (parseFloat(getComputedStyle(target).borderRadius) || 12) + 'px';
            } else if (target) {
                cursor.style.width = OTHER_INDICATOR_SIZE + 'px';
                cursor.style.height = OTHER_INDICATOR_SIZE + 'px';
                cursor.style.borderRadius = '999px';
            } else {
                cursor.style.width = DEFAULT_SIZE + 'px';
                cursor.style.height = DEFAULT_SIZE + 'px';
                cursor.style.borderRadius = '999px';
            }
        }

        function releaseActive() {
            if (!active) return;
            active.el.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
            active.el.style.transform = '';
            active = null;
            cursor.classList.remove('enh-cursor--block', 'enh-cursor--button');
            light.style.transform = '';
            setShape(null);
        }

        function applyScale() {
            const targetScale = isDown ? (active && active.isButton ? 0.97 : 0.92) : 1;
            cursor.style.setProperty('--enh-cursor-scale', targetScale);
        }

        function handleMove(mouseX, mouseY) {
            let hit = document.elementFromPoint(mouseX, mouseY);
            // elementFromPoint can return the cursor div itself (high z-index);
            // hide it temporarily so the real element underneath is returned.
            if (hit === cursor || hit === light) {
                cursor.style.display = 'none';
                hit = document.elementFromPoint(mouseX, mouseY);
                cursor.style.display = '';
            }
            // Only skip the scrolling content body of the modal — that's where
            // heavy DOM injection + multi-property transitions happen and cause
            // glitches. The sticky header and footer action buttons are fine.
            const inModalBody = hit && hit.closest('.modal-body-scroller-content, .exp-modal-body');
            const cardTarget = (hit && !inModalBody) ? hit.closest(EXCLUDE_SELECTOR) : null;
            const inExcluded = !!cardTarget;
            const buttonTarget = (hit && !inModalBody && !inExcluded) ? hit.closest(BUTTON_SELECTOR) : null;
            const target = buttonTarget || ((hit && !inModalBody && !inExcluded) ? hit.closest(OTHER_SELECTOR) : null);

            // Card hover: grow cursor without enveloping
            const onCard = !!cardTarget;
            cursor.classList.toggle('enh-cursor--card', onCard);
            if (onCard && !active) {
                cursor.style.width = '36px';
                cursor.style.height = '36px';
                cursor.style.borderRadius = '999px';
            } else if (!onCard && !active) {
                cursor.style.width = DEFAULT_SIZE + 'px';
                cursor.style.height = DEFAULT_SIZE + 'px';
                cursor.style.borderRadius = '999px';
            }

            if (target !== (active && active.el)) {
                releaseActive();
                if (target) {
                    const isButton = !!buttonTarget;
                    const rect = target.getBoundingClientRect();
                    active = { el: target, isButton, offX: 0, offY: 0 };
                    cursor.classList.add('enh-cursor--block');
                    cursor.classList.toggle('enh-cursor--button', isButton);
                    target.style.transition = 'none';
                    setShape(target, rect.width, rect.height, isButton);
                }
            }

            let tx = mouseX, ty = mouseY;

            if (active) {
                // getBoundingClientRect reflects our own last-applied offset, so
                // subtract it back out to find the element's true resting position
                // (otherwise the pull compounds frame over frame and drifts/jitters).
                const visual = active.el.getBoundingClientRect();
                const cx = visual.left - active.offX + visual.width / 2;
                const cy = visual.top - active.offY + visual.height / 2;

                // Clamp both axes off the *same* (smaller) dimension, not each
                // axis's own size — a wide multi-photo row (gallery-grid-2/3)
                // is much wider than it is tall, so per-axis clamping let the
                // horizontal pan run way stronger than the vertical one and
                // made the pan feel uneven across multi-image cards.
                const strength = active.isButton ? MAGNETIC_STRENGTH : OTHER_MAGNETIC_STRENGTH;
                const limit = active.isButton ? MAGNETIC_LIMIT : OTHER_MAGNETIC_LIMIT;
                const maxOffset = Math.min(visual.width, visual.height) * limit;
                const offX = Math.max(-maxOffset, Math.min(maxOffset, (mouseX - cx) * strength));
                const offY = Math.max(-maxOffset, Math.min(maxOffset, (mouseY - cy) * strength));

                active.el.style.transform = `translate3d(${offX}px, ${offY}px, 0)`;
                active.offX = offX;
                active.offY = offY;

                if (active.isButton) {
                    // Cursor tracks the button's own (magnetically pulled) center.
                    light.style.transform = `translate(${offX * LIGHT_MULT}px, ${offY * LIGHT_MULT}px)`;
                    tx = cx + offX;
                    ty = cy + offY;
                }
                // Non-buttons: the element still pans, but the cursor just
                // follows the real pointer position (set below) — it's not
                // trying to be a glove for the whole card.
            }

            cursor.style.transform =
                `translate(${tx}px, ${ty}px) translate(-50%, -50%) scale(var(--enh-cursor-scale, 1))`;
        }

        window.addEventListener('mousemove', e => handleMove(e.clientX, e.clientY));
        window.addEventListener('mouseleave', () => { releaseActive(); cursor.style.opacity = '0'; });
        window.addEventListener('mouseenter', () => { cursor.style.opacity = ''; });
        window.addEventListener('mousedown', () => { isDown = true; applyScale(); });
        window.addEventListener('mouseup', () => { isDown = false; applyScale(); });
    }

    // ── Friction / inertia scrolling ───────────────────────────────────────
    // Applies to window scroll and to the case-study/experiment modal
    // scrollers (.modal-sheet, .exp-modal-body). One shared wheel listener
    // picks the right target; the rAF loop only runs while a scroller still
    // has velocity, so it costs nothing while idle.
    function initSmoothScroll() {
        const FRICTION = 0.5;
        const GAIN = 0.55;
        const MAX_VELOCITY = 70;
        const STOP_THRESHOLD = 0.05;

        const active = new Map(); // el -> velocity

        function maxScroll(el) {
            return el.scrollHeight - el.clientHeight;
        }

        function step(el) {
            const v = active.get(el);
            if (v === undefined) return;

            const decayed = v * FRICTION;
            const max = maxScroll(el);
            const next = Math.max(0, Math.min(max, el.scrollTop + decayed));
            el.scrollTop = next;

            if (Math.abs(decayed) < STOP_THRESHOLD || next <= 0 || next >= max) {
                active.delete(el);
                return;
            }
            active.set(el, decayed);
            requestAnimationFrame(() => step(el));
        }

        window.addEventListener('wheel', e => {
            if (e.ctrlKey) return; // let pinch-zoom through untouched

            // Modal scroll containers are excluded on purpose: app.js toggles
            // the (expensive, multi-property) .expanded transition off a
            // scrollTop > 40 threshold. Our decaying-velocity steps can
            // overshoot/oscillate right around that threshold, repeatedly
            // flipping the class and restarting that transition mid-flight —
            // which is exactly the "modal glitching" regression this fixes.
            // Native scrolling there is what that logic was tuned against.
            if (e.target.closest('.modal-sheet, .exp-modal-body')) return;

            const el = document.scrollingElement;
            if (maxScroll(el) <= 0) return;

            e.preventDefault();

            const wasIdle = !active.has(el);
            const current = active.get(el) || 0;
            let next = current + e.deltaY * GAIN;
            next = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, next));
            active.set(el, next);

            if (wasIdle) requestAnimationFrame(() => step(el));
        }, { passive: false });
    }

    // ── Easter eggs ─────────────────────────────────────────────────────────
    function initEasterEggs() {
        const FOUND_KEY = 'enh-eggs-found';
        const found = new Set(JSON.parse(localStorage.getItem(FOUND_KEY) || '[]'));
        const TOTAL_EGGS = 2;
        const ARROW_EGG = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight'];

        let letterBuffer = '';
        let arrowBuffer = [];

        function markFound(id) {
            if (found.has(id)) return;
            found.add(id);
            localStorage.setItem(FOUND_KEY, JSON.stringify([...found]));
        }

        function pixelBurst() {
            const cols = 14, rows = 8;
            const overlay = document.createElement('div');
            overlay.className = 'enh-pixel-burst';
            overlay.style.setProperty('--cols', cols);
            for (let i = 0; i < cols * rows; i++) {
                const tile = document.createElement('span');
                tile.style.animationDelay = (Math.random() * 0.3) + 's';
                overlay.appendChild(tile);
            }
            document.body.appendChild(overlay);
            requestAnimationFrame(() => overlay.classList.add('enh-pixel-burst--active'));
            setTimeout(() => overlay.remove(), 1400);
        }

        function konamiFlash() {
            document.documentElement.classList.add('enh-konami-flash');
            setTimeout(() => document.documentElement.classList.remove('enh-konami-flash'), 900);
        }

        function toggleEggInfo() {
            const existing = document.getElementById('enh-egg-info');
            if (existing) {
                existing.remove();
                return;
            }
            const box = document.createElement('div');
            box.id = 'enh-egg-info';
            box.innerHTML = `<strong>${found.size}/${TOTAL_EGGS}</strong> easter eggs found<br><span>hint: try typing, or arrow keys</span>`;
            document.body.appendChild(box);
            setTimeout(() => box.remove(), 4000);
        }

        document.addEventListener('keydown', e => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            if (e.key === '?') {
                toggleEggInfo();
                return;
            }

            if (e.key.length === 1) {
                letterBuffer = (letterBuffer + e.key.toLowerCase()).slice(-5);
                if (letterBuffer === 'pixel') {
                    markFound('pixel-burst');
                    pixelBurst();
                    letterBuffer = '';
                }
            }

            if (e.key.startsWith('Arrow')) {
                arrowBuffer.push(e.key);
                arrowBuffer = arrowBuffer.slice(-ARROW_EGG.length);
                if (arrowBuffer.join() === ARROW_EGG.join()) {
                    markFound('konami');
                    konamiFlash();
                    arrowBuffer = [];
                }
            }
        });
    }

})();
