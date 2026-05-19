const fs = require('fs');
const path = require('path');

const pagesDir = path.join('d:', 'Freelance', 'Web Designing', 'Price Comparison', 'Sample 5', 'pages');

function readFile(filepath) {
    return fs.readFileSync(filepath, 'utf8');
}

function writeFile(filepath, content) {
    fs.writeFileSync(filepath, content, 'utf8');
}

// 1. Read categories.html
const categoriesHtml = readFile(path.join(pagesDir, 'categories.html'));

// Extract standard nav
const navMatch = categoriesHtml.match(/(<nav[\s\S]*?<\/nav>)/);
if (!navMatch) {
    console.error("Could not find standard nav in categories.html");
    process.exit(1);
}
const standardNav = navMatch[1];

// Extract standard footer
const footerMatch = categoriesHtml.match(/(<!-- FOOTER -->\s*<div class="w-full bg-\[#0A3D2A\][\s\S]*?<\/div>)/);
if (!footerMatch) {
    console.error("Could not find standard footer in categories.html");
    process.exit(1);
}
const standardFooter = footerMatch[1];

const filesToUpdate = [
    'about.html', 'blogs.html', 'contact.html', 'electronics.html', 
    'fashion.html', 'food.html', 'grocery.html', 'kids.html', 
    'laptops.html', 'mobiles.html', 'personal-care.html', 
    'property.html', 'support.html', 'travel.html'
];

for (const filename of filesToUpdate) {
    const filepath = path.join(pagesDir, filename);
    if (!fs.existsSync(filepath)) {
        console.log(`Skipping ${filename}, does not exist.`);
        continue;
    }
        
    let content = readFile(filepath);
    
    // Infer title from <title> tag
    const titleMatch = content.match(/<title>(.*?) - StopBuyPk<\/title>/);
    let pageName = titleMatch ? titleMatch[1].trim() : filename.replace('.html', '').replace(/\b\w/g, l => l.toUpperCase());
    if (pageName === "All Categories" || pageName === "Categories") {
        pageName = "Categories";
    }
    
    // Prepare custom nav
    // The standard nav has: <h1>Categories</h1>
    let customNav = standardNav.replace(/(<h1[^>]*>)\s*Categories\s*(<\/h1>)/, `$1${pageName}$2`);
    
    // Replace nav in target file
    if (/<nav[\s\S]*?<\/nav>/.test(content)) {
        content = content.replace(/<nav[\s\S]*?<\/nav>/, customNav);
    } else {
        // if no nav, insert after <body>
        content = content.replace(/(<body[^>]*>)/, `$1\n${customNav}`);
    }
        
    // Replace footer
    // Remove any <footer ...> </footer> tag
    content = content.replace(/<footer[\s\S]*?<\/footer>/g, '');
    
    // Remove existing <!-- FOOTER --> ... </div> blocks
    content = content.replace(/<!-- FOOTER -->\s*<div[^>]*>[\s\S]*?<\/div>/g, '');
    
    // Insert standard footer right before <script src="../js/location.js"></script> or </body>
    if (content.includes('<script src="../js/location.js"></script>')) {
        content = content.replace('<script src="../js/location.js"></script>', `${standardFooter}\n\n<script src="../js/location.js"></script>`);
    } else {
        content = content.replace('</body>', `${standardFooter}\n</body>`);
    }

    writeFile(filepath, content);
    console.log(`Updated ${filename} with page name: ${pageName}`);
}

console.log("Done.");
