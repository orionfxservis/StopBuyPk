const fs = require('fs');
const path = require('path');

const filePath = path.resolve('index.html');
let content = fs.readFileSync(filePath, 'utf8');

// Pattern to match "Enter Your Comments" button in index.html
const target = /<button onclick="openCommentModal\(\)"\s*class="[^"]*">\s*<i class="fas fa-comment-dots[^"]*"><\/i>\s*<span class="lang-en">Enter Your Comments<\/span>\s*<span class="lang-ur">اپنی رائے درج کریں<\/span>\s*<\/button>/;

const replacement = `<button onclick="openCommentModal()"
                            class="group h-[32px] px-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-green-500 hover:to-emerald-600 text-white font-bold text-xs shadow-md hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-1.5 whitespace-nowrap">
                            <i class="fas fa-comment-dots text-[11px]"></i>
                            <span class="lang-en">Enter Your Comments</span>
                            <span class="lang-ur">اپنی رائے درج کریں</span>
                        </button>`;

if (target.test(content)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Successfully resized "Enter Your Comments" button in index.html.');
} else {
    console.log('Button is already updated or pattern did not match.');
}
