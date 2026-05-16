document.addEventListener('DOMContentLoaded', () => {
    const travelGrid = document.getElementById('dynamicTravelGrid');

    if (travelGrid && typeof DataService !== 'undefined') {
        DataService.getTravelPackages().then(packages => {
            if (packages && packages.length > 0) {
                
                // Only show active/published packages
                const activePackages = packages.filter(pkg => pkg.status !== 'Draft' && pkg.status !== 'inactive');
                
                if (activePackages.length === 0) {
                    travelGrid.innerHTML = `
                        <p class="text-slate-500 col-span-full text-center py-4">
                            No active travel packages available at the moment.
                        </p>`;
                    return;
                }

                const htmlStr = activePackages.map(pkg => {
                    const isPopular = pkg.listingType === 'Featured' || pkg.listingType === 'Premium';
                    const badgeText = isPopular ? 'Popular' : (pkg.category || 'Tour');
                    const badgeColor = isPopular ? 'from-[#f59e0b] to-[#f97316]' : 'from-[#059669] to-[#10b981]';
                    
                    return `
                    <div class="travel-card glass rounded-[28px]">
                        <div class="absolute top-[15px] left-[15px] bg-gradient-to-r ${badgeColor} text-white text-[12px] font-semibold px-[14px] py-[6px] rounded-full z-10 shadow-md">
                            ${badgeText}
                        </div>
                        <img src="${pkg.image || '../images/travel/northern-tour.jpg'}" class="w-full h-56 object-cover" onerror="this.src='https://placehold.co/600x400?text=Travel+Tour'">
                        <div class="p-6">
                            <div class="font-bold text-2xl text-gray-800 line-clamp-1" title="${pkg.title}">${pkg.title || 'Travel Package'}</div>
                            <div class="text-sm text-emerald-600 mt-1 line-clamp-1" title="${pkg.destination}">${pkg.destination || 'Multiple Destinations'}</div>
                            
                            <div class="flex justify-between mt-5">
                                <div>
                                    <div class="text-xs text-gray-500">Duration</div>
                                    <div class="font-semibold">${pkg.duration || 'N/A'} ${pkg.duration == 1 ? 'Day' : 'Days'}</div>
                                </div>
                                <div class="text-right">
                                    <div class="text-xs text-gray-500">From</div>
                                    <div class="font-bold text-2xl text-emerald-700">Rs. ${(pkg.price || 0).toLocaleString()}</div>
                                </div>
                            </div>
                            
                            <div class="flex gap-3 mt-6">
                                <a href="https://wa.me/${(pkg.whatsapp || pkg.contact || '').replace(/[^0-9]/g, '')}" target="_blank" class="flex-1 py-3 rounded-2xl border border-emerald-500 text-emerald-700 text-center font-semibold text-sm transition hover:bg-emerald-50">
                                    Contact
                                </a>
                                <button onclick="alert('Details:\\n' + decodeURIComponent('${encodeURIComponent(pkg.details || 'No additional details.')}'))" class="flex-1 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-semibold text-sm transition hover:scale-105">
                                    View Details
                                </button>
                            </div>
                        </div>
                    </div>
                    `;
                }).join('');
                
                travelGrid.innerHTML = htmlStr;

            } else {
                travelGrid.innerHTML = `
                    <p class="text-slate-500 col-span-full text-center py-4">
                        No travel packages available at the moment.
                    </p>`;
            }
        }).catch(err => {
            console.error("Failed to load travel packages:", err);
            travelGrid.innerHTML = `
                <p class="text-red-500 col-span-full text-center py-4">
                    Error loading packages. Please try again later.
                </p>`;
        });
    }
});
