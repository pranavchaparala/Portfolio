/**
 * home.js — Home page bento grid, experiments thumbnails, and interactive footer.
 */
document.addEventListener('DOMContentLoaded', () => {
    // --- Render Bento Grid (First 4 projects) ---
    const bentoGrid = document.getElementById('home-bento-grid');
    if (bentoGrid && typeof projectsData !== 'undefined') {
        const firstFour = projectsData.slice(0, 4);
        bentoGrid.innerHTML = '';

        firstFour.forEach((proj, idx) => {
            const card = document.createElement('div');
            // Assign class for styling and grid layouts
            card.className = `home-bento-card bento-span-${idx === 0 || idx === 3 ? '2' : '1'}`;
            card.setAttribute('data-haptic', '');

            // Top Header: Name and Year
            const header = document.createElement('div');
            header.className = 'bento-card-header';
            header.innerHTML = `
                <span class="bento-title">${proj.title}</span>
                <span class="bento-year">${proj.year || ''}</span>
            `;
            card.appendChild(header);

            // Image Frame
            const imgFrame = document.createElement('div');
            imgFrame.className = 'bento-media-frame';
            const img = document.createElement('img');
            img.src = proj.galleryImages[0].src;
            img.alt = proj.title;
            imgFrame.appendChild(img);
            card.appendChild(imgFrame);

            // Click → open case study modal
            card.addEventListener('click', () => {
                if (proj.externalLink) {
                    window.open(proj.externalLink, '_blank');
                } else if (typeof window.openCaseStudy === 'function') {
                    window.openCaseStudy(proj.id);
                }
            });

            bentoGrid.appendChild(card);
        });
    }

    // --- Render Experiments Thumbnails (First 6 experiments) ---
    const expThumbs = document.getElementById('home-experiments-thumbs');
    if (expThumbs && typeof experimentsData !== 'undefined') {
        const firstSix = experimentsData.slice(0, 6);
        expThumbs.innerHTML = '';

        firstSix.forEach(exp => {
            const thumb = document.createElement('div');
            thumb.className = 'home-experiment-thumb project-card-container';
            thumb.setAttribute('data-haptic', '');

            const mediaWrap = document.createElement('div');
            mediaWrap.className = 'thumb-media-wrap';

            // Check if video/gif or image
            const isGif = exp.videoFilename && exp.videoFilename.endsWith('.gif');
            const isVideo = exp.videoFilename && (
                exp.videoFilename.endsWith('.mp4') ||
                exp.videoFilename.endsWith('.mov') ||
                exp.videoFilename.endsWith('.webm')
            );
            const MEDIA_BASE = 'assets/experiments/';

            if (isGif) {
                const img = document.createElement('img');
                img.src = MEDIA_BASE + exp.videoFilename;
                img.alt = exp.title;
                mediaWrap.appendChild(img);
            } else if (isVideo) {
                const video = document.createElement('video');
                video.src = MEDIA_BASE + exp.videoFilename;
                video.autoplay = true;
                video.loop = true;
                video.muted = true;
                video.playsInline = true;
                mediaWrap.appendChild(video);
            } else {
                const img = document.createElement('img');
                img.src = MEDIA_BASE + exp.filename;
                img.alt = exp.title;
                mediaWrap.appendChild(img);
            }

            thumb.appendChild(mediaWrap);

            const title = document.createElement('div');
            title.className = 'thumb-title';
            title.textContent = exp.title;
            thumb.appendChild(title);

            // Click → open experiment modal
            thumb.addEventListener('click', () => {
                if (typeof window.openExperimentModal === 'function') {
                    window.openExperimentModal(exp);
                }
            });

            expThumbs.appendChild(thumb);
        });
    }

    // --- Footer Interactive Logic (Timezones and Map) ---
    // Update local NYC time (Eastern Time)
    const localTimeEl = document.getElementById('nyc-local-time');
    const tzListEl = document.getElementById('other-timezones-list');

    function updateClocks() {
        const now = new Date();
        
        // NYC Local Time
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

        // Popover Timezones: London, Tokyo, San Francisco
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
