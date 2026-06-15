/**
 * experiments.js  –  Experiments page logic
 *
 * Grid: 5-column masonry, each item styled as a project-card-container
 *       (grey background, padding, title on top, image at natural ratio)
 *
 * Modal: fits viewport height without scroll, media + metadata panels,
 *        minimap rail appears when modal expands to full-width.
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- DOM ---
    const experimentsSection    = document.getElementById('experiments-section');
    const experimentsCountEl    = document.getElementById('experiments-count');
    const experimentsCountTitle = document.getElementById('experiments-count-title');

    // Modal DOM
    const overlayEl       = document.getElementById('experiment-modal');
    const sheetEl         = document.getElementById('experiment-modal-sheet');
    const mediaContainer  = document.getElementById('experiment-media-container');
    const metaRow         = document.getElementById('exp-modal-meta');
    const titleTarget     = document.getElementById('experiment-modal-title');
    const dynamicBody     = document.getElementById('exp-modal-dynamic-body');

    // Minimap rail DOM
    const railEl          = document.getElementById('exp-modal-rail');
    const viewportWin     = document.getElementById('exp-modal-viewport-indicator');
    const miniMapEl       = document.getElementById('exp-modal-mini-map');

    const count = typeof experimentsData !== 'undefined' ? experimentsData.length : 0;
    if (experimentsCountEl)    experimentsCountEl.textContent    = count;
    if (experimentsCountTitle) experimentsCountTitle.textContent = count;

    const MEDIA_BASE = 'assets/experiments/';

    // -------------------------------------------------------
    // RENDER 5-COL MASONRY with project-card-container style
    // -------------------------------------------------------
    function renderExperiments() {
        if (!experimentsSection || typeof experimentsData === 'undefined') return;

        const masonry = document.createElement('div');
        masonry.className = 'experiments-masonry';

        experimentsData.forEach(exp => {
            const card = document.createElement('div');
            card.className = 'experiment-item project-card-container';

            // ---- Header (title on top, same as project cards) ----
            const header = document.createElement('div');
            header.className = 'project-header';

            const nameSpan = document.createElement('span');
            nameSpan.className = 'project-name';
            nameSpan.textContent = exp.title;

            const descSpan = document.createElement('span');
            descSpan.className = 'project-year';
            descSpan.textContent = exp.description;

            header.appendChild(nameSpan);
            header.appendChild(descSpan);
            card.appendChild(header);

            // ---- Media at natural aspect ratio ----
            const mediaWrap = document.createElement('div');
            mediaWrap.className = 'experiment-media-wrap';

            const isGif   = exp.videoFilename && exp.videoFilename.endsWith('.gif');
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
                video.autoplay    = true;
                video.loop        = true;
                video.muted       = true;
                video.playsInline = true;
                video.className   = 'experiment-media';
                mediaWrap.appendChild(video);
            } else {
                const img = document.createElement('img');
                img.src = MEDIA_BASE + exp.filename;
                img.alt = exp.title;
                img.className = 'experiment-media';
                mediaWrap.appendChild(img);
            }

            card.appendChild(mediaWrap);

            // Click → open modal
            card.addEventListener('click', () => openExperimentModal(exp));
            masonry.appendChild(card);
        });

        experimentsSection.appendChild(masonry);
    }

    // -------------------------------------------------------
    // MINIMAP RAIL SYSTEM (mirrors app.js)
    // -------------------------------------------------------
    function syncRailLayout() {
        if (!dynamicBody || !railEl || !miniMapEl || !viewportWin || !sheetEl) return;
        const totalH   = dynamicBody.scrollHeight;
        const visibleH = sheetEl.clientHeight;
        const railH    = railEl.clientHeight;
        const ratio    = railH / totalH;
        const indH     = Math.max(20, Math.round(visibleH * ratio));
        viewportWin.style.height = `${indH}px`;

        miniMapEl.innerHTML = '';
        dynamicBody.querySelectorAll('h1, h2, h3, img, video').forEach(el => {
            const top    = Math.round(el.offsetTop  * ratio);
            const height = Math.max(2, Math.round(el.offsetHeight * ratio));
            const m = document.createElement('div');
            m.className = 'mini-map-element' + (el.tagName === 'IMG' || el.tagName === 'VIDEO' ? ' mini-map-media' : '');
            m.style.cssText = `position:absolute;top:${top}px;height:${height}px;left:0;right:0;`;
            miniMapEl.appendChild(m);
        });
    }

    function trackRailScroll(scrollPos) {
        if (!dynamicBody || !railEl || !viewportWin) return;
        const ratio = railEl.clientHeight / dynamicBody.scrollHeight;
        viewportWin.style.transform = `translateY(${Math.round(scrollPos * ratio)}px)`;
    }

    // -------------------------------------------------------
    // OPEN EXPERIMENT MODAL
    // -------------------------------------------------------
    window.openExperimentModal = function(exp) {
        if (!overlayEl || !mediaContainer || !metaRow || !titleTarget) return;

        // Set header title
        titleTarget.innerText = exp.title;

        // Inject media
        mediaContainer.innerHTML = '';
        const isGif   = exp.videoFilename && exp.videoFilename.endsWith('.gif');
        const isVideo = exp.videoFilename && (
            exp.videoFilename.endsWith('.mp4') ||
            exp.videoFilename.endsWith('.mov') ||
            exp.videoFilename.endsWith('.webm')
        );

        if (isGif) {
            const img = document.createElement('img');
            img.src = MEDIA_BASE + exp.videoFilename;
            img.alt = exp.title;
            mediaContainer.appendChild(img);
        } else if (isVideo) {
            const video = document.createElement('video');
            video.src         = MEDIA_BASE + exp.videoFilename;
            video.autoplay    = true;
            video.loop        = true;
            video.muted       = true;
            video.playsInline = true;
            video.controls    = true;
            mediaContainer.appendChild(video);
        } else {
            const img = document.createElement('img');
            img.src = MEDIA_BASE + exp.filename;
            img.alt = exp.title;
            mediaContainer.appendChild(img);
        }

        // Build metadata panels (same design as projects)
        metaRow.innerHTML = '';
        const board = document.createElement('div');
        board.className = 'metadata-showcase-board exp-metadata-board';

        function makeStack(tagText, bodyContent) {
            const stack = document.createElement('div');
            stack.className = 'meta-stack-block';
            const tag = document.createElement('span');
            tag.className = 'meta-panel-tag';
            tag.textContent = tagText;
            stack.appendChild(tag);
            const body = document.createElement('div');
            body.className = 'meta-panel-body-card';
            body.textContent = bodyContent;
            stack.appendChild(body);
            return stack;
        }

        // Col 1 — About / Description
        board.appendChild(makeStack('About', exp.description));

        // Col 2 — Medium (inferred from file type)
        let medium = 'Static Image';
        if (isGif)   medium = 'GIF Animation';
        if (isVideo) medium = 'Motion / Video';
        board.appendChild(makeStack('Medium', medium));

        // Col 3 — Index
        board.appendChild(makeStack('No.', String(exp.id).padStart(2, '0')));

        metaRow.appendChild(board);

        // Open modal
        overlayEl.classList.remove('rail-active');
        overlayEl.classList.add('active');
        if (sheetEl) sheetEl.scrollTop = 0;
        document.body.style.overflow = 'hidden';

        setTimeout(() => syncRailLayout(), 80);
    };

    window.closeExperimentModal = function(event) {
        if (event) event.stopPropagation();
        if (!overlayEl) return;
        overlayEl.classList.remove('active');
        overlayEl.classList.remove('rail-active');
        setTimeout(() => {
            document.body.style.overflow = 'auto';
            if (mediaContainer) mediaContainer.innerHTML = '';
            if (metaRow) metaRow.innerHTML = '';
        }, 400);
    };

    // Backdrop click closes
    if (overlayEl) {
        overlayEl.addEventListener('click', e => {
            if (e.target === overlayEl) closeExperimentModal(e);
        });
    }

    // Scroll: toggle rail-active when scrolled, and track scroll position
    if (sheetEl) {
        sheetEl.addEventListener('scroll', () => {
            const pos    = sheetEl.scrollTop;
            const bottom = sheetEl.scrollHeight - sheetEl.clientHeight;
            if (pos > 40 && pos < bottom - 40) {
                overlayEl.classList.add('rail-active');
            } else {
                overlayEl.classList.remove('rail-active');
            }
            trackRailScroll(pos);
        });

        const ro = new ResizeObserver(() => syncRailLayout());
        if (dynamicBody) ro.observe(dynamicBody);
        window.addEventListener('resize', () => syncRailLayout());
    }

    // --- Kick off ---
    renderExperiments();
});
