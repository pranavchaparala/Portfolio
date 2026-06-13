// projects.js — self-contained, all paths relative to New Portfolio/
const projectsData = [
    {
        "id": "clanx",
        "title": "ClanX",
        "year": "2024",
        "galleryLayout": "3",
        "galleryImages": [
            { "src": "covers/clanx.png", "ratio": "ratio-cube" },
            { "src": "covers/clanx2.png", "ratio": "ratio-cube" },
            { "src": "covers/clanx3.png", "ratio": "ratio-cube" }
        ],
        "link": "projects/clanx/index.html",
        "externalLink": "https://clanx.ai/",
        "tags": ["Product Design"]
    },
    {
        "id": "permanence-of-decay",
        "title": "Permanence of Decay",
        "year": "2026",
        "galleryLayout": "2",
        "galleryImages": [
            { "src": "projects/permanence-of-decay/assets/IMG_0653-edited.jpg", "ratio": "ratio-cube" },
            { "src": "projects/permanence-of-decay/assets/IMG_0652-edited-scaled.jpg", "ratio": "ratio-cube" }
        ],
        "link": "projects/permanence-of-decay/index.html",
        "externalLink": "https://parsons.edu/dt-2026/permanence-of-decay/",
        "tags": ["Creative Tech"]
    },
    {
        "id": "lectrix-ev",
        "title": "Lectrix EV",
        "year": "2024",
        "galleryLayout": "3",
        "galleryImages": [
            { "src": "covers/lectrix1.png", "ratio": "ratio-cube" },
            { "src": "covers/lectrix2.png", "ratio": "ratio-cube" },
            { "src": "covers/lectrix3.png", "ratio": "ratio-cube" }
        ],
        "link": "projects/lectrix-ev/index.html",
        "externalLink": "https://apps.apple.com/in/app/lectrix/id1637083917",
        "tags": ["Product Design"]
    },
    {
        "id": "lunaring",
        "title": "Luna Ring",
        "year": "2023",
        "galleryLayout": "2",
        "galleryImages": [
            { "src": "covers/lunaring.png", "ratio": "ratio-cube" },
            { "src": "projects/lunaring/assets/10.png", "ratio": "ratio-cube" }
        ],
        "link": "projects/lunaring/index.html",
        "externalLink": "https://www.lunazone.com/products/luna-smart-ring-gen-2",
        "tags": ["Product Design"]
    },
    {
        "id": "echoes-of-presence",
        "title": "Echoes of Presence",
        "year": "2023",
        "galleryLayout": "2",
        "galleryImages": [
            { "src": "covers/echoesofpresence.png", "ratio": "ratio-cube" },
            { "src": "projects/echoes-of-presence/assets/5.jpeg", "ratio": "ratio-cube" }
        ],
        "link": "projects/echoes-of-presence/index.html",
        // "externalLink": "",
        "tags": ["Creative Tech"]
    },
    {
        "id": "unreasonablecube",
        "title": "Unreasonable Cube",
        "year": "2026",
        "galleryLayout": "1",
        "galleryImages": [
            { "src": "projects/unreasonablecube/unreasonablecube_Claude.png", "ratio": "ratio-cube" }
        ],
        "link": "projects/unreasonablecube/index.html",
        "externalLink": "https://devpost.com/software/team-18-unreasonable-cube/joins/i0cOIBWhoy-2Ny883ERCuA",
        "tags": ["Creative Tech"]
    },
    {
        "id": "oneplus",
        "title": "OnePlus OxygenOS 12",
        "year": "2021",
        "galleryLayout": "1",
        "galleryImages": [
            { "src": "covers/oneplus.png", "ratio": "ratio-cube" }
        ],
        "link": "projects/oneplus/index.html",
        "externalLink": "https://www.oneplus.com/us/oxygenos12",
        "tags": ["Product Design"]
    },
    {
        "id": "viewbuds",
        "title": "Viewbuds",
        "year": "2025",
        "galleryLayout": "1",
        "galleryImages": [
            { "src": "covers/viewbuds.png", "ratio": "ratio-cube" }
        ],
        "link": "projects/viewbuds/index.html",
        "externalLink": "https://www.gonoise.com/products/noise-view-buds-truly-wireless-earbuds",
        "tags": ["Product Design"]
    },
    {
        "id": "bezapp",
        "title": "Bezapp",
        "year": "",
        "galleryLayout": "1",
        "galleryImages": [
            { "src": "covers/bezapp.png", "ratio": "ratio-cube" }
        ],
        "link": "https://www.behance.net/gallery/116765115/Events-Management-App-UIUX-Design",
        //"externalLink": "",
        "tags": ["Product Design"]
    },
    {
        "id": "doodleforest",
        "title": "Doodle Forest",
        "year": "2025",
        "galleryLayout": "1",
        "galleryImages": [
            { "src": "covers/doodleforest.png", "ratio": "ratio-cube" }
        ],
        "link": "projects/doodleforest/index.html",
        //"externalLink": "",
        "tags": ["Creative Tech"]
    },
    {
        "id": "gudz",
        "title": "Gudz",
        "year": "",
        "galleryLayout": "1",
        "galleryImages": [
            { "src": "covers/gudz.png", "ratio": "ratio-cube" }
        ],
        "link": "https://www.behance.net/gallery/186363817/Logistics-CMS-Delivery-App",
        //"externalLink": "",
        "tags": ["Product Design"]
    }
];

