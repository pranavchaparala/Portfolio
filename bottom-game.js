/**
 * bottom-game.js — keep scrolling past the bottom and the site footer
 * itself grows, its normal content fading out as a monochrome Tetris
 * (built from the exact same pill-tile module as pixel-mosaic.js — same
 * ASP/GAP proportions and the same width-driven column formula) fades in
 * to take its place. Desktop only, matching pixel-mosaic.js's own
 * touch/mouse split. Fully removable: delete the include block from a
 * page, or flip ENABLED below.
 */
(function () {
    'use strict';

    const ENABLED = true;
    if (!ENABLED) return;

    // Desktop only — same split pixel-mosaic.js uses for its own cursor/lens interaction.
    const isMobile = window.innerWidth <= 768 || ('ontouchstart' in window && window.innerWidth <= 1024);
    if (isMobile) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const footer = document.querySelector('footer.site-footer');
    if (!footer) return;

    // Same pill proportions as pixel-mosaic.js's tiles.
    const ASP = 3, GAP = 2;

    const PULL_MAX = 950;    // cumulative wheel "pull" needed to trigger, once at the bottom —
                              // deliberately high so it takes a few real seconds of sustained
                              // scrolling, not one brisk flick.
    const PULL_DECAY = 0.92;

    let pull = 0;
    let gameOpen = false;
    let naturalHeight = null;

    function expandedHeight() {
        return Math.min(520, window.innerHeight * 0.6);
    }

    footer.classList.add('btmg-footer');

    const mount = document.createElement('div');
    mount.id = 'btmg-mount';
    mount.innerHTML =
        '<div class="btmg-bar">' +
        '<span class="btmg-title">Pixel Stack</span>' +
        '<span class="btmg-score">Score: <span id="btmg-score-val">0</span></span>' +
        '<button type="button" id="btmg-close-btn">Close ✕</button>' +
        '</div>' +
        '<canvas id="btmg-canvas"></canvas>' +
        '<div class="btmg-hint">← → move · ↑ rotate · ↓ soft drop · space hard drop</div>' +
        '<div class="btmg-gameover hidden" id="btmg-gameover"><span>Game Over</span><button type="button" id="btmg-restart-btn">Restart</button></div>';
    footer.appendChild(mount);

    const canvas = mount.querySelector('#btmg-canvas');
    const ctx = canvas.getContext('2d');
    const scoreEl = mount.querySelector('#btmg-score-val');
    const gameoverEl = mount.querySelector('#btmg-gameover');

    mount.querySelector('#btmg-close-btn').addEventListener('click', closeGame);
    mount.querySelector('#btmg-restart-btn').addEventListener('click', () => {
        gameoverEl.classList.add('hidden');
        startGame();
    });

    function footerOwnChildren() {
        return Array.from(footer.children).filter(el => el !== mount);
    }

    function applyPullVisuals(p) {
        if (naturalHeight === null) naturalHeight = footer.getBoundingClientRect().height;
        footer.style.height = (naturalHeight + p * (expandedHeight() - naturalHeight)) + 'px';
        footer.style.overflow = 'hidden';
        const contentOpacity = Math.max(0, 1 - p * 1.4);
        footerOwnChildren().forEach(el => { el.style.opacity = contentOpacity; });
        mount.style.opacity = Math.min(1, p * 1.3);
        mount.style.pointerEvents = p > 0.95 ? 'auto' : 'none';
    }

    function resetVisuals() {
        footer.style.height = '';
        footer.style.overflow = '';
        footerOwnChildren().forEach(el => { el.style.opacity = ''; });
        mount.style.opacity = '0';
        mount.style.pointerEvents = 'none';
    }
    resetVisuals();

    function isAtBottom() {
        const el = document.scrollingElement;
        return (el.scrollTop + window.innerHeight) >= (el.scrollHeight - 4);
    }

    // Once a pull is underway, growing the footer itself increases
    // scrollHeight, and the friction-scroll system (enhancements.js) takes a
    // few frames to catch scrollTop up to the new bottom. Re-checking
    // isAtBottom() on every single wheel tick during that lag would flicker
    // false and decay the very pull that caused it — so once started, stay
    // "pulling" until the user actually scrolls back up.
    let pulling = false;

    window.addEventListener('wheel', e => {
        if (gameOpen) return;
        if (e.deltaY > 0 && (pulling || isAtBottom())) {
            pulling = true;
            pull = Math.min(PULL_MAX, pull + e.deltaY * 0.6);
            applyPullVisuals(pull / PULL_MAX);
            if (pull >= PULL_MAX) openGame();
        } else if (pull > 0) {
            pulling = false;
            pull *= PULL_DECAY;
            if (pull < 1) pull = 0;
            applyPullVisuals(pull / PULL_MAX);
        }
    }, { passive: true });

    function onResize() {
        if (gameOpen) { resizeBoard(); render(); }
    }

    function openGame() {
        gameOpen = true;
        pulling = false;
        pull = 0;
        applyPullVisuals(1);
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', onKeydown);
        window.addEventListener('resize', onResize);
        startGame();
    }

    function closeGame() {
        gameOpen = false;
        stopGame();
        document.body.style.overflow = '';
        document.removeEventListener('keydown', onKeydown);
        window.removeEventListener('resize', onResize);
        applyPullVisuals(0);
        setTimeout(() => { if (!gameOpen) resetVisuals(); }, 350);
    }

    function onKeydown(e) {
        if (e.key === 'Escape') { closeGame(); return; }
        if (!game || game.over) return;
        if (e.key === 'ArrowLeft') { move(-1); e.preventDefault(); }
        else if (e.key === 'ArrowRight') { move(1); e.preventDefault(); }
        else if (e.key === 'ArrowDown') { tick(); e.preventDefault(); }
        else if (e.key === 'ArrowUp') { rotate(); e.preventDefault(); }
        else if (e.key === ' ') { hardDrop(); e.preventDefault(); }
    }

    // ── Board sizing: identical tile algorithm to pixel-mosaic.js ─────────
    // cols derived from container width (same /10 divisor pixel-mosaic.js
    // uses on desktop), tileH = tileW * ASP — same tall-pill module as the
    // hero, just stacked into a playable grid instead of a video mosaic.
    let COLS = 20, ROWS = 12, TILE_W = 10, TILE_H = 30;

    function resizeBoard() {
        const cw = mount.clientWidth || footer.clientWidth;
        COLS = Math.max(15, Math.round(cw / 10));
        TILE_W = Math.max(2, Math.floor(cw / COLS));
        TILE_H = Math.round(TILE_W * ASP);
        const usableH = Math.max(TILE_H * 4, mount.clientHeight - 64);
        ROWS = Math.max(4, Math.floor(usableH / TILE_H));
        canvas.width = COLS * TILE_W;
        canvas.height = ROWS * TILE_H;
    }

    const SHAPES = {
        I: [[1, 1, 1, 1]],
        O: [[1, 1], [1, 1]],
        T: [[0, 1, 0], [1, 1, 1]],
        S: [[0, 1, 1], [1, 1, 0]],
        Z: [[1, 1, 0], [0, 1, 1]],
        J: [[0, 0, 1], [1, 1, 1]],
        L: [[1, 0, 0], [1, 1, 1]]
    };
    const SHAPE_KEYS = Object.keys(SHAPES);

    function rotateMatrix(m) {
        const rows = m.length, cols = m[0].length;
        const res = [];
        for (let c = 0; c < cols; c++) {
            const row = [];
            for (let r = rows - 1; r >= 0; r--) row.push(m[r][c]);
            res.push(row);
        }
        return res;
    }

    function newPiece() {
        const key = SHAPE_KEYS[Math.floor(Math.random() * SHAPE_KEYS.length)];
        const shape = SHAPES[key].map(row => row.slice());
        return { shape, x: Math.floor((COLS - shape[0].length) / 2), y: 0 };
    }

    function makeBoard() {
        return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    }

    let game = null;
    let dropTimer = null;
    let dropInterval = 500;
    let FILL_SETTLED = 'rgb(31, 33, 36)', FILL_ACTIVE = 'rgba(31, 33, 36, 0.55)', FILL_EMPTY = 'rgba(31, 33, 36, 0.06)';

    // Canvas fillStyle doesn't resolve CSS custom properties (no cascade
    // context outside the DOM), so resolve --text-primary to a literal
    // rgb() once via a probe element, then derive the lighter/active
    // shades from it — keeps the board theme-aware without hardcoding hex.
    function resolveThemeColors() {
        const probe = document.createElement('div');
        probe.style.color = 'var(--text-primary)';
        probe.style.display = 'none';
        document.body.appendChild(probe);
        const rgb = getComputedStyle(probe).color;
        probe.remove();
        const m = rgb.match(/\d+/g);
        if (!m) return;
        const [r, g, b] = m;
        FILL_SETTLED = `rgb(${r}, ${g}, ${b})`;
        FILL_ACTIVE = `rgba(${r}, ${g}, ${b}, 0.55)`;
        FILL_EMPTY = `rgba(${r}, ${g}, ${b}, 0.06)`;
    }

    function startGame() {
        game = { board: null, piece: null, score: 0, over: false };
        dropInterval = 500;
        scoreEl.textContent = '0';
        resolveThemeColors();
        resizeBoard();
        game.board = makeBoard();
        game.piece = newPiece();
        clearInterval(dropTimer);
        dropTimer = setInterval(tick, dropInterval);
        render();
    }

    function stopGame() {
        clearInterval(dropTimer);
        dropTimer = null;
    }

    function collides(shape, x, y) {
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (!shape[r][c]) continue;
                const bx = x + c, by = y + r;
                if (bx < 0 || bx >= COLS || by >= ROWS) return true;
                if (by >= 0 && game.board[by][bx]) return true;
            }
        }
        return false;
    }

    function merge() {
        const { shape, x, y } = game.piece;
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c] && y + r >= 0) game.board[y + r][x + c] = 1;
            }
        }
    }

    function clearLines() {
        let cleared = 0;
        for (let r = ROWS - 1; r >= 0; r--) {
            if (game.board[r].every(v => v)) {
                game.board.splice(r, 1);
                game.board.unshift(Array(COLS).fill(0));
                cleared++;
                r++;
            }
        }
        if (cleared) {
            game.score += [0, 40, 100, 300, 1200][cleared] || cleared * 400;
            scoreEl.textContent = game.score;
            dropInterval = Math.max(120, dropInterval - cleared * 8);
            clearInterval(dropTimer);
            dropTimer = setInterval(tick, dropInterval);
        }
    }

    function tick() {
        if (!game || game.over) return;
        const { shape, x, y } = game.piece;
        if (!collides(shape, x, y + 1)) {
            game.piece.y++;
        } else {
            merge();
            clearLines();
            game.piece = newPiece();
            if (collides(game.piece.shape, game.piece.x, game.piece.y)) {
                game.over = true;
                stopGame();
                gameoverEl.classList.remove('hidden');
            }
        }
        render();
    }

    function move(dx) {
        const { shape, x, y } = game.piece;
        if (!collides(shape, x + dx, y)) {
            game.piece.x += dx;
            render();
        }
    }

    function hardDrop() {
        while (!collides(game.piece.shape, game.piece.x, game.piece.y + 1)) game.piece.y++;
        tick();
    }

    function rotate() {
        const rotated = rotateMatrix(game.piece.shape);
        let nx = game.piece.x;
        if (nx + rotated[0].length > COLS) nx = COLS - rotated[0].length;
        if (nx < 0) nx = 0;
        if (!collides(rotated, nx, game.piece.y)) {
            game.piece.shape = rotated;
            game.piece.x = nx;
            render();
        }
    }

    // Identical pill geometry to pixel-mosaic.js's drawPill.
    function drawPill(x, y, w, h) {
        const r = w / 2;
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

    function drawCell(cx, cy, state) {
        const innerW = TILE_W - GAP * 2, innerH = TILE_H - GAP * 2;
        const x = cx * TILE_W + GAP, y = cy * TILE_H + GAP;
        ctx.fillStyle = state === 2 ? FILL_ACTIVE : state === 1 ? FILL_SETTLED : FILL_EMPTY;
        drawPill(x, y, Math.max(1, innerW), Math.max(1, innerH));
    }

    function render() {
        if (!game) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) drawCell(c, r, game.board[r][c]);
        }
        const { shape, x, y } = game.piece;
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c]) drawCell(x + c, y + r, 2);
            }
        }
    }

})();
