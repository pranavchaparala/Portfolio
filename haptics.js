/**
 * haptics.js — Global WebKit Switch Haptic Feedback Router
 *
 * Injects a hidden <label>/<input type="checkbox" switch> into the DOM.
 * Uses event delegation on document.body to fire haptic feedback on
 * any click that hits a qualifying interactive element — including
 * elements created dynamically after page load.
 */
(function () {
    // Inject hidden haptic trigger if not already present
    if (!document.getElementById('global-haptic-trigger')) {
        const label = document.createElement('label');
        label.id = 'global-haptic-trigger';
        label.setAttribute('for', 'global-haptic-switch');
        label.className = 'haptic-container-hidden';

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.setAttribute('switch', '');
        input.id = 'global-haptic-switch';
        input.className = 'haptic-input-hidden';

        label.appendChild(input);
        document.body.prepend(label);
    }

    const trigger = document.getElementById('global-haptic-trigger');

    // Selectors that qualify for haptic feedback
    const HAPTIC_SELECTORS = [
        '.nav-btn',
        '.logo-block',
        '.project-card-container',
        '.experiment-item',
        '#modal-close-btn-desktop',
        '#modal-close-btn-mobile',
        '#modal-action-btn',
        '[data-haptic]',
        '.home-bento-card',
        '.home-experiment-thumb'
    ];

    const selectorString = HAPTIC_SELECTORS.join(', ');

    document.addEventListener('click', function (e) {
        if (!trigger) return;
        const match = e.target.closest(selectorString);
        if (match) {
            trigger.click();
        }
    }, true); // capture phase so it fires before navigation
})();
