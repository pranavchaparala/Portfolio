import os
import re
import json

# Configuration
PROJECTS_DIR = '.'
PROJECTS_JS_FILE = 'projects.js'
NEW_PORTFOLIO_JS_FILE = os.path.join('New Portfolio', 'projects.js')
DEFAULT_COVER = 'echoesofpresence.png'
BLACKLIST = ['.git', 'about', 'work', 'play', 'covers', 'common', '.DS_Store']

def extract_meta(html_content, name):
    match = re.search(rf'<meta\s+name=["\']{name}["\']\s+content=["\'](.*?)["\']', html_content, re.IGNORECASE | re.DOTALL)
    if not match:
        match = re.search(rf'<meta\s+content=["\'](.*?)["\']\s+name=["\']{name}["\']', html_content, re.IGNORECASE | re.DOTALL)
    return match.group(1) if match else None

def extract_title(html_content):
    match = re.search('<title>(.*?)</title>', html_content)
    if match:
        title = match.group(1).split('|')[0].strip()
        return title
    return "Untitled Project"

def extract_year_from_grid(html_content):
    match = re.search(r'<span\s+class=["\']meta-label["\']>\s*Year\s*</span>\s*<span\s+class=["\']meta-value["\']>\s*(\d{4})\s*</span>', html_content, re.IGNORECASE | re.DOTALL)
    if match:
        return match.group(1).strip()
    return ""

def extract_experiments_data(file_path):
    if not os.path.exists(file_path):
        return "const experimentsData = [];"
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    idx = content.find('const experimentsData')
    if idx != -1:
        return content[idx:].strip()
    return "const experimentsData = [];"

def sync():
    projects_data = []
    
    # 1. GRID PRIORITY (Order on the Work page)
    GRID_PRIORITY = [
        'clanx',
        'lectrix-ev',
        'echoes-of-presence',
        'unreasonablecube',
        'lunaring',
        'viewbuds',        
    ]

    # 2. CAROUSEL PRIORITY (Order and selection for the Home page)
    CAROUSEL_PRIORITY = [
        'echoes-of-presence',
        'unreasonablecube',
        'oneplus',
        'viewbuds',
        'lectrix-ev',
        'clanx',
    ]
    
    # Sort folders for GRID based on GRID_PRIORITY
    folders = [f for f in os.listdir(PROJECTS_DIR) 
               if os.path.isdir(os.path.join(PROJECTS_DIR, f)) 
               and f not in BLACKLIST]
    
    def sort_key(folder):
        if folder in GRID_PRIORITY:
            return (0, GRID_PRIORITY.index(folder))
        else:
            return (1, folder.lower())
            
    folders.sort(key=sort_key)

    for folder in folders:
        index_path = os.path.join(PROJECTS_DIR, folder, 'index.html')
        if not os.path.exists(index_path):
            continue
            
        with open(index_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        title = extract_title(content)
        img = extract_meta(content, 'project-img')
        grid_img = extract_meta(content, 'project-grid-img')
        tags_raw = extract_meta(content, 'project-tags')
        tags = [t.strip() for t in tags_raw.split(',')] if tags_raw else []
        description = extract_meta(content, 'project-description') or "Content coming soon."
        external_link = extract_meta(content, 'project-link')
        
        # New: Project Covers & Year
        covers_raw = extract_meta(content, 'project-covers')
        year = extract_meta(content, 'project-year') or extract_year_from_grid(content) or ""
        
        gallery_images = []
        if covers_raw:
            covers_list = [c.strip() for c in covers_raw.split(',') if c.strip()]
            for c in covers_list:
                if c.startswith('..') or c.startswith('/') or c.startswith('http'):
                    src_path = c
                elif c.startswith('covers/'):
                    src_path = f"../{c}"
                else:
                    src_path = f"../{folder}/{c}"
                gallery_images.append({"src": src_path, "ratio": "ratio-cube"})
        else:
            fallback_img = grid_img if grid_img else (img if img else None)
            if not fallback_img:
                for ext in ['png', 'jpg', 'jpeg', 'webp']:
                    if os.path.exists(os.path.join(PROJECTS_DIR, folder, f'cover.{ext}')):
                        fallback_img = f'{folder}/cover.{ext}'
                        break
            if not fallback_img:
                fallback_img = DEFAULT_COVER
            
            if fallback_img.startswith('..') or fallback_img.startswith('/') or fallback_img.startswith('http'):
                src_path = fallback_img
            elif fallback_img.startswith('covers/'):
                src_path = f"../{fallback_img}"
            elif '/' in fallback_img:
                src_path = f"../{fallback_img}"
            else:
                src_path = f"../{folder}/{fallback_img}" if fallback_img != DEFAULT_COVER else f"../covers/{DEFAULT_COVER}"
                
            gallery_images.append({"src": src_path, "ratio": "ratio-landscape"})
            
        layout = str(len(gallery_images))
        
        projects_data.append({
            "id": folder,
            "title": title,
            "year": year,
            "img": img if img else DEFAULT_COVER,
            "gridImg": grid_img if grid_img else (img if img else DEFAULT_COVER),
            "galleryLayout": layout,
            "galleryImages": gallery_images,
            "link": external_link if external_link else f"{folder}/",
            "externalLink": external_link if external_link else "",
            "tags": tags,
            "content": f"<h1>{title}</h1><p>{description}</p>"
        })

    # 1. Output to root projects.js (old format compatible)
    js_output_root = f"const projectsData = {json.dumps(projects_data, indent=4)};\n"
    js_output_root += f"const carouselOrder = {json.dumps(CAROUSEL_PRIORITY)};\n"
    with open(PROJECTS_JS_FILE, 'w', encoding='utf-8') as f:
        f.write("// projects.js - AUTOMATICALLY GENERATED BY sync_projects.py\n")
        f.write(js_output_root)
    print(f"Successfully synced root {PROJECTS_JS_FILE}")

    # 2. Output to New Portfolio projects.js (including preserved experimentsData)
    experiments_js_content = extract_experiments_data(NEW_PORTFOLIO_JS_FILE)
    js_output_new = f"// projects.js - AUTOMATICALLY GENERATED BY sync_projects.py\n"
    js_output_new += f"const projectsData = {json.dumps(projects_data, indent=4)};\n\n"
    js_output_new += experiments_js_content + "\n"
    
    with open(NEW_PORTFOLIO_JS_FILE, 'w', encoding='utf-8') as f:
        f.write(js_output_new)
    print(f"Successfully synced New Portfolio {NEW_PORTFOLIO_JS_FILE}")

if __name__ == "__main__":
    sync()
