/**
 * theme.js — Light / dark mode toggle with localStorage persistence.
 * Loaded synchronously in <head> so data-theme is set before first paint.
 */
(function () {
    const STORAGE_KEY = 'theme';
    const root = document.documentElement;

    function getPreferredTheme() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved === 'light' || saved === 'dark') return saved;
        return 'light';
    }

    function applyTheme(theme) {
        root.setAttribute('data-theme', theme);
        localStorage.setItem(STORAGE_KEY, theme);
        syncToggleButtons(theme);
    }

    function syncToggleButtons(theme) {
        document.querySelectorAll('.theme-btn').forEach((btn) => {
            const btnTheme = btn.getAttribute('data-theme');
            btn.classList.toggle('active', btnTheme === theme);
            btn.setAttribute('aria-pressed', btnTheme === theme ? 'true' : 'false');
        });
    }

    // Set data-theme immediately to prevent flash
    const initialTheme = getPreferredTheme();
    root.setAttribute('data-theme', initialTheme);

    // Everything else runs after DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
        syncToggleButtons(initialTheme);

        document.querySelectorAll('.theme-btn').forEach((btn) => {
            btn.addEventListener('click', () => {
                const theme = btn.getAttribute('data-theme');
                if (theme === 'light' || theme === 'dark') {
                    applyTheme(theme);
                }
            });
        });
    });
})();