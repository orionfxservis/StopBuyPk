const DataService = {

    API_URL: "https://script.google.com/macros/s/AKfycbzkozZ7alWlQ1V55DO-Fvcb_Q5lGD7Z2YdrOxcLrBAN-nZ07_m2Sl8_XAuxMwoYn0Tl/exec",

    login: async (data) => {
        try {
            // Attempt to hit the live endpoint
            const res = await fetch(DataService.API_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({ action: "login", ...data })
            });
            const result = await res.json();
            
            if (result.success) {
                return result;
            } else {
                console.warn("Backend rejected login, checking local fallback");
                throw new Error("Backend authentication failed");
            }
        } catch (err) {
            console.warn("Backend unavailable or failed auth, falling back to LocalStorage authentication", err);
            
            // Fallback: Check local storage 'admin_users'
            const users = JSON.parse(localStorage.getItem("admin_users")) || [];
            let foundUser = null;

            if (data.role === 'admin') {
                foundUser = users.find(u => (u.username === data.userId || u.id === data.userId) && u.password === data.password && u.role === 'admin');
                // Hardcoded fallback admin for demo purposes
                if (!foundUser && data.userId === 'admin' && data.password === 'admin123') {
                    foundUser = { role: 'admin', username: 'Admin Demo' };
                }
            } else if (data.role === 'company') {
                foundUser = users.find(u => u.username === data.username && u.password === data.password && u.role === 'company');
            } else {
                foundUser = users.find(u => (u.username === data.userId || u.id === data.userId) && u.password === data.password && u.role === 'user');
            }

            if (foundUser) {
                return { success: true, user: foundUser };
            }

            return { success: false, message: "Invalid credentials (Local)" };
        }
    },

    // Mock DataService methods using LocalStorage to prevent admin dashboard from getting stuck
    getCategories: async () => JSON.parse(localStorage.getItem("admin_categories")) || [],
    getProducts: async () => JSON.parse(localStorage.getItem("admin_products")) || [],
    getBanners: async () => JSON.parse(localStorage.getItem("admin_banners")) || [],
    getDeals: async () => JSON.parse(localStorage.getItem("admin_deals")) || [],
    getUsers: async () => {
        try {
            const res = await fetch(DataService.API_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({ action: "getUsers" })
            });
            const data = await res.json();
            if (data.success && data.users) {
                localStorage.setItem("admin_users", JSON.stringify(data.users));
                return data.users;
            }
        } catch (err) {
            console.warn("Failed to get users from API, falling back to local storage");
        }
        return JSON.parse(localStorage.getItem("admin_users")) || [];
    },
    getBlogs: async () => JSON.parse(localStorage.getItem("admin_blogs")) || [],
    getTravelPackages: async () => JSON.parse(localStorage.getItem("admin_travel_packages")) || [],
    getBroadcasts: async () => JSON.parse(localStorage.getItem("admin_broadcasts")) || [],

    saveCategories: async (data) => localStorage.setItem("admin_categories", JSON.stringify(data)),
    saveProducts: async (data) => localStorage.setItem("admin_products", JSON.stringify(data)),
    saveBanners: async (data) => localStorage.setItem("admin_banners", JSON.stringify(data)),
    saveDeals: async (data) => localStorage.setItem("admin_deals", JSON.stringify(data)),
    saveUsers: async (data) => {
        try {
            const res = await fetch(DataService.API_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({ action: "syncUsers", users: data })
            });
            const result = await res.json();
            if (!result.success) console.warn("API sync failed", result.message);
        } catch (err) {
            console.error("Failed to sync users to API", err);
        }
        localStorage.setItem("admin_users", JSON.stringify(data));
        return true;
    },
    saveBlogs: async (data) => localStorage.setItem("admin_blogs", JSON.stringify(data)),
    saveTravelPackages: async (data) => localStorage.setItem("admin_travel_packages", JSON.stringify(data)),
    saveBroadcasts: async (data) => localStorage.setItem("admin_broadcasts", JSON.stringify(data))
};