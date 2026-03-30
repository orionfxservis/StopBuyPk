// Local Data Service using browser localStorage (for testing on GitHub Pages without Google Sheets)

const DataService = {
    // -- GETTERS --
    getCategories: async () => JSON.parse(localStorage.getItem('admin_categories') || '[]'),
    getProducts: async () => JSON.parse(localStorage.getItem('admin_products') || '[]'),
    getBanners: async () => JSON.parse(localStorage.getItem('admin_banners') || '[]'),
    getDeals: async () => JSON.parse(localStorage.getItem('admin_deals') || '[]'),
    getUsers: async () => JSON.parse(localStorage.getItem('admin_users') || '[]'),

    // -- SETTERS --
    saveCategories: async (data) => localStorage.setItem('admin_categories', JSON.stringify(data)),
    saveProducts: async (data) => localStorage.setItem('admin_products', JSON.stringify(data)),
    saveBanners: async (data) => localStorage.setItem('admin_banners', JSON.stringify(data)),
    saveDeals: async (data) => localStorage.setItem('admin_deals', JSON.stringify(data)),
    saveUsers: async (data) => localStorage.setItem('admin_users', JSON.stringify(data))
};
