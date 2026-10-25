const fs = require('fs');
const path = require('path');

const filePath = path.resolve('index.html');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Replace the Travel & Tours section markup with the proportionate size
const targetSectionRegex = /<!-- 6\. Travel & Tours Section -->[\s\S]*?<\/section>/;

const newSection = `<!-- 6. Travel & Tours Section -->
            <section id="travel-section" class="py-8 text-left">
                <!-- PREMIUM OUTER WRAPPER -->
                <div class="relative overflow-hidden rounded-[26px] border border-white/10 bg-gradient-to-br from-[#021710] via-[#064e3b] to-[#059669] shadow-[0_10px_40px_rgba(16,185,129,0.22)] p-5 md:p-6">

                    <!-- BACKGROUND EFFECTS -->
                    <div class="absolute inset-0 overflow-hidden pointer-events-none">
                        <!-- Glow -->
                        <div class="absolute -top-32 -right-32 w-[350px] h-[350px] bg-emerald-300/10 rounded-full blur-3xl"></div>
                        <div class="absolute -bottom-32 -left-32 w-[350px] h-[350px] bg-cyan-400/10 rounded-full blur-3xl"></div>

                        <!-- Grid -->
                        <div class="absolute inset-0 opacity-[0.05]"
                            style="background-image:
                            linear-gradient(to right, rgba(255,255,255,.18) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(255,255,255,.18) 1px, transparent 1px);
                            background-size: 55px 55px;">
                        </div>
                    </div>

                    <!-- HEADER -->
                    <div class="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">

                        <!-- LEFT -->
                        <div class="flex items-center gap-3">
                            <!-- ICON -->
                            <div class="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/15 flex items-center justify-center shadow-sm text-xl shrink-0">
                                ✈️
                            </div>

                            <!-- TEXT -->
                            <div>
                                <h2 class="text-2xl font-bold text-white tracking-wide leading-tight"
                                    style="font-family: 'Times New Roman', Times, serif;">
                                    <span class="lang-en">Travel &amp; Tours</span>
                                    <span class="lang-ur">سفر اور سیاحت</span>
                                </h2>

                                <p class="text-xs md:text-sm text-emerald-100/80 mt-0.5 max-w-xl leading-relaxed">
                                    <span class="lang-en">Explore Pakistan &amp; International Tour Deals with Smart Price Comparison</span>
                                    <span class="lang-ur">پاکستان اور بین الاقوامی ٹور پیکجز بہترین قیمتوں کے موازنہ کے ساتھ دریافت کریں</span>
                                </p>
                            </div>
                        </div>

                        <!-- RIGHT BUTTON (Reduced 50%) -->
                        <button onclick="window.location.href='pages/travel.html'"
                            class="group h-[32px] px-3.5 rounded-xl bg-white text-emerald-900 text-xs font-bold shadow-md hover:bg-emerald-50 transition-all duration-300 hover:-translate-y-0.5 flex items-center justify-center gap-1.5 whitespace-nowrap">
                            <span>View All Packages</span>
                            <i class="fas fa-arrow-right text-[10px] transition-transform duration-300 group-hover:translate-x-0.5"></i>
                        </button>
                    </div>

                    <!-- FEATURE STRIP -->
                    <div class="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-5">
                        <!-- ITEM -->
                        <div class="h-[36px] rounded-xl bg-white/10 border border-white/10 backdrop-blur-xl px-3 flex items-center gap-2">
                            <div class="text-base">🌍</div>
                            <div class="flex items-center gap-1.5">
                                <span class="text-sm font-black text-white">120+</span>
                                <span class="text-[11px] font-semibold text-emerald-100/80">Tours</span>
                            </div>
                        </div>

                        <!-- ITEM -->
                        <div class="h-[36px] rounded-xl bg-white/10 border border-white/10 backdrop-blur-xl px-3 flex items-center gap-2">
                            <div class="text-base">🏨</div>
                            <div class="flex items-center gap-1.5">
                                <span class="text-sm font-black text-white">85+</span>
                                <span class="text-[11px] font-semibold text-emerald-100/80">Hotels</span>
                            </div>
                        </div>

                        <!-- ITEM -->
                        <div class="h-[36px] rounded-xl bg-white/10 border border-white/10 backdrop-blur-xl px-3 flex items-center gap-2">
                            <div class="text-base">✈️</div>
                            <div class="flex items-center gap-1.5">
                                <span class="text-sm font-black text-white">40+</span>
                                <span class="text-[11px] font-semibold text-emerald-100/80">Airlines</span>
                            </div>
                        </div>

                        <!-- ITEM -->
                        <div class="h-[36px] rounded-xl bg-white/10 border border-white/10 backdrop-blur-xl px-3 flex items-center gap-2">
                            <div class="text-base">⭐</div>
                            <div class="flex items-center gap-1.5">
                                <span class="text-sm font-black text-white">4.9</span>
                                <span class="text-[11px] font-semibold text-emerald-100/80">Rating</span>
                            </div>
                        </div>
                    </div>

                    <!-- PACKAGES GRID -->
                    <div class="relative z-10">
                        <div id="travelPackagesGrid"
                            class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            <div class="col-span-full text-center py-8 text-emerald-200 font-medium text-sm">
                                Loading travel packages...
                            </div>
                        </div>
                    </div>

                </div>
            </section>`;

if (targetSectionRegex.test(content)) {
    content = content.replace(targetSectionRegex, newSection);
    console.log('Successfully applied Travel & Tours section markup.');
} else {
    console.log('Travel & Tours section regex did not match or already updated.');
}

// 2. Adjust card image height in travel packages render JS to h-[160px] and rounded-2xl
content = content.replace(
    'rounded-[28px] overflow-hidden border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between',
    'rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between'
);

content = content.replace(
    'relative w-full h-[200px] bg-slate-100 overflow-hidden',
    'relative w-full h-[160px] bg-slate-100 overflow-hidden'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated index.html with resized Travel & Tours section.');
