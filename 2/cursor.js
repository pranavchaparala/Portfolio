window.addEventListener('load', () => { document.body.classList.add('loaded'); });

const basePathCursor = window.location.pathname.includes('/projects/') ? '../../' : './';

function initCursor() {
    if (!document.getElementById('cursor-svg')) {
        document.body.insertAdjacentHTML('beforeend', `
            <svg id="cursor-svg"><path id="thread-path" d="" /></svg>
            <div id="cursor-square-loader">
                <div class="loader-rect"></div>
            </div>
            <div id="cursor-hint"></div>
        `);
    }

    const cursorSq = document.getElementById('cursor-square-loader');
    const pathEl   = document.getElementById('thread-path');
    const hintEl   = document.getElementById('cursor-hint');

    // Determine base hint text from URL — doesn't depend on dynamic DOM
    const path    = window.location.pathname;
    const isPlay  = path.includes('/play/');
    const isHome  = !path.includes('/work/')  && !path.includes('/play/') &&
                    !path.includes('/about/') && !path.includes('/projects/') &&
                    !path.match(/\/[a-z]+-ev\/|\/clanx\/|\/lunaring\/|\/oneplus\/|\/unreasonable|\/doodle|\/echoes|\/viewbuds|\/gudz|\/permanence-of-decay|\/bezapp/);

    const baseHintText = isPlay ? 'drag to explore' : (isHome ? 'scroll to explore' : null);

    let mouse       = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let hintExpired = false; // true once the 5s explore hint auto-hides
    let isOverProject = false;

    // Define hideHint before any setTimeout that references it
    const hideExploreHint = () => {
        hintExpired = true;
        if (!isOverProject && hintEl) {
            hintEl.classList.remove('visible');
            hintEl.textContent = '';
        }
        window.removeEventListener('mousedown', hideExploreHint);
        window.removeEventListener('touchstart', hideExploreHint);
        window.removeEventListener('wheel',      hideExploreHint);
    };

    if (baseHintText && hintEl) {
        hintEl.textContent = baseHintText;
        hintEl.style.transform = `translate3d(${mouse.x + 12}px, ${mouse.y}px, 0) translateY(-50%)`;

        setTimeout(() => { if (!isOverProject) hintEl.classList.add('visible'); }, 800);
        setTimeout(() => { hideExploreHint(); }, 5800);

        window.addEventListener('mousedown', hideExploreHint);
        window.addEventListener('touchstart', hideExploreHint);
        window.addEventListener('wheel',      hideExploreHint);
    }

    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        if (hintEl) {
            hintEl.style.transform = `translate3d(${e.clientX + 12}px, ${e.clientY}px, 0) translateY(-50%)`;
        }

        // Optimization: Use event delegation instead of elementsFromPoint
        // This is handled by a separate listener for better performance
    });

    // Efficient hover detection
    const handleHover = (e) => {
        const target = e.target.closest('.project-img, .card, .grid-item');
        const overProject = !!target;

        if (overProject !== isOverProject) {
            isOverProject = overProject;
            if (hintEl) {
                if (overProject) {
                    hintEl.textContent = 'open project';
                    hintEl.classList.add('visible');
                } else {
                    if (!hintExpired && baseHintText) {
                        hintEl.textContent = baseHintText;
                        hintEl.classList.add('visible');
                    } else {
                        hintEl.classList.remove('visible');
                        hintEl.textContent = '';
                    }
                }
            }
        }
    };

    window.addEventListener('mouseover', handleHover);

    let points = Array.from({ length: 12 }, () => ({ x: mouse.x, y: mouse.y }));

    function updateCursor() {
        points[0].x = mouse.x;
        points[0].y = mouse.y;
        for (let i = 1; i < 12; i++) {
            points[i].x += (points[i - 1].x - points[i].x) * 0.35;
            points[i].y += (points[i - 1].y - points[i].y) * 0.35;
        }

        cursorSq.style.transform = `translate3d(${points[0].x - 6}px, ${points[0].y - 6}px, 0)`;

        let d = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < 12; i++) d += ` L ${points[i].x} ${points[i].y}`;
        pathEl.setAttribute('d', d);

        requestAnimationFrame(updateCursor);
    }

    updateCursor();
}

document.addEventListener('DOMContentLoaded', initCursor);