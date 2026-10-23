const fs = require('fs');

const file = 'index.html';
let content = fs.readFileSync(file, 'utf8');

const isCRLF = content.includes('\r\n');
const eol = isCRLF ? '\r\n' : '\n';

// 1. Update submitReview and add load saved reviews
const oldReviewJs = `            function submitReview() {

                const name = document.getElementById('reviewName').value;
                const city = document.getElementById('reviewCity').value;
                const comment = document.getElementById('reviewComment').value;
                const stars = document.getElementById('reviewStars').value;

                if (!name || !city || !comment) {
                    alert("Please fill all fields");
                    return;
                }

                const reviewCard = \`
            <div class="bg-white/5 border border-white/10 rounded-3xl p-5 backdrop-blur-md hover:bg-white/10 transition-all duration-300">
                
                <div class="text-yellow-400 text-lg mb-4">
                    \${stars}
                </div>

                <p class="text-gray-200 text-lg leading-relaxed italic">
                    "\${comment}"
                </p>

                <div class="mt-6 text-red-400 font-semibold text-lg">
                    — \${name}, \${city}
                </div>

            </div>
        \`;

                document.getElementById('reviewsContainer')
                    .insertAdjacentHTML('afterbegin', reviewCard);

                // RESET
                document.getElementById('reviewName').value = "";
                document.getElementById('reviewCity').value = "";
                document.getElementById('reviewComment').value = "";

                closeCommentModal();
            }`;

const newReviewJs = `            // Load saved user reviews on startup
            document.addEventListener('DOMContentLoaded', () => {
                try {
                    const savedReviews = JSON.parse(localStorage.getItem('stopbuy_user_reviews') || '[]');
                    const container = document.getElementById('reviewsContainer');
                    if (container && savedReviews.length > 0) {
                        savedReviews.forEach(rev => {
                            const card = \`
                                <div class="bg-white/5 border border-white/10 rounded-3xl p-5 backdrop-blur-md hover:bg-white/10 transition-all duration-300">
                                    <div class="text-yellow-400 text-base mb-3">\${rev.stars || '★★★★★'}</div>
                                    <p class="text-gray-200 text-[15px] leading-relaxed italic">"\${rev.comment}"</p>
                                    <div class="mt-5 text-red-400 font-semibold text-base">— \${rev.name}, \${rev.city}</div>
                                </div>
                            \`;
                            container.insertAdjacentHTML('afterbegin', card);
                        });
                    }
                } catch(e) {
                    console.error("Error loading saved reviews", e);
                }
            });

            function submitReview() {

                const name = document.getElementById('reviewName').value;
                const city = document.getElementById('reviewCity').value;
                const comment = document.getElementById('reviewComment').value;
                const stars = document.getElementById('reviewStars').value;

                if (!name || !city || !comment) {
                    alert("Please fill all fields");
                    return;
                }

                const reviewCard = \`
            <div class="bg-white/5 border border-white/10 rounded-3xl p-5 backdrop-blur-md hover:bg-white/10 transition-all duration-300">
                
                <div class="text-yellow-400 text-base mb-3">
                    \${stars}
                </div>

                <p class="text-gray-200 text-[15px] leading-relaxed italic">
                    "\${comment}"
                </p>

                <div class="mt-6 text-red-400 font-semibold text-base">
                    — \${name}, \${city}
                </div>

            </div>
        \`;

                const container = document.getElementById('reviewsContainer');
                if (container) {
                    container.insertAdjacentHTML('afterbegin', reviewCard);
                }

                try {
                    const savedReviews = JSON.parse(localStorage.getItem('stopbuy_user_reviews') || '[]');
                    savedReviews.unshift({ name, city, comment, stars });
                    localStorage.setItem('stopbuy_user_reviews', JSON.stringify(savedReviews));
                } catch(e) {}

                // RESET
                document.getElementById('reviewName').value = "";
                document.getElementById('reviewCity').value = "";
                document.getElementById('reviewComment').value = "";

                closeCommentModal();
            }`;

if (content.includes(oldReviewJs.replace(/\r?\n/g, eol))) {
    content = content.replace(oldReviewJs.replace(/\r?\n/g, eol), newReviewJs.replace(/\r?\n/g, eol));
    console.log('Updated review submit and persist logic');
}

