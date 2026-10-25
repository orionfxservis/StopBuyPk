const fs = require('fs');
const path = require('path');

const filePath = path.resolve('index.html');
let content = fs.readFileSync(filePath, 'utf8');

// Check if banner is already positioned under FAQ
const alreadyUnderFaq = /<!-- ================= FAQ SECTION ================= -->[\s\S]*?<\/section>\s*<!-- Large Promotional Banner -->/;
if (alreadyUnderFaq.test(content)) {
    console.log('Promotional banner is already placed directly under the FAQ section in index.html.');
    process.exit(0);
}

// 1. Extract the promotional banner block
const bannerRegex = /([ \t]*<!-- Large Promotional Banner -->[\s\S]*?<\/div>[ \t]*\r?\n[ \t]*<\/a>[ \t]*\r?\n[ \t]*<\/div>)/;
const match = content.match(bannerRegex);

if (!match) {
    console.error('Could not find Large Promotional Banner in index.html');
    process.exit(1);
}

const bannerBlock = match[1];
console.log('Found banner block to move.');

// Remove banner from its current position
content = content.replace(bannerRegex, '');

// Clean up extra blank lines where the banner used to be
content = content.replace(/(<\/script>\s*\r?\n)\s*\r?\n\s*(\r?\n\s*<!-- Stats\/Trust Bar -->)/, '$1\r\n$2');

// 2. Find the end of FAQ section
const faqEndRegex = /(<!-- ================= FAQ SECTION ================= -->[\s\S]*?<\/section>)/;
const faqMatch = content.match(faqEndRegex);

if (!faqMatch) {
    console.error('Could not find FAQ section in index.html');
    process.exit(1);
}

// Ensure proper spacing with mb-12
const updatedBannerBlock = bannerBlock.replace('class="w-full my-4"', 'class="w-full mb-12"');

content = content.replace(
    faqEndRegex,
    `$1\r\n\r\n${updatedBannerBlock}`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully moved banner under FAQ section in index.html.');