const experimentsData = [
    { id: 1, filename: "playground1.png", videoFilename: "playground1.mov", title: "GENUARY WITHOUT A FONT", description: "Generative Cityscape in P5JS" },
    { id: 2, filename: "playground2.png", videoFilename: "playground2.mp4", title: "BOOLEAN ALGEBRA", description: "Algorithmic Geometry Study" },
    { id: 3, filename: "playground3.png", videoFilename: "playground3.mp4", title: "ASCII VIDEO ENCODING", description: "Python Video Encoding" },
    { id: 4, filename: "playground4.png", videoFilename: "playground4.mp4", title: "FIBONACCI SEQUENCE", description: "Audio Reactive Golden Spiral in P5JS" },
    { id: 5, filename: "playground5.png", videoFilename: "playground5.mp4", title: "METROPOLIS", description: "Generative Cityscape in P5JS" },
    { id: 6, filename: "playground6.png", videoFilename: "playground6.mp4", title: "LOWRES", description: "Audio Reactive Low Resolution in P5JS" },
    { id: 7, filename: "playground7.png", videoFilename: "playground7.png", title: "NOTHING POINT", description: "Fluid Simulation Concept" },
    { id: 8, filename: "playground8.png", videoFilename: "playground8.mp4", title: "FLUX", description: "Noise Field Visualization" },
    { id: 9, filename: "playground9.png", videoFilename: "playground9.mp4", title: "ECHO", description: "Recursive Pattern Echo" },
    { id: 10, filename: "playground10.png", videoFilename: "playground10.mp4", title: "Mamun Investment Onboarding", description: "Motion Design and Animation" },
    { id: 11, filename: "playground11.png", videoFilename: "playground11.gif", title: "SĀR Rise Collection", description: "Furniture Design - Seating" },
    { id: 12, filename: "playground12.png", videoFilename: "playground12.gif", title: "Inkā Logo", description: "Brand Design for Fitness Diagnosis Platform" },
    { id: 13, filename: "playground13.png", videoFilename: "playground13.gif", title: "Cheriyal Collection", description: "Product Design for Cheriyal Handicrafts" },
    { id: 14, filename: "playground14.png", videoFilename: "playground14.gif", title: "Vaccine", description: "Illustration for Covid-19 Awareness" },
    { id: 15, filename: "playground15.png", videoFilename: "playground15.gif", title: "Straight Outta Olympus", description: "Brand and Graphic Design for College Fest" },
    { id: 16, filename: "playground16.png", videoFilename: "playground16.gif", title: "Clear Cocktail", description: "Packaging Design for a Beverage Brand" },
    { id: 17, filename: "playground17.png", videoFilename: "playground17.gif", title: "Logo Exploration", description: "Logo's for covid variants in various design styles" },
    { id: 18, filename: "playground18.png", videoFilename: "playground18.gif", title: "Bling Smart Accessories", description: "Product Design for Smart Wearable Concept" },
    { id: 19, filename: "playground19.png", videoFilename: "playground19.gif", title: "Piece Together", description: "Mixed Reality Puzzle Game for Apple Vision Pro" }
];
