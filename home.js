/**
 * home.js — Home page projects carousel, experiments auto-play carousel, and interactive footer.
 */
document.addEventListener('DOMContentLoaded', () => {
    const MEDIA_BASE = 'assets/experiments/';

    // --- Render Projects Grid (First 3 projects) ---
    const projectsCarousel = document.getElementById('home-projects-carousel');
    if (projectsCarousel && typeof projectsData !== 'undefined' && projectsData.length > 0) {
        projectsCarousel.innerHTML = '';

        projectsData.slice(0, 3).forEach(proj => {
            const card = document.createElement('div');
            card.className = 'project-card-container project-grid-card';
            card.setAttribute('data-haptic', '');
            if (proj.tags && proj.tags.length > 0) {
                const tagSlug = proj.tags[0].toLowerCase().replace(/\s+/g, '-');
                card.dataset.tag = tagSlug;
            }

            const header = document.createElement('div');
            header.className = 'project-header';
            header.innerHTML = `
                <span class="project-name">${proj.title}</span>
                <span class="project-year">${proj.year || ''}</span>
            `;
            card.appendChild(header);

            const gallery = document.createElement('div');
            gallery.className = 'project-gallery gallery-grid-1';

            const frame = document.createElement('div');
            frame.className = 'media-frame ratio-cube';
            const img = document.createElement('img');
            img.src = proj.galleryImages[0].src;
            img.alt = proj.title;
            img.loading = 'lazy';
            frame.appendChild(img);
            gallery.appendChild(frame);
            card.appendChild(gallery);

            const caption = document.createElement('div');
            caption.className = 'project-card-caption';
            caption.textContent = proj.caption || '';
            card.appendChild(caption);

            card.addEventListener('click', () => {
                if (document.body.classList.contains('page-leaving')) return;
                document.body.classList.add('page-leaving');
                setTimeout(() => {
                    window.location.href = `projects.html?p=${proj.id}`;
                }, 200);
            });

            projectsCarousel.appendChild(card);
        });
    }

    // --- Render Experiments Carousel with Continuous Scroll (First 12 experiments) ---
    const expThumbs = document.getElementById('home-experiments-thumbs');
    if (expThumbs && typeof experimentsData !== 'undefined') {
        const expCount = Math.min(12, experimentsData.length);
        expThumbs.innerHTML = '';

        const carousel = document.createElement('div');
        carousel.className = 'experiments-carousel-track';

        // Bar-graph heights: short → tall → medium, cycling (smaller on mobile)
        const isMobile = window.innerWidth <= 768;
        const barHeights = isMobile
            ? ['120px', '210px', '165px']
            : ['180px', '330px', '240px'];

        // Helper to create a card (expIdx = real index in experimentsData for click delegation)
        function createExpCard(exp, heightIndex, expIdx) {
            const card = document.createElement('div');
            card.className = 'experiment-carousel-card';
            card.setAttribute('data-haptic', '');
            card.dataset.expIdx = expIdx;

            const mediaWrap = document.createElement('div');
            mediaWrap.className = 'experiment-media-wrap';
            mediaWrap.style.height = barHeights[heightIndex % 3];

            const isGif = exp.videoFilename && exp.videoFilename.endsWith('.gif');
            const isVideo = exp.videoFilename && (
                exp.videoFilename.endsWith('.mp4') ||
                exp.videoFilename.endsWith('.mov') ||
                exp.videoFilename.endsWith('.webm')
            );

            if (isGif) {
                const img = document.createElement('img');
                img.src = MEDIA_BASE + exp.videoFilename;
                img.alt = exp.title;
                img.className = 'experiment-media';
                mediaWrap.appendChild(img);
            } else if (isVideo) {
                const video = document.createElement('video');
                video.src = MEDIA_BASE + exp.videoFilename;
                video.autoplay = true;
                video.loop = true;
                video.muted = true;
                video.setAttribute('muted', '');
                video.playsInline = true;
                video.className = 'experiment-media';
                mediaWrap.appendChild(video);
            } else {
                const img = document.createElement('img');
                img.src = MEDIA_BASE + exp.filename;
                img.alt = exp.title;
                img.className = 'experiment-media';
                mediaWrap.appendChild(img);
            }

            card.appendChild(mediaWrap);

            const titleEl = document.createElement('div');
            titleEl.className = 'experiment-card-title';
            titleEl.textContent = exp.title;
            card.appendChild(titleEl);

            return card;
        }

        // Render original cards
        experimentsData.slice(0, expCount).forEach((exp, idx) => {
            carousel.appendChild(createExpCard(exp, idx, idx));
        });

        // Clone the full set and append — enables seamless infinite loop
        const originals = [...carousel.children];
        originals.forEach(card => carousel.appendChild(card.cloneNode(true)));

        expThumbs.appendChild(carousel);

        // Event delegation handles clicks on both originals and clones
        carousel.addEventListener('click', (e) => {
            const card = e.target.closest('.experiment-carousel-card');
            if (!card) return;
            const idx = parseInt(card.dataset.expIdx, 10);
            if (!isNaN(idx) && typeof window.openExperimentModal === 'function') {
                window.openExperimentModal(experimentsData[idx]);
            }
        });

        // ---- SEAMLESS CONTINUOUS SCROLL ----
        let scrollAnimationId = null;
        let isPaused = false;
        const SCROLL_SPEED = 0.5;

        function startContinuousScroll() {
            if (scrollAnimationId) return;
            function step() {
                if (!isPaused) {
                    carousel.scrollLeft += SCROLL_SPEED;
                    // When we reach the midpoint (start of the clone set),
                    // silently jump back — same visual position, no flash
                    const half = carousel.scrollWidth / 2;
                    if (carousel.scrollLeft >= half) {
                        carousel.scrollLeft -= half;
                    }
                }
                scrollAnimationId = requestAnimationFrame(step);
            }
            scrollAnimationId = requestAnimationFrame(step);
        }

        function stopContinuousScroll() {
            if (scrollAnimationId) {
                cancelAnimationFrame(scrollAnimationId);
                scrollAnimationId = null;
            }
        }

        carousel.addEventListener('mouseenter', () => { isPaused = true; });
        carousel.addEventListener('mouseleave', () => { isPaused = false; });

        startContinuousScroll();

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                stopContinuousScroll();
            } else {
                startContinuousScroll();
            }
        });
    }

    // --- Footer Interactive Logic ---
    const localTimeEl = document.getElementById('nyc-local-time');
    const tzListEl = document.getElementById('other-timezones-list');

    function updateClocks() {
        const now = new Date();

        const nycTimeStr = now.toLocaleTimeString('en-US', {
            timeZone: 'America/New_York',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
        if (localTimeEl) {
            localTimeEl.textContent = `${nycTimeStr} EST`;
        }

        const zones = [
            { name: 'San Francisco', zone: 'America/Los_Angeles', label: 'PST' },
            { name: 'London', zone: 'Europe/London', label: 'BST' },
            { name: 'Tokyo', zone: 'Asia/Tokyo', label: 'JST' }
        ];

        if (tzListEl) {
            tzListEl.innerHTML = zones.map(z => {
                const zTime = now.toLocaleTimeString('en-US', {
                    timeZone: z.zone,
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                });
                return `<div class="timezone-row"><span>${z.name}</span><strong>${zTime} ${z.label}</strong></div>`;
            }).join('');
        }
    }

    updateClocks();
    setInterval(updateClocks, 1000);
});