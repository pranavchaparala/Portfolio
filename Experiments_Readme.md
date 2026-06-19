# Adding a New Experiment

## What you need

For each experiment you need **two files**:

| File | Purpose | Format |
|------|---------|--------|
| `playgroundN.png` | Thumbnail shown in the grid | PNG, square-ish, ≤ 500 KB |
| `playgroundN.mp4` | Video/GIF shown in the modal | MP4 preferred; `.gif`, `.mov`, `.webm` also work |

> If there is no video (static image only), set both `filename` and `videoFilename` to the same `.png`.
> Example: `{ filename: "playground7.png", videoFilename: "playground7.png", … }`

---

## Step-by-step

### 1. Pick the next ID number
Open [projects.js](projects.js) and scroll to the bottom of `experimentsData`.  
The last entry currently has `id: 19`. Your new one will be `id: 20`.

### 2. Prepare your files
Name them exactly:
```
playground20.png
playground20.mp4
```
Replace `20` with your actual ID number.

**Thumbnail tips**
- Crop to roughly 1:1 or 4:3 — the grid clips to a card shape automatically.
- Export at 1× (not 2×) to keep file size small.
- ≤ 500 KB is the target.

**Video tips**
- **Target: under 5 MB.** Vercel deploys from git — large binary files inflate the repo permanently and can hit deployment size limits.
- H.264 MP4 plays everywhere with no transcoding needed.
- Loop-friendly: trim to 3–8 seconds, no audio required (it autoplays muted).
- If using a GIF, convert it to MP4 first (GIFs are much larger for the same content).

**Compress before uploading — run this in Terminal:**
```bash
ffmpeg -i INPUT.mp4 -vcodec libx264 -crf 28 -preset slow -movflags +faststart -an OUTPUT.mp4
```
If still over 5 MB, also scale down the resolution:
```bash
ffmpeg -i INPUT.mp4 -vf scale=1280:-2 -vcodec libx264 -crf 28 -preset slow -movflags +faststart -an OUTPUT.mp4
```
(`-crf 28` controls quality: lower = better quality/larger file, higher = more compression. 28 is the right balance for looping previews. `-an` strips audio since these autoplay muted.)

### 3. Upload the files
Drop both files into:
```
assets/experiments/
```
You should see the existing `playground1.png`, `playground1.mp4`, etc. there.

### 4. Add the entry to `experimentsData`
Open [projects.js](projects.js) and add a new line inside the `experimentsData` array (before the closing `];`):

```js
{ id: 20, filename: "playground20.png", videoFilename: "playground20.mp4", title: "YOUR TITLE", description: "One-line description" },
```

Field reference:

| Field | Required | Notes |
|-------|----------|-------|
| `order` | yes | Controls grid position. Lower number = appears first. Just change this number to reprioritize — no need to move lines around. |
| `id` | yes | Unique integer used for analytics. Never reuse an old one. |
| `filename` | yes | Thumbnail PNG path (relative to `assets/experiments/`) |
| `videoFilename` | yes | Video/GIF/PNG path; can equal `filename` if static |
| `title` | yes | Shown in the grid card and modal header. Uppercase looks good. |
| `description` | yes | Short subtitle shown below the title in the modal |
| `category` | no | Shown in modal as "Category" (e.g. `"Creative Coding"`, `"AI / Product"`) |
| `tools` | no | Shown in modal as "Tools" (e.g. `"Javascript"`, `"HTML, Python"`) |

### 5. Update the count in the nav
Open [index.html](index.html) and find:
```html
<a href="experiments.html" class="nav-btn">Experiments <span class="count">19</span></a>
```
Change `19` → `20` (or whatever the new total is).

Do the same in [experiments.html](experiments.html) if it has a matching count badge.

### 6. Check it works
Open the site locally (`index.html` in a browser or your local server).  
- The new card should appear in the Experiments grid on the home page and on the Experiments page.  
- Clicking it should open the modal and play/show your media.

---

## Quick checklist

- [ ] `playground20.png` in `assets/experiments/`
- [ ] `playground20.mp4` (or `.gif`/`.png`) in `assets/experiments/`
- [ ] Entry added to `experimentsData` in `projects.js`
- [ ] `id` is unique and sequential
- [ ] Nav count updated in `index.html` (and `experiments.html` if applicable)
- [ ] Verified in browser — card shows and modal opens

---

## File naming convention
Always follow `playgroundN` where `N` is the integer ID. Do **not** skip numbers or reuse old IDs — the grid renders in array order and the IDs are used for analytics tracking.
