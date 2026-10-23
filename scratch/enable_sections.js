const fs = require('fs');

const file = 'index.html';
let content = fs.readFileSync(file, 'utf8');

// 1. Travel & Tours Section Markup
const travelSectionHtml = `            <!-- 6. Travel & Tours Section -->
            <section id="travel-section" class="py-8 text-left">
                <!-- PREMIUM OUTER WRAPPER -->
                <div class="relative overflow-hidden rounded-[34px] border border-white/10 bg-gradient-to-br from-[#021710] via-[#064e3b] to-[#059669] shadow-[0_20px_70px_rgba(16,185,129,0.28)] p-5 md:p-7">

                    <!-- BACKGROUND EFFECTS -->
                    <div class="absolute inset-0 overflow-hidden pointer-events-none">
                        <!-- Glow -->
                        <div class="absolute -top-32 -right-32 w-[420px] h-[420px] bg-emerald-300/10 rounded-full blur-3xl"></div>
                        <div class="absolute -bottom-32 -left-32 w-[420px] h-[420px] bg-cyan-400/10 rounded-full blur-3xl"></div>

                        <!-- Grid -->
                        <div class="absolute inset-0 opacity-[0.05]"
                            style="background-image:
                            linear-gradient(to right, rgba(255,255,255,.18) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(255,255,255,.18) 1px, transparent 1px);
                            background-size: 55px 55px;">
                        </div>
                    </div>

                    <!-- HEADER -->
                    <div class="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-7">

                        <!-- LEFT -->
                        <div class="flex items-center gap-4">
                            <!-- ICON -->
                            <div class="w-16 h-16 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/15 flex items-center justify-center shadow-[0_8px_30px_rgba(255,255,255,.12)] text-3xl">
                                ✈️
                            </div>

                            <!-- TEXT -->
                            <div>
                                <h2 class="text-3xl md:text-4xl font-black text-white tracking-wide leading-tight"
                                    style="font-family: Georgia, 'Times New Roman', serif;">
                                    <span class="lang-en">Travel &amp; Tours</span>
                                    <span class="lang-ur">سفر اور سیاحت</span>
                                </h2>

                                <p class="text-sm md:text-[15px] text-emerald-100/80 mt-1 max-w-xl leading-relaxed">
                                    <span class="lang-en">Explore Pakistan &amp; International Tour Deals with Smart Price Comparison</span>
                                    <span class="lang-ur">پاکستان اور بین الاقوامی ٹور پیکجز بہترین قیمتوں کے موازنہ کے ساتھ دریافت کریں</span>
                                </p>
                            </div>
                        </div>

                        <!-- RIGHT BUTTON -->
                        <button onclick="window.location.href='pages/travel.html'"
                            class="group h-[52px] px-7 rounded-2xl bg-white text-emerald-900 text-sm font-extrabold shadow-[0_8px_25px_rgba(255,255,255,.18)] hover:bg-emerald-50 transition-all duration-300 hover:-translate-y-1 flex items-center justify-center gap-2 whitespace-nowrap">
                            <span>View All Packages</span>
                            <i class="fas fa-arrow-right text-xs transition-transform duration-300 group-hover:translate-x-1"></i>
                        </button>
                    </div>

                    <!-- FEATURE STRIP -->
                    <div class="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-3 mb-7">
                        <!-- ITEM -->
                        <div class="h-[56px] rounded-2xl bg-white/10 border border-white/10 backdrop-blur-xl px-4 flex items-center gap-3">
                            <div class="text-xl">🌍</div>
                            <div class="flex items-center gap-1.5">
                                <span class="text-lg font-black text-white">120+</span>
                                <span class="text-[13px] font-semibold text-emerald-100/80">Tours</span>
                            </div>
                        </div>

                        <!-- ITEM -->
                        <div class="h-[56px] rounded-2xl bg-white/10 border border-white/10 backdrop-blur-xl px-4 flex items-center gap-3">
                            <div class="text-xl">🏨</div>
                            <div class="flex items-center gap-1.5">
                                <span class="text-lg font-black text-white">85+</span>
                                <span class="text-[13px] font-semibold text-emerald-100/80">Hotels</span>
                            </div>
                        </div>

                        <!-- ITEM -->
                        <div class="h-[56px] rounded-2xl bg-white/10 border border-white/10 backdrop-blur-xl px-4 flex items-center gap-3">
                            <div class="text-xl">✈️</div>
                            <div class="flex items-center gap-1.5">
                                <span class="text-lg font-black text-white">40+</span>
                                <span class="text-[13px] font-semibold text-emerald-100/80">Airlines</span>
                            </div>
                        </div>

                        <!-- ITEM -->
                        <div class="h-[56px] rounded-2xl bg-white/10 border border-white/10 backdrop-blur-xl px-4 flex items-center gap-3">
                            <div class="text-xl">⭐</div>
                            <div class="flex items-center gap-1.5">
                                <span class="text-lg font-black text-white">4.9</span>
                                <span class="text-[13px] font-semibold text-emerald-100/80">Rating</span>
                            </div>
                        </div>
                    </div>

                    <!-- PACKAGES GRID -->
                    <div class="relative z-10">
                        <div id="travelPackagesGrid"
                            class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            <div class="col-span-full text-center py-10 text-emerald-200 font-medium">
                                Loading travel packages...
                            </div>
                        </div>
                    </div>

                </div>
            </section>
`;

