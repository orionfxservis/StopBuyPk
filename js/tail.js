          current = lastEl ? lastEl.getAttribute('id') : '';
        }
      }

      navLinks.forEach((link) => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
          link.classList.add('active');
        }
      });
    });

// Dynamic Add-ons (Categories & Banners)
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Dynamic Categories Mapping
    const catGrid = document.getElementById('dynamicCategoryGrid');
    if (catGrid && window.DataService) {
        try {
            const categories = await DataService.getCategories();
            if (categories && categories.length > 0) {
                const iconMap = {
                    'food': '\uD83C\uDF54',
                    'vehicle': '\uD83D\uDE97',
                    'vehicles': '\uD83D\uDE97',
                    'grocery': '\uD83D\uDED2',
                    'electronics': '\uD83D\uDCF1',
                    'mobile': '\uD83D\uDCF1',
                    'mobiles': '\uD83D\uDCF1',
                    'clothing': '\uD83D\uDC55',
                    'housing': '\uD83C\uDFE0',
                    'home': '\uD83C\uDFE0',
                    'properties': '\uD83C\uDFE0'
                };
                
                // catGrid.innerHTML = categories.map(cat => {
                //     const icon = iconMap[cat.name.toLowerCase()] || '📦';
                //     const link = cat.name.toLowerCase() === 'food' ? 'pages/food.html' : 'javascript:void(0)';
                //     return `
                //       <article class="glass-card p-4 hover:-translate-y-1 transition transform" onclick="window.location.href='${link}'" style="cursor:pointer; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; background: rgba(15, 23, 42, 0.4);">
                //         <div class="flex items-center justify-between mb-2">
                //           <div class="w-10 h-10 rounded-2xl bg-slate-800 flex items-center justify-center text-xl">${icon}</div>
                //         </div>
                //         <h3 class="font-bold text-slate-100 flex items-center gap-1" style="font-size: 1.1rem; line-height: 1.2;">
                //            ${cat.name}
                //         </h3>
                //       </article>
                //     `;
                // }).join('');
            }
        } catch (e) {
            console.error("Failed to map dynamic categories", e);
        }
    }

    // 2. Dynamic Banner Rotation
    const adBanner = document.getElementById('dynamicHorizontalBanner');
    if (adBanner && window.DataService) {
        try {
            const banners = await DataService.getBanners();
            if (banners && banners.length > 0) {
                adBanner.style.padding = '0';
                adBanner.style.display = 'block';
                adBanner.style.background = 'transparent';
                adBanner.style.border = 'none';
                adBanner.style.color = 'transparent';
                adBanner.innerHTML = '';
                
                let currentBannerIndex = 0;
                
                const renderBanner = () => {
                    const b = banners[currentBannerIndex];
                    const clickTarget = b.link ? b.link : 'javascript:void(0)';
                    const cursor = b.link ? 'pointer' : 'default';
                    adBanner.innerHTML = `
                      <a href="${clickTarget}" style="display:block; width:100%; height:100%; overflow:hidden; border-radius: 1rem; cursor: ${cursor}; text-decoration: none;">
                         <img src="${b.image}" alt="Promotional Banner" style="width:100%; height:100%; object-fit: cover; border-radius: 1rem; transition: opacity 0.5s ease;" />
                      </a>
                    `;
                };

                renderBanner();

                if (banners.length > 1) {
                    setInterval(() => {
                        currentBannerIndex = (currentBannerIndex + 1) % banners.length;
                        renderBanner();
                    }, 4500); 
                }
            }
        } catch (e) {
            console.error("Failed to map banners", e);
        }
    }
});
