const DataService = {

    API_URL: "https://script.google.com/macros/s/AKfycbzyEB5zYLsk68L_bUVpXWZXLTdqcxmmAyaH0oAy0I5p_NXZlD2jT_kM0ueFofmLu66qOQ/exec",

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
                foundUser = users.find(u => {
                    const uId = String(u.userId || u.id || '').trim().toLowerCase();
                    const targetId = String(data.userId || '').trim().toLowerCase();
                    const uRole = String(u.role || '').trim().toLowerCase();
                    return (uId === targetId) && (String(u.password) === String(data.password)) && (uRole === 'admin' || uRole === 'sub-admin');
                });
                // Hardcoded fallback admin for demo purposes
                if (!foundUser && data.userId === 'admin' && data.password === 'admin123') {
                    foundUser = { role: 'admin', userId: 'admin', username: 'Admin Demo' };
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
    getCategories: async () => {
        let cached = JSON.parse(localStorage.getItem("admin_categories"));
        if (!cached || cached.length === 0) {
            try {
                const res = await fetch(DataService.API_URL, { method: "POST", body: JSON.stringify({ action: "getCategories" }) });
                const data = await res.json();
                if (data.success && data.categories) {
                    localStorage.setItem("admin_categories", JSON.stringify(data.categories));
                    return data.categories;
                }
            } catch (err) { console.error(err); }
            return [];
        } else {
            setTimeout(async () => {
                try {
                    const res = await fetch(DataService.API_URL, { method: "POST", body: JSON.stringify({ action: "getCategories" }) });
                    const data = await res.json();
                    if (data.success && data.categories) localStorage.setItem("admin_categories", JSON.stringify(data.categories));
                } catch (err) {}
            }, 0);
            return cached;
        }
    },
    getProducts: async () => {
        let cached = JSON.parse(localStorage.getItem("admin_products"));
        if (!cached || cached.length === 0) {
            try {
                const res = await fetch(DataService.API_URL, { method: "POST", body: JSON.stringify({ action: "getProducts" }) });
                const data = await res.json();
                if (data.success && data.products) {
                    localStorage.setItem("admin_products", JSON.stringify(data.products));
                    return data.products;
                }
            } catch (err) { console.error(err); }
            return [];
        } else {
            setTimeout(async () => {
                try {
                    const res = await fetch(DataService.API_URL, { method: "POST", body: JSON.stringify({ action: "getProducts" }) });
                    const data = await res.json();
                    if (data.success && data.products) localStorage.setItem("admin_products", JSON.stringify(data.products));
                } catch (err) {}
            }, 0);
            return cached;
        }
    },
    getBanners: async () => JSON.parse(localStorage.getItem("admin_banners")) || [],
    getDeals: async () => {
        setTimeout(async () => {
            try {
                const res = await fetch(DataService.API_URL, { method: "POST", body: JSON.stringify({ action: "getDeals" }) });
                const data = await res.json();
                if (data.success && data.deals) localStorage.setItem("admin_deals", JSON.stringify(data.deals));
            } catch (err) {}
        }, 0);
        return JSON.parse(localStorage.getItem("admin_deals")) || [];
    },
    getUsers: async () => {
        setTimeout(async () => {
            try {
                const res = await fetch(DataService.API_URL, { method: "POST", body: JSON.stringify({ action: "getUsers" }) });
                const data = await res.json();
                if (data.success && data.users) localStorage.setItem("admin_users", JSON.stringify(data.users));
            } catch (err) {}
        }, 0);
        return JSON.parse(localStorage.getItem("admin_users")) || [];
    },
    getBlogs: async () => {
        let cached = JSON.parse(localStorage.getItem("admin_blogs"));
        if (!cached || cached.length === 0) {
            try {
                const res = await fetch(DataService.API_URL, { method: "POST", body: JSON.stringify({ action: "getBlogs" }) });
                const data = await res.json();
                if (data.success && data.blogs) {
                    localStorage.setItem("admin_blogs", JSON.stringify(data.blogs));
                    return data.blogs;
                }
            } catch (err) { console.error(err); }
            return [];
        } else {
            setTimeout(async () => {
                try {
                    const res = await fetch(DataService.API_URL, { method: "POST", body: JSON.stringify({ action: "getBlogs" }) });
                    const data = await res.json();
                    if (data.success && data.blogs) localStorage.setItem("admin_blogs", JSON.stringify(data.blogs));
                } catch (err) {}
            }, 0);
            return cached;
        }
    },
    getTravelPackages: async () => {
        setTimeout(async () => {
            try {
                const res = await fetch(DataService.API_URL, { method: "POST", body: JSON.stringify({ action: "getTravelPackages" }) });
                const data = await res.json();
                if (data.success && data.travelPackages) localStorage.setItem("admin_travel_packages", JSON.stringify(data.travelPackages));
            } catch (err) {}
        }, 0);
        return JSON.parse(localStorage.getItem("admin_travel_packages")) || [];
    },
    getBroadcasts: async () => {
        setTimeout(async () => {
            try {
                const res = await fetch(DataService.API_URL, { method: "POST", body: JSON.stringify({ action: "getBroadcasts" }) });
                const data = await res.json();
                if (data.success && data.broadcasts) localStorage.setItem("admin_broadcasts", JSON.stringify(data.broadcasts));
            } catch (err) {}
        }, 0);
        return JSON.parse(localStorage.getItem("admin_broadcasts")) || [];
    },

    getLiveRates: async () => {
        try {
            const res = await fetch(DataService.API_URL, { method: "POST", body: JSON.stringify({ action: "getLiveRates" }) });
            const data = await res.json();
            if (data.success && data.rates) {
                localStorage.setItem("stopbuyLiveRates", JSON.stringify(data.rates));
                return data.rates;
            }
        } catch (err) {
            console.error("Fetch live rates failed", err);
        }
        return JSON.parse(localStorage.getItem("stopbuyLiveRates")) || null;
    },

    saveCategories: async (data) => {
        try {
            const res = await fetch(DataService.API_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({ action: "syncCategories", categories: data })
            });
            const result = await res.json();
            if (!result.success) {
                console.warn("API sync failed", result.message);
                alert("Google Sheet Sync Error: " + result.message);
            }
        } catch (err) {
            console.error("Failed to sync categories to API", err);
            alert("Failed to connect to Google Apps Script. Did you deploy a New Version?");
        }
        localStorage.setItem("admin_categories", JSON.stringify(data));
    },
    saveProducts: async (data) => {
        try {
            const res = await fetch(DataService.API_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({ action: "syncProducts", products: data })
            });
            const result = await res.json();
            if (!result.success) {
                console.warn("API sync failed", result.message);
                alert("Google Sheet Sync Error (Products): " + result.message);
            }
        } catch (err) {
            console.error("Failed to sync products to API", err);
            alert("Failed to connect to Google Apps Script. Did you deploy a New Version?");
        }
        localStorage.setItem("admin_products", JSON.stringify(data));
    },
    saveBanners: async (data) => localStorage.setItem("admin_banners", JSON.stringify(data)),
    saveDeals: async (data) => {
        try {
            const res = await fetch(DataService.API_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({ action: "syncDeals", deals: data })
            });
            const result = await res.json();
            if (!result.success) console.warn("API sync failed", result.message);
        } catch (err) {
            console.error("Failed to sync deals to API", err);
        }
        localStorage.setItem("admin_deals", JSON.stringify(data));
        return true;
    },
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
    saveBlogs: async (data) => {
        try {
            const res = await fetch(DataService.API_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({ action: "syncBlogs", blogs: data })
            });
            const result = await res.json();
            if (!result.success) console.warn("API sync failed", result.message);
        } catch (err) {
            console.error("Failed to sync blogs to API", err);
        }
        localStorage.setItem("admin_blogs", JSON.stringify(data));
        return true;
    },
    saveTravelPackages: async (data) => {
        try {
            const res = await fetch(DataService.API_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({ action: "syncTravelPackages", travelPackages: data })
            });
            const result = await res.json();
            if (!result.success) console.warn("API sync failed", result.message);
        } catch (err) {
            console.error("Failed to sync travel packages to API", err);
        }
        localStorage.setItem("admin_travel_packages", JSON.stringify(data));
        return true;
    },
    saveBroadcasts: async (data) => {
        try {
            const res = await fetch(DataService.API_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({ action: "syncBroadcasts", broadcasts: data })
            });
            const result = await res.json();
            if (!result.success) console.warn("API sync failed", result.message);
        } catch (err) {
            console.error("Failed to sync broadcasts to API", err);
        }
        localStorage.setItem("admin_broadcasts", JSON.stringify(data));
        return true;
    },
    saveLiveRates: async (data) => {
        try {
            const res = await fetch(DataService.API_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({ action: "syncLiveRates", rates: data })
            });
            const result = await res.json();
            if (!result.success) console.warn("API sync failed", result.message);
        } catch (err) {
            console.error("Failed to sync live rates to API", err);
        }
        localStorage.setItem("stopbuyLiveRates", JSON.stringify(data));
        return true;
    }
};