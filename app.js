/**
 * app.js  –  Projects page logic
 * Renders project cards:
 *   • layout-3 → full-width row with 3 images
 *   • layout-2 → full-width row with 2 images
 *   • layout-1 → placed in a 3-column auto-grid
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Elements ---
    const projectsSection = document.getElementById('projects-section');
    const projectsCountEl = document.getElementById('projects-count');
    const projectsCountTitle = document.getElementById('projects-count-title');

    const overlayContainer = document.getElementById('case-study-modal');
    const modalSheet = document.getElementById('modal-sheet-node');
    const miniMapBlueprint = document.getElementById('modal-mini-map-content');
    const miniMapClip = document.getElementById('modal-mini-map-clip');
    const layoutRail = document.getElementById('modal-rail');
    const structuralTarget = document.getElementById('modal-dynamic-body-target');
    const viewportIndicator = document.getElementById('modal-viewport-indicator');

    // --- Update counts ---
    const projectCount = typeof projectsData !== 'undefined' ? projectsData.length : 0;
    if (projectsCountEl) projectsCountEl.textContent = projectCount;
    if (projectsCountTitle) projectsCountTitle.textContent = projectCount;

    // -------------------------------------------------------
    // RENDER PROJECTS
    //   layout-3 → dedicated full-width row
    //   layout-2 → dedicated full-width row
    //   layout-1 → 3-column grid
    // -------------------------------------------------------
    function renderProjects() {
        if (!projectsSection || typeof projectsData === 'undefined') return;
        projectsSection.innerHTML = '';

        let i = 0;
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

        // Caption below image
        if (project.caption) {
            const caption = document.createElement('div');
            caption.className = 'project-card-caption';
            caption.textContent = project.caption;
            container.appendChild(caption);
        }

        // Click handler — opens case study modal, or external URL if no local case study
        container.addEventListener('click', () => {
            if (project.link && project.link.startsWith('http')) {
                window.open(project.link, '_blank');
            } else {
                openCaseStudy(project.id);
            }
        });

        return container;
    }

    // -------------------------------------------------------
    // MINIMAP RAIL SYSTEM
    // -------------------------------------------------------
    const RAIL_PAD = 8; // px padding — matches CSS inset on .modal-mini-map-clip

    function syncRailLayout() {
        if (!structuralTarget || !layoutRail || !miniMapBlueprint || !viewportIndicator) return;

        const pageHeight  = structuralTarget.scrollHeight;
        const viewportW   = modalSheet ? modalSheet.clientWidth  : window.innerWidth;
        const railWidth   = layoutRail.clientWidth;
        const innerW      = railWidth - RAIL_PAD * 2;   // clip area width (matches CSS inset: 8px)
        const scaleFactor = innerW / viewportW;

        // Clone content into blueprint
        miniMapBlueprint.innerHTML = '';
        const clone = structuralTarget.cloneNode(true);
        clone.removeAttribute('id');
        clone.style.cssText += '; pointer-events:none; overflow:hidden; max-width:100%';
        clone.querySelectorAll('video').forEach(v => { v.muted = true; v.removeAttribute('autoplay'); });
        miniMapBlueprint.appendChild(clone);

        // Blueprint fills viewportW, scales to innerW — positioned at (0,0) inside clip
        miniMapBlueprint.style.width          = `${viewportW}px`;
        miniMapBlueprint.style.transform      = `scale(${scaleFactor})`;
        miniMapBlueprint.style.transformOrigin = 'top left';
        miniMapBlueprint.style.top            = '0px';
        miniMapBlueprint.style.left           = '0px';

        // Rail height: scaled content + top/bottom padding, capped at 50vh
        const scaledPageH = pageHeight * scaleFactor;
        const railHeight  = Math.min(scaledPageH + RAIL_PAD * 2, window.innerHeight * 0.5);
        layoutRail.style.height = `${railHeight}px`;

        // Indicator: 16:9 of the rail width (indicator is wider than rail via CSS left:-8px)
        const indicatorH = Math.round(railWidth * 9 / 16);
        viewportIndicator.style.height    = `${indicatorH}px`;
        viewportIndicator.style.transform = `translateY(${RAIL_PAD}px)`;
    }

    function executeRailTracking(scrollPos) {
        if (!structuralTarget || !layoutRail || !viewportIndicator || !miniMapBlueprint) return;

        const pageHeight  = structuralTarget.scrollHeight;
        const visibleH    = modalSheet ? modalSheet.clientHeight : window.innerHeight;
        const viewportW   = modalSheet ? modalSheet.clientWidth  : window.innerWidth;
        const railWidth   = layoutRail.clientWidth;
        const railHeight  = layoutRail.clientHeight;
        const innerW      = railWidth - RAIL_PAD * 2;
        const scaleFactor = innerW / viewportW;

        const maxScroll     = pageHeight - visibleH;
        const scrollPercent = maxScroll > 0 ? scrollPos / maxScroll : 0;

        // Indicator travels from RAIL_PAD to (railHeight - RAIL_PAD - indicatorH)
        const indicatorH    = viewportIndicator.clientHeight || Math.round(railWidth * 9 / 16);
        const maxY          = railHeight - RAIL_PAD - indicatorH;
        const indicatorY    = RAIL_PAD + scrollPercent * (maxY - RAIL_PAD);
        viewportIndicator.style.transform = `translateY(${indicatorY}px)`;

        // Blueprint scrolls inside clip: from top:0 down to top:-(scaledH - clipH)
        const scaledH = pageHeight * scaleFactor;
        const clipH   = railHeight - RAIL_PAD * 2;
        if (scaledH > clipH) {
            miniMapBlueprint.style.top = `-${(scaledH - clipH) * scrollPercent}px`;
        }
    }

    // -------------------------------------------------------
    // CASE STUDY MODAL
    // -------------------------------------------------------
    window.openCaseStudy = function (slug) {
        const project = projectsData.find(p => p.id === slug);
        if (!project) return;

        const titleTarget = document.getElementById('modal-title-target');
        if (titleTarget) titleTarget.innerText = `${project.title} — Case Study`;

        const actionBtn = document.getElementById('modal-action-btn');
        if (actionBtn) {
            actionBtn.href = project.externalLink || `projects/${project.id}/index.html`;
            actionBtn.onclick = () => {
                if (typeof umami !== 'undefined') umami.track('project-live-click', { project: slug, title: project.title });
            };
        }

        const bodyTarget = document.getElementById('modal-dynamic-body-target');
        if (!bodyTarget) return;

        bodyTarget.innerHTML = '<div style="font-size:14px;color:var(--text-muted);text-align:center;padding:120px 0;font-weight:400;font-family:inherit;">Loading case study...</div>';

        const projectUrl = `projects/${slug}/index.html`;

        fetch(projectUrl)
            .then(r => {
                if (!r.ok) throw new Error(`Failed to load ${projectUrl}`);
                return r.text();
            })
            .then(html => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const csNode = doc.querySelector('.case-study-container') || doc.querySelector('#project-container');
                if (!csNode) throw new Error(`No content container in ${projectUrl}`);

                const tempDiv = document.createElement('div');
                tempDiv.appendChild(csNode.cloneNode(true));

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

                const metaGrid = tempDiv.querySelector('.meta-grid');
                if (metaGrid) {
                    const labels = Array.from(metaGrid.querySelectorAll('.meta-label')).map(el => el.textContent.trim());
                    const values = Array.from(metaGrid.querySelectorAll('.meta-value')).map(el => el.textContent.trim());
                    const metaPairs = {};
                    labels.forEach((label, idx) => { metaPairs[label] = values[idx]; });

                    const board = document.createElement('div');
                    board.className = 'metadata-showcase-board';

                    function makeStack(tagText, bodyContent) {
                        const stack = document.createElement('div');
                        stack.className = 'meta-stack-block';

                        const tag = document.createElement('div');
                        tag.className = 'meta-panel-tag-new';
                        tag.textContent = tagText;
                        stack.appendChild(tag);

                        const body = document.createElement('div');
                        body.className = 'meta-panel-body-new';
                        if (typeof bodyContent === 'string') {
                            body.textContent = bodyContent;
                        } else {
                            body.appendChild(bodyContent);
                        }
                        stack.appendChild(body);
                        return stack;
                    }

                    let overviewText = doc.querySelector('meta[name="project-description"]')?.getAttribute('content');
                    if (!overviewText) {
                        overviewText = tempDiv.querySelector('.body-text')?.textContent.trim() || 'No overview available.';
                    }
                    board.appendChild(makeStack('About', overviewText));

                    const otherKeys = Object.keys(metaPairs);
                    let col2Key = otherKeys.find(k => ['media', 'client', 'tags'].includes(k.toLowerCase()));
                    if (!col2Key && otherKeys.length > 0) col2Key = otherKeys[0];

                    if (col2Key) {
                        const stack = document.createElement('div');
                        stack.className = 'meta-stack-block';

                        const tag = document.createElement('div');
                        tag.className = 'meta-panel-tag-new';
                        tag.textContent = col2Key;
                        stack.appendChild(tag);

                        const listEl = document.createElement('div');
                        listEl.className = 'meta-panel-body-new list-layout';
                        metaPairs[col2Key].split(',').map(s => s.trim()).filter(Boolean).forEach(v => {
                            const row = document.createElement('div');
                            row.className = 'meta-list-row';
                            row.textContent = v;
                            listEl.appendChild(row);
                        });
                        stack.appendChild(listEl);
                        board.appendChild(stack);
                    }

                    const col3Key = otherKeys.find(k => k !== col2Key && k.toLowerCase() === 'year') ||
                        otherKeys.find(k => k !== col2Key);
                    if (col3Key) {
                        board.appendChild(makeStack(col3Key, metaPairs[col3Key]));
                    } else if (metaPairs['Year']) {
                        board.appendChild(makeStack('Year', metaPairs['Year']));
                    }

                    metaGrid.parentNode.replaceChild(board, metaGrid);

                    const linkUrl = project.externalLink || (project.link ? `projects/${project.id}/index.html` : null);
                    if (linkUrl) {
                        const mobileLiveBtn = document.createElement('a');
                        mobileLiveBtn.className = 'mobile-live-website-btn nav-btn active';
                        mobileLiveBtn.href = linkUrl;
                        mobileLiveBtn.target = '_blank';
                        mobileLiveBtn.textContent = 'Live Website ↗';
                        board.parentNode.insertBefore(mobileLiveBtn, board.nextSibling);
                    }
                }

                bodyTarget.innerHTML = tempDiv.innerHTML;
                setTimeout(() => syncRailLayout(), 80);
            })
            .catch(err => {
                console.error(err);
                bodyTarget.innerHTML = `<div class="case-study-container"><h1>${project.title}</h1><p class="body-text">Content coming soon.</p></div>`;
            });

        overlayContainer.classList.remove('expanded');
        overlayContainer.classList.add('active');
        if (modalSheet) {
            modalSheet.scrollTop = 0;
            requestAnimationFrame(() => { modalSheet.scrollTop = 0; });
        }
        document.body.style.overflow = 'hidden';

        if (typeof umami !== 'undefined') umami.track('project-view', { project: slug, title: project.title });

        const params = new URLSearchParams(window.location.search);
        params.set('p', slug);
        window.history.pushState({ projectSlug: slug }, '', `${window.location.pathname}?${params.toString()}`);
    };

    window.closeCaseStudy = function (event) {
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

    if (overlayContainer) {
        overlayContainer.addEventListener('click', e => {
            if (e.target === overlayContainer) closeCaseStudy(e);
        });
    }

    if (modalSheet) {
        modalSheet.addEventListener('scroll', () => {
            const pos = modalSheet.scrollTop;
            const bottom = modalSheet.scrollHeight - modalSheet.clientHeight;
            if (pos > 40) {
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

    const params = new URLSearchParams(window.location.search);
    const initialSlug = params.get('p');
    if (initialSlug) openCaseStudy(initialSlug);

    window.addEventListener('popstate', () => {
        const p = new URLSearchParams(window.location.search).get('p');
        if (p) { openCaseStudy(p); } else { closeCaseStudy(); }
    });

    renderProjects();
});