# Brand Assets

Drop replacements here. File names must match exactly — all HTML files reference these paths.

---

## Required Files

### `favicon.png`
- **Size:** 32×32px (minimum), 64×64px (recommended for retina)
- **Format:** PNG with transparency
- **Animated:** No — browsers ignore animated PNGs as favicons
- **Notes:** Keep it simple; fine detail is lost at 16–32px. A single glyph or monogram works best.

---

### `apple-touch-icon.png`
- **Size:** 180×180px
- **Format:** PNG, no transparency (iOS fills transparent areas with black)
- **Animated:** No
- **Notes:** Shown when someone saves your site to their iOS home screen. Add `<link rel="apple-touch-icon" href="assets/brand/apple-touch-icon.png">` to all HTML `<head>` blocks to activate it.

---

### `og-image.png`
- **Size:** 1200×630px
- **Format:** PNG or JPG
- **Animated:** No — social platforms (Twitter/X, LinkedIn, iMessage) only render static images
- **Notes:** Shown as the preview card when your URL is shared. Add these tags to all HTML `<head>` blocks:
  ```html
  <meta property="og:image" content="https://yourdomain.com/assets/brand/og-image.png">
  <meta name="twitter:image" content="https://yourdomain.com/assets/brand/og-image.png">
  ```
  Include your name and a one-line description in the image itself — the card title/description text often gets clipped.

---

## Optional Files

### `favicon.svg`
- **Size:** Vector (no fixed size)
- **Format:** SVG
- **Animated:** Yes — SVG favicons support CSS animations in Firefox and Chrome; Safari ignores animation
- **Notes:** Modern browsers prefer SVG over PNG when both are declared. Add alongside the PNG:
  ```html
  <link rel="icon" type="image/svg+xml" href="assets/brand/favicon.svg">
  <link rel="icon" type="image/png" href="assets/brand/favicon.png">
  ```

### `favicon.ico`
- **Size:** Multi-resolution bundle: 16×16, 32×32, 48×48
- **Format:** ICO
- **Animated:** No
- **Notes:** Only needed for legacy IE support or if some RSS readers show broken icons. Skip unless you hit a specific bug.

---

## Current Files

| File | Status |
|------|--------|
| `favicon.png` | ✓ Present & wired |
| `apple-touch-icon.png` | ✓ Present & wired |
| `og-image.png` | ✓ Present & wired |
| `favicon.svg` | ✓ Present & wired |
| `favicon.ico` | Optional |