// 2. Update travel packages loading logic with fallback packages
const oldTravelBlock = `                    const travelPackages = await DataService.getTravelPackages();
                    const grid = document.getElementById('travelPackagesGrid');
                    if (grid && travelPackages.length > 0) {
                        const publishedPackages = travelPackages.filter(pkg => pkg.status === 'Publish');
                        if (publishedPackages.length > 0) {
                            grid.innerHTML = publishedPackages.map(pkg => {
                                return \`
                            <div class="w-full cursor-pointer group bg-white rounded-[28px] overflow-hidden border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300" onclick="openTravelDetailModal('\${encodeURIComponent(JSON.stringify(pkg))}')">
                                
                                <!-- IMAGE SECTION -->
                                <div class="relative w-full h-[200px] bg-slate-100 overflow-hidden">
                                    <img src="\${pkg.image || 'https://via.placeholder.com/400x200'}" alt="\${pkg.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                                    
                                    <!-- Heart Icon -->
                                    <div class="absolute top-4 right-4 w-9 h-9 bg-white rounded-full flex items-center justify-center text-slate-500 hover:text-red-500 shadow-md transition-colors z-10" onclick="event.stopPropagation();">
                                        <i class="far fa-heart"></i>
                                    </div>
                                    
                                    <!-- Price Badge -->
                                    <div class="absolute bottom-4 left-4 bg-white px-4 py-1.5 rounded-full shadow-md z-10">
                                        <span class="text-[12px] font-bold text-red-500">FROM Rs \${(pkg.price || 0).toLocaleString()}</span>
                                    </div>
                                </div>
                                
                                <!-- CONTENT SECTION -->
                                <div class="px-5 pt-3 pb-4 bg-white text-left flex flex-col h-full">
                                    <h3 class="text-[15px] leading-snug font-bold text-[#1a2b3c] group-hover:text-emerald-600 transition-colors">\${pkg.title} \${pkg.verified === 'Yes' ? '✅' : ''}</h3>
                                    <div class="text-[11px] font-semibold text-red-500 mt-1 uppercase tracking-wide">
                                        Travel: \${(pkg.departure || 'Karachi').toUpperCase()} - \${(pkg.destination || 'Saudi Arab').toUpperCase()}
                                    </div>
                                    
                                    <!-- Action Buttons -->
                                    <div class="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                                        <button onclick="event.stopPropagation(); window.open('https://web.whatsapp.com/send?phone=' + (pkg.whatsapp || pkg.contact || '').replace(/[^0-9]/g, ''), '_blank')" class="flex-1 py-1.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 rounded-lg text-[11px] font-bold hover:bg-emerald-500 hover:text-slate-900 transition-all"><span class="lang-en">Contact</span><span class="lang-ur">رابطہ کریں</span></button>
                                        <button onclick="event.stopPropagation(); openTravelDetailModal('\${encodeURIComponent(JSON.stringify(pkg))}')" class="flex-1 py-1.5 bg-sky-500/10 text-sky-600 border border-sky-500/30 rounded-lg text-[11px] font-bold hover:bg-sky-500 hover:text-slate-900 transition-all"><span class="lang-en">View Details</span><span class="lang-ur">تفصیلات دیکھیں</span></button>
                                    </div>
                                </div>
                                
                            </div>
                        \`;
                            }).join('');
                        } else {
                            grid.innerHTML = '<p class="text-gray-400 text-sm">No active travel packages available at the moment.</p>';
                        }
                    } else if (grid) {
                        grid.innerHTML = '<p class="text-gray-400 text-sm">No travel packages available at the moment.</p>';
                    }`;

