/**
 * app.js  –  Projects page logic
 * Renders project cards in a 3-column grid layout:
 *   • layout-3 → full-width 3-image row
 *   • layout-2 → 2-image row, hugs content
 *   • layout-1 → single-image card, placed in a 3-column auto-grid
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Elements ---
    const projectsSection      = document.getElementById('projects-section');
    const projectsCountEl      = document.getElementById('projects-count');
    const projectsCountTitle   = document.getElementById('projects-count-title');

    const overlayContainer     = document.getElementById('case-study-modal');
    const modalSheet           = document.getElementById('modal-sheet-node');
    const miniMapBlueprint     = document.getElementById('modal-mini-map-content');
    const layoutRail           = document.getElementById('modal-rail');
    const structuralTarget     = document.getElementById('modal-dynamic-body-target');
    const viewportIndicator    = document.getElementById('modal-viewport-indicator');

    // --- Update counts ---
    const projectCount = typeof projectsData !== 'undefined' ? projectsData.length : 0;
    if (projectsCountEl)    projectsCountEl.textContent    = projectCount;
    if (projectsCountTitle) projectsCountTitle.textContent = projectCount;

    // -------------------------------------------------------
    // RENDER PROJECTS
    // Layout rules:
    //   layout-3 → spans a dedicated full-width row
    //   layout-2 → spans a dedicated row, hugs 2 images
    //   layout-1 → placed in a 3-column auto-grid row
    // -------------------------------------------------------
    function renderProjects() {
        if (!projectsSection || typeof projectsData === 'undefined') return;
        projectsSection.innerHTML = '';

        let i = 0;
        // 3-column container for single-image cards
        let singleColumnGrid = null;

        function flushSingleGrid() {
            if (singleColumnGrid) {
                projectsSection.appendChild(singleColumnGrid);
                singleColumnGrid = null;
            }
        }

        while (i < projectsData.length) {
            const project = projectsData[i];

            if (project.galleryLayout === '1') {
                // Accumulate into the 3-column single grid
                if (!singleColumnGrid) {
                    singleColumnGrid = document.createElement('div');
                    singleColumnGrid.className = 'project-single-grid';
                }
                singleColumnGrid.appendChild(createProjectCard(project));
                i++;
            } else {
                // layout-2 or layout-3: flush any pending single grid first
                flushSingleGrid();
                projectsSection.appendChild(createProjectCard(project));
                i++;
            }
        }
        // Flush any remaining singles
        flushSingleGrid();
    }

    function createProjectCard(project) {
        const container = document.createElement('div');
        container.className = `project-card-container layout-${project.galleryLayout}`;
        container.setAttribute('data-slug', project.id);

        // Header
        const header = document.createElement('div');
        header.className = 'project-header';
        const nameSpan = document.createElement('span');
        nameSpan.className = 'project-name';
        nameSpan.textContent = project.title;
        const yearSpan = document.createElement('span');
        yearSpan.className = 'project-year';
        yearSpan.textContent = project.year || '';
        header.appendChild(nameSpan);
        header.appendChild(yearSpan);
        container.appendChild(header);

        // Gallery
        const gallery = document.createElement('div');
        gallery.className = `project-gallery gallery-grid-${project.galleryLayout}`;
        project.galleryImages.forEach(img => {
            const frame = document.createElement('div');
            frame.className = `media-frame ${img.ratio || 'ratio-landscape'}`;
            const image = document.createElement('img');
            image.src = img.src;
            image.alt = project.title;
            frame.appendChild(image);
            gallery.appendChild(frame);
        });
        container.appendChild(gallery);

        // Click handler
        container.addEventListener('click', () => {
            if (project.externalLink) {
                window.open(project.externalLink, '_blank');
            } else {
                openCaseStudy(project.id);
            }
        });

        return container;
    }

    // -------------------------------------------------------
    // MINIMAP RAIL SYSTEM
    // -------------------------------------------------------
    function syncRailLayout() {
        if (!structuralTarget || !layoutRail || !miniMapBlueprint || !viewportIndicator) return;
        const totalHeight = structuralTarget.scrollHeight;
        const visibleHeight = modalSheet ? modalSheet.clientHeight : window.innerHeight;
        const railHeight = layoutRail.clientHeight;
        const ratio = railHeight / totalHeight;
        const indicatorHeight = Math.max(20, Math.round(visibleHeight * ratio));
        viewportIndicator.style.height = `${indicatorHeight}px`;
        miniMapBlueprint.innerHTML = '';
        const sections = structuralTarget.querySelectorAll('h1, h2, h3, img, video');
        sections.forEach(el => {
            const offsetTop  = el.offsetTop;
            const elHeight   = el.offsetHeight;
            const top        = Math.round(offsetTop  * ratio);
            const height     = Math.max(2, Math.round(elHeight * ratio));
            const marker = document.createElement('div');
            marker.className = 'mini-map-element';
            if (el.tagName === 'IMG' || el.tagName === 'VIDEO') {
                marker.className += ' mini-map-media';
            }
            marker.style.cssText = `position:absolute;top:${top}px;height:${height}px;left:0;right:0;`;
            miniMapBlueprint.appendChild(marker);
        });
    }

    function executeRailTracking(scrollPos) {
        if (!structuralTarget || !layoutRail || !viewportIndicator) return;
        const totalHeight   = structuralTarget.scrollHeight;
        const railHeight    = layoutRail.clientHeight;
        const ratio         = railHeight / totalHeight;
        const indicatorTop  = Math.round(scrollPos * ratio);
        viewportIndicator.style.transform = `translateY(${indicatorTop}px)`;
    }

    // -------------------------------------------------------
    // CASE STUDY MODAL
    // -------------------------------------------------------
    window.openCaseStudy = function(slug) {
        const project = projectsData.find(p => p.id === slug);
        if (!project) return;

        const titleTarget = document.getElementById('modal-title-target');
        if (titleTarget) titleTarget.innerText = `${project.title} — Case Archive`;

        const actionBtn = document.getElementById('modal-action-btn');
        if (actionBtn) {
            actionBtn.href = project.externalLink || `projects/${project.id}/index.html`;
        }

        const bodyTarget = document.getElementById('modal-dynamic-body-target');
        if (!bodyTarget) return;

        bodyTarget.innerHTML = '<div style="font-size:14px;color:#888;text-align:center;padding:120px 0;font-weight:400;font-family:inherit;">Loading case study...</div>';

        const projectUrl = `projects/${slug}/index.html`;

        fetch(projectUrl)
            .then(r => {
                if (!r.ok) throw new Error(`Failed to load ${projectUrl}`);
                return r.text();
            })
            .then(html => {
                const parser  = new DOMParser();
                const doc     = parser.parseFromString(html, 'text/html');
                const csNode  = doc.querySelector('.case-study-container') || doc.querySelector('#project-container');
                if (!csNode) throw new Error(`No content container in ${projectUrl}`);

                const tempDiv = document.createElement('div');
                tempDiv.appendChild(csNode.cloneNode(true));

                // Rewrite relative asset paths so they load from the projects subfolder
                tempDiv.querySelectorAll('img').forEach(img => {
                    const src = img.getAttribute('src');
                    if (src && !src.startsWith('http') && !src.startsWith('/') && !src.startsWith('projects/')) {
                        img.src = `projects/${slug}/${src}`;
                    }
                });
                tempDiv.querySelectorAll('video, source').forEach(media => {
                    const src = media.getAttribute('src');
                    if (src && !src.startsWith('http') && !src.startsWith('/') && !src.startsWith('projects/')) {
                        media.src = `projects/${slug}/${src}`;
                    }
                });

                // Replace two-column meta-grid with metadata-showcase-board
                const metaGrid = tempDiv.querySelector('.meta-grid');
                if (metaGrid) {
                    const labels = Array.from(metaGrid.querySelectorAll('.meta-label')).map(el => el.textContent.trim());
                    const values = Array.from(metaGrid.querySelectorAll('.meta-value')).map(el => el.textContent.trim());
                    const metaPairs = {};
                    labels.forEach((label, idx) => { metaPairs[label] = values[idx]; });

                    const board = document.createElement('div');
                    board.className = 'metadata-showcase-board';

                    function makeStack(tagText, bodyContent, isActionable, href) {
                        const stack = document.createElement('div');
                        stack.className = 'meta-stack-block';
                        const tag = document.createElement(isActionable ? 'a' : 'span');
                        tag.className = 'meta-panel-tag' + (isActionable ? ' actionable-variant' : '');
                        tag.textContent = tagText;
                        if (isActionable && href) { tag.href = href; tag.target = '_blank'; }
                        stack.appendChild(tag);
                        const body = document.createElement('div');
                        body.className = 'meta-panel-body-card';
                        if (typeof bodyContent === 'string') {
                            body.textContent = bodyContent;
                        } else {
                            body.appendChild(bodyContent);
                        }
                        stack.appendChild(body);
                        return stack;
                    }

                    // Col 1 – About
                    let overviewText = doc.querySelector('meta[name="project-description"]')?.getAttribute('content');
                    if (!overviewText) {
                        overviewText = tempDiv.querySelector('.body-text')?.textContent.trim() || 'No overview available.';
                    }
                    board.appendChild(makeStack('About', overviewText, false, null));

                    const otherKeys = Object.keys(metaPairs);
                    let col2Key = otherKeys.find(k => ['media','client','tags'].includes(k.toLowerCase()));
                    if (!col2Key && otherKeys.length > 0) col2Key = otherKeys[0];

                    if (col2Key) {
                        const listEl = document.createElement('div');
                        listEl.className = 'meta-panel-body-card list-layout';
                        metaPairs[col2Key].split(',').map(s => s.trim()).filter(Boolean).forEach(v => {
                            const row = document.createElement('div');
                            row.className = 'meta-list-row';
                            row.textContent = v;
                            listEl.appendChild(row);
                        });
                        const stack = document.createElement('div');
                        stack.className = 'meta-stack-block';
                        const tag = document.createElement('span');
                        tag.className = 'meta-panel-tag';
                        tag.textContent = col2Key;
                        stack.appendChild(tag);
                        stack.appendChild(listEl);
                        board.appendChild(stack);
                    }

                    // Col 3 – Year or remaining key
                    const col3Key = otherKeys.find(k => k !== col2Key && k.toLowerCase() === 'year') ||
                                    otherKeys.find(k => k !== col2Key);
                    if (col3Key) {
                        board.appendChild(makeStack(col3Key, metaPairs[col3Key], false, null));
                    } else if (metaPairs['Year']) {
                        board.appendChild(makeStack('Year', metaPairs['Year'], false, null));
                    }

                    metaGrid.parentNode.replaceChild(board, metaGrid);
                }

                bodyTarget.innerHTML = tempDiv.innerHTML;
                setTimeout(() => syncRailLayout(), 80);
            })
            .catch(err => {
                console.error(err);
                bodyTarget.innerHTML = `<div class="case-study-container"><h1>${project.title}</h1><p class="body-text">Content coming soon.</p></div>`;
            });

        // Open modal
        overlayContainer.classList.remove('expanded');
        overlayContainer.classList.add('active');
        if (modalSheet) modalSheet.scrollTop = 0;
        document.body.style.overflow = 'hidden';

        // URL param
        const params = new URLSearchParams(window.location.search);
        params.set('p', slug);
        window.history.pushState({ projectSlug: slug }, '', `${window.location.pathname}?${params.toString()}`);

        setTimeout(() => syncRailLayout(), 80);
    };

    window.closeCaseStudy = function(event) {
        if (event) event.stopPropagation();
        if (!overlayContainer || !overlayContainer.classList.contains('active')) return;
        overlayContainer.classList.remove('active');
        overlayContainer.classList.remove('expanded');
        const params = new URLSearchParams(window.location.search);
        params.delete('p');
        const qs = params.toString() ? `?${params.toString()}` : '';
        window.history.pushState(null, '', `${window.location.pathname}${qs}`);
        setTimeout(() => {
            document.body.style.overflow = 'auto';
            if (miniMapBlueprint) miniMapBlueprint.innerHTML = '';
        }, 400);
    };

    // Backdrop click closes modal
    if (overlayContainer) {
        overlayContainer.addEventListener('click', e => {
            if (e.target === overlayContainer) closeCaseStudy(e);
        });
    }

    // Scroll handler — expand to fullscreen mid-scroll, collapse at top/bottom
    if (modalSheet) {
        modalSheet.addEventListener('scroll', () => {
            const pos    = modalSheet.scrollTop;
            const bottom = modalSheet.scrollHeight - modalSheet.clientHeight;
            if (pos > 40 && pos < bottom - 40) {
                overlayContainer.classList.add('expanded');
            } else {
                overlayContainer.classList.remove('expanded');
            }
            executeRailTracking(pos);
        });

        const resizeObserver = new ResizeObserver(() => syncRailLayout());
        if (structuralTarget) resizeObserver.observe(structuralTarget);
        window.addEventListener('resize', () => syncRailLayout());
    }

    // Deep-link: open project from URL param on load
    const params = new URLSearchParams(window.location.search);
    const initialSlug = params.get('p');
    if (initialSlug) openCaseStudy(initialSlug);

    window.addEventListener('popstate', () => {
        const p = new URLSearchParams(window.location.search).get('p');
        if (p) { openCaseStudy(p); } else { closeCaseStudy(); }
    });

    // --- Kick off ---
    renderProjects();
});
