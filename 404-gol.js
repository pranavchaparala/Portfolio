(function () {
    const container = document.getElementById('pm-container');
    if (!container) return;

    const GAP          = 2;
    const ASP          = 3;
    const REVEAL_MS    = 900;
    const SCROLL_SPEED = 10; // columns per second

    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'width:100%;height:100%;display:block;';
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    let cols = 0, rows = 0;
    let tileW, tileH, logW, logH, dpr;
    let cells = null;
    let rafId = null, startTime = null, scrollOffset = 0, lastScrollTime = null;

    function getColors() {
        const dark = document.documentElement.getAttribute('data-theme') === 'dark';
        return dark
            ? { r: 245, g: 245, b: 247, deadA: 0.07 }
            : { r: 31,  g: 33,  b: 36,  deadA: 0.06 };
    }

    function build404() {
        const S = 8, W = cols * S, H = rows * S;
        const off = document.createElement('canvas');
        off.width = W; off.height = H;
        const ox = off.getContext('2d');

        ox.font = `900 ${Math.round(H * 0.88)}px -apple-system, "SF Pro Display", Arial Black, sans-serif`;
        ox.textBaseline = 'middle';
        ox.textAlign = 'center';
        const xScale = Math.min((W * 0.82) / ox.measureText('404').width, 2.0);
        ox.fillStyle = '#fff';
        ox.save();
        ox.scale(xScale, 1);
        ox.fillText('404', W / (2 * xScale), H / 2);
        ox.restore();

        const data = ox.getImageData(0, 0, W, H).data;
        const targets = [];
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const px = Math.floor((c + 0.5) * S), py = Math.floor((r + 0.5) * S);
                if (data[(py * W + px) * 4 + 3] > 100) targets.push([c, r]);
            }
        }

        // BFS erosion: depth from glyph edge drives 3-shade gradient
        const set   = new Set(targets.map(([c, r]) => r * cols + c));
        const depth = new Map();
        const queue = [];
        const dirs  = [[-1,0],[1,0],[0,-1],[0,1]];

        for (const [c, r] of targets) {
            for (const [dc, dr] of dirs) {
                const nc = c+dc, nr = r+dr;
                if (nc<0||nc>=cols||nr<0||nr>=rows||!set.has(nr*cols+nc)) {
                    if (!depth.has(r*cols+c)) { depth.set(r*cols+c, 0); queue.push([c,r,0]); }
                    break;
                }
            }
        }
        let qi = 0;
        while (qi < queue.length) {
            const [c,r,d] = queue[qi++];
            for (const [dc,dr] of dirs) {
                const nc=c+dc,nr=r+dr,key=nr*cols+nc;
                if (set.has(key)&&!depth.has(key)) { depth.set(key,d+1); queue.push([nc,nr,d+1]); }
            }
        }

        return targets.map(([c, r]) => {
            const d = depth.get(r*cols+c) || 0;
            return { c, r, shade: d === 0 ? 0.28 : d === 1 ? 0.60 : 1.0 };
        });
    }

    function setup() {
        const cw = container.clientWidth;
        const ch = container.clientHeight;
        if (cw <= 0 || ch <= 0) return;

        dpr   = Math.min(window.devicePixelRatio || 1, 1.5);
        const tileCols = Math.max(15, Math.round(cw / 10));
        tileW = Math.max(2, Math.floor(cw / tileCols));
        tileH = Math.round(tileW * ASP);
        logW  = Math.floor(cw / tileW) * tileW;
        logH  = Math.floor(ch / tileH) * tileH;
        cols  = Math.floor(logW / tileW);
        rows  = Math.floor(logH / tileH);

        canvas.width  = logW * dpr;
        canvas.height = logH * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        cells         = build404();
        startTime     = null;
        scrollOffset  = 0;
        lastScrollTime = null;
    }

    function drawPill(x, y, w, h) {
        const r = w / 2;
        ctx.beginPath();
        ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y);
        ctx.quadraticCurveTo(x+w,y,x+w,y+r); ctx.lineTo(x+w,y+h-r);
        ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h); ctx.lineTo(x+r,y+h);
        ctx.quadraticCurveTo(x,y+h,x,y+h-r); ctx.lineTo(x,y+r);
        ctx.quadraticCurveTo(x,y,x+r,y);
        ctx.closePath(); ctx.fill();
    }

    function easeOut(t) { return 1 - (1 - t) * (1 - t); }

    function draw(now) {
        rafId = requestAnimationFrame(draw);
        if (!cells) return;
        if (!startTime) startTime = now;

        const elapsed  = now - startTime;
        const progress = easeOut(Math.min(1, elapsed / REVEAL_MS));

        // Begin scrolling once fully revealed
        if (progress >= 1) {
            if (!lastScrollTime) lastScrollTime = now;
            scrollOffset = (scrollOffset + SCROLL_SPEED * (now - lastScrollTime) / 1000) % cols;
            lastScrollTime = now;
        }

        const colShift = Math.floor(scrollOffset);
        const { r, g, b, deadA } = getColors();
        const iW = tileW - GAP * 2, iH = tileH - GAP * 2;

        ctx.clearRect(0, 0, logW, logH);

        // All pills off
        ctx.fillStyle = `rgba(${r},${g},${b},${deadA})`;
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                drawPill(col*tileW+GAP, row*tileH+GAP, iW, iH);
            }
        }

        // 404 pills — fade in, then scroll right wrapping around
        for (const { c, r: row, shade } of cells) {
            const displayCol = (c + colShift + cols) % cols;
            ctx.fillStyle = `rgba(${r},${g},${b},${shade * progress})`;
            drawPill(displayCol*tileW+GAP, row*tileH+GAP, iW, iH);
        }
    }

    setup();
    rafId = requestAnimationFrame(draw);

    let resizeTimer;
    new ResizeObserver(() => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(setup, 150);
    }).observe(container);

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) { cancelAnimationFrame(rafId); rafId = null; }
        else if (!rafId) {
            lastScrollTime = null;
            rafId = requestAnimationFrame(draw);
        }
    });
})();
