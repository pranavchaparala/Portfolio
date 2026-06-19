(function () {
    const container = document.getElementById('pm-container');
    if (!container) return;

    const isMobile = window.innerWidth <= 768 || ('ontouchstart' in window && window.innerWidth <= 1024);

    // Create elements
    const wrap = document.createElement('div');
    wrap.id = 'pm-wrap';
    wrap.style.cssText = 'position:relative;width:100%;height:100%;overflow:hidden;' + (isMobile ? '' : 'cursor:none;');
    const outC = document.createElement('canvas');
    outC.id = 'pm-out';
    outC.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;display:block;';
    wrap.appendChild(outC);
    container.appendChild(wrap);

    const vid = document.createElement('video');
    vid.id = 'pm-vid';
    vid.style.display = 'none';
    vid.setAttribute('playsinline', '');
    vid.loop = true;
    vid.muted = true;
    container.appendChild(vid);

    const srcC = document.createElement('canvas');
    srcC.id = 'pm-src';
    srcC.style.display = 'none';
    container.appendChild(srcC);

    const hirC = document.createElement('canvas');
    hirC.id = 'pm-hir';
    hirC.style.display = 'none';
    container.appendChild(hirC);

    const srcX = srcC.getContext('2d', { willReadFrequently: true });
    const hirX = hirC.getContext('2d', { willReadFrequently: true });
    const outX = outC.getContext('2d');

    let mx = -9999, my = -9999, lensAlpha = 0;
    const ASP = 3, GAP = 2, LENS = 200;
    let running = false;
    let rafId = null;
    let outLogW = 0, outLogH = 0, curTileW = 8, curTileH = 24;


    vid.poster = 'hero-poster.jpg';
    vid.preload = 'auto';
    vid.autoplay = true;
    vid.src = isMobile ? 'hero-mobile.mp4' : 'hero.mp4';
    vid.play().catch(() => {});
    if (isMobile) {
        document.addEventListener('touchstart', function retry() {
            vid.play().catch(() => {});
            document.removeEventListener('touchstart', retry);
        }, { passive: true });
    }
    vid.onloadedmetadata = () => {
        vid.onloadedmetadata = null;
        setup();
        running = true;
        loop();
    };

    function setup() {
        const cw = wrap.clientWidth;
        const ch = wrap.clientHeight;
        if (cw <= 0 || ch <= 0) return;
        hirC.width = cw; hirC.height = ch;
        // Mobile: +10% columns (÷9 vs ÷10) and shorter pills (ASP 2 vs 3)
        const cols = Math.max(15, Math.round(cw / (isMobile ? 8 : 10)));
        curTileW = Math.max(2, Math.floor(cw / cols));
        curTileH = Math.round(curTileW * (isMobile ? 2 : ASP));
        outLogW = Math.floor(cw / curTileW) * curTileW;
        outLogH = Math.floor(ch / curTileH) * curTileH;
        // Cap dpr: every fill/clear runs at outC's *physical* pixel count, so
        // on a 2-3x retina display this was tripling canvas work for a
        // tile-based effect that's already deliberately low-fidelity — the
        // extra sharpness wasn't visible, only the cost was.
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        outC.width = outLogW * dpr;
        outC.height = outLogH * dpr;
        outX.setTransform(dpr, 0, 0, dpr, 0, 0);

        // The mono layer only ever needs roughly one sample per tile, so the
        // source canvas is a small thumbnail instead of the full container —
        // the browser's own image scaling does the averaging in drawCover,
        // which is cheaper and less aliased than picking one source pixel
        // per tile by hand. Crucially, the thumbnail's aspect ratio must
        // match the container's (cw:ch), NOT the tile grid's (cols:rows) —
        // tiles are tall pills (tileH = tileW * ASP), so cols:rows is
        // skewed by a factor of ASP away from the real aspect ratio. Sizing
        // the thumbnail to cols:rows previously cropped drawCover's "cover"
        // scale against the wrong frame shape, which read as a stretch/zoom
        // on both the video and the webcam feed.
        srcC.width = Math.floor(outLogW / curTileW);
        srcC.height = Math.max(1, Math.round(srcC.width * ch / cw));
    }

    // Responsive: reflow on container resize
    let resizeTimer;
    const ro = new ResizeObserver(() => {
        if (running) {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(setup, 150);
        }
    });
    ro.observe(container);

    function drawPill(x, y, w, h) {
        const r = w / 2;
        outX.beginPath();
        outX.moveTo(x + r, y);
        outX.lineTo(x + w - r, y);
        outX.quadraticCurveTo(x + w, y, x + w, y + r);
        outX.lineTo(x + w, y + h - r);
        outX.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        outX.lineTo(x + r, y + h);
        outX.quadraticCurveTo(x, y + h, x, y + h - r);
        outX.lineTo(x, y + r);
        outX.quadraticCurveTo(x, y, x + r, y);
        outX.closePath();
        outX.fill();
    }

    function drawCover(ctx, src, dw, dh) {
        const vw = src.videoWidth || src.naturalWidth;
        const vh = src.videoHeight || src.naturalHeight;
        if (!vw || !vh) return;
        const scale = Math.max(dw / vw, dh / vh);
        const sw = vw * scale, sh = vh * scale;
        ctx.drawImage(src, (dw - sw) / 2, (dh - sh) / 2, sw, sh);
    }

    const posterImg = new Image();
    posterImg.src = 'hero-poster.jpg';

    function draw() {
        if (!running) return;
        const src = vid.readyState >= 2 ? vid : (posterImg.complete && posterImg.naturalWidth ? posterImg : null);
        if (!src) return;
        const isHovering = !isMobile && mx > -100;
        lensAlpha += ((isHovering ? 1 : 0) - lensAlpha) * 0.07;
        lensAlpha = Math.max(0, Math.min(1, lensAlpha));

        // Mono layer: tiny thumbnail-sized read (one sample per tile) instead
        // of a full-container getImageData — this used to be the single
        // biggest per-frame cost.
        drawCover(srcX, src, srcC.width, srcC.height);
        const mosData = srcX.getImageData(0, 0, srcC.width, srcC.height).data;
        const sw = srcC.width, srcH = srcC.height;

        const ow = outLogW, oh = outLogH;
        const tileW = curTileW, tileH = curTileH;
        const cols = Math.floor(ow / tileW), rows = Math.floor(oh / tileH);

        const rect = outC.getBoundingClientRect();
        const scx = ow / rect.width;
        const cmx = (mx - rect.left) * scx;
        const cmy = (my - rect.top) * (oh / rect.height);

        outX.clearRect(0, 0, ow, oh);
        const lensR = LENS * scx;

        // Hi-res layer only matters inside the lens circle, and only while
        // it's actually visible — skip the draw + readback entirely when not
        // hovering, and crop the readback to the lens's bounding box (plus a
        // one-tile margin) instead of the full container the rest of the time.
        const showLens = lensAlpha > 0.01;
        let hirData = null, hirCropX = 0, hirCropY = 0, hirCropW = 0, hirCropH = 0, hsx = 1, hsy = 1;
        if (showLens) {
            drawCover(hirX, src, hirC.width, hirC.height);
            hsx = hirC.width / ow;
            hsy = hirC.height / oh;
            const pad = Math.max(tileW, tileH);
            const left = Math.max(0, Math.floor((cmx - lensR) * hsx) - pad);
            const top = Math.max(0, Math.floor((cmy - lensR) * hsy) - pad);
            const right = Math.min(hirC.width, Math.ceil((cmx + lensR) * hsx) + pad);
            const bottom = Math.min(hirC.height, Math.ceil((cmy + lensR) * hsy) + pad);
            hirCropX = left; hirCropY = top;
            hirCropW = Math.max(1, right - left);
            hirCropH = Math.max(1, bottom - top);
            hirData = hirX.getImageData(hirCropX, hirCropY, hirCropW, hirCropH).data;
        }

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const cx = c * tileW + tileW / 2, cy = r * tileH + tileH / 2;
                const dist = Math.sqrt((cx - cmx) ** 2 + (cy - cmy) ** 2);

                const mpy = Math.min(srcH - 1, Math.floor(r * srcH / rows));
                const midx = (mpy * sw + c) * 4;
                const mr = mosData[midx], mg = mosData[midx + 1], mb = mosData[midx + 2];
                const lum = 0.299 * mr + 0.587 * mg + 0.114 * mb;
                const mono = Math.min(255, Math.round((lum / 255) * 210));

                const t = Math.max(0, 1 - dist / lensR), ease = t * t * (3 - 2 * t), L = ease * lensAlpha;

                let fr = mono, fg = mono, fb = mono;
                if (hirData && L > 0.003) {
                    const hpx = Math.min(hirC.width - 1, Math.round(cx * hsx)) - hirCropX;
                    const hpy = Math.min(hirC.height - 1, Math.round(cy * hsy)) - hirCropY;
                    if (hpx >= 0 && hpy >= 0 && hpx < hirCropW && hpy < hirCropH) {
                        const hidx = (hpy * hirCropW + hpx) * 4;
                        const hr = hirData[hidx], hg = hirData[hidx + 1], hb = hirData[hidx + 2];
                        fr = Math.round(mono + (hr - mono) * L);
                        fg = Math.round(mono + (hg - mono) * L);
                        fb = Math.round(mono + (hb - mono) * L);
                    }
                }

                const innerW = tileW - GAP * 2, innerH = tileH - GAP * 2, grow = L * innerW * 0.15;
                const tw = Math.max(1, Math.min(tileW - 2, innerW + grow));
                const th = Math.max(1, Math.min(tileH - 2, innerH + grow * ASP * 0.5));
                const tx = c * tileW + GAP + (innerW - tw) / 2, ty = r * tileH + GAP + (innerH - th) / 2;

                outX.fillStyle = `rgb(${fr},${fg},${fb})`;
                drawPill(tx, ty, tw, th);
            }
        }
    }

    function loop() { draw(); rafId = requestAnimationFrame(loop); }

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
        } else if (running && !rafId && !document.querySelector('.modal-overlay.active')) {
            loop();
        }
    });

    // Pause entirely while a case-study/experiment modal is open — its own
    // transitions (especially expanding to fullscreen, which animates
    // width/height/margin-top/border-radius together) need the main thread,
    // and this canvas's per-frame getImageData work was competing with it
    // for no benefit since the mosaic isn't visible behind the modal anyway.
    const modalPauseObserver = new MutationObserver(() => {
        const modalOpen = !!document.querySelector('.modal-overlay.active');
        if (modalOpen) {
            if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
        } else if (running && !rafId && !document.hidden) {
            loop();
        }
    });
    document.querySelectorAll('.modal-overlay').forEach(el => {
        modalPauseObserver.observe(el, { attributes: true, attributeFilter: ['class'] });
    });

    // Mouse/touch interactions — desktop only
    if (!isMobile) {
        wrap.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
        wrap.addEventListener('mouseleave', () => { mx = -9999; my = -9999; });
        wrap.addEventListener('touchmove', e => { e.preventDefault(); mx = e.touches[0].clientX; my = e.touches[0].clientY; }, { passive: false });
        wrap.addEventListener('touchend', () => { mx = -9999; my = -9999; });
    }

    // Public API for hero-mode.js
    window.PM = {
        get vid()    { return vid; },
        get canvas() { return outC; },
        get tileW()  { return curTileW; },
        get tileH()  { return curTileH; },
        get cols()   { return Math.floor(outLogW / curTileW); },
        get rows()   { return Math.floor(outLogH / curTileH); },
        get logW()   { return outLogW; },
        get logH()   { return outLogH; },
        get dpr()    { return Math.min(window.devicePixelRatio || 1, 1.5); },
        get gap()    { return GAP; },
        pause()  { if (rafId) { cancelAnimationFrame(rafId); rafId = null; } },
        resume() { if (running && !rafId && !document.hidden) loop(); },
    };
})();