// 2. Peoples Comments Section Markup + Comment Modal
const commentsSectionHtml = `            <!-- Peoples Comments Section -->
            <section id="comments-section" class="py-8 text-left">
                <!-- OUTER BOX -->
                <div class="relative overflow-hidden rounded-[26px] border border-white/10 
                    bg-gradient-to-br from-[#020617] via-[#050816] to-[#0f172a]
                    shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl p-5 md:p-7">

                    <!-- Glow -->
                    <div
                        class="absolute -top-20 -right-20 w-72 h-72 bg-red-500/10 rounded-full blur-3xl pointer-events-none">
                    </div>

                    <!-- HEADER -->
                    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5 relative z-10">
                        <div>
                            <p class="text-red-400 tracking-[5px] uppercase text-[11px] mb-1 font-bold">
                                <span class="lang-en">Loved By Pakistanis</span>
                                <span class="lang-ur">پاکستانیوں کا پسندیدہ</span>
                            </p>

                            <h2 class="text-2xl md:text-4xl font-extrabold text-white leading-tight">
                                <span class="lang-en">Real People. Real Savings.</span>
                                <span class="lang-ur">اصلی لوگ، حقیقی بچت۔</span>
                            </h2>
                        </div>

                        <!-- BUTTON -->
                        <button onclick="openCommentModal()"
                            class="bg-gradient-to-r from-emerald-500 to-green-600 
                            hover:from-green-500 hover:to-emerald-600 
                            text-white font-semibold px-5 py-2.5 rounded-2xl 
                            shadow-lg hover:scale-105 transition-all duration-300 text-sm w-fit flex items-center gap-2">
                            <i class="fas fa-comment-dots"></i>
                            <span class="lang-en">Enter Your Comments</span>
                            <span class="lang-ur">اپنی رائے درج کریں</span>
                        </button>
                    </div>

                    <!-- REVIEW CARDS -->
                    <div id="reviewsContainer"
                        class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 relative z-10">

                        <!-- CARD 1 -->
                        <div
                            class="bg-white/5 border border-white/10 rounded-3xl p-5 backdrop-blur-md hover:bg-white/10 transition-all duration-300">
                            <div class="text-yellow-400 text-base mb-3">
                                ★★★★★
                            </div>
                            <p class="text-gray-200 text-[15px] leading-relaxed italic">
                                "I saved Rs 4,800 on monthly groceries using StopBuy. The comparison tool is a game changer!"
                            </p>
                            <div class="mt-5 text-red-400 font-semibold text-base">
                                — Ayesha Khan, Lahore
                            </div>
                        </div>

                        <!-- CARD 2 -->
                        <div
                            class="bg-white/5 border border-white/10 rounded-3xl p-5 backdrop-blur-md hover:bg-white/10 transition-all duration-300">
                            <div class="text-yellow-400 text-base mb-3">
                                ★★★★★
                            </div>
                            <p class="text-gray-200 text-[15px] leading-relaxed italic">
                                "Found the lowest petrol prices and got my iPhone 16 for Rs 14k less than market."
                            </p>
                            <div class="mt-5 text-red-400 font-semibold text-base">
                                — Bilal Ahmed, Karachi
                            </div>
                        </div>

                        <!-- CARD 3 -->
                        <div
                            class="bg-white/5 border border-white/10 rounded-3xl p-5 backdrop-blur-md hover:bg-white/10 transition-all duration-300">
                            <div class="text-yellow-400 text-base mb-3">
                                ★★★★★
                            </div>
                            <p class="text-gray-200 text-[15px] leading-relaxed italic">
                                "Booked my Umrah through StopBuy. Everything was seamless and cheaper than travel agents."
                            </p>
                            <div class="mt-5 text-red-400 font-semibold text-base">
                                — Sana Malik, Islamabad
                            </div>
                        </div>

                    </div>

                </div>
            </section>

            <!-- COMMENT POPUP MODAL -->
            <div id="commentModal"
                class="fixed inset-0 bg-black/70 backdrop-blur-sm hidden items-start justify-center z-[99999] p-3 overflow-y-auto" onclick="if(event.target === this) closeCommentModal();">
                <!-- SMALLER & SCROLLABLE POPUP -->
                <div
                    class="bg-white w-full max-w-[340px] rounded-3xl shadow-2xl overflow-hidden relative mt-20 mb-6 animate-[fadeIn_.3s_ease]" onclick="event.stopPropagation();">
                    <!-- CLOSE BUTTON -->
                    <button onclick="closeCommentModal()"
                        class="absolute top-3 right-3 w-7 h-7 rounded-full bg-red-100 hover:bg-red-200 text-red-600 flex items-center justify-center transition-all z-50">
                        <i class="fas fa-times text-xs"></i>
                    </button>

                    <!-- HEADER -->
                    <div class="bg-gradient-to-r from-emerald-600 to-green-500 p-4 text-white">
                        <h3 class="text-lg font-bold">
                            <span class="lang-en">Share Your Experience</span>
                            <span class="lang-ur">اپنا تجربہ شیئر کریں</span>
                        </h3>
                        <p class="text-[11px] text-white/80 mt-1">
                            <span class="lang-en">Your feedback helps others save smarter.</span>
                            <span class="lang-ur">آپ کی رائے دوسروں کو بہتر بچت کرنے میں مدد دیتی ہے۔</span>
                        </p>
                    </div>

                    <!-- FORM -->
                    <div class="p-4 space-y-3 max-h-[75vh] overflow-y-auto">
                        <!-- NAME -->
                        <div>
                            <label class="block text-[11px] font-semibold text-gray-700 mb-1">
                                <span class="lang-en">Your Name</span>
                                <span class="lang-ur">آپ کا نام</span>
                            </label>
                            <input type="text" id="reviewName"
                                class="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                placeholder="Enter your name">
                        </div>

                        <!-- CITY -->
                        <div>
                            <label class="block text-[11px] font-semibold text-gray-700 mb-1">
                                <span class="lang-en">City</span>
                                <span class="lang-ur">شہر</span>
                            </label>
                            <input type="text" id="reviewCity"
                                class="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                placeholder="Enter your city">
                        </div>

                        <!-- COMMENTS -->
                        <div>
                            <label class="block text-[11px] font-semibold text-gray-700 mb-1">
                                <span class="lang-en">Comments</span>
                                <span class="lang-ur">تبصرہ</span>
                            </label>
                            <textarea id="reviewComment" rows="3"
                                class="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                                placeholder="Write your feedback..."></textarea>
                        </div>

                        <!-- STARS -->
                        <div>
                            <label class="block text-[11px] font-semibold text-gray-700 mb-1">
                                <span class="lang-en">Satisfaction Stars</span>
                                <span class="lang-ur">ستارے</span>
                            </label>
                            <select id="reviewStars"
                                class="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500">
                                <option value="★★★★★">★★★★★ Excellent</option>
                                <option value="★★★★☆">★★★★☆ Very Good</option>
                                <option value="★★★☆☆">★★★☆☆ Good</option>
                                <option value="★★☆☆☆">★★☆☆☆ Average</option>
                            </select>
                        </div>

                        <!-- SUBMIT -->
                        <button onclick="submitReview()"
                            class="w-full bg-gradient-to-r from-emerald-600 to-green-500 
                            hover:from-green-500 hover:to-emerald-600 
                            text-white font-semibold py-2.5 rounded-xl 
                            transition-all duration-300 hover:scale-[1.02] shadow-lg text-xs">
                            <span class="lang-en">Submit Review</span>
                            <span class="lang-ur">تبصرہ جمع کروائیں</span>
                        </button>
                    </div>
                </div>
            </div>
`;

// Check CRLF or LF
const isCRLF = content.includes('\r\n');
const eol = isCRLF ? '\r\n' : '\n';

// Target 1: Under "Today's Biggest Savings" (before "<!-- 7. Smart Savings Blog -->")
const target1 = '            <!-- 7. Smart Savings Blog -->';
if (content.includes(target1)) {
    const adjustedTravelSection = travelSectionHtml.split('\n').join(eol);
    content = content.replace(target1, adjustedTravelSection + eol + target1);
}

// Target 2: After "Smart Savings Blog" section (before "<!-- 8. App Promotion")
const target2 = '            <!-- 8. App Promotion (Comparison in your pocket) -->';
if (content.includes(target2)) {
    const adjustedCommentsSection = commentsSectionHtml.split('\n').join(eol);
    content = content.replace(target2, adjustedCommentsSection + eol + target2);
}

fs.writeFileSync(file, content, 'utf8');
console.log('Successfully updated index.html with Travel & Tours and Peoples Comments sections!');
