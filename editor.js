/**
 * editor.js — internal CMS block editor.
 *
 * Reads `projectsData` / `experimentsData` (globals from projects.js) as a
 * read-only source of truth. Edits live only in memory + localStorage drafts.
 * Nothing here ever writes to projects.js or any HTML file — output is
 * copy-pasteable text via the Export panel.
 */

document.addEventListener('DOMContentLoaded', () => {

    // =========================================================
    // 1. PASSWORD GATE
    // NOTE: cosmetic deterrent only, NOT real security — the repo
    // and deployed site are public; anyone can read this constant
    // via devtools/page source. Do not gate anything sensitive here.
    // =========================================================
    const EDITOR_PASSWORD = 'changeme';
    const GATE_SESSION_KEY = 'editor_unlocked';

    const gateEl = document.getElementById('editor-gate');
    const shellEl = document.getElementById('editor-shell');
    const gateForm = document.getElementById('gate-form');
    const gateInput = document.getElementById('gate-password');
    const gateError = document.getElementById('gate-error');

    function unlock() {
        sessionStorage.setItem(GATE_SESSION_KEY, 'true');
        gateEl.classList.add('hidden');
        shellEl.classList.remove('hidden');
        init();
    }

    if (sessionStorage.getItem(GATE_SESSION_KEY) === 'true') {
        unlock();
    } else {
        gateForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (gateInput.value === EDITOR_PASSWORD) {
                unlock();
            } else {
                gateError.textContent = 'Incorrect password.';
                gateInput.classList.add('shake');
                setTimeout(() => gateInput.classList.remove('shake'), 300);
            }
        });
    }

    // =========================================================
    // 2. UTILITIES
    // =========================================================
    function uid() { return 'blk_' + Math.random().toString(36).slice(2, 9); }

    function slugify(str) {
        return String(str).toLowerCase().trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '') || 'untitled';
    }

    function deepClone(obj) {
        return typeof structuredClone === 'function' ? structuredClone(obj) : JSON.parse(JSON.stringify(obj));
    }

    function escapeHtml(str) {
        return String(str == null ? '' : str)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    // Native window.prompt/confirm/alert are silently disabled in some
    // embedded/webview browser contexts (clicks produce no dialog at all).
    // These build the same interactions as plain in-page DOM instead.
    function modalShell(innerBuilder) {
        return new Promise(resolve => {
            const overlay = document.createElement('div');
            overlay.className = 'editor-modal-overlay';
            const box = document.createElement('div');
            box.className = 'editor-modal-box';
            overlay.appendChild(box);
            function close(value) { overlay.remove(); resolve(value); }
            innerBuilder(box, close);
            document.body.appendChild(overlay);
        });
    }

    function showTextPrompt(title, placeholder) {
        return modalShell((box, close) => {
            const h = document.createElement('h3'); h.textContent = title;
            const input = document.createElement('input');
            input.type = 'text'; input.className = 'editor-modal-input'; input.placeholder = placeholder || '';
            const btnRow = document.createElement('div'); btnRow.className = 'editor-modal-buttons';
            const cancelBtn = document.createElement('button'); cancelBtn.textContent = 'Cancel';
            const okBtn = document.createElement('button'); okBtn.className = 'primary'; okBtn.textContent = 'Create';
            cancelBtn.addEventListener('click', () => close(null));
            okBtn.addEventListener('click', () => close(input.value.trim() || null));
            input.addEventListener('keydown', e => {
                if (e.key === 'Enter') close(input.value.trim() || null);
                if (e.key === 'Escape') close(null);
            });
            btnRow.appendChild(cancelBtn); btnRow.appendChild(okBtn);
            box.appendChild(h); box.appendChild(input); box.appendChild(btnRow);
            setTimeout(() => input.focus(), 0);
        });
    }

    function showConfirmModal(message) {
        return modalShell((box, close) => {
            const pre = document.createElement('pre'); pre.className = 'editor-modal-message'; pre.textContent = message;
            const btnRow = document.createElement('div'); btnRow.className = 'editor-modal-buttons';
            const cancelBtn = document.createElement('button'); cancelBtn.textContent = 'Cancel';
            const okBtn = document.createElement('button'); okBtn.className = 'primary'; okBtn.textContent = 'Continue';
            cancelBtn.addEventListener('click', () => close(false));
            okBtn.addEventListener('click', () => close(true));
            btnRow.appendChild(cancelBtn); btnRow.appendChild(okBtn);
            box.appendChild(pre); box.appendChild(btnRow);
        });
    }

    function showAlertModal(message) {
        return modalShell((box, close) => {
            const pre = document.createElement('pre'); pre.className = 'editor-modal-message'; pre.textContent = message;
            const btnRow = document.createElement('div'); btnRow.className = 'editor-modal-buttons';
            const okBtn = document.createElement('button'); okBtn.className = 'primary'; okBtn.textContent = 'OK';
            okBtn.addEventListener('click', () => close());
            btnRow.appendChild(okBtn);
            box.appendChild(pre); box.appendChild(btnRow);
        });
    }

    let saveTimer = null;
    function debounceSave() {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(saveDraft, 500);
    }

    // =========================================================
    // 3. STATE
    // =========================================================
    const state = {
        entityType: 'project',     // 'project' | 'experiment'
        entityId: null,
        base: null,                // untouched snapshot from projectsData/experimentsData (or null for new draft)
        working: null,             // the editable copy
        view: 'canvas',            // 'canvas' | 'preview'
        exportedAt: null
    };

    function draftKey(type, id) { return `editor_draft_${type}_${id}`; }
    function exportedKey(type, id) { return `editor_exported_${type}_${id}`; }

    // =========================================================
    // 4. ENTITY LOADING
    // =========================================================
    function blankEntity(type, id, title) {
        if (type === 'project') {
            return {
                id, title, year: '', caption: '', galleryLayout: '1', galleryImages: [],
                link: `projects/${id}/index.html`, tags: [],
                systemLogic: '', installationMetrics: [], hardwareParams: [], entropyScale: null,
                contentBlocks: []
            };
        }
        return {
            id, title, filename: '', videoFilename: '', description: '',
            codeSnippet: '', interfaceVariables: [], ephemeral: false,
            contentBlocks: []
        };
    }

    function findBase(type, id) {
        const arr = type === 'project' ? projectsData : experimentsData;
        return arr.find(e => String(e.id) === String(id)) || null;
    }

    // Existing projectsData/experimentsData entries predate the new optional
    // fields, so any entity loaded from the live data (not a fresh blank
    // draft) needs these keys backfilled to safe defaults before the
    // metadata sidebar/list editors run, or array fields are undefined.
    function withFieldDefaults(type, entity) {
        if (type === 'project') {
            if (entity.systemLogic == null) entity.systemLogic = '';
            if (!entity.installationMetrics) entity.installationMetrics = [];
            if (!entity.hardwareParams) entity.hardwareParams = [];
            if (entity.entropyScale === undefined) entity.entropyScale = null;
        } else {
            if (entity.codeSnippet == null) entity.codeSnippet = '';
            if (!entity.interfaceVariables) entity.interfaceVariables = [];
            if (entity.ephemeral == null) entity.ephemeral = false;
        }
        if (!entity.contentBlocks) entity.contentBlocks = [];
        return entity;
    }

    function loadEntity(type, id, isNew, newTitle) {
        state.entityType = type;
        state.entityId = id;
        state.base = isNew ? null : findBase(type, id);

        const stored = localStorage.getItem(draftKey(type, id));
        if (stored) {
            state.working = withFieldDefaults(type, JSON.parse(stored));
        } else if (state.base) {
            state.working = withFieldDefaults(type, deepClone(state.base));
        } else {
            state.working = blankEntity(type, id, newTitle || id);
        }

        const exportedAt = localStorage.getItem(exportedKey(type, id));
        state.exportedAt = exportedAt || null;

        renderAll();
    }

    function saveDraft() {
        if (!state.entityId) return;
        localStorage.setItem(draftKey(state.entityType, state.entityId), JSON.stringify(state.working));
        // any edit invalidates the "exported" marker
        localStorage.removeItem(exportedKey(state.entityType, state.entityId));
        state.exportedAt = null;
        renderStateBadge();
    }

    function isDirty() {
        if (!state.base) return true; // new draft, never "clean"
        return JSON.stringify(state.working) !== JSON.stringify(state.base);
    }

    // =========================================================
    // 5. BLOCK MODEL
    // =========================================================
    function makeBlock(type) {
        switch (type) {
            case 'text': return { id: uid(), type, html: '', variant: 'body' };
            case 'image': return { id: uid(), type, src: assetPrefix(), alt: '', caption: '' };
            case 'video': return { id: uid(), type, src: assetPrefix(), poster: '' };
            case 'col2': return { id: uid(), type, layout: 'media-row', children: [makeBlock('image'), makeBlock('image')] };
            case 'col3': return { id: uid(), type, children: [makeBlock('image'), makeBlock('image'), makeBlock('image')] };
            case 'list': return { id: uid(), type, title: '', items: [{ bold: '', rest: '' }] };
            case 'divider': return { id: uid(), type };
            default: return { id: uid(), type: 'text', html: '', variant: 'body' };
        }
    }

    function assetPrefix() {
        return state.entityType === 'project'
            ? `projects/${state.entityId}/assets/`
            : `assets/experiments/`;
    }

    const BLOCK_TYPES = ['text', 'image', 'video', 'col2', 'col3', 'list', 'divider'];
    const CHILD_BLOCK_TYPES = ['text', 'image', 'video'];

    // =========================================================
    // 5b. IMPORT FROM LIVE HTML (Projects only, one-time, lossy-with-warnings)
    //
    // Existing project pages are hand-authored HTML, not generated from
    // contentBlocks, so opening one normally starts with an empty canvas.
    // This is an opt-in one-time importer: fetches the real
    // projects/{id}/index.html, walks its .case-study-container, and
    // converts recognized elements into blocks. One-off hand-styled
    // markup (inline styles, mixed nested content) won't always convert
    // cleanly — every lossy decision is collected into `warnings` and
    // shown to the user before anything is applied, so they can review
    // and touch up rather than be surprised.
    //
    // Requires the page to be served over http(s) — fetch() of a sibling
    // file is blocked by the browser under file:// (no CORS for local
    // files), so this only works when editor.html is opened via a local
    // server or the deployed site, not by double-clicking the file.
    // =========================================================
    function rebaseImportedSrc(src, projectId) {
        if (!src) return src;
        if (/^https?:\/\//.test(src) || src.startsWith('data:') || src.startsWith('../')) return src;
        const stripped = src.replace(/^\.\//, '');
        return stripped.startsWith(`projects/${projectId}/`) ? stripped : `projects/${projectId}/${stripped}`;
    }

    function textVariantForP(el) {
        if (el.classList.contains('tagline')) return 'tagline';
        if (el.classList.contains('quote-box')) return 'quote';
        return 'body';
    }

    function elementToBlocks(el, projectId, warnings) {
        const tag = el.tagName;

        if (tag === 'IMG') {
            return [{ id: uid(), type: 'image', src: rebaseImportedSrc(el.getAttribute('src'), projectId), alt: el.getAttribute('alt') || '', caption: '' }];
        }
        if (tag === 'VIDEO') {
            const source = el.querySelector('source');
            const src = source ? source.getAttribute('src') : el.getAttribute('src');
            return [{ id: uid(), type: 'video', src: rebaseImportedSrc(src, projectId), poster: '' }];
        }
        if (tag === 'HR') return [{ id: uid(), type: 'divider' }];
        if (tag === 'H2') return [{ id: uid(), type: 'text', variant: 'h2', html: el.textContent.trim() }];
        if (tag === 'BLOCKQUOTE') {
            warnings.push('A <blockquote> was converted to a plain quote block — any embedded link inside it was dropped.');
            return [{ id: uid(), type: 'text', variant: 'quote', html: el.textContent.trim() }];
        }
        if (tag === 'P') {
            return [{ id: uid(), type: 'text', variant: textVariantForP(el), html: el.textContent.trim() }];
        }

        if (tag === 'DIV' || tag === 'SECTION') {
            const isRow = el.classList.contains('media-row') || el.classList.contains('img-grid') || el.classList.contains('two-col-text');
            const isGallery = el.classList.contains('gallery-grid');
            const isList = el.classList.contains('section-spacer') || (el.querySelector(':scope > span.list-title') && el.querySelector(':scope > ul.list-section'));

            if (el.classList.contains('two-col-text')) {
                warnings.push('".two-col-text" has no exact block equivalent — imported as a 2-column block; double-check spacing.');
            }

            if (isRow || isGallery) {
                const slotCount = isGallery ? 3 : 2;
                const childEls = Array.from(el.children);
                const children = [];
                childEls.forEach(c => {
                    const sub = elementToBlocks(c, projectId, warnings);
                    if (sub.length === 0) {
                        warnings.push(`Unrecognized <${c.tagName.toLowerCase()}> inside a column layout was skipped.`);
                    } else {
                        if (sub.length > 1) warnings.push(`A column slot had multiple pieces of content — only the first was kept; the rest was dropped.`);
                        if (children.length < slotCount) children.push(sub[0]);
                    }
                });
                if (childEls.length > slotCount) warnings.push(`A row had more than ${slotCount} item(s) — extras were dropped; add them back manually if needed.`);
                while (children.length < slotCount) {
                    children.push(makeBlock('text'));
                    warnings.push('A column layout had fewer items than slots — an empty text block was added as a placeholder.');
                }
                return [{ id: uid(), type: isGallery ? 'col3' : 'col2', layout: el.classList.contains('img-grid') ? 'img-grid' : 'media-row', children }];
            }

            if (isList) {
                const titleSpan = el.querySelector('span.list-title');
                const ul = el.querySelector('ul.list-section');
                const title = titleSpan ? titleSpan.textContent.trim() : '';
                const items = [];
                if (ul) {
                    Array.from(ul.children).forEach(li => {
                        const b = li.querySelector('b');
                        if (b) {
                            const bold = b.textContent.trim();
                            const rest = li.textContent.replace(b.textContent, '').trim();
                            items.push({ bold, rest });
                        } else {
                            items.push({ bold: '', rest: li.textContent.trim() });
                        }
                    });
                }
                return [{ id: uid(), type: 'list', title, items: items.length ? items : [{ bold: '', rest: '' }] }];
            }

            // Unrecognized div — if it has no element children, treat it as a
            // plain paragraph; otherwise it's a styling wrapper, so recurse
            // into its children individually rather than losing them.
            if (el.children.length === 0) {
                return el.textContent.trim() ? [{ id: uid(), type: 'text', variant: textVariantForP(el), html: el.textContent.trim() }] : [];
            }
            warnings.push(`An unrecognized <div> wrapper (class="${el.className}") was flattened — its children were imported individually; original grouping/inline styles were not preserved.`);
            const out = [];
            Array.from(el.children).forEach(c => out.push(...elementToBlocks(c, projectId, warnings)));
            return out;
        }

        warnings.push(`Unrecognized element <${tag.toLowerCase()}> was skipped.`);
        return [];
    }

    async function importFromLiveHtml() {
        if (state.entityType !== 'project' || !state.base) return;
        const id = state.entityId;
        let html;
        try {
            const res = await fetch(`projects/${id}/index.html`);
            if (!res.ok) throw new Error('HTTP ' + res.status);
            html = await res.text();
        } catch (err) {
            await showAlertModal('Could not fetch projects/' + id + '/index.html — this only works when editor.html is served over http(s) (e.g. a local server), not opened directly as a file.\n\n' + err.message);
            return;
        }

        const doc = new DOMParser().parseFromString(html, 'text/html');
        const container = doc.querySelector('.case-study-container');
        if (!container) { await showAlertModal('Could not find .case-study-container in that page.'); return; }

        const warnings = [];
        const blocks = [];
        let skippedTagline = false;
        Array.from(container.children).forEach(el => {
            if (el.tagName === 'H1') return; // title field
            if (!skippedTagline && el.classList.contains('tagline')) { skippedTagline = true; return; } // caption field
            if (el.classList.contains('meta-grid')) return; // metadata sidebar fields
            blocks.push(...elementToBlocks(el, id, warnings));
        });

        const summary = `Import would replace the current ${state.working.contentBlocks.length} block(s) with ${blocks.length} block(s) parsed from the live page.` +
            (warnings.length ? `\n\n${warnings.length} warning(s):\n- ${warnings.slice(0, 8).join('\n- ')}${warnings.length > 8 ? `\n…and ${warnings.length - 8} more` : ''}` : '\n\nNo warnings — conversion looked clean.') +
            '\n\nContinue?';
        if (!await showConfirmModal(summary)) return;

        state.working.contentBlocks = blocks;
        renderBlockCanvas();
        debounceSave();
        renderPreview();
    }

    // =========================================================
    // 6. DOM REFS
    // =========================================================
    const entitySidebar = document.getElementById('entity-sidebar');
    const entityListEl = document.getElementById('entity-list');
    const sidebarTabBtns = document.querySelectorAll('.sidebar-tabs button');
    const newDraftBtn = document.getElementById('new-draft-btn');

    const blockCanvas = document.getElementById('block-canvas');
    const previewPane = document.getElementById('preview-pane');
    const viewToggleBtns = document.querySelectorAll('.view-toggle button');
    const stateBadge = document.getElementById('editor-state-badge');
    const addBlockRow = document.getElementById('add-block-row');
    const importBtn = document.getElementById('import-btn');

    const metaSidebar = document.getElementById('meta-sidebar');

    const exportBtn = document.getElementById('export-btn');
    const exportPanel = document.getElementById('export-panel');
    const exportScrim = document.getElementById('export-scrim');
    const exportCloseBtn = document.getElementById('export-close-btn');
    const exportTabBtns = document.querySelectorAll('.export-tab');
    const exportJsTextarea = document.getElementById('export-js-output');
    const exportHtmlTextarea = document.getElementById('export-html-output');
    const copyBtns = document.querySelectorAll('.export-copy-btn');

    // =========================================================
    // 7. SIDEBAR (entity list)
    // =========================================================
    let sidebarTab = 'project';

    function renderSidebar() {
        sidebarTabBtns.forEach(b => b.classList.toggle('active', b.dataset.tab === sidebarTab));
        const arr = sidebarTab === 'project' ? projectsData : experimentsData;
        entityListEl.innerHTML = '';
        arr.forEach(e => {
            const li = document.createElement('li');
            li.textContent = e.title;
            li.className = (sidebarTab === state.entityType && String(e.id) === String(state.entityId)) ? 'active' : '';
            li.addEventListener('click', () => loadEntity(sidebarTab, e.id, false));
            entityListEl.appendChild(li);
        });
    }

    sidebarTabBtns.forEach(b => b.addEventListener('click', () => {
        sidebarTab = b.dataset.tab;
        renderSidebar();
    }));

    newDraftBtn.addEventListener('click', async () => {
        const title = await showTextPrompt('Title for the new ' + sidebarTab, 'e.g. New Project Title');
        if (!title) return;
        let id = slugify(title);
        const arr = sidebarTab === 'project' ? projectsData : experimentsData;
        let suffix = 1;
        let candidate = id;
        while (arr.some(e => String(e.id) === candidate) || localStorage.getItem(draftKey(sidebarTab, candidate))) {
            candidate = id + '-' + (++suffix);
        }
        loadEntity(sidebarTab, candidate, true, title);
        renderSidebar();
    });

    // =========================================================
    // 8. TOP TOOLBAR — view toggle + state badge
    // =========================================================
    viewToggleBtns.forEach(b => b.addEventListener('click', () => {
        state.view = b.dataset.view;
        viewToggleBtns.forEach(x => x.classList.toggle('active', x.dataset.view === state.view));
        blockCanvas.classList.toggle('hidden', state.view !== 'canvas');
        addBlockRow.classList.toggle('hidden', state.view !== 'canvas');
        previewPane.classList.toggle('hidden', state.view !== 'preview');
    }));

    function renderStateBadge() {
        if (!state.entityId) { stateBadge.textContent = ''; return; }
        if (state.exportedAt) {
            stateBadge.textContent = `Exported ${new Date(Number(state.exportedAt)).toLocaleTimeString()}`;
        } else if (isDirty()) {
            stateBadge.textContent = 'Draft saved';
        } else {
            stateBadge.textContent = 'Saved';
        }
        importBtn.classList.toggle('hidden', !(state.entityType === 'project' && state.base));
    }

    importBtn.addEventListener('click', importFromLiveHtml);

    // =========================================================
    // 9. META SIDEBAR (context-aware fields)
    // =========================================================
    function fieldGroup(labelText, inputEl) {
        const wrap = document.createElement('div');
        wrap.className = 'meta-field-group';
        const label = document.createElement('label');
        label.textContent = labelText;
        wrap.appendChild(label);
        wrap.appendChild(inputEl);
        return wrap;
    }

    function textInput(value, onChange, multiline) {
        const el = document.createElement(multiline ? 'textarea' : 'input');
        if (!multiline) el.type = 'text';
        el.value = value || '';
        el.addEventListener('input', () => { onChange(el.value); debounceSave(); renderPreview(); renderStateBadge(); });
        return el;
    }

    function renderKvList(container, arr, labelKey, valueKey) {
        container.innerHTML = '';
        arr.forEach((row, i) => {
            const r = document.createElement('div');
            r.className = 'kv-row';
            const labelInput = document.createElement('input');
            labelInput.type = 'text'; labelInput.placeholder = 'Label'; labelInput.value = row[labelKey] || '';
            labelInput.addEventListener('input', () => { row[labelKey] = labelInput.value; debounceSave(); renderPreview(); });
            const valueInput = document.createElement('input');
            valueInput.type = 'text'; valueInput.placeholder = 'Value'; valueInput.value = row[valueKey] || '';
            valueInput.addEventListener('input', () => { row[valueKey] = valueInput.value; debounceSave(); renderPreview(); });
            const removeBtn = document.createElement('button');
            removeBtn.className = 'kv-remove'; removeBtn.textContent = '✕';
            removeBtn.addEventListener('click', () => { arr.splice(i, 1); renderKvList(container, arr, labelKey, valueKey); debounceSave(); renderPreview(); });
            r.appendChild(labelInput); r.appendChild(valueInput); r.appendChild(removeBtn);
            container.appendChild(r);
        });
        const addBtn = document.createElement('button');
        addBtn.className = 'kv-add'; addBtn.textContent = '+ Add row';
        addBtn.addEventListener('click', () => { arr.push({ [labelKey]: '', [valueKey]: '' }); renderKvList(container, arr, labelKey, valueKey); debounceSave(); });
        container.appendChild(addBtn);
    }

    function renderMetaSidebar() {
        metaSidebar.innerHTML = '';
        if (!state.working) return;

        const h2 = document.createElement('h2');
        h2.textContent = state.entityType === 'project' ? 'Project Details' : 'Experiment Details';
        metaSidebar.appendChild(h2);

        metaSidebar.appendChild(fieldGroup('Title', textInput(state.working.title, v => state.working.title = v)));

        if (state.entityType === 'project') {
            metaSidebar.appendChild(fieldGroup('Year', textInput(state.working.year, v => state.working.year = v)));
            metaSidebar.appendChild(fieldGroup('Caption / Tagline', textInput(state.working.caption, v => state.working.caption = v, true)));

            metaSidebar.appendChild(fieldGroup('System Logic', textInput(state.working.systemLogic, v => state.working.systemLogic = v, true)));

            const metricsWrap = document.createElement('div');
            metricsWrap.className = 'meta-field-group';
            metricsWrap.appendChild(Object.assign(document.createElement('label'), { textContent: 'Installation Metrics' }));
            const metricsList = document.createElement('div');
            metricsWrap.appendChild(metricsList);
            renderKvList(metricsList, state.working.installationMetrics, 'label', 'value');
            metaSidebar.appendChild(metricsWrap);

            const hwWrap = document.createElement('div');
            hwWrap.className = 'meta-field-group';
            hwWrap.appendChild(Object.assign(document.createElement('label'), { textContent: 'Hardware / Robotic Parameters' }));
            const hwList = document.createElement('div');
            hwWrap.appendChild(hwList);
            renderKvList(hwList, state.working.hardwareParams, 'label', 'value');
            metaSidebar.appendChild(hwWrap);

            const entropyInput = document.createElement('input');
            entropyInput.type = 'number'; entropyInput.min = 0; entropyInput.max = 10;
            entropyInput.value = state.working.entropyScale == null ? '' : state.working.entropyScale;
            entropyInput.addEventListener('input', () => {
                state.working.entropyScale = entropyInput.value === '' ? null : Number(entropyInput.value);
                debounceSave(); renderPreview();
            });
            metaSidebar.appendChild(fieldGroup('Data Friction / Entropy Scale (0–10)', entropyInput));
        } else {
            metaSidebar.appendChild(fieldGroup('Description', textInput(state.working.description, v => state.working.description = v, true)));

            const codeInput = textInput(state.working.codeSnippet, v => state.working.codeSnippet = v, true);
            codeInput.style.fontFamily = 'ui-monospace, SFMono-Regular, Menlo, monospace';
            metaSidebar.appendChild(fieldGroup('Code / Logic Snippet', codeInput));

            const ifaceWrap = document.createElement('div');
            ifaceWrap.className = 'meta-field-group';
            ifaceWrap.appendChild(Object.assign(document.createElement('label'), { textContent: 'Physical Interface Variables' }));
            const ifaceList = document.createElement('div');
            ifaceWrap.appendChild(ifaceList);
            renderKvList(ifaceList, state.working.interfaceVariables, 'label', 'value');
            metaSidebar.appendChild(ifaceWrap);

            const toggleWrap = document.createElement('div');
            toggleWrap.className = 'meta-field-group toggle-row';
            const cb = document.createElement('input');
            cb.type = 'checkbox'; cb.checked = !!state.working.ephemeral;
            cb.addEventListener('change', () => { state.working.ephemeral = cb.checked; debounceSave(); renderPreview(); });
            const lab = document.createElement('label');
            lab.textContent = 'Ephemeral (not permanently documented)';
            lab.style.textTransform = 'none'; lab.style.marginBottom = '0';
            toggleWrap.appendChild(cb); toggleWrap.appendChild(lab);
            metaSidebar.appendChild(toggleWrap);
        }
    }

    // =========================================================
    // 10. BLOCK CANVAS (form cards)
    // =========================================================
    function renderBlockCanvas() {
        blockCanvas.innerHTML = '';
        const blocks = state.working ? state.working.contentBlocks : [];
        if (!blocks || blocks.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'canvas-empty';
            empty.textContent = 'No blocks yet — use "+ Add block" below to start.';
            blockCanvas.appendChild(empty);
            return;
        }
        blocks.forEach((block, idx) => blockCanvas.appendChild(renderTopBlockCard(block, idx, blocks)));
    }

    function blockTypeSelect(currentType, options, onChange) {
        const sel = document.createElement('select');
        options.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t; opt.textContent = t;
            if (t === currentType) opt.selected = true;
            sel.appendChild(opt);
        });
        sel.addEventListener('change', () => onChange(sel.value));
        return sel;
    }

    function renderTopBlockCard(block, idx, arr) {
        const card = document.createElement('div');
        card.className = 'block-card';

        const head = document.createElement('div');
        head.className = 'block-card-head';

        const badge = document.createElement('span');
        badge.className = 'block-type-badge';
        badge.textContent = block.type;

        const typeSel = blockTypeSelect(block.type, BLOCK_TYPES, (newType) => {
            arr[idx] = makeBlock(newType);
            renderBlockCanvas(); debounceSave(); renderPreview();
        });

        const left = document.createElement('div');
        left.style.display = 'flex'; left.style.gap = '8px'; left.style.alignItems = 'center';
        left.appendChild(badge); left.appendChild(typeSel);

        const toolbar = document.createElement('div');
        toolbar.className = 'block-toolbar';

        const upBtn = mkBtn('↑', () => { if (idx > 0) { [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]]; renderBlockCanvas(); debounceSave(); renderPreview(); } });
        const downBtn = mkBtn('↓', () => { if (idx < arr.length - 1) { [arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]]; renderBlockCanvas(); debounceSave(); renderPreview(); } });
        const dupBtn = mkBtn('Duplicate', () => { arr.splice(idx + 1, 0, deepClone(block)); renderBlockCanvas(); debounceSave(); renderPreview(); });
        const delBtn = mkBtn('Delete', () => { arr.splice(idx, 1); renderBlockCanvas(); debounceSave(); renderPreview(); }, true);

        toolbar.appendChild(upBtn); toolbar.appendChild(downBtn); toolbar.appendChild(dupBtn); toolbar.appendChild(delBtn);

        head.appendChild(left);
        head.appendChild(toolbar);
        card.appendChild(head);

        const body = document.createElement('div');
        body.className = 'block-card-body';
        renderBlockFields(body, block);
        card.appendChild(body);

        return card;
    }

    function mkBtn(text, onClick, danger) {
        const b = document.createElement('button');
        b.textContent = text;
        if (danger) b.classList.add('danger');
        b.addEventListener('click', onClick);
        return b;
    }

    function field(labelText, inputEl) {
        const row = document.createElement('div');
        row.className = 'field-row';
        const label = document.createElement('label');
        label.textContent = labelText;
        row.appendChild(label);
        row.appendChild(inputEl);
        return row;
    }

    function mkTextField(value, onChange, multiline) {
        const el = document.createElement(multiline ? 'textarea' : 'input');
        if (!multiline) el.type = 'text';
        el.value = value || '';
        el.addEventListener('input', () => { onChange(el.value); debounceSave(); renderPreview(); });
        return el;
    }

    function renderBlockFields(body, block) {
        body.innerHTML = '';
        switch (block.type) {
            case 'text': {
                const variantSel = blockTypeSelect(block.variant, ['body', 'tagline', 'h2', 'quote'], v => { block.variant = v; debounceSave(); renderPreview(); });
                body.appendChild(field('Variant', variantSel));
                body.appendChild(field('Text', mkTextField(block.html, v => block.html = v, true)));
                break;
            }
            case 'image': {
                body.appendChild(field('Source path', mkTextField(block.src, v => block.src = v)));
                const hint = document.createElement('div');
                hint.className = 'field-hint';
                hint.textContent = 'Drop the real file at this path before publishing — the editor only previews it locally.';
                body.appendChild(hint);
                const fileInput = document.createElement('input');
                fileInput.type = 'file'; fileInput.accept = 'image/*';
                fileInput.addEventListener('change', () => {
                    if (fileInput.files[0]) { block._localPreviewSrc = URL.createObjectURL(fileInput.files[0]); renderPreview(); }
                });
                body.appendChild(field('Local preview (not exported)', fileInput));
                body.appendChild(field('Alt text', mkTextField(block.alt, v => block.alt = v)));
                body.appendChild(field('Caption', mkTextField(block.caption, v => block.caption = v)));
                break;
            }
            case 'video': {
                body.appendChild(field('Source path', mkTextField(block.src, v => block.src = v)));
                const hint = document.createElement('div');
                hint.className = 'field-hint';
                hint.textContent = 'Drop the real file at this path before publishing — the editor only previews it locally.';
                body.appendChild(hint);
                const fileInput = document.createElement('input');
                fileInput.type = 'file'; fileInput.accept = 'video/*';
                fileInput.addEventListener('change', () => {
                    if (fileInput.files[0]) { block._localPreviewSrc = URL.createObjectURL(fileInput.files[0]); renderPreview(); }
                });
                body.appendChild(field('Local preview (not exported)', fileInput));
                break;
            }
            case 'col2': {
                const layoutSel = blockTypeSelect(block.layout, ['media-row', 'img-grid'], v => { block.layout = v; debounceSave(); renderPreview(); });
                body.appendChild(field('Layout', layoutSel));
                const grid = document.createElement('div');
                grid.className = 'col-children'; grid.style.setProperty('--col-count', 2);
                block.children.forEach((child, i) => grid.appendChild(renderChildSlot(child, block.children, i)));
                body.appendChild(grid);
                break;
            }
            case 'col3': {
                const grid = document.createElement('div');
                grid.className = 'col-children'; grid.style.setProperty('--col-count', 3);
                block.children.forEach((child, i) => grid.appendChild(renderChildSlot(child, block.children, i)));
                body.appendChild(grid);
                break;
            }
            case 'list': {
                body.appendChild(field('Section title', mkTextField(block.title, v => block.title = v)));
                const itemsWrap = document.createElement('div');
                renderListItems(itemsWrap, block);
                body.appendChild(itemsWrap);
                break;
            }
            case 'divider': {
                const hint = document.createElement('div');
                hint.className = 'field-hint';
                hint.textContent = 'Renders a horizontal divider (<hr>) — no fields needed.';
                body.appendChild(hint);
                break;
            }
        }
    }

    function renderListItems(wrap, block) {
        wrap.innerHTML = '';
        block.items.forEach((item, i) => {
            const row = document.createElement('div');
            row.className = 'list-items-row';
            const boldInput = document.createElement('input');
            boldInput.type = 'text'; boldInput.placeholder = 'Bold lead-in (optional)'; boldInput.value = item.bold || '';
            boldInput.addEventListener('input', () => { item.bold = boldInput.value; debounceSave(); renderPreview(); });
            const restInput = document.createElement('input');
            restInput.type = 'text'; restInput.placeholder = 'Rest of line'; restInput.value = item.rest || '';
            restInput.addEventListener('input', () => { item.rest = restInput.value; debounceSave(); renderPreview(); });
            const removeBtn = document.createElement('button');
            removeBtn.className = 'list-remove'; removeBtn.textContent = '✕';
            removeBtn.addEventListener('click', () => { block.items.splice(i, 1); renderListItems(wrap, block); debounceSave(); renderPreview(); });
            row.appendChild(boldInput); row.appendChild(restInput); row.appendChild(removeBtn);
            wrap.appendChild(row);
        });
        const addBtn = document.createElement('button');
        addBtn.className = 'kv-add'; addBtn.textContent = '+ Add line';
        addBtn.addEventListener('click', () => { block.items.push({ bold: '', rest: '' }); renderListItems(wrap, block); debounceSave(); });
        wrap.appendChild(addBtn);
    }

    function renderChildSlot(child, childrenArr, i) {
        const slot = document.createElement('div');
        slot.className = 'col-slot';
        const label = document.createElement('span');
        label.className = 'col-slot-label';
        label.textContent = 'Slot ' + (i + 1);
        slot.appendChild(label);

        const typeSel = blockTypeSelect(child.type, CHILD_BLOCK_TYPES, (newType) => {
            childrenArr[i] = makeBlock(newType);
            renderBlockCanvas(); debounceSave(); renderPreview();
        });
        slot.appendChild(typeSel);

        const fieldsWrap = document.createElement('div');
        fieldsWrap.style.marginTop = '6px';
        renderBlockFields(fieldsWrap, child);
        slot.appendChild(fieldsWrap);

        return slot;
    }

    const addBlockTypeSelect = document.getElementById('add-block-type-select');
    BLOCK_TYPES.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t; opt.textContent = t;
        addBlockTypeSelect.appendChild(opt);
    });

    document.getElementById('add-block-confirm-btn').addEventListener('click', () => {
        if (!state.working) return;
        state.working.contentBlocks.push(makeBlock(addBlockTypeSelect.value));
        renderBlockCanvas(); debounceSave(); renderPreview();
    });

    // =========================================================
    // 11. LIVE PREVIEW (renders with real project.css classes)
    // =========================================================
    function renderBlockPreview(block) {
        switch (block.type) {
            case 'text': {
                const tag = block.variant === 'h2' ? 'h2' : 'p';
                const el = document.createElement(tag);
                el.className = block.variant === 'h2' ? '' : (block.variant === 'tagline' ? 'tagline' : block.variant === 'quote' ? 'quote-box' : 'body-text');
                el.textContent = block.html;
                return el;
            }
            case 'image': {
                const wrap = document.createDocumentFragment();
                const img = document.createElement('img');
                img.src = block._localPreviewSrc || block.src;
                img.alt = block.alt || '';
                wrap.appendChild(img);
                if (block.caption) {
                    const cap = document.createElement('p');
                    cap.className = 'body-text';
                    cap.style.fontSize = '14px';
                    cap.style.color = 'var(--text-faint)';
                    cap.style.marginTop = '-12px';
                    cap.textContent = block.caption;
                    wrap.appendChild(cap);
                }
                return wrap;
            }
            case 'video': {
                const video = document.createElement('video');
                video.autoplay = true; video.loop = true; video.muted = true; video.playsInline = true;
                const source = document.createElement('source');
                source.src = block._localPreviewSrc || block.src;
                video.appendChild(source);
                return video;
            }
            case 'col2': {
                const div = document.createElement('div');
                div.className = block.layout === 'img-grid' ? 'img-grid' : 'media-row';
                block.children.forEach(c => div.appendChild(renderBlockPreview(c)));
                return div;
            }
            case 'col3': {
                const div = document.createElement('div');
                div.className = 'gallery-grid';
                block.children.forEach(c => div.appendChild(renderBlockPreview(c)));
                return div;
            }
            case 'list': {
                const wrap = document.createElement('div');
                const titleEl = document.createElement('span');
                titleEl.className = 'list-title';
                titleEl.textContent = block.title;
                const ul = document.createElement('ul');
                ul.className = 'list-section';
                block.items.forEach(item => {
                    const li = document.createElement('li');
                    if (item.bold) {
                        const b = document.createElement('b');
                        b.textContent = item.bold + ' ';
                        li.appendChild(b);
                    }
                    li.appendChild(document.createTextNode(item.rest || ''));
                    ul.appendChild(li);
                });
                wrap.appendChild(titleEl); wrap.appendChild(ul);
                return wrap;
            }
            case 'divider': {
                return document.createElement('hr');
            }
        }
        return document.createDocumentFragment();
    }

    function renderPreview() {
        previewPane.innerHTML = '';
        if (!state.working) return;
        const inner = document.createElement('div');
        inner.className = 'preview-inner case-study-container';
        inner.style.width = '100%';
        inner.style.maxWidth = '900px';
        inner.style.margin = '0';

        const h1 = document.createElement('h1');
        h1.textContent = state.working.title;
        inner.appendChild(h1);

        if (state.entityType === 'project' && state.working.caption) {
            const tagline = document.createElement('p');
            tagline.className = 'tagline';
            tagline.textContent = state.working.caption;
            inner.appendChild(tagline);
        } else if (state.entityType === 'experiment' && state.working.description) {
            const tagline = document.createElement('p');
            tagline.className = 'tagline';
            tagline.textContent = state.working.description;
            inner.appendChild(tagline);
        }

        const metaGrid = document.createElement('div');
        metaGrid.className = 'meta-grid';
        function metaRow(label, value) {
            const l = document.createElement('span'); l.className = 'meta-label'; l.textContent = label;
            const v = document.createElement('span'); v.className = 'meta-value'; v.textContent = value;
            metaGrid.appendChild(l); metaGrid.appendChild(v);
        }
        if (state.entityType === 'project') {
            metaRow('Year', state.working.year || '—');
            if (state.working.tags && state.working.tags.length) metaRow('Tags', state.working.tags.join(', '));
            if (state.working.entropyScale != null) metaRow('Entropy', String(state.working.entropyScale));
        } else {
            metaRow('No.', String(state.working.id));
            metaRow('Ephemeral', state.working.ephemeral ? 'Yes' : 'No');
        }
        inner.appendChild(metaGrid);

        (state.working.contentBlocks || []).forEach(b => inner.appendChild(renderBlockPreview(b)));

        previewPane.appendChild(inner);
    }

    // =========================================================
    // 12. EXPORT — serialize blocks to HTML strings + JS object
    // =========================================================
    function serializeBlock(block, indent) {
        const pad = '    '.repeat(indent || 0);
        switch (block.type) {
            case 'text': {
                const cls = block.variant === 'h2' ? null : (block.variant === 'tagline' ? 'tagline' : block.variant === 'quote' ? 'quote-box' : 'body-text');
                return block.variant === 'h2'
                    ? `${pad}<h2>${escapeHtml(block.html).toUpperCase()}</h2>`
                    : `${pad}<p class="${cls}">${escapeHtml(block.html)}</p>`;
            }
            case 'image': {
                let out = `${pad}<img src="${escapeHtml(block.src)}" alt="${escapeHtml(block.alt)}">`;
                if (block.caption) out += `\n${pad}<p class="body-text" style="font-size:14px;color:var(--text-faint);margin-top:-12px;">${escapeHtml(block.caption)}</p>`;
                return out;
            }
            case 'video':
                return `${pad}<video autoplay loop muted playsinline>\n${pad}    <source src="${escapeHtml(block.src)}" type="video/mp4">\n${pad}</video>`;
            case 'col2': {
                const cls = block.layout === 'img-grid' ? 'img-grid' : 'media-row';
                const inner = block.children.map(c => serializeBlock(c, (indent || 0) + 1)).join('\n');
                return `${pad}<div class="${cls}">\n${inner}\n${pad}</div>`;
            }
            case 'col3': {
                const inner = block.children.map(c => serializeBlock(c, (indent || 0) + 1)).join('\n');
                return `${pad}<div class="gallery-grid">\n${inner}\n${pad}</div>`;
            }
            case 'list': {
                const items = block.items.map(i => `${pad}    <li>${i.bold ? `<b>${escapeHtml(i.bold)}</b> ` : ''}${escapeHtml(i.rest)}</li>`).join('\n');
                return `${pad}<div class="section-spacer">\n${pad}    <span class="list-title">${escapeHtml(block.title)}</span>\n${pad}    <ul class="list-section">\n${items}\n${pad}    </ul>\n${pad}</div>`;
            }
            case 'divider':
                return `${pad}<hr>`;
            default:
                return '';
        }
    }

    function buildExportObject() {
        const clone = deepClone(state.working);
        delete clone.contentBlocks;
        Object.keys(clone).forEach(k => { if (k.startsWith('_')) delete clone[k]; });
        return clone;
    }

    function refreshExportPanel() {
        const obj = buildExportObject();
        const jsComment = state.entityType === 'project'
            ? `// Paste this object into projectsData in projects.js (replacing the existing "${state.working.id}" entry, or appended as new)\n`
            : `// Paste this object into experimentsData in projects.js (replacing the existing "${state.working.id}" entry, or appended as new)\n`;
        exportJsTextarea.value = jsComment + JSON.stringify(obj, null, 4);

        const blocks = (state.working.contentBlocks || []).map(b => serializeBlock(b, 0)).join('\n');
        const htmlComment = state.entityType === 'project'
            ? `<!-- Paste below the .meta-grid (after <hr>) in projects/${state.working.id}/index.html, inside .case-study-container -->\n`
            : `<!-- This markup is not currently auto-injected by experiments.js. Use as reference / manually wire into the experiment modal's dynamic body if extending it. -->\n`;
        exportHtmlTextarea.value = htmlComment + blocks;
    }

    exportBtn.addEventListener('click', () => {
        if (!state.entityId) return;
        refreshExportPanel();
        exportPanel.classList.add('open');
        exportScrim.classList.add('open');
    });

    function closeExportPanel() {
        exportPanel.classList.remove('open');
        exportScrim.classList.remove('open');
    }
    exportCloseBtn.addEventListener('click', closeExportPanel);
    exportScrim.addEventListener('click', closeExportPanel);

    exportTabBtns.forEach(tabBtn => tabBtn.addEventListener('click', () => {
        exportTabBtns.forEach(b => b.classList.toggle('active', b === tabBtn));
        document.querySelectorAll('.export-tab-content').forEach(c => c.classList.add('hidden'));
        document.getElementById('export-tab-' + tabBtn.dataset.tab).classList.remove('hidden');
    }));

    copyBtns.forEach(btn => btn.addEventListener('click', () => {
        const targetId = btn.dataset.target;
        const ta = document.getElementById(targetId);
        navigator.clipboard.writeText(ta.value).then(() => {
            const original = btn.textContent;
            btn.textContent = 'Copied!';
            setTimeout(() => btn.textContent = original, 1200);
        });
    }));

    // marking export complete also persists once the user has actually copied something
    document.querySelectorAll('.export-copy-btn').forEach(btn => btn.addEventListener('click', () => {
        if (!state.entityId) return;
        const ts = String(Date.now());
        localStorage.setItem(exportedKey(state.entityType, state.entityId), ts);
        state.exportedAt = ts;
        renderStateBadge();
    }));

    // =========================================================
    // 13. INIT / RENDER ALL
    // =========================================================
    function renderAll() {
        renderSidebar();
        renderMetaSidebar();
        renderBlockCanvas();
        renderPreview();
        renderStateBadge();
    }

    function init() {
        sidebarTab = 'project';
        renderSidebar();
        if (typeof projectsData !== 'undefined' && projectsData.length) {
            loadEntity('project', projectsData[0].id, false);
        }
    }
});
