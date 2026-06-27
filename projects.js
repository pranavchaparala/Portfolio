// projects.js — self-contained, all paths relative to New Portfolio/
const projectsData = [
    {
        "id": "clanx",
        "title": "ClanX",
        "year": "2024",
        "caption": "AI-powered recruitment platform streamlining talent discovery to hire.",
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
        "id": "lectrix-ev",
        "title": "Lectrix EV",
        "year": "2024",
        "caption": "EV companion app design for connected mobility and charging experiences.",
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
        "caption": "Smart ring health companion app from scratch, winner of Red Dot Award 2024.",
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
        "id": "permanence-of-decay",
        "title": "Permanence of Decay",
        "year": "2026",
        "caption": "Digital archive exploring material decay through computational photography.",
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
        "id": "echoes-of-presence",
        "title": "Echoes of Presence",
        "year": "2024",
        "caption": "Interactive installation exploring presence through sound and light.",
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
        "caption": "Generative art cube exploring impossible geometry at hackathon.",
        "galleryLayout": "1",
        "galleryImages": [
            { "src": "projects/unreasonablecube/unreasonablecube_Claude.png", "ratio": "ratio-cube" }
        ],
        "link": "projects/unreasonablecube/index.html",
        "externalLink": "https://devpost.com/software/team-18-unreasonable-cube/joins/i0cOIBWhoy-2Ny883ERCuA",
        "tags": ["Creative Tech"],
        "hardwareParams": [
            { "label": "Core", "value": "Custom mechanical assembly housing 6x ESP32 microcontrollers" },
            { "label": "Displays", "value": "Six 4\" ST7796 TFT screens" },
            { "label": "Mechanics", "value": "Gear-driven system with outer gear rings and internal rotary encoders, allowing rotation without stressing internal wiring" }
        ],
        "systemLogic": "OpenAI Whisper handles speech-to-text with tuned RMS thresholds; Claude 3.5 Sonnet generates the initial six lenses and the final speculative narrative; a Python-based weight engine coordinates and calculates interaction vectors influencing follow-up questions."
    },
    {
        "id": "oneplus",
        "title": "OnePlus OxygenOS 12",
        "year": "2021",
        "caption": "Operating system design reaching 16-20 million global users.",
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
        "year": "2024",
        "caption": "True wireless earbuds app with seamless connectivity experience.",
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
        "year": "2021",
        "caption": "Event management app design for seamless social planning.",
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
        "caption": "Interactive generative forest built with creative coding tools.",
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
        "year": "2021",
        "caption": "Logistics CMS and delivery platform UX/UI redesign.",
        "galleryLayout": "1",
        "galleryImages": [
            { "src": "covers/gudz.png", "ratio": "ratio-cube" }
        ],
        "link": "https://www.behance.net/gallery/186363817/Logistics-CMS-Delivery-App",
        //"externalLink": "",
        "tags": ["Product Design"]
    }
];

// To reorder the grid, change the `order` number. Lower = appears first.
const experimentsData = [
    { order: 1, id: 20, filename: "playground20.png", videoFilename: "playground20.mp4", title: "LOOM", description: "The AI-powered tool that instantly swaps everyday objects with perfectly lit movie props.", category: "AI / Product", tools: "HTML, Python, Nanobanana API" },
    { order: 2, id: 21, filename: "playground21.png", videoFilename: "playground21.mp4", title: "De//Faced", description: "An interactive 3D self-portrait that uses conversational AI to generate custom sticker graffiti.", category: "AI / Product", tools: "HTML, Python, Nanobanana API" },
    { order: 3, id: 22, filename: "playground22.png", videoFilename: "playground22.mp4", title: "Data Experience", description: "An interactive generative installation that translates real-time human movement into a dynamic silhouette composed of machine-predicted sketches.", category: "AI / Product", tools: "HTML, Python, MediaPipe, JavaScript, Dataset" },
    { order: 4, id: 2, filename: "playground2.png", videoFilename: "playground2.mp4", title: "BOOLEAN ALGEBRA", description: "Algorithmic Geometry Study", category: "Creative Coding", tools: "Javascript" },
    { order: 5, id: 19, filename: "playground19.png", videoFilename: "playground19.mp4", title: "Piece Together", description: "Mixed Reality Puzzle Game for Apple Vision Pro", tools: "Unity" },
    { order: 6, id: 5, filename: "playground5.png", videoFilename: "playground5.mp4", title: "METROPOLIS", description: "Generative Cityscape in P5JS", category: "Creative Coding", tools: "Javascript" },
    { order: 7, id: 1, filename: "playground1.png", videoFilename: "playground1.mp4", title: "GENUARY WITHOUT A FONT", description: "Generative Cityscape in P5JS", category: "Creative Coding", tools: "Javascript" },
    { order: 8, id: 4, filename: "playground4.png", videoFilename: "playground4.mp4", title: "FIBONACCI SEQUENCE", description: "Audio Reactive Golden Spiral in P5JS", category: "Creative Coding", tools: "Javascript" },
    { order: 9, id: 13, filename: "playground13.png", videoFilename: "playground13.mp4", title: "Cheriyal Collection", description: "Product Design for Cheriyal Handicrafts" },
    { order: 10, id: 11, filename: "playground11.png", videoFilename: "playground11.mp4", title: "SĀR Rise Collection", description: "Furniture Design - Seating" },
    { order: 11, id: 3, filename: "playground3.png", videoFilename: "playground3.mp4", title: "ASCII VIDEO ENCODING", description: "Python Video Encoding", category: "Creative Coding", tools: "Python" },
    { order: 12, id: 6, filename: "playground6.png", videoFilename: "playground6.mp4", title: "LOWRES", description: "Audio Reactive Low Resolution in P5JS", category: "Creative Coding", tools: "Javascript" },
    { order: 13, id: 10, filename: "playground10.png", videoFilename: "playground10.mp4", title: "Mamun Investment Onboarding", description: "Motion Design and Animation" },
    { order: 14, id: 8, filename: "playground8.png", videoFilename: "playground8.png", title: "FLUX", description: "Noise Field Visualization", category: "Creative Coding", tools: "Javascript" },
    { order: 15, id: 15, filename: "playground15.png", videoFilename: "playground15.mp4", title: "Straight Outta Olympus", description: "Brand and Graphic Design for College Fest" },
    { order: 16, id: 12, filename: "playground12.png", videoFilename: "playground12.mp4", title: "Inkā Logo", description: "Brand Design for Fitness Diagnosis Platform" },
    { order: 17, id: 14, filename: "playground14.png", videoFilename: "playground14.mp4", title: "Vaccine", description: "Illustration for Covid-19 Awareness" },
    { order: 18, id: 17, filename: "playground17.png", videoFilename: "playground17.mp4", title: "Logo Exploration", description: "Logo's for covid variants in various design styles" },
    { order: 19, id: 16, filename: "playground16.png", videoFilename: "playground16.mp4", title: "Clear Cocktail", description: "Packaging Design for a Beverage Brand" },
    { order: 20, id: 7, filename: "playground7.png", videoFilename: "playground7.png", title: "NOTHING POINT", description: "Fluid Simulation Concept", category: "Creative Coding", tools: "Javascript" },
    { order: 21, id: 18, filename: "playground18.png", videoFilename: "playground18.mp4", title: "Bling Smart Accessories", description: "Product Design for Smart Wearable Concept" },
    { order: 22, id: 9, filename: "playground9.png", videoFilename: "playground9.png", title: "ECHO", description: "Recursive Pattern Echo", category: "Creative Coding", tools: "Javascript" }
];
