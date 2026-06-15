// projects.js — self-contained, all paths relative to New Portfolio/
const projectsData = [
    {
        "id": "clanx",
        "title": "ClanX",
        "year": "2024",
        "galleryLayout": "3",
        "galleryImages": [
            { "src": "projects/clanx/assets/1.png",  "ratio": "ratio-cube" },
            { "src": "projects/clanx/assets/2.png",  "ratio": "ratio-cube" },
            { "src": "projects/clanx/assets/3.png",  "ratio": "ratio-cube" }
        ],
        "link": "projects/clanx/index.html",
        "externalLink": "",
        "tags": ["Product Design"]
    },
    {
        "id": "permanence-of-decay",
        "title": "Permanence of Decay",
        "year": "2026",
        "galleryLayout": "2",
        "galleryImages": [
            { "src": "projects/permanence-of-decay/assets/IMG_0653-edited.jpg",         "ratio": "ratio-cube" },
            { "src": "projects/permanence-of-decay/assets/IMG_0652-edited-scaled.jpg",  "ratio": "ratio-cube" }
        ],
        "link": "projects/permanence-of-decay/index.html",
        "externalLink": "",
        "tags": ["Creative Tech"]
    },
    {
        "id": "lectrix-ev",
        "title": "Lectrix EV",
        "year": "2024",
        "galleryLayout": "3",
        "galleryImages": [
            { "src": "projects/lectrix-ev/assets/1.png", "ratio": "ratio-cube" },
            { "src": "projects/lectrix-ev/assets/2.png", "ratio": "ratio-cube" },
            { "src": "projects/lectrix-ev/assets/3.png", "ratio": "ratio-cube" }
        ],
        "link": "projects/lectrix-ev/index.html",
        "externalLink": "",
        "tags": ["Product Design"]
    },
    {
        "id": "lunaring",
        "title": "Luna Ring",
        "year": "2023",
        "galleryLayout": "2",
        "galleryImages": [
            { "src": "projects/lunaring/assets/2.png", "ratio": "ratio-cube" },
            { "src": "projects/lunaring/assets/4.png", "ratio": "ratio-cube" }
        ],
        "link": "projects/lunaring/index.html",
        "externalLink": "",
        "tags": ["Product Design"]
    },
    {
        "id": "echoes-of-presence",
        "title": "Echoes of Presence",
        "year": "2023",
        "galleryLayout": "2",
        "galleryImages": [
            { "src": "projects/echoes-of-presence/assets/1.jpeg", "ratio": "ratio-cube" },
            { "src": "projects/echoes-of-presence/assets/3.png",  "ratio": "ratio-cube" }
        ],
        "link": "projects/echoes-of-presence/index.html",
        "externalLink": "",
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
        "externalLink": "",
        "tags": ["Creative Tech"]
    },
    {
        "id": "oneplus",
        "title": "OnePlus OxygenOS 12",
        "year": "2021",
        "galleryLayout": "1",
        "galleryImages": [
            { "src": "projects/oneplus/oneplus.png", "ratio": "ratio-landscape" }
        ],
        "link": "projects/oneplus/index.html",
        "externalLink": "",
        "tags": ["Product Design"]
    },
    {
        "id": "viewbuds",
        "title": "Viewbuds",
        "year": "2025",
        "galleryLayout": "1",
        "galleryImages": [
            { "src": "covers/viewbuds.png", "ratio": "ratio-landscape" }
        ],
        "link": "projects/viewbuds/index.html",
        "externalLink": "",
        "tags": ["Product Design"]
    },
    {
        "id": "bezapp",
        "title": "Bezapp",
        "year": "",
        "galleryLayout": "1",
        "galleryImages": [
            { "src": "projects/bezapp/bezapp.png", "ratio": "ratio-landscape" }
        ],
        "link": "https://www.behance.net/gallery/116765115/Events-Management-App-UIUX-Design",
        "externalLink": "https://www.behance.net/gallery/116765115/Events-Management-App-UIUX-Design",
        "tags": ["Product Design"]
    },
    {
        "id": "doodleforest",
        "title": "Doodle Forest",
        "year": "2025",
        "galleryLayout": "1",
        "galleryImages": [
            { "src": "projects/doodleforest/doodleforest.png", "ratio": "ratio-landscape" }
        ],
        "link": "projects/doodleforest/index.html",
        "externalLink": "",
        "tags": ["Creative Tech"]
    },
    {
        "id": "gudz",
        "title": "Gudz",
        "year": "",
        "galleryLayout": "1",
        "galleryImages": [
            { "src": "projects/gudz/gudz.png", "ratio": "ratio-landscape" }
        ],
        "link": "https://www.behance.net/gallery/186363817/Logistics-CMS-Delivery-App",
        "externalLink": "https://www.behance.net/gallery/186363817/Logistics-CMS-Delivery-App",
        "tags": ["Product Design"]
    }
];

