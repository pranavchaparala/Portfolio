(function () {
    'use strict';

    // ─── Live clock ──────────────────────────────────────────────────────────
    function tickClock() {
        const el = document.getElementById('nyc-local-time');
        if (!el) return;
        el.textContent = new Date().toLocaleTimeString('en-US', {
            timeZone: 'America/New_York',
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
        });
    }
    tickClock();
    setInterval(tickClock, 1000);

    // ─── Timezone tooltip ────────────────────────────────────────────────────
    const ZONES = [
        { name: 'San Francisco', zone: 'America/Los_Angeles' },
        { name: 'London',        zone: 'Europe/London'       },
        { name: 'Tokyo',         zone: 'Asia/Tokyo'          },
    ];

    function buildZoneHTML() {
        const now = new Date();
        return ZONES.map(z => {
            const parts = new Intl.DateTimeFormat('en-US', {
                timeZone: z.zone, hour: '2-digit', minute: '2-digit',
                hour12: false, timeZoneName: 'short'
            }).formatToParts(now);
            const time  = parts.find(p => p.type === 'hour').value + ':' + parts.find(p => p.type === 'minute').value;
            const label = parts.find(p => p.type === 'timeZoneName').value;
            return `<div class="tz-row"><span class="tz-name">${z.name}</span><span class="tz-time">${time} <span class="tz-label">${label}</span></span></div>`;
        }).join('');
    }

    // ─── Card tilt ───────────────────────────────────────────────────────────
    const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window;
    const tiltInited = new WeakSet();

    function initTiltOnImage(img) {
        img.addEventListener('mouseenter', () => img.classList.remove('tilt-img-resetting'));
        img.addEventListener('mousemove', e => {
            const r  = img.getBoundingClientRect();
            const dx = ((e.clientX - r.left) / r.width  - 0.5) * 2;
            const dy = ((e.clientY - r.top)  / r.height - 0.5) * 2;
            img.style.transform = `scale(1.06) translate(${dx * -6}px, ${dy * -6}px)`;
        });
        img.addEventListener('mouseleave', () => {
            img.classList.add('tilt-img-resetting');
            img.style.transform = '';
        });
    }

    // ─── Year hover ──────────────────────────────────────────────────────────
    const yearInited = new WeakSet();

    function initYearHover(el) {
        if (yearInited.has(el)) return;
        yearInited.add(el);
        const original = el.textContent.trim();
        const yr = parseInt(original, 10);
        if (isNaN(yr)) return;
        function fadeSwap(text) {
            el.style.opacity = '0';
            setTimeout(() => {
                el.textContent = text;
                el.style.opacity = '';
            }, 150);
        }
        el.addEventListener('mouseenter', () => {
            const diff = new Date().getFullYear() - yr;
            fadeSwap(diff <= 0 ? 'This year' : diff === 1 ? 'Last year' : `${diff} yrs ago`);
        });
        el.addEventListener('mouseleave', () => fadeSwap(original));
    }

    // Lazy-init on first hover — works regardless of when cards are rendered
    document.addEventListener('mouseover', e => {
        const el = e.target;
        if (!isMobile && (el.tagName === 'IMG' || el.tagName === 'VIDEO') && el.closest('.media-frame') && !tiltInited.has(el)) {
            tiltInited.add(el);
            initTiltOnImage(el);
        }
        const year = el.closest('.project-year');
        if (year) initYearHover(year);
    }, { passive: true });

    // ─── DOM-ready setup ─────────────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', () => {

        // Timezone tooltip wired to footer clock element
        const clockEl   = document.getElementById('nyc-local-time');
        const clockWrap = clockEl && clockEl.closest('.footer-info');
        if (clockWrap) {
            clockWrap.classList.add('footer-time-hover');
            const tip = document.createElement('div');
            tip.className = 'footer-tz-tooltip';
            tip.innerHTML = buildZoneHTML();
            setInterval(() => { tip.innerHTML = buildZoneHTML(); }, 1000);
            clockWrap.appendChild(tip);
            clockWrap.addEventListener('mouseenter', () => tip.classList.add('visible'));
            clockWrap.addEventListener('mouseleave', () => tip.classList.remove('visible'));
        }

        // Nav count-up — synced to page-transition.js reveal
        function animateCounts() {
            document.querySelectorAll('.nav-btn.active .count').forEach(badge => {
                const target = parseInt(badge.textContent, 10);
                if (isNaN(target) || target === 0) return;
                badge.textContent = '0';
                // Double rAF: first frame paints '0' at opacity 0, second triggers the CSS fade-in
                requestAnimationFrame(() => requestAnimationFrame(() => {
                    badge.style.opacity = '1';
                    let t0 = null;
                    function step(ts) {
                        if (!t0) t0 = ts;
                        const p = Math.min((ts - t0) / 1400, 1);
                        badge.textContent = Math.round((1 - Math.pow(1 - p, 3)) * target);
                        if (p < 1) requestAnimationFrame(step);
                        else badge.textContent = target;
                    }
                    requestAnimationFrame(step);
                }));
            });
        }

        if (document.body.classList.contains('page-entered')) {
            animateCounts();
        } else {
            const obs = new MutationObserver(() => {
                if (!document.body.classList.contains('page-entered')) return;
                obs.disconnect();
                animateCounts();
            });
            obs.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        }

        // Recognition context lines — injected from data-context attribute
        document.querySelectorAll('.recognition-item[data-context]').forEach(item => {
            const ctx = document.createElement('span');
            ctx.className = 'recognition-context';
            ctx.textContent = item.dataset.context;
            item.appendChild(ctx);
        });
    });
})();
