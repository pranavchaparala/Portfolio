/**
 * footer-game.js — Expanding footer with pixel-mosaic snake game.
 * Snake segments are pills drawn directly into the mosaic grid.
 */
(function () {
    'use strict';

    const isTouch = 'ontouchstart' in window || window.matchMedia('(pointer: coarse)').matches;
    const isMobile = window.innerWidth <= 768;

    document.addEventListener('DOMContentLoaded', () => {
        const footer   = document.querySelector('.site-footer.figma-footer');
        const inner    = footer && footer.querySelector('.footer-inner');
        const gameArea = footer && footer.querySelector('.footer-game-area');
        if (!footer || !inner || !gameArea) return;


        // ── Overscroll pull trigger ───────────────────────────────────────────
        let triggered = false;
        let pull = 0;
        const PULL_NEEDED = 200;
        const BASE_H = () => inner.offsetHeight + 2;

        function atBottom() {
            return window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4;
        }

        function setPullHeight(px) {
            const base   = BASE_H();
            const target = window.innerHeight * 0.5;
            footer.style.transition = 'none';
            footer.style.height = (base + (target - base) * Math.min(1, px / PULL_NEEDED)) + 'px';
        }

        function lockOpen() {
            triggered = true;
            window.removeEventListener('wheel', onWheel);
            footer.style.transition = 'height 0.55s cubic-bezier(0.16, 1, 0.3, 1)';
            footer.style.height = (window.innerHeight * 0.5) + 'px';
            inner.classList.add('footer-inner--hidden');
            setTimeout(() => {
                footer.addEventListener('transitionend', function onExpand(ev) {
                    if (ev.propertyName !== 'height') return;
                    footer.removeEventListener('transitionend', onExpand);
                    gameArea.classList.add('footer-game-area--visible');
                    initGame(gameArea);
                });
            }, 280);
        }

        function onWheel(e) {
            if (triggered) return;
            if (!atBottom()) {
                if (pull > 0) {
                    pull = Math.max(0, pull - 30);
                    setPullHeight(pull);
                    if (pull === 0) { footer.style.transition = ''; footer.style.height = ''; }
                }
                return;
            }
            if (e.deltaY > 0) {
                e.preventDefault();
                pull = Math.min(PULL_NEEDED, pull + e.deltaY * 0.45);
                setPullHeight(pull);
                if (pull >= PULL_NEEDED) lockOpen();
            } else {
                pull = Math.max(0, pull + e.deltaY * 0.45);
                setPullHeight(pull);
                if (pull === 0) { footer.style.transition = 'height 0.3s ease'; footer.style.height = ''; }
            }
        }

        window.addEventListener('wheel', onWheel, { passive: false });

        // Touch
        let touchStartY = 0, touchPull = 0;
        window.addEventListener('touchstart', e => { touchStartY = e.touches[0].clientY; touchPull = pull; }, { passive: true });
        window.addEventListener('touchmove', e => {
            if (triggered || !atBottom()) return;
            const dy = touchStartY - e.touches[0].clientY;
            if (dy > 0) {
                pull = Math.min(PULL_NEEDED, touchPull + dy * 0.6);
                setPullHeight(pull);
                if (pull >= PULL_NEEDED) lockOpen();
            }
        }, { passive: true });
        window.addEventListener('touchend', () => {
            if (triggered || pull >= PULL_NEEDED) return;
            if (pull > 0) {
                pull = 0;
                footer.style.transition = 'height 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)';
                footer.style.height = '';
            }
        }, { passive: true });
    });

    // ── Game ──────────────────────────────────────────────────────────────────
    function initGame(container) {
        const canvas  = container.querySelector('.footer-mosaic');
        const scoreEl = container.querySelector('.footer-snake-score');
        const hintEl  = container.querySelector('.footer-snake-hint');
        if (!canvas) return;

        const snakeCanvas = container.querySelector('.footer-snake');
        if (snakeCanvas) snakeCanvas.style.display = 'none';

        const isDark      = () => document.documentElement.getAttribute('data-theme') === 'dark';
        const SNAKE_COLOR = () => isDark() ? '#F5F5F7' : '#1F2124';
        const FOOD_COLOR  = () => isDark() ? '#FF453A' : '#FF3B30';

        const GAP = 2;
        const ASP = isMobile ? 2 : 3;

        const outX = canvas.getContext('2d');

        // Static noise grid — seeded once per setup, gives subtle texture
        let bgGrid = [];

        let tileW = 8, tileH = 24, logW = 0, logH = 0, cols = 0, rows = 0;

        function setup() {
            const cw = container.clientWidth;
            const ch = container.clientHeight;
            if (cw <= 0 || ch <= 0) return;

            const colCount = Math.max(15, Math.round(cw / (isMobile ? 8 : 10)));
            tileW  = Math.max(2, Math.floor(cw / colCount));
            tileH  = Math.round(tileW * ASP);
            logW   = Math.floor(cw / tileW) * tileW;
            logH   = Math.floor(ch / tileH) * tileH;
            cols   = Math.floor(logW / tileW);
            rows   = Math.floor(logH / tileH);

            const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
            canvas.width  = logW * dpr;
            canvas.height = logH * dpr;
            outX.setTransform(dpr, 0, 0, dpr, 0, 0);

            // Seed background noise grid
            bgGrid = [];
            for (let r = 0; r < rows; r++) {
                bgGrid[r] = [];
                for (let c = 0; c < cols; c++) {
                    // subtle random brightness offset: ±12 steps
                    bgGrid[r][c] = Math.floor(Math.random() * 25) - 12;
                }
            }

            if (snake) snake = snake.filter(s => s.x < cols && s.y < rows);
        }

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


        // ── Snake state ───────────────────────────────────────────────────────
        let snake, dir, nextDir, food, score, alive, gameStarted;

        function resetSnake() {
            const cx = Math.floor(cols / 2);
            const cy = Math.floor(rows / 2);
            snake       = [{ x: cx, y: cy }, { x: cx - 1, y: cy }, { x: cx - 2, y: cy }];
            dir         = { x: 1, y: 0 };
            nextDir     = { x: 1, y: 0 };
            score       = 0;
            alive       = true;
            gameStarted = false;
            if (scoreEl) scoreEl.textContent = '0';
            if (hintEl)  { hintEl.textContent = isMobile ? 'Swipe to play' : 'Arrow keys to play'; hintEl.style.opacity = '1'; }
            placeFood();
        }

        function placeFood() {
            const occupied = new Set(snake.map(s => s.x + ',' + s.y));
            let pos;
            do { pos = { x: Math.floor(Math.random() * cols), y: Math.floor(Math.random() * rows) }; }
            while (occupied.has(pos.x + ',' + pos.y));
            food = pos;
        }

        function stepSnake() {
            if (!alive) return;
            dir = { ...nextDir };
            const head = { x: (snake[0].x + dir.x + cols) % cols, y: (snake[0].y + dir.y + rows) % rows };
            if (snake.some(s => s.x === head.x && s.y === head.y)) {
                alive = false;
                if (hintEl) { hintEl.textContent = 'Game over — press any arrow to restart'; hintEl.style.opacity = '1'; }
                return;
            }
            snake.unshift(head);
            if (head.x === food.x && head.y === food.y) {
                score++;
                if (scoreEl) scoreEl.textContent = score;
                placeFood();
            } else {
                snake.pop();
            }
        }

        // ── Unified draw — mosaic + snake in one pass ─────────────────────────
        function drawFrame() {
            if (!snake || !food) return;

            const snakeMap  = new Map();
            snake.forEach((s, i) => snakeMap.set(s.x + ',' + s.y, i));
            const foodKey   = food.x + ',' + food.y;
            const foodPulse = 0.75 + 0.25 * Math.sin(Date.now() / 220);
            const dark      = isDark();
            // Base background brightness: 200 light / 44 dark
            const base      = dark ? 44 : 200;

            outX.clearRect(0, 0, logW, logH);

            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const key      = c + ',' + r;
                    const snakeIdx = snakeMap.get(key);
                    const x = c * tileW + GAP;
                    const y = r * tileH + GAP;
                    const w = tileW - GAP * 2;
                    const h = tileH - GAP * 2;

                    if (snakeIdx !== undefined) {
                        outX.globalAlpha = snakeIdx === 0 ? 1 : Math.max(0.25, 1 - snakeIdx / snake.length * 0.6);
                        outX.fillStyle   = SNAKE_COLOR();
                    } else if (key === foodKey) {
                        outX.globalAlpha = foodPulse;
                        outX.fillStyle   = FOOD_COLOR();
                    } else {
                        outX.globalAlpha = 1;
                        const v = Math.min(255, Math.max(0, base + (bgGrid[r] ? bgGrid[r][c] : 0)));
                        outX.fillStyle = `rgb(${v},${v},${v})`;
                    }
                    drawPill(x, y, w, h);
                }
            }
            outX.globalAlpha = 1;
        }

        // ── Controls ──────────────────────────────────────────────────────────
        const DIRS = {
            ArrowUp:    { x: 0,  y: -1 },
            ArrowDown:  { x: 0,  y:  1 },
            ArrowLeft:  { x: -1, y:  0 },
            ArrowRight: { x: 1,  y:  0 },
        };

        document.addEventListener('keydown', e => {
            const d = DIRS[e.key];
            if (!d) return;
            e.preventDefault();
            if (!alive) { resetSnake(); return; }
            if (d.x === -dir.x && d.y === -dir.y) return;
            nextDir = d;
            if (!gameStarted) { gameStarted = true; if (hintEl) hintEl.style.opacity = '0'; }
        });

        if (isTouch) {
            let tx0, ty0;
            canvas.addEventListener('touchstart', e => { tx0 = e.touches[0].clientX; ty0 = e.touches[0].clientY; }, { passive: true });
            canvas.addEventListener('touchend', e => {
                const dx = e.changedTouches[0].clientX - tx0;
                const dy = e.changedTouches[0].clientY - ty0;
                if (!alive) { resetSnake(); return; }
                if (Math.abs(dx) > Math.abs(dy)) {
                    const d = dx > 0 ? DIRS.ArrowRight : DIRS.ArrowLeft;
                    if (d.x !== -dir.x) { nextDir = d; gameStarted = true; }
                } else {
                    const d = dy > 0 ? DIRS.ArrowDown : DIRS.ArrowUp;
                    if (d.y !== -dir.y) { nextDir = d; gameStarted = true; }
                }
                if (hintEl) hintEl.style.opacity = '0';
            }, { passive: true });
        }

        // ── Loop ──────────────────────────────────────────────────────────────
        setup();
        resetSnake();
        window.addEventListener('resize', () => { setup(); if (!snake.length) resetSnake(); });

        let lastStep = 0;
        const SPEED  = 140;

        function loop(ts) {
            if (gameStarted && alive && ts - lastStep > SPEED) {
                stepSnake();
                lastStep = ts;
            }
            drawFrame();
            requestAnimationFrame(loop);
        }

        requestAnimationFrame(loop);
    }

})();
