/**
 * hero-mode.js — Showreel / Game / Camera switcher for the hero pixel mosaic.
 * Requires pixel-mosaic.js to expose window.PM before this runs.
 */
(function () {
    'use strict';

    const isMobile = window.innerWidth <= 768;
    const isTouch  = 'ontouchstart' in window || window.matchMedia('(pointer: coarse)').matches;

    let currentMode    = 'showreel';
    let cameraStream   = null;
    let snakeRafId     = null;
    let gameInited     = false;

    // Snake state
    let snake, dir, nextDir, foods, score, alive, gameStarted;

    const FOOD_COUNT = 4;  // foods on screen at once

    document.addEventListener('DOMContentLoaded', () => {
        const bar = document.getElementById('hero-mode-bar');
        if (!bar) return;

        bar.querySelectorAll('.hero-mode-btn').forEach(btn => {
            btn.addEventListener('click', () => setMode(btn.dataset.mode));
        });

        document.addEventListener('keydown', onKey);
        if (isTouch) attachTouchControls();
    });

    function setMode(mode) {
        if (mode === currentMode) return;

        if (currentMode === 'game')   exitGame();
        if (currentMode === 'camera') exitCamera();

        currentMode = mode;

        document.querySelectorAll('.hero-mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });

        if (mode === 'showreel') enterShowreel();
        if (mode === 'game')     enterGame();
        if (mode === 'camera')   enterCamera();
    }

    // ── Showreel ──────────────────────────────────────────────────────────────
    function enterShowreel() {
        if (!window.PM) return;
        PM.resume();
        const vid = document.getElementById('pm-vid');
        if (!vid) return;
        if (vid.srcObject) {
            vid.srcObject.getTracks().forEach(t => t.stop());
            vid.srcObject = null;
        }
        vid.src = isMobile ? 'hero-mobile.mp4' : 'hero.mp4';
        vid.play().catch(() => {});
    }

    // ── Camera ────────────────────────────────────────────────────────────────
    function enterCamera() {
        if (!window.PM) return;
        PM.resume();
        navigator.mediaDevices.getUserMedia({ video: true, audio: false })
            .then(stream => {
                cameraStream = stream;
                const vid = document.getElementById('pm-vid');
                if (vid) { vid.srcObject = stream; vid.play().catch(() => {}); }
            })
            .catch(() => setMode('showreel'));
    }

    function exitCamera() {
        if (cameraStream) {
            cameraStream.getTracks().forEach(t => t.stop());
            cameraStream = null;
        }
    }

    // ── Game ──────────────────────────────────────────────────────────────────
    function enterGame() {
        if (!window.PM) return;
        PM.pause();

        gameInited = false;
        resetSnake();
        startSnakeLoop();
    }

    function exitGame() {
        if (snakeRafId) { cancelAnimationFrame(snakeRafId); snakeRafId = null; }
    }

    function resetSnake() {
        const cols = PM.cols, rows = PM.rows;
        if (!cols || !rows) return;
        const cx = Math.floor(cols / 2), cy = Math.floor(rows / 2);
        snake       = [{ x: cx, y: cy }, { x: cx - 1, y: cy }, { x: cx - 2, y: cy }];
        dir         = { x: 1, y: 0 };
        nextDir     = { x: 1, y: 0 };
        score       = 0;
        alive       = true;
        gameStarted = false;
        foods       = [];
        for (let i = 0; i < FOOD_COUNT; i++) spawnFood();
        updateHint(isMobile ? 'Swipe to play' : 'Arrow keys to play');
        updateScore(0);
    }

    // Each food: { x, y, size (tiles wide), growth (segments to add) }
    function spawnFood() {
        const cols = PM.cols, rows = PM.rows;
        // Weighted sizes: 1-tile, 2-tile, 3-tile, 4-tile
        const sizes   = [1, 1, 2, 2, 2, 3, 3, 4];
        const size    = sizes[Math.floor(Math.random() * sizes.length)];
        const growth  = size;  // eat a 3-wide pill → grow 3 segments

        const occupied = new Set();
        snake.forEach(s => occupied.add(s.x + ',' + s.y));
        foods.forEach(f => {
            for (let i = 0; i < f.size; i++) occupied.add((f.x + i) + ',' + f.y);
        });

        let pos, attempts = 0;
        do {
            pos = {
                x: Math.floor(Math.random() * (cols - size)),
                y: 1 + Math.floor(Math.random() * (rows - 2)),
            };
            const clear = !Array.from({ length: size }, (_, i) => (pos.x + i) + ',' + pos.y)
                .some(k => occupied.has(k));
            if (clear) break;
        } while (++attempts < 200);

        foods.push({ x: pos.x, y: pos.y, size, growth });
    }

    function stepSnake() {
        if (!alive) return;
        const cols = PM.cols, rows = PM.rows;
        dir = { ...nextDir };
        const head = { x: (snake[0].x + dir.x + cols) % cols, y: (snake[0].y + dir.y + rows) % rows };
        if (snake.some(s => s.x === head.x && s.y === head.y)) {
            alive = false;
            updateHint(isMobile ? 'Tap to restart' : 'Any arrow to restart');
            return;
        }
        snake.unshift(head);

        const eatenIdx = foods.findIndex(f =>
            head.y === f.y && head.x >= f.x && head.x < f.x + f.size
        );

        if (eatenIdx !== -1) {
            const eaten = foods[eatenIdx];
            score += eaten.size;
            updateScore(score);
            // Grow by food size: keep extra segments at tail
            for (let i = 1; i < eaten.growth; i++) {
                snake.push({ ...snake[snake.length - 1] });
            }
            foods.splice(eatenIdx, 1);
            spawnFood();
        } else {
            snake.pop();
        }
    }

    function drawGame() {
        const pm = window.PM;
        if (!pm || !pm.canvas || !snake || !foods) return;

        const canvas = pm.canvas;
        const ctx    = canvas.getContext('2d');
        const tW     = pm.tileW, tH = pm.tileH;
        const cols   = pm.cols,  rows = pm.rows;
        const logW   = pm.logW,  logH = pm.logH;
        const dpr    = pm.dpr;
        const GAP    = pm.gap;
        const dark   = document.documentElement.getAttribute('data-theme') === 'dark';
        // Slightly off-white in light mode to reduce harshness
        const bgColor = dark ? 'rgb(44,44,46)' : 'rgb(235,235,240)';

        if (!tW || !cols) return;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, logW, logH);

        const foodPulse = 0.65 + 0.35 * Math.sin(Date.now() / 240);

        // Background pass
        ctx.globalAlpha = 1;
        ctx.fillStyle   = bgColor;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const x = c * tW + GAP, y = r * tH + GAP;
                drawPill(ctx, x, y, tW - GAP * 2, tH - GAP * 2);
            }
        }

        // Food pass — one pill per tile, consecutive cells filled
        ctx.fillStyle = dark ? '#FF453A' : '#FF3B30';
        ctx.globalAlpha = foodPulse;
        foods.forEach(f => {
            for (let i = 0; i < f.size; i++) {
                const fx = (f.x + i) * tW + GAP;
                const fy = f.y * tH + GAP;
                drawPill(ctx, fx, fy, tW - GAP * 2, tH - GAP * 2);
            }
        });

        // Snake pass
        ctx.fillStyle = dark ? '#F5F5F7' : '#1F2124';
        snake.forEach((s, i) => {
            ctx.globalAlpha = i === 0 ? 1 : Math.max(0.25, 1 - i / snake.length * 0.6);
            const x = s.x * tW + GAP, y = s.y * tH + GAP;
            drawPill(ctx, x, y, tW - GAP * 2, tH - GAP * 2);
        });

        ctx.globalAlpha = 1;
    }

    function drawPill(ctx, x, y, w, h) {
        const r = Math.min(w, h) / 2;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        ctx.fill();
    }

    let lastStep = 0;
    const SPEED  = 140;

    function startSnakeLoop() {
        if (snakeRafId) cancelAnimationFrame(snakeRafId);
        function loop(ts) {
            if (currentMode !== 'game') return;
            if (gameStarted && alive && ts - lastStep > SPEED) {
                stepSnake();
                lastStep = ts;
            }
            drawGame();
            snakeRafId = requestAnimationFrame(loop);
        }
        snakeRafId = requestAnimationFrame(loop);
    }

    // ── Controls ──────────────────────────────────────────────────────────────
    const DIRS = {
        ArrowUp:    { x: 0,  y: -1 },
        ArrowDown:  { x: 0,  y:  1 },
        ArrowLeft:  { x: -1, y:  0 },
        ArrowRight: { x: 1,  y:  0 },
    };

    function onKey(e) {
        if (currentMode !== 'game') return;
        const d = DIRS[e.key];
        if (!d) return;
        e.preventDefault();
        if (!alive) { resetSnake(); return; }
        if (d.x === -dir.x && d.y === -dir.y) return;
        nextDir = d;
        if (!gameStarted) { gameStarted = true; updateHint(''); }
    }

    function attachTouchControls() {
        let tx0, ty0;
        const container = document.getElementById('hero-mosaic-container');
        if (!container) return;
        container.addEventListener('touchstart', e => {
            tx0 = e.touches[0].clientX; ty0 = e.touches[0].clientY;
        }, { passive: true });
        container.addEventListener('touchmove', e => {
            if (currentMode === 'game') e.preventDefault();
        }, { passive: false });
        container.addEventListener('touchend', e => {
            if (currentMode !== 'game') return;
            const dx = e.changedTouches[0].clientX - tx0;
            const dy = e.changedTouches[0].clientY - ty0;
            if (!alive) { resetSnake(); return; }
            if (Math.abs(dx) > Math.abs(dy)) {
                const d = dx > 0 ? DIRS.ArrowRight : DIRS.ArrowLeft;
                if (d.x !== -dir.x) { nextDir = d; gameStarted = true; updateHint(''); }
            } else {
                const d = dy > 0 ? DIRS.ArrowDown : DIRS.ArrowUp;
                if (d.y !== -dir.y) { nextDir = d; gameStarted = true; updateHint(''); }
            }
        }, { passive: true });
    }

    // ── HUD helpers ───────────────────────────────────────────────────────────
    function updateHint(text) {
        const el = document.querySelector('.hero-snake-hint');
        if (!el) return;
        el.textContent = text;
        el.style.opacity = text ? '1' : '0';
    }

    function updateScore(n) {
        const el = document.querySelector('.hero-snake-score');
        if (el) el.textContent = n;
    }

})();
