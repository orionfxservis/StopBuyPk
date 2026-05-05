/**
 * DataService - Interacts with the deployed Google Apps Script Web App
 * via standard REST API fetch calls (for GitHub deployment compatibility)
 */

const DataService = {
    // ⚠️ CRITICAL: Replace this URL with your NEW DEPLOYMENT Web App URL from Google!
    API_URL: 'https://script.google.com/macros/s/AKfycbzJLWvKN0j0gHy_A05_Tbp7tyAKotWE7jF2QvNj51L0-naRp56tKNtx6i1Cm9d0tfcf/exec',

    // --- Helpers ---

    _fetchGET: async (action) => {
        try {
            const url = `${DataService.API_URL}?action=${action}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            if (data.error) throw new Error(data.error);
            
            const localData = JSON.parse(localStorage.getItem(action.replace('get', '').toLowerCase()));
            // Prioritize local data if it exists and has items, ensuring admin changes are visible immediately
            // even if the Google Apps script backend is returning stale data or dummy placeholders.
            if (localData && Array.isArray(localData) && localData.length > 0) {
                return localData;
            }

            if (!data || !Array.isArray(data) || data.length === 0) {
                return localData || [];
            }
            return data;
        } catch (error) {
            console.error(`Error fetching ${action}:`, error);
            // Fallback for local testing if API isn't set
            return JSON.parse(localStorage.getItem(action.replace('get', '').toLowerCase())) || [];
        }
    },

    _fetchPOST: async (action, payload) => {
        try {
            if (action.startsWith('save')) {
                localStorage.setItem(action.replace('save', '').toLowerCase(), JSON.stringify(payload));
            }
            const response = await fetch(DataService.API_URL, {
                method: 'POST',
                // Using text/plain avoids some CORS preflight issues with Google Apps Script
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({ action: action, payload: payload })
            });
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            if (data.error) throw new Error(data.error);
            return data;
        } catch (error) {
            console.error(`Error posting ${action}:`, error);
            // Fallback for local testing
            if (action.startsWith('save')) {
                return { message: 'Success' };
            }
            throw error;
        }
    },

    // --- Products ---

    getProducts: async () => {
        return await DataService._fetchGET('getProducts');
    },

    saveProducts: async (products) => {
        const res = await DataService._fetchPOST('saveProducts', products);
        return res.message;
    },

    // --- Categories ---

    getCategories: async () => {
        return await DataService._fetchGET('getCategories');
    },

    saveCategories: async (categories) => {
        const res = await DataService._fetchPOST('saveCategories', categories);
        return res.message;
    },

    // --- Banners ---

    getBanners: async () => {
        let items = await DataService._fetchGET('getBanners');
        if (!items || items.length === 0) {
            // Provide a default banner if local memory is empty / cross-origin blocked
            items = [{ image: 'https://picsum.photos/720/120?random=test', link: '#' }];
        }
        return items;
    },

    saveBanners: async (banners) => {
        const res = await DataService._fetchPOST('saveBanners', banners);
        return res.message;
    },

    // --- Deals of the Day ---

    getDeals: async () => {
        return await DataService._fetchGET('getDeals');
    },

    saveDeals: async (deals) => {
        const res = await DataService._fetchPOST('saveDeals', deals);
        return res.message;
    },

    // --- Blogs ---

    getBlogs: async () => {
        return await DataService._fetchGET('getBlogs');
    },

    saveBlogs: async (blogs) => {
        const res = await DataService._fetchPOST('saveBlogs', blogs);
        return res.message;
    },

    // --- Broadcasts ---

    getBroadcasts: async () => {
        return await DataService._fetchGET('getBroadcasts');
    },

    saveBroadcasts: async (broadcasts) => {
        const res = await DataService._fetchPOST('saveBroadcasts', broadcasts);
        return res.message;
    },

    // --- Travel Packages ---

    getTravelPackages: async () => {
        return await DataService._fetchGET('getTravelPackages');
    },

    saveTravelPackages: async (travelPackages) => {
        const res = await DataService._fetchPOST('saveTravelPackages', travelPackages);
        return res.message;
    },

    // --- Users / Auth ---

    getUsers: async () => {
        return await DataService._fetchGET('getUsers');
    },

    saveUsers: async (users) => {
        const res = await DataService._fetchPOST('saveUsers', users);
        return res.message;
    },

    login: async (username, password, type) => {
        try {
            const res = await DataService._fetchPOST('login', { username, password, type });
            if (res.success) {
                return res;
            } else {
                // Workaround: if remote Code.gs API returns failure, check locally by fetching all users
                // to circumvent Google Sheets Number vs String type issues in unupdated backends.
                console.warn("API rejected login, validating dynamically via getUsers...");
                try {
                    const allUsers = await DataService.getUsers() || [];
                    const user = allUsers.find(u => String(u.username) === String(username) && String(u.password) === String(password) && String(u.role) === String(type));
                    
                    if (user) {
                        if (user.status === 'hold') {
                            return { success: false, message: 'Account is on hold. Please contact support.' };
                        }
                        return { success: true, user: user };
                    }
                } catch(e) {
                    console.error("Fallback dynamic user validation failed", e);
                }
                
                return res; // Return original API failure message if dynamic check also fails
            }
        } catch (error) {
            // Local fallback logic if API fails completely
            console.warn("Using local stub login due to API failure");
            
            // Try to find user in local storage first
            const localUsers = JSON.parse(localStorage.getItem('users')) || [];
            const user = localUsers.find(u => String(u.username) === String(username) && String(u.password) === String(password) && String(u.role) === String(type));
            
            if (user) {
                if (user.status === 'hold') {
                    return { success: false, message: 'Account is on hold. Please contact support.' };
                }
                return { success: true, user: user };
            }
            
            // Hardcoded defaults
            if (type === 'admin' && ((username === 'Faisal' && password === '1234') || (username === 'Ashraf Taj' && password === 'admin123'))) {
                return { success: true, user: { username, role: 'admin' } };
            } else if (type === 'company' && (username === 'test' && password === 'test')) {
                return { success: true, user: { username, role: 'company' } };
            } else if (type === 'user') {
                return { success: true, user: { username, role: 'user' } };
            }
            return { success: false, message: 'Invalid credentials' };
        }
    }
};
