import re
content = open('index.html', 'r', encoding='utf-8').read()
replacement = """const safeTitle = encodeURIComponent(title);
                const safeDesc = encodeURIComponent(desc);
                const safeImage = image || 'images/placeholder.jpg';

                return `
                    <div class="blog-card bg-white rounded-3xl overflow-hidden modern-shadow border border-emerald-100 cursor-pointer hover:-translate-y-1 hover:shadow-lg transition-all" onclick="openBlogModal('${safeTitle}', '${safeDesc}', '${safeImage}')">
                        <img src="${safeImage}" class="w-full h-36 object-contain bg-emerald-50 rounded-t-3xl" onerror="this.src='images/placeholder.jpg'">
                        <div class="p-5">
                            <div class="font-semibold" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${title}</div>
                            <div class="text-sm text-gray-600 mt-1" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${desc}</div>
                            <button class="mt-3 text-xs text-emerald-700 font-semibold flex items-center gap-1">Read Full Article <i class="fas fa-arrow-right text-[10px]"></i></button>
                        </div>
                    </div>
                `;"""

content = re.sub(r'<div class="blog-card bg-white rounded-3xl.*?</div>\s*</div>\s*`;', replacement, content, flags=re.DOTALL)
open('index.html', 'w', encoding='utf-8').write(content)