const newTravelBlock = `                    let travelPackages = [];
                    try {
                        travelPackages = await DataService.getTravelPackages();
                    } catch (e) {
                        console.warn("Could not fetch remote travel packages, using local packages:", e);
                    }

                    const defaultTravelPackages = [
                        {
                            id: 'tp-1',
                            title: 'Umrah 15 Days Economy Package',
                            departure: 'Karachi',
                            destination: 'Makkah & Madinah',
                            price: 265000,
                            duration: '15 Days',
                            category: 'Umrah Package',
                            image: 'images/travel/04-05-26/travel_umrah.png',
                            verified: 'Yes',
                            whatsapp: '+923001234567',
                            status: 'Publish',
                            desc: 'Economy Umrah package including visa, return tickets, 3-star hotel accommodation close to Haram, and complete ground transport.'
                        },
                        {
                            id: 'tp-2',
                            title: 'Skardu & Shangrila Luxury Tour',
                            departure: 'Islamabad',
                            destination: 'Skardu Valley',
                            price: 85000,
                            duration: '7 Days',
                            category: 'Domestic Tour',
                            image: 'images/travel/04-05-26/travel_pakistan.png',
                            verified: 'Yes',
                            whatsapp: '+923001234567',
                            status: 'Publish',
                            desc: '7-day guided tour of Skardu, Upper Kachura Lake, Shangrila Resort, Katpana Cold Desert, and Deosai Plains with hotel and transport.'
                        },
                        {
                            id: 'tp-3',
                            title: 'Dubai Spectacular Family Holiday',
                            departure: 'Lahore',
                            destination: 'Dubai, UAE',
                            price: 195000,
                            duration: '5 Days',
                            category: 'International Tour',
                            image: 'images/travel/04-05-26/travel_international.png',
                            verified: 'Yes',
                            whatsapp: '+923001234567',
                            status: 'Publish',
                            desc: 'Exciting Dubai trip including Desert Safari with BBQ dinner, Marina Dhow Cruise, Burj Khalifa visit, and Dubai Mall tour.'
                        },
                        {
                            id: 'tp-4',
                            title: "Naran, Kaghan & Babusar Adventure",
                            departure: 'Rawalpindi',
                            destination: 'Babusar Top',
                            price: 48000,
                            duration: '5 Days',
                            category: 'Northern Explorer',
                            image: "images/travel/travel/naran'kaghan-babusar.jpg",
                            verified: 'Yes',
                            whatsapp: '+923001234567',
                            status: 'Publish',
                            desc: 'Explore Saif-ul-Malook Lake, Shogran, Siri Paye, and scenic Babusar Top with luxury coaster transport and quality family hotel stays.'
                        }
                    ];

                    let publishedPackages = (travelPackages || []).filter(pkg => !pkg.status || pkg.status === 'Publish' || pkg.status.toLowerCase() === 'publish' || pkg.status.toLowerCase() === 'active');
                    if (publishedPackages.length === 0) {
                        publishedPackages = defaultTravelPackages;
                    }

                    const grid = document.getElementById('travelPackagesGrid');
                    if (grid && publishedPackages.length > 0) {
                        grid.innerHTML = publishedPackages.map(pkg => {
                            return \`
                            <div class="w-full cursor-pointer group bg-white rounded-[28px] overflow-hidden border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between" onclick="openTravelDetailModal('\${encodeURIComponent(JSON.stringify(pkg))}')">
                                
                                <!-- IMAGE SECTION -->
                                <div class="relative w-full h-[200px] bg-slate-100 overflow-hidden">
                                    <img src="\${pkg.image || 'https://via.placeholder.com/400x200'}" alt="\${pkg.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                                    
                                    <!-- Heart Icon -->
                                    <div class="absolute top-4 right-4 w-9 h-9 bg-white rounded-full flex items-center justify-center text-slate-500 hover:text-red-500 shadow-md transition-colors z-10" onclick="event.stopPropagation();">
                                        <i class="far fa-heart"></i>
                                    </div>
                                    
                                    <!-- Price Badge -->
                                    <div class="absolute bottom-4 left-4 bg-white px-4 py-1.5 rounded-full shadow-md z-10">
                                        <span class="text-[12px] font-bold text-red-500">FROM Rs \${(pkg.price || 0).toLocaleString()}</span>
                                    </div>
                                </div>
                                
                                <!-- CONTENT SECTION -->
                                <div class="px-5 pt-3 pb-4 bg-white text-left flex flex-col flex-1 justify-between">
                                    <div>
                                        <h3 class="text-[15px] leading-snug font-bold text-[#1a2b3c] group-hover:text-emerald-600 transition-colors">\${pkg.title} \${pkg.verified === 'Yes' ? '✅' : ''}</h3>
                                        <div class="text-[11px] font-semibold text-red-500 mt-1 uppercase tracking-wide">
                                            Travel: \${(pkg.departure || 'Karachi').toUpperCase()} - \${(pkg.destination || 'Saudi Arab').toUpperCase()}
                                        </div>
                                    </div>
                                    
                                    <!-- Action Buttons -->
                                    <div class="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                                        <button onclick="event.stopPropagation(); window.open('https://web.whatsapp.com/send?phone=' + (pkg.whatsapp || pkg.contact || '').replace(/[^0-9]/g, ''), '_blank')" class="flex-1 py-1.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 rounded-lg text-[11px] font-bold hover:bg-emerald-500 hover:text-slate-900 transition-all"><span class="lang-en">Contact</span><span class="lang-ur">رابطہ کریں</span></button>
                                        <button onclick="event.stopPropagation(); openTravelDetailModal('\${encodeURIComponent(JSON.stringify(pkg))}')" class="flex-1 py-1.5 bg-sky-500/10 text-sky-600 border border-sky-500/30 rounded-lg text-[11px] font-bold hover:bg-sky-500 hover:text-slate-900 transition-all"><span class="lang-en">View Details</span><span class="lang-ur">تفصیلات دیکھیں</span></button>
                                    </div>
                                </div>
                                
                            </div>
                        \`;
                        }).join('');
                    } else if (grid) {
                        grid.innerHTML = '<p class="text-gray-400 text-sm">No travel packages available at the moment.</p>';
                    }`;

if (content.includes(oldTravelBlock.replace(/\r?\n/g, eol))) {
    content = content.replace(oldTravelBlock.replace(/\r?\n/g, eol), newTravelBlock.replace(/\r?\n/g, eol));
    console.log('Updated travel packages loading logic with fallback packages');
}

fs.writeFileSync(file, content, 'utf8');
console.log('Update complete!');
