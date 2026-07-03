const fs = require('fs');
const path = require('path');

const sections = [
    { title: 'Introduction & Physical Maquette', files: ['design.md'], id: 'intro' },
    { title: 'Smart Home Subsystem', files: ['smart-home-outline.md', 'smart-home.md'], id: 'smart-home' },
    { title: 'Autonomous Navigation & Smart Car', files: ['smart-car-outline.md', 'smart-car.md'], id: 'smart-car' },
    { title: 'Indoor Localization System', files: ['Indoor-Localization-outline.md', 'Indoor-Localization.md'], id: 'indoor-loc' },
    { title: 'Computer Vision Smart Parking', files: ['parking-outline.md', 'parking.md'], id: 'parking' },
    { title: 'Autonomous Charging Station', files: ['charging-area-outline.md', 'charging-area.md'], id: 'charging' },
    { title: 'BATU AI Chatbot (RAG System)', files: ['chatbot-outline.md', 'chatbot.md'], id: 'chatbot' },
    { title: 'Centralized Web Platform', files: ['web-platform.md'], id: 'web-plat' },
    { title: 'Frameworks & Dependencies', files: ['frameworks.md'], id: 'frameworks' },
];

let rawFilesContent = {};
let unifiedSections = [];

sections.forEach((sec, idx) => {
    let mergedContent = '';
    sec.files.forEach(file => {
        const filePath = path.join(__dirname, file);
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf-8');
            rawFilesContent[file] = content;
            
            // Cleanup chapter numbers from headings
            // Matches "# Chapter X", "## 1.2", "### 1.2.3" and removes the numbers
            let cleaned = content.replace(/^(#+)\s*(?:Chapter\s*\d+|[0-9]+(?:\.[0-9]+)*)\s*:?\s*/gm, '$1 ');
            mergedContent += cleaned + '\n\n';
        }
    });
    unifiedSections.push({ 
        title: (idx + 1) + '. ' + sec.title, 
        id: sec.id,
        content: mergedContent 
    });
});

const tsCode = "// @ts-nocheck\n" +
"declare const marked: any;\n" +
"declare const JSZip: any;\n" +
"declare const saveAs: any;\n\n" +
"const rawMarkdownFiles: Record<string, string> = " + JSON.stringify(rawFilesContent) + ";\n\n" +
"const sectionsData = " + JSON.stringify(unifiedSections) + ";\n\n" +
"document.addEventListener('DOMContentLoaded', () => {\n" +
"    const contentDiv = document.getElementById('main-content');\n" +
"    const sidebarNav = document.getElementById('sidebar-nav');\n\n" +
"    // Render content\n" +
"    sectionsData.forEach(sec => {\n" +
"        // Sidebar link\n" +
"        const link = document.createElement('a');\n" +
"        link.href = '#' + sec.id;\n" +
"        link.className = 'block px-4 py-2 mt-2 text-sm font-semibold text-slate-300 rounded-lg hover:bg-slate-700 hover:text-teal-400 transition-colors nav-link';\n" +
"        link.textContent = sec.title;\n" +
"        sidebarNav.appendChild(link);\n\n" +
"        // Content section\n" +
"        const sectionEl = document.createElement('section');\n" +
"        sectionEl.id = sec.id;\n" +
"        sectionEl.className = 'mb-20 pt-8 scroll-mt-20 fade-up';\n" +
"        \n" +
"        const titleEl = document.createElement('h1');\n" +
"        titleEl.className = 'text-4xl font-extrabold mb-6 text-teal-400 tracking-tight';\n" +
"        titleEl.textContent = sec.title;\n" +
"        sectionEl.appendChild(titleEl);\n\n" +
"        const bodyEl = document.createElement('div');\n" +
"        bodyEl.className = 'prose prose-invert prose-slate max-w-none prose-a:text-emerald-400 prose-headings:text-slate-100 prose-strong:text-slate-200 glass-panel p-8 md:p-12 rounded-3xl shadow-2xl relative group hover:shadow-teal-500/10 transition-shadow duration-500';\n" +
"        bodyEl.innerHTML = marked.parse(sec.content);\n" +
"        sectionEl.appendChild(bodyEl);\n\n" +
"        contentDiv.appendChild(sectionEl);\n" +
"    });\n\n" +
"    // Scrollspy Logic\n" +
"    const sections = document.querySelectorAll('section');\n" +
"    const navLinks = document.querySelectorAll('.nav-link');\n\n" +
"    const observerOptions = {\n" +
"        root: document.getElementById('scroll-area'),\n" +
"        rootMargin: '0px',\n" +
"        threshold: 0.05\n" +
"    };\n\n" +
"    const observer = new IntersectionObserver((entries) => {\n" +
"        entries.forEach(entry => {\n" +
"            if (entry.isIntersecting) {\n" +
"                entry.target.classList.add('visible');\n" +
"                navLinks.forEach(link => {\n" +
"                    link.classList.remove('bg-slate-800', 'text-teal-400', 'translate-x-2');\n" +
"                    if (link.getAttribute('href') === '#' + entry.target.id) {\n" +
"                        link.classList.add('bg-slate-800', 'text-teal-400', 'translate-x-2');\n" +
"                    }\n" +
"                });\n" +
"            }\n" +
"        });\n" +
"    }, observerOptions);\n\n" +
"    sections.forEach(sec => observer.observe(sec));\n\n" +
"    // Fallback visibility trigger\n" +
"    setTimeout(() => {\n" +
"        sections.forEach(sec => sec.classList.add('visible'));\n" +
"    }, 800);\n\n" +
"    // Smooth scroll for nav links\n" +
"    navLinks.forEach(link => {\n" +
"        link.addEventListener('click', (e) => {\n" +
"            e.preventDefault();\n" +
"            const targetId = link.getAttribute('href').substring(1);\n" +
"            const targetEl = document.getElementById(targetId);\n" +
"            if(targetEl) {\n" +
"                const scrollArea = document.getElementById('scroll-area');\n" +
"                scrollArea.scrollTo({\n" +
"                    top: targetEl.offsetTop - 80,\n" +
"                    behavior: 'smooth'\n" +
"                });\n" +
"            }\n" +
"        });\n" +
"    });\n\n" +
"    // ZIP Download Logic\n" +
"    const downloadBtn = document.getElementById('download-zip');\n" +
"    downloadBtn.addEventListener('click', () => {\n" +
"        const zip = new JSZip();\n" +
"        for (const [filename, content] of Object.entries(rawMarkdownFiles)) {\n" +
"            zip.file(filename, content);\n" +
"        }\n" +
"        zip.generateAsync({type:\"blob\"})\n" +
"        .then(function(content) {\n" +
"            saveAs(content, \"SmartCity2026_Raw_Docs.zip\");\n" +
"        });\n" +
"    });\n" +
"});\n";

fs.writeFileSync(path.join(__dirname, 'main.ts'), tsCode);

// Write index.html
const htmlContent = `<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Smart City 2026 Docs</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.tailwindcss.com?plugins=typography"></script>
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="styles.css">
</head>
<body class="bg-slate-900 text-slate-300 font-sans antialiased overflow-x-hidden selection:bg-teal-500 selection:text-white">

    <div class="flex h-screen overflow-hidden">
        
        <!-- Sidebar -->
        <aside class="w-80 bg-slate-900/80 backdrop-blur-xl border-r border-slate-700/50 hidden md:flex flex-col h-full shadow-2xl relative z-10">
            <div class="h-24 flex items-center px-8 border-b border-slate-800">
                <h1 class="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-emerald-400 tracking-wider">SMART CITY<br/><span class="text-xs tracking-[0.3em] text-slate-400">2026 DOCS</span></h1>
            </div>
            
            <nav id="sidebar-nav" class="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <!-- Links injected by TS -->
            </nav>

            <div class="p-6 border-t border-slate-800">
                <button id="download-zip" class="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-900 font-bold py-3 px-4 rounded-xl shadow-lg shadow-teal-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98]">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                    Download ZIP
                </button>
            </div>
        </aside>

        <!-- Main Content -->
        <main id="scroll-area" class="flex-1 h-full overflow-y-auto relative custom-scrollbar animated-bg">
            <!-- Glass Overlay for Background -->
            <div class="absolute inset-0 bg-slate-900/90 pointer-events-none fixed"></div>
            
            <div class="relative z-10 px-8 py-12 md:px-16 lg:px-24 max-w-5xl mx-auto" id="main-content">
                <!-- Sections injected by TS -->
            </div>
        </main>
    </div>

    <!-- Compile TS Script -->
    <script src="main.js"></script>
</body>
</html>`;

fs.writeFileSync(path.join(__dirname, 'index.html'), htmlContent);

// Write styles.css
const cssContent = `
body {
    font-family: 'Inter', sans-serif;
}

/* Glassmorphism Panels */
.glass-panel {
    background: rgba(30, 41, 59, 0.4);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.05);
}

/* Custom Scrollbar */
.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(45, 212, 191, 0.3); 
    border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(45, 212, 191, 0.6); 
}

/* Animations & Dynamic UI */
.fade-up {
    opacity: 0;
    transform: translateY(30px);
    transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.fade-up.visible {
    opacity: 1;
    transform: translateY(0);
}

.animated-bg {
    background: linear-gradient(-45deg, #0f172a, #1e293b, #0f172a, #020617);
    background-size: 400% 400%;
    animation: gradientBG 15s ease infinite;
}

@keyframes gradientBG {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
}

/* Enhancing Tailwind Typography for Dark Mode */
.prose h1, .prose h2, .prose h3, .prose h4 {
    color: #f1f5f9 !important;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding-bottom: 0.5rem;
    margin-bottom: 1.5rem;
}

.prose a {
    text-decoration: none;
    border-bottom: 1px dashed #34d399;
    transition: all 0.2s ease;
}

.prose a:hover {
    color: #10b981 !important;
    border-bottom-style: solid;
}

.prose code {
    background: rgba(15, 23, 42, 0.6) !important;
    padding: 0.2rem 0.4rem;
    border-radius: 0.25rem;
    color: #5eead4 !important;
}

.prose pre {
    background: #0f172a !important;
    border: 1px solid rgba(255, 255, 255, 0.1);
}
`;

fs.writeFileSync(path.join(__dirname, 'styles.css'), cssContent);