const experimentsData = [
    { id: 1,  filename: "playground1.png",  videoFilename: "playground1.mov",  title: "GENUARY WITHOUT A FONT",      description: "Generative Cityscape in P5JS" },
    { id: 2,  filename: "playground2.png",  videoFilename: "playground2.mp4",  title: "BOOLEAN ALGEBRA",            description: "Algorithmic Geometry Study" },
    { id: 3,  filename: "playground3.png",  videoFilename: "playground3.mp4",  title: "ASCII VIDEO ENCODING",       description: "Python Video Encoding" },
    { id: 4,  filename: "playground4.png",  videoFilename: "playground4.mp4",  title: "FIBONACCI SEQUENCE",         description: "Audio Reactive Golden Spiral in P5JS" },
    { id: 5,  filename: "playground5.png",  videoFilename: "playground5.mp4",  title: "METROPOLIS",                 description: "Generative Cityscape in P5JS" },
    { id: 6,  filename: "playground6.png",  videoFilename: "playground6.mp4",  title: "LOWRES",                     description: "Audio Reactive Low Resolution in P5JS" },
    { id: 7,  filename: "playground7.png",  videoFilename: "playground7.png",  title: "NOTHING POINT",              description: "Fluid Simulation Concept" },
    { id: 8,  filename: "playground8.png",  videoFilename: "playground8.mp4",  title: "FLUX",                       description: "Noise Field Visualization" },
    { id: 9,  filename: "playground9.png",  videoFilename: "playground9.mp4",  title: "ECHO",                       description: "Recursive Pattern Echo" },
    { id: 10, filename: "playground10.png", videoFilename: "playground10.mp4", title: "Mamun Investment Onboarding",description: "Motion Design and Animation" },
    { id: 11, filename: "playground11.png", videoFilename: "playground11.gif", title: "SĀR Rise Collection",        description: "Furniture Design - Seating" },
    { id: 12, filename: "playground12.png", videoFilename: "playground12.gif", title: "Inkā Logo",                  description: "Brand Design for Fitness Diagnosis Platform" },
    { id: 13, filename: "playground13.png", videoFilename: "playground13.gif", title: "Cheriyal Collection",        description: "Product Design for Cheriyal Handicrafts" },
    { id: 14, filename: "playground14.png", videoFilename: "playground14.gif", title: "Vaccine",                    description: "Illustration for Covid-19 Awareness" },
    { id: 15, filename: "playground15.png", videoFilename: "playground15.gif", title: "Straight Outta Olympus",     description: "Brand and Graphic Design for College Fest" },
    { id: 16, filename: "playground16.png", videoFilename: "playground16.gif", title: "Clear Cocktail",             description: "Packaging Design for a Beverage Brand" },
    { id: 17, filename: "playground17.png", videoFilename: "playground17.gif", title: "Logo Exploration",           description: "Logo's for covid variants in various design styles" },
    { id: 18, filename: "playground18.png", videoFilename: "playground18.gif", title: "Bling Smart Accessories",    description: "Product Design for Smart Wearable Concept" },
    { id: 19, filename: "playground19.png", videoFilename: "playground19.gif", title: "Piece Together",             description: "Mixed Reality Puzzle Game for Apple Vision Pro" }
];
