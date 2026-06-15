(function () {
    const container = document.getElementById('pm-container');
    if (!container) return;

    // Create elements
    const wrap = document.createElement('div');
    wrap.id = 'pm-wrap';
    wrap.style.cssText = 'position:relative;cursor:none;width:100%;height:100%;';
    const outC = document.createElement('canvas');
    outC.id = 'pm-out';
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

    let mx = -9999, my = -9999, lensAlpha = 0, COLS = 120, ASP = 3, GAP = 2, LENS = 200, running = false;
    let rafId = null;
    let cameraStream = null;
    let usingCamera = false;

    // --- Camera toggle button ---
    const camBtn = document.createElement('button');
    camBtn.className = 'nav-btn pm-cam-btn';
    camBtn.setAttribute('aria-label', 'Toggle camera');
    camBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg><span>Try me</span>`;
    wrap.appendChild(camBtn);

    camBtn.addEventListener('click', async () => {
        if (!usingCamera) {
            try {
                cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                vid.srcObject = cameraStream;
                await vid.play();
                usingCamera = true;
                camBtn.classList.add('active');
            } catch (e) {
                console.warn('Camera access denied:', e);
            }
        } else {
            if (cameraStream) {
                cameraStream.getTracks().forEach(t => t.stop());
                cameraStream = null;
            }
            vid.srcObject = null;
            vid.src = 'hero.mp4';
            vid.play().catch(() => {});
            usingCamera = false;
            camBtn.classList.remove('active');
        }
    });

    vid.src = 'hero.mp4';
    vid.play().catch(() => {});
    vid.onloadedmetadata = () => {
        vid.onloadedmetadata = null; // only run once — camera switch must not re-setup
        setup();
        running = true;
        loop();
    };

    function setup() {
        const cw = container.clientWidth;
        if (cw <= 0) return;
        const scale = Math.min(1, cw / vid.videoWidth);
        const sw = Math.round(vid.videoWidth * scale), sh = Math.round(vid.videoHeight * scale);
        if (sw <= 0 || sh <= 0) return;
        srcC.width = sw; srcC.height = sh;
        hirC.width = sw; hirC.height = sh;
        const tileW = Math.max(2, Math.floor(sw / COLS)), tileH = Math.round(tileW * ASP);
        outC.width = Math.floor(sw / tileW) * tileW;
        outC.height = Math.floor(sh / tileH) * tileH;
        outC.style.width = cw + 'px';
        outC.style.height = (cw * (sh / sw)) + 'px';
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

    function drawCover(ctx, video, dw, dh) {
        const vw = video.videoWidth, vh = video.videoHeight;
        if (!vw || !vh) return;
        const scale = Math.max(dw / vw, dh / vh);
        const sw = vw * scale, sh = vh * scale;
        ctx.drawImage(video, (dw - sw) / 2, (dh - sh) / 2, sw, sh);
    }

    function draw() {
        if (!running || vid.readyState < 2) return;
        const isHovering = mx > -100;
        lensAlpha += ((isHovering ? 1 : 0) - lensAlpha) * 0.07;
        lensAlpha = Math.max(0, Math.min(1, lensAlpha));

        drawCover(srcX, vid, srcC.width, srcC.height);
        drawCover(hirX, vid, hirC.width, hirC.height);

        const mosData = srcX.getImageData(0, 0, srcC.width, srcC.height).data;
        const hirData = hirX.getImageData(0, 0, hirC.width, hirC.height).data;
        const sw = srcC.width;

        const ow = outC.width, oh = outC.height;
        const tileW = Math.floor(srcC.width / COLS), tileH = Math.round(tileW * ASP);
        const cols = Math.floor(ow / tileW), rows = Math.floor(oh / tileH);

        const rect = outC.getBoundingClientRect();
        const scx = ow / rect.width;
        const cmx = (mx - rect.left) * scx;
        const cmy = (my - rect.top) * (oh / rect.height);

        outX.clearRect(0, 0, ow, oh);
        const lensR = LENS * scx;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const cx = c * tileW + tileW / 2, cy = r * tileH + tileH / 2;
                const dist = Math.sqrt((cx - cmx) ** 2 + (cy - cmy) ** 2);

                const mpx = Math.floor(c * (srcC.width / cols)), mpy = Math.floor(r * (srcC.height / rows));
                const midx = (mpy * sw + mpx) * 4;
                const mr = mosData[midx], mg = mosData[midx + 1], mb = mosData[midx + 2];
                const lum = 0.299 * mr + 0.587 * mg + 0.114 * mb;
                const mono = Math.min(255, Math.round((lum / 255) * 210));

                const hpx = Math.min(hirC.width - 1, Math.round(cx * (hirC.width / ow)));
                const hpy = Math.min(hirC.height - 1, Math.round(cy * (hirC.height / oh)));
                const hidx = (hpy * hirC.width + hpx) * 4;
                const hr = hirData[hidx], hg = hirData[hidx + 1], hb = hirData[hidx + 2];

                const t = Math.max(0, 1 - dist / lensR), ease = t * t * (3 - 2 * t), L = ease * lensAlpha;
                const innerW = tileW - GAP * 2, innerH = tileH - GAP * 2, grow = L * innerW * 0.15;
                const tw = Math.max(1, Math.min(tileW - 2, innerW + grow));
                const th = Math.max(1, Math.min(tileH - 2, innerH + grow * ASP * 0.5));
                const tx = c * tileW + GAP + (innerW - tw) / 2, ty = r * tileH + GAP + (innerH - th) / 2;

                const fr = Math.round(mono + (hr - mono) * L);
                const fg = Math.round(mono + (hg - mono) * L);
                const fb = Math.round(mono + (hb - mono) * L);

                outX.fillStyle = `rgb(${fr},${fg},${fb})`;
                drawPill(tx, ty, tw, th);
            }
        }
    }

    function loop() { draw(); rafId = requestAnimationFrame(loop); }

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
        } else if (running && !rafId) {
            loop();
        }
    });

    wrap.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
    wrap.addEventListener('mouseleave', () => { mx = -9999; my = -9999; });
    wrap.addEventListener('touchmove', e => { e.preventDefault(); mx = e.touches[0].clientX; my = e.touches[0].clientY; }, { passive: false });
    wrap.addEventListener('touchend', () => { mx = -9999; my = -9999; });
})();
