/**
 * home-hero.js — Generative canvas animation for the home page hero.
 * Creates a dynamic landscape of vertical bars with organic wave patterns.
 * Visual inspiration: abstract topographic / sound-wave landscape.
 */

(function () {
    'use strict';

    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let W, H;
    let bars = [];
    let time = 0;
    let animFrame;
    let isDark = document.documentElement.getAttribute('data-theme') === 'dark' ||
        document.body.classList.contains('dark-mode');

    const DARK_BAR_COLORS = [
        '#1C1C1E', '#2C2C2E', '#3A3A3C', '#48484A', '#636366'
    ];

    const LIGHT_BAR_COLORS = [
        '#E8E8ED', '#D1D1D6', '#AEAEB2', '#8E8E93', '#636366'
    ];

    const BAR_ACCENT_LIGHT = ['#007AFF', '#34C759', '#FF9500', '#FF2D55', '#5856D6', '#AF52DE', '#FF6482', '#00C7BE'];
    const BAR_ACCENT_DARK = ['#0A84FF', '#30D158', '#FF9F0A', '#FF375F', '#5E5CE6', '#BF5AF2', '#FF6482', '#64D2FF'];

    function resize() {
        const rect = canvas.parentElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        W = rect.width;
        H = rect.height;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        ctx.scale(dpr, dpr);
        initBars();
    }

    function initBars() {
        const barWidth = 3;
        const gap = 1;
        const totalStep = barWidth + gap;
        const count = Math.floor(W / totalStep) + 2;
        bars = [];
        for (let i = 0; i < count; i++) {
            const x = i * totalStep;
            const phaseOffset = (i / count) * Math.PI * 4;
            const speedVariation = 0.3 + Math.random() * 0.4;
            bars.push({
                x,
                width: barWidth,
                phaseOffset,
                speedVariation,
                baseHeight: 0.3 + Math.random() * 0.5,
                accent: Math.random() > 0.85,
                accentColor: isDark
                    ? BAR_ACCENT_DARK[Math.floor(Math.random() * BAR_ACCENT_DARK.length)]
                    : BAR_ACCENT_LIGHT[Math.floor(Math.random() * BAR_ACCENT_LIGHT.length)],
                barColor: isDark
                    ? DARK_BAR_COLORS[Math.floor(Math.random() * DARK_BAR_COLORS.length)]
                    : LIGHT_BAR_COLORS[Math.floor(Math.random() * LIGHT_BAR_COLORS.length)],
                heightOffset: 0.1 + Math.random() * 0.3
            });
        }
    }

    function draw() {
        ctx.clearRect(0, 0, W, H);

        // Background gradient
        const grad = ctx.createLinearGradient(0, 0, W, 0);
        if (isDark) {
            grad.addColorStop(0, 'rgba(28, 28, 30, 0.3)');
            grad.addColorStop(0.5, 'rgba(44, 44, 46, 0.2)');
            grad.addColorStop(1, 'rgba(28, 28, 30, 0.3)');
        } else {
            grad.addColorStop(0, 'rgba(245, 245, 247, 0.5)');
            grad.addColorStop(0.5, 'rgba(232, 232, 237, 0.3)');
            grad.addColorStop(1, 'rgba(245, 245, 247, 0.5)');
        }
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        time += 0.008;

        bars.forEach(bar => {
            const wave1 = Math.sin(time * bar.speedVariation + bar.phaseOffset) * 0.4;
            const wave2 = Math.sin(time * bar.speedVariation * 0.5 + bar.phaseOffset * 1.5) * 0.25;
            const wave3 = Math.sin(time * bar.speedVariation * 0.3 + bar.phaseOffset * 2.5) * 0.15;

            // Normalized value 0-1
            const raw = (wave1 + wave2 + wave3) * 0.5 + 0.5;
            const normalized = Math.max(0.05, Math.min(0.95, raw));

            const maxHeight = H * 0.85;
            const minHeight = H * 0.08;
            const barHeight = minHeight + normalized * maxHeight;
            const y = H - barHeight;

            // Draw bar
            if (bar.accent) {
                ctx.fillStyle = bar.accentColor;
                ctx.globalAlpha = 0.6 + normalized * 0.4;
                ctx.fillRect(bar.x, y, bar.width, barHeight);
                ctx.globalAlpha = 1;
            } else {
                const alpha = 0.3 + normalized * 0.7;
                ctx.globalAlpha = alpha;
                ctx.fillStyle = bar.barColor;
                ctx.fillRect(bar.x, y, bar.width, barHeight);
                ctx.globalAlpha = 1;
            }
        });

        // Subtle fade at bottom
        const fadeGrad = ctx.createLinearGradient(0, H * 0.92, 0, H);
        fadeGrad.addColorStop(0, 'rgba(28, 28, 30, 0)');
        fadeGrad.addColorStop(1, isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(245, 245, 247, 0.4)');
        ctx.fillStyle = fadeGrad;
        ctx.fillRect(0, H * 0.92, W, H * 0.08);

        animFrame = requestAnimationFrame(draw);
    }

    function start() {
        resize();
        draw();
        window.addEventListener('resize', resize);

        // Listen for theme changes
        const observer = new MutationObserver(() => {
            const newDark = document.documentElement.getAttribute('data-theme') === 'dark';
            if (newDark !== isDark) {
                isDark = newDark;
                initBars();
            }
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    }

    function stop() {
        if (animFrame) cancelAnimationFrame(animFrame);
        window.removeEventListener('resize', resize);
    }

    // Auto-start when ready
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        start();
    } else {
        document.addEventListener('DOMContentLoaded', start);
    }

    // Cleanup on page leave
    window.addEventListener('beforeunload', stop);
})();