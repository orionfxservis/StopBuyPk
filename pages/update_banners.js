const fs = require('fs');
const path = require('path');

const pagesDir = path.join('d:', 'Freelance', 'Web Designing', 'Price Comparison', 'Sample 5', 'pages');

const filesToUpdate = [
    'electronics.html', 'fashion.html', 'grocery.html', 'kids.html', 
    'computers.html', 'mobiles.html', 'personal-care.html', 'property.html'
];

for (const filename of filesToUpdate) {
    const filepath = path.join(pagesDir, filename);
    if (!fs.existsSync(filepath)) {
        console.log(`Skipping ${filename}, does not exist.`);
        continue;
    }
        
    let content = fs.readFileSync(filepath, 'utf8');
    
    // Find the hero banner block
    // It usually looks like:
    // <!-- HERO -->
    // <div class="category-hero">
    //   <img src="../images/grafix/fresh-groceries-02.png" class="hero-banner">
    // </div>
    
    const regex = /<!--\s*HERO\s*-->\s*<div class="category-hero">\s*<img[^>]*src="([^"]+)"[^>]*>\s*<\/div>/i;
    const match = content.match(regex);
    
    if (match) {
        const imgSrc = match[1];
        const replacement = `<!-- HERO -->
    <div class="max-w-screen-2xl mx-auto px-4 py-6">
        <div class="relative w-full rounded-3xl overflow-hidden shadow-lg border border-emerald-200 mb-2 bg-[#F4F9F2]">
            <img src="${imgSrc}" alt="Category Banner"
                class="w-full h-[150px] sm:h-[200px] md:h-[300px] object-cover md:object-fill">
        </div>
    </div>`;
        
        content = content.replace(regex, replacement);
        
        // Also remove the old CSS blocks if they exist:
        // .category-hero { ... }
        // .hero-banner { ... }
        content = content.replace(/\/\*\s*HERO\s*\*\/\s*/i, '');
        content = content.replace(/\.category-hero\s*\{[^}]*\}/g, '');
        content = content.replace(/\.hero-banner\s*\{[^}]*\}/g, '');
        
        fs.writeFileSync(filepath, content, 'utf8');
        console.log(`Updated banner in ${filename}`);
    } else {
        console.log(`No banner found to update in ${filename}`);
    }
}

console.log("Done.");
